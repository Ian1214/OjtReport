<?php

namespace App\Http\Controllers;

use App\Models\AttendanceCorrectionRequest;
use App\Models\Company;
use App\Models\CompletionCertificate;
use App\Models\DailyReport;
use App\Models\Document;
use App\Models\DtrSubmission;
use App\Models\LeaveRequest;
use App\Models\SystemBackup;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CompanyDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isSupervisor()) {
            return app(SupervisorDashboardController::class)->index($request);
        }

        if ($user->isSchoolCoordinator()) {
            return app(SchoolCoordinatorDashboardController::class)->index($request);
        }

        if (! $user->isCompanyAdmin()) {
            $user->loadMissing('assignedSupervisor');

            $activeReport = $user->dailyReports()
                ->whereNull('summary')
                ->oldest('report_date')
                ->first(['id', 'report_date', 'time_in', 'time_out']);
            $todayReport = $activeReport ?? $user->dailyReports()
                ->whereDate('report_date', today())
                ->latest()
                ->first(['id', 'report_date', 'time_in', 'time_out', 'approval_status']);
            $approvedHours = (float) $user->approvedDailyReports()->sum('total_hours');
            $requiredHours = (float) ($user->required_hours ?? 0);
            $taskCounts = $user->assignedTasks()
                ->selectRaw('status, count(*) as aggregate')
                ->groupBy('status')
                ->pluck('aggregate', 'status');

            return Inertia::render('dashboard', [
                'supervisor' => $user->assignedSupervisor === null ? null : [
                    'id' => $user->assignedSupervisor->id,
                    'name' => $user->assignedSupervisor->name,
                    'isOnline' => $user->assignedSupervisor->isOnline(),
                    'lastSeenAt' => $user->assignedSupervisor->last_seen_at?->toIso8601String(),
                ],
                'today' => [
                    'status' => match (true) {
                        $activeReport?->time_out !== null => 'summary_due',
                        $activeReport !== null => 'timed_in',
                        $todayReport !== null => 'submitted',
                        default => 'not_started',
                    },
                    'timeIn' => $todayReport?->time_in,
                    'timeOut' => $todayReport?->time_out,
                    'approvalStatus' => $todayReport?->approval_status,
                ],
                'progress' => [
                    'approvedHours' => round($approvedHours, 2),
                    'requiredHours' => $requiredHours,
                    'remainingHours' => round(max(0, $requiredHours - $approvedHours), 2),
                    'percentage' => $requiredHours > 0
                        ? min(100, round(($approvedHours / $requiredHours) * 100))
                        : 0,
                ],
                'taskSummary' => [
                    'notStarted' => (int) ($taskCounts['not_started'] ?? 0),
                    'ongoing' => (int) ($taskCounts['ongoing'] ?? 0),
                    'finished' => (int) ($taskCounts['finished'] ?? 0),
                ],
                'tasks' => $user->assignedTasks()
                    ->whereIn('status', ['not_started', 'ongoing'])
                    ->latest()
                    ->limit(3)
                    ->get()
                    ->map(fn ($task): array => [
                        'id' => $task->id,
                        'title' => $task->title,
                        'description' => $task->description,
                        'status' => $task->status,
                        'dueDate' => $task->due_date?->toDateString(),
                    ]),
                'onboarding' => $user->onboardingChecklistItems()
                    ->orderBy('completed_at')
                    ->orderBy('due_date')
                    ->get(['id', 'title', 'due_date', 'completed_at'])
                    ->map(fn ($item): array => [
                        'id' => $item->id,
                        'title' => $item->title,
                        'dueDate' => $item->due_date?->toDateString(),
                        'completedAt' => $item->completed_at?->toIso8601String(),
                    ]),
                'recentFeedback' => $user->supervisorFeedback()
                    ->with('supervisor:id,name')
                    ->latest()
                    ->limit(3)
                    ->get()
                    ->map(fn ($feedback): array => [
                        'id' => $feedback->id,
                        'category' => $feedback->category,
                        'rating' => $feedback->rating,
                        'comments' => $feedback->comments,
                        'supervisorName' => $feedback->supervisor->name,
                        'createdAt' => $feedback->created_at->toIso8601String(),
                    ]),
            ]);
        }

        /** @var Company $company */
        $company = $user->companyRecord;

        Gate::authorize('view', $company);

        $ojtQuery = User::query()->where('company_id', $company->id)->where('role', 'ojt');
        $ojtIds = (clone $ojtQuery)->select('id');
        $ojtCounts = (clone $ojtQuery)->toBase()
            ->selectRaw('count(*) as total')
            ->selectRaw("count(case when ojt_status in ('onboarding', 'active') and end_date is null then 1 end) as active")
            ->selectRaw("count(case when ojt_status = 'onboarding' then 1 end) as onboarding")
            ->selectRaw("count(case when ojt_status = 'paused' then 1 end) as paused")
            ->selectRaw("count(case when ojt_status = 'completed' or end_date is not null then 1 end) as completed")
            ->selectRaw('count(case when supervisor_id is null then 1 end) as unassigned')
            ->selectRaw('count(case when last_seen_at >= ? then 1 end) as online', [now()->subSeconds(User::ONLINE_WINDOW_SECONDS)])
            ->first();
        $today = now($company->timezone)->toDateString();
        $attendance = DailyReport::query()
            ->whereIn('user_id', $ojtIds)
            ->whereDate('report_date', $today)
            ->toBase()
            ->selectRaw('count(*) as recorded')
            ->selectRaw('count(case when time_out is null then 1 end) as timed_in')
            ->selectRaw('count(case when time_out is not null then 1 end) as timed_out')
            ->selectRaw("count(case when attendance_status = 'late' then 1 end) as late")
            ->first();
        $onLeaveToday = LeaveRequest::query()
            ->where('company_id', $company->id)
            ->where('status', LeaveRequest::STATUS_APPROVED)
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $today)
            ->count();
        $pendingReports = DailyReport::query()
            ->whereIn('user_id', $ojtIds)
            ->where('approval_status', DailyReport::STATUS_PENDING)
            ->whereNotNull('summary')
            ->count();
        $pendingCorrections = AttendanceCorrectionRequest::query()
            ->whereIn('requested_by', $ojtIds)
            ->where('status', AttendanceCorrectionRequest::STATUS_PENDING_ADMIN)
            ->count();
        $pendingLeave = LeaveRequest::query()
            ->where('company_id', $company->id)
            ->where('status', LeaveRequest::STATUS_PENDING_ADMIN)
            ->count();
        $pendingDocuments = Document::query()
            ->where('company_id', $company->id)
            ->where('status', Document::STATUS_PENDING)
            ->count();
        $pendingDtrs = DtrSubmission::query()
            ->where('company_id', $company->id)
            ->where('status', DtrSubmission::STATUS_PENDING_ADMIN)
            ->count();
        $pendingCertificates = CompletionCertificate::query()
            ->where('company_id', $company->id)
            ->where('status', CompletionCertificate::STATUS_PENDING_SUPERVISOR)
            ->count();
        $lastBackup = SystemBackup::query()->latest()->first(['status', 'completed_at', 'verified_at']);
        $totalOjtCount = (int) ($ojtCounts->total ?? 0);
        $activeOjtCount = (int) ($ojtCounts->active ?? 0);
        $completedOjtCount = (int) ($ojtCounts->completed ?? 0);

        return Inertia::render('company/overview', [
            'company' => [
                'name' => $company->name,
            ],
            'stats' => [
                'totalOjtCount' => $totalOjtCount,
                'activeOjtCount' => $activeOjtCount,
                'completedOjtCount' => $completedOjtCount,
            ],
            'monitoring' => [
                'attendance' => [
                    'recorded' => (int) ($attendance->recorded ?? 0),
                    'timedIn' => (int) ($attendance->timed_in ?? 0),
                    'timedOut' => (int) ($attendance->timed_out ?? 0),
                    'late' => (int) ($attendance->late ?? 0),
                    'onLeave' => $onLeaveToday,
                    'notRecorded' => max(0, $activeOjtCount - (int) ($attendance->recorded ?? 0) - $onLeaveToday),
                ],
                'queues' => [
                    'reports' => $pendingReports,
                    'corrections' => $pendingCorrections,
                    'leave' => $pendingLeave,
                    'documents' => $pendingDocuments,
                    'dtrs' => $pendingDtrs,
                    'certificates' => $pendingCertificates,
                    'total' => $pendingReports + $pendingCorrections + $pendingLeave + $pendingDocuments + $pendingDtrs + $pendingCertificates,
                ],
                'workforce' => [
                    'onboarding' => (int) ($ojtCounts->onboarding ?? 0),
                    'paused' => (int) ($ojtCounts->paused ?? 0),
                    'unassignedSupervisor' => (int) ($ojtCounts->unassigned ?? 0),
                    'online' => (int) ($ojtCounts->online ?? 0),
                    'supervisors' => $company->users()->where('role', 'supervisor')->count(),
                    'departments' => $company->departments()->where('is_active', true)->count(),
                ],
                'records' => [
                    'finalizedDtrs' => DtrSubmission::query()->where('company_id', $company->id)->where('status', DtrSubmission::STATUS_APPROVED)->count(),
                    'finalizedCertificates' => CompletionCertificate::query()->where('company_id', $company->id)->where('status', CompletionCertificate::STATUS_FINALIZED)->count(),
                    'approvedDocuments' => Document::query()->where('company_id', $company->id)->where('status', Document::STATUS_APPROVED)->count(),
                ],
                'system' => [
                    'backupStatus' => $lastBackup?->status ?? 'not_available',
                    'backupCompletedAt' => $lastBackup?->completed_at?->toIso8601String(),
                    'backupVerifiedAt' => $lastBackup?->verified_at?->toIso8601String(),
                ],
                'refreshedAt' => now($company->timezone)->toIso8601String(),
            ],
        ]);
    }
}
