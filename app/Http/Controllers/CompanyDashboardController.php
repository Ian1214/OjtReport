<?php

namespace App\Http\Controllers;

use App\Models\Company;
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
            ]);
        }

        /** @var Company $company */
        $company = $user->companyRecord;

        Gate::authorize('view', $company);

        $totalOjtCount = $company->ojts()->count();
        $completedOjtCount = $company->ojts()->whereNotNull('end_date')->count();

        return Inertia::render('company/overview', [
            'company' => [
                'name' => $company->name,
            ],
            'stats' => [
                'totalOjtCount' => $totalOjtCount,
                'activeOjtCount' => $totalOjtCount - $completedOjtCount,
                'completedOjtCount' => $completedOjtCount,
            ],
        ]);
    }
}
