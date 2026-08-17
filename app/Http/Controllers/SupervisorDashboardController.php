<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupervisorDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $supervisor */
        $supervisor = $request->user();

        abort_unless($supervisor->isSupervisor(), 403);

        return Inertia::render('supervisor/dashboard', [
            'ojts' => $supervisor->assignedOjts()
                ->with([
                    'school.curriculumOutcomes' => fn ($query) => $query->where('is_active', true)->orderBy('code'),
                    'assignedTasks' => fn ($query) => $query->with('curriculumOutcomes:id,code,title')->latest(),
                ])
                ->withCount(['sentDirectMessages as unread_messages_count' => fn ($query) => $query
                    ->where('recipient_id', $supervisor->id)
                    ->whereNull('read_at')])
                ->orderBy('name')
                ->get(['id', 'school_id', 'name', 'student_id', 'program', 'department', 'position', 'last_seen_at'])
                ->map(fn (User $ojt): array => [
                    'id' => $ojt->id,
                    'name' => $ojt->name,
                    'studentId' => $ojt->student_id,
                    'program' => $ojt->program,
                    'department' => $ojt->department,
                    'position' => $ojt->position,
                    'isOnline' => $ojt->isOnline(),
                    'lastSeenAt' => $ojt->last_seen_at?->toIso8601String(),
                    'unreadCount' => (int) $ojt->unread_messages_count,
                    'outcomes' => $ojt->school?->curriculumOutcomes->map(fn ($outcome): array => [
                        'id' => $outcome->id,
                        'code' => $outcome->code,
                        'title' => $outcome->title,
                    ]) ?? [],
                    'tasks' => $ojt->assignedTasks->map(fn ($task): array => [
                        'id' => $task->id,
                        'title' => $task->title,
                        'description' => $task->description,
                        'status' => $task->status,
                        'dueDate' => $task->due_date?->toDateString(),
                        'outcomes' => $task->curriculumOutcomes->map(fn ($outcome): array => [
                            'code' => $outcome->code,
                            'title' => $outcome->title,
                        ]),
                    ]),
                ]),
        ]);
    }

    public function showReports(Request $request, User $ojt): Response
    {
        /** @var User $supervisor */
        $supervisor = $request->user();

        abort_unless($supervisor->isSupervisor(), 403);
        abort_unless($ojt->role === 'ojt' && $ojt->supervisor_id === $supervisor->id, 404);

        $completedHours = (float) $ojt->approvedDailyReports()->sum('total_hours');

        return Inertia::render('company/ojt-reports', [
            'companyName' => $supervisor->company ?? config('app.name'),
            'viewer' => 'supervisor',
            'ojt' => [
                'id' => $ojt->id,
                'name' => $ojt->name,
                'studentId' => $ojt->student_id,
                'program' => $ojt->program,
                'year' => $ojt->year,
                'department' => $ojt->department,
                'position' => $ojt->position,
                'requiredHours' => $ojt->required_hours,
                'completedHours' => $completedHours,
                'hoursLeft' => max(0, (float) $ojt->required_hours - $completedHours),
            ],
            'reports' => $ojt->dailyReports()
                ->whereNotNull('summary')
                ->latest('report_date')
                ->get([
                    'id',
                    'report_date',
                    'time_in',
                    'time_out',
                    'total_hours',
                    'summary',
                    'approval_status',
                    'reviewed_at',
                    'rejection_reason',
                    'scheduled_time_in',
                    'attendance_status',
                    'late_minutes',
                ]),
            'onboardingItems' => $ojt->onboardingChecklistItems()
                ->with('completedBy:id,name')
                ->orderBy('completed_at')
                ->orderBy('due_date')
                ->get()
                ->map(fn ($item): array => [
                    'id' => $item->id,
                    'title' => $item->title,
                    'description' => $item->description,
                    'dueDate' => $item->due_date?->toDateString(),
                    'completedAt' => $item->completed_at?->toIso8601String(),
                    'completedBy' => $item->completedBy?->name,
                ]),
            'feedback' => $ojt->supervisorFeedback()
                ->with('supervisor:id,name')
                ->latest()
                ->get()
                ->map(fn ($feedback): array => [
                    'id' => $feedback->id,
                    'category' => $feedback->category,
                    'rating' => $feedback->rating,
                    'comments' => $feedback->comments,
                    'sharedWithSchool' => $feedback->shared_with_school,
                    'supervisorName' => $feedback->supervisor->name,
                    'createdAt' => $feedback->created_at->toIso8601String(),
                ]),
        ]);
    }
}
