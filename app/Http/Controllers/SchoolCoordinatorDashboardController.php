<?php

namespace App\Http\Controllers;

use App\Http\Requests\AcknowledgeOjtCompletionRequest;
use App\Models\CompletionCertificate;
use App\Models\DailyReport;
use App\Models\DtrSubmission;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SchoolCoordinatorDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $coordinator */
        $coordinator = $request->user();
        $this->authorizeCoordinator($coordinator);
        $coordinator->loadMissing('school:id,name');

        $studentsQuery = User::query()
            ->where('school_id', $coordinator->school_id)
            ->where('role', 'ojt');
        $students = (clone $studentsQuery)
            ->select([
                'id', 'company_id', 'supervisor_id', 'name', 'student_id', 'program',
                'required_hours', 'end_date', 'school_acknowledged_at',
            ])
            ->with(['companyRecord:id,name', 'assignedSupervisor:id,name'])
            ->withSum('approvedDailyReports as approved_hours', 'total_hours')
            ->withCount([
                'dailyReports as pending_reports_count' => fn ($query) => $query
                    ->where('approval_status', DailyReport::STATUS_PENDING)
                    ->whereNotNull('summary'),
                'dailyReports as late_days_count' => fn ($query) => $query
                    ->where('attendance_status', DailyReport::ATTENDANCE_LATE),
                'assignedTasks as unfinished_tasks_count' => fn ($query) => $query
                    ->whereIn('status', ['not_started', 'ongoing']),
            ])
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('school/dashboard', [
            'schoolName' => $coordinator->school?->name ?? 'School workspace',
            'summary' => [
                'students' => (clone $studentsQuery)->count(),
                'completedStudents' => (clone $studentsQuery)->whereNotNull('end_date')->count(),
                'finalizedDtrs' => DtrSubmission::query()
                    ->whereHas('user', fn ($query) => $query
                        ->where('school_id', $coordinator->school_id)
                        ->where('role', 'ojt'))
                    ->where('status', DtrSubmission::STATUS_APPROVED)
                    ->count(),
                'finalizedCertificates' => CompletionCertificate::query()
                    ->whereHas('ojt', fn ($query) => $query
                        ->where('school_id', $coordinator->school_id)
                        ->where('role', 'ojt'))
                    ->where('status', CompletionCertificate::STATUS_FINALIZED)
                    ->count(),
            ],
            'students' => $students->through(fn (User $student): array => $this->studentSummary($student)),
        ]);
    }

    public function show(Request $request, User $ojt): Response
    {
        /** @var User $coordinator */
        $coordinator = $request->user();
        $this->authorizeStudent($coordinator, $ojt);

        $ojt->loadMissing(['companyRecord:id,name', 'assignedSupervisor:id,name'])
            ->loadSum('approvedDailyReports as approved_hours', 'total_hours')
            ->loadCount([
                'dailyReports as pending_reports_count' => fn ($query) => $query
                    ->where('approval_status', DailyReport::STATUS_PENDING)
                    ->whereNotNull('summary'),
                'dailyReports as late_days_count' => fn ($query) => $query
                    ->where('attendance_status', DailyReport::ATTENDANCE_LATE),
                'assignedTasks as unfinished_tasks_count' => fn ($query) => $query
                    ->whereIn('status', ['not_started', 'ongoing']),
            ]);
        $approvedHours = (float) $ojt->approvedDailyReports()->sum('total_hours');

        return Inertia::render('school/student', [
            'student' => [
                ...$this->studentSummary($ojt),
                'department' => $ojt->department,
                'position' => $ojt->position,
                'year' => $ojt->year,
                'approvedHours' => $approvedHours,
                'remainingHours' => max(0, (float) ($ojt->required_hours ?? 0) - $approvedHours),
                'startDate' => $ojt->start_date?->toDateString(),
                'endDate' => $ojt->end_date?->toDateString(),
            ],
            'recentReports' => $ojt->dailyReports()
                ->whereNotNull('summary')
                ->latest('report_date')
                ->limit(10)
                ->get(['id', 'report_date', 'total_hours', 'summary', 'approval_status', 'attendance_status'])
                ->map(fn (DailyReport $report): array => [
                    'id' => $report->id,
                    'date' => $report->report_date->toDateString(),
                    'hours' => $report->total_hours,
                    'summary' => $report->summary,
                    'approvalStatus' => $report->approval_status,
                    'attendanceStatus' => $report->attendance_status,
                ]),
            'tasks' => $ojt->assignedTasks()
                ->latest()
                ->limit(10)
                ->get(['id', 'title', 'description', 'status', 'due_date'])
                ->map(fn ($task): array => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status,
                    'dueDate' => $task->due_date?->toDateString(),
                ]),
            'feedback' => $ojt->supervisorFeedback()
                ->where('shared_with_school', true)
                ->with('supervisor:id,name')
                ->latest()
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

    public function acknowledge(AcknowledgeOjtCompletionRequest $request, User $ojt): RedirectResponse
    {
        if ($ojt->end_date === null) {
            return back()->withErrors([
                'completion' => 'The company must complete the OJT hours before school acknowledgement.',
            ]);
        }

        $ojt->update([
            'school_acknowledged_by' => $request->user()->id,
            'school_acknowledged_at' => now(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Completion acknowledged for {$ojt->name}.",
        ]);

        return back();
    }

    private function authorizeCoordinator(User $coordinator): void
    {
        abort_unless($coordinator->isSchoolCoordinator() && $coordinator->school_id !== null, 403);
    }

    private function authorizeStudent(User $coordinator, User $student): void
    {
        $this->authorizeCoordinator($coordinator);
        abort_unless(
            $student->role === 'ojt' && $student->school_id === $coordinator->school_id,
            404,
        );
    }

    /** @return array<string, mixed> */
    private function studentSummary(User $student): array
    {
        $approvedHours = (float) ($student->getAttribute('approved_hours') ?? 0);

        return [
            'id' => $student->id,
            'name' => $student->name,
            'studentId' => $student->student_id,
            'program' => $student->program,
            'companyName' => $student->companyRecord?->name ?? 'Not assigned',
            'supervisorName' => $student->assignedSupervisor?->name ?? 'Not assigned',
            'requiredHours' => (float) ($student->required_hours ?? 0),
            'approvedHours' => $approvedHours,
            'remainingHours' => max(0, (float) ($student->required_hours ?? 0) - $approvedHours),
            'lateDays' => (int) $student->getAttribute('late_days_count'),
            'pendingReports' => (int) $student->getAttribute('pending_reports_count'),
            'unfinishedTasks' => (int) $student->getAttribute('unfinished_tasks_count'),
            'isComplete' => $student->end_date !== null,
            'acknowledgedAt' => $student->school_acknowledged_at?->toIso8601String(),
        ];
    }
}
