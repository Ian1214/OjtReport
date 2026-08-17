<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Http\Requests\ManageOjtIndexRequest;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class ManagedOjtController extends Controller
{
    public function index(ManageOjtIndexRequest $request): Response
    {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();

        abort_unless($companyAdmin->isCompanyAdmin(), 403);

        /** @var Company $company */
        $company = $companyAdmin->companyRecord;

        Gate::authorize('view', $company);

        $filters = $request->validated();
        $ojtQuery = $company->ojts()
            ->select([
                'id',
                'name',
                'email',
                'student_id',
                'department',
                'department_id',
                'position',
                'program',
                'year',
                'ojt_status',
                'supervisor_id',
                'supervisor_name',
                'required_hours',
                'start_date',
                'end_date',
                'last_seen_at',
            ])
            ->with(['latestAccountSetupDelivery' => fn (HasOne $query): HasOne => $query->select([
                'account_setup_deliveries.id',
                'account_setup_deliveries.user_id',
                'account_setup_deliveries.status',
                'account_setup_deliveries.queued_at',
                'account_setup_deliveries.sent_at',
                'account_setup_deliveries.failed_at',
                'account_setup_deliveries.failure_reason',
            ])])
            ->withSum('approvedDailyReports', 'total_hours')
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $query) use ($search): void {
                    $query
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('student_id', 'like', "%{$search}%")
                        ->orWhere('department', 'like', "%{$search}%")
                        ->orWhere('position', 'like', "%{$search}%");
                });
            })
            ->when(($filters['status'] ?? 'all') === 'active', fn (Builder $query): Builder => $query->whereIn('ojt_status', [User::OJT_STATUS_ONBOARDING, User::OJT_STATUS_ACTIVE])->whereNull('end_date'))
            ->when(($filters['status'] ?? 'all') === 'completed', fn (Builder $query): Builder => $query->where(fn (Builder $query): Builder => $query->where('ojt_status', User::OJT_STATUS_COMPLETED)->orWhereNotNull('end_date')))
            ->when(in_array($filters['status'] ?? 'all', [User::OJT_STATUS_ONBOARDING, User::OJT_STATUS_PAUSED, User::OJT_STATUS_WITHDRAWN], true), fn (Builder $query): Builder => $query->where('ojt_status', $filters['status']))
            ->when($filters['department'] ?? null, fn (Builder $query, string $department): Builder => $query->where('department', $department));
        $ojtPaginator = $ojtQuery
            ->orderBy('department')
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();
        $totalOjtCount = $company->ojts()->count();
        $completedOjtCount = $company->ojts()->where(fn (Builder $query): Builder => $query->where('ojt_status', User::OJT_STATUS_COMPLETED)->orWhereNotNull('end_date'))->count();
        $activeOjtCount = $company->ojts()->whereIn('ojt_status', [User::OJT_STATUS_ONBOARDING, User::OJT_STATUS_ACTIVE])->whereNull('end_date')->count();
        $departments = $company->departments()
            ->withCount('ojts')
            ->orderByDesc('is_active')
            ->orderBy('name')
            ->get()
            ->map(fn ($department): array => [
                'id' => $department->id,
                'name' => $department->name,
                'ojtCount' => (int) $department->ojts_count,
                'isActive' => $department->is_active,
            ]);
        $legacyDepartments = $company->ojts()
            ->whereNull('department_id')
            ->whereNotNull('department')
            ->selectRaw('department, count(*) as aggregate')
            ->groupBy('department')
            ->get()
            ->map(fn (User $ojt): array => [
                'id' => null,
                'name' => $ojt->department,
                'ojtCount' => (int) $ojt->getAttribute('aggregate'),
                'isActive' => true,
            ]);

        return Inertia::render('company/dashboard', [
            'company' => ['name' => $company->name],
            'ojts' => $ojtPaginator->getCollection()
                ->map(fn (User $ojt): array => [
                    'id' => $ojt->id,
                    'name' => $ojt->name,
                    'email' => $ojt->email,
                    'studentId' => $ojt->student_id,
                    'department' => $ojt->department,
                    'departmentId' => $ojt->department_id,
                    'position' => $ojt->position,
                    'program' => $ojt->program,
                    'year' => $ojt->year,
                    'status' => $ojt->ojt_status,
                    'supervisorName' => $ojt->supervisor_name,
                    'supervisorId' => $ojt->supervisor_id,
                    'requiredHours' => $ojt->required_hours,
                    'startDate' => $ojt->start_date?->toDateString(),
                    'completedHours' => (float) ($ojt->approved_daily_reports_sum_total_hours ?? 0),
                    'hoursLeft' => max(0, (float) $ojt->required_hours - (float) ($ojt->approved_daily_reports_sum_total_hours ?? 0)),
                    'isComplete' => $ojt->end_date !== null,
                    'isOnline' => $ojt->isOnline(),
                    'lastSeenAt' => $ojt->last_seen_at?->toIso8601String(),
                    'setupDelivery' => $ojt->latestAccountSetupDelivery === null ? null : [
                        'status' => $ojt->latestAccountSetupDelivery->status,
                        'queuedAt' => $ojt->latestAccountSetupDelivery->queued_at->toIso8601String(),
                        'sentAt' => $ojt->latestAccountSetupDelivery->sent_at?->toIso8601String(),
                        'failedAt' => $ojt->latestAccountSetupDelivery->failed_at?->toIso8601String(),
                        'failureReason' => $ojt->latestAccountSetupDelivery->failure_reason,
                    ],
                ])
                ->values(),
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? 'all',
                'department' => $filters['department'] ?? '',
            ],
            'departments' => $departments->concat($legacyDepartments)->sortBy('name')->values(),
            'pagination' => [
                'currentPage' => $ojtPaginator->currentPage(),
                'lastPage' => $ojtPaginator->lastPage(),
                'total' => $ojtPaginator->total(),
                'from' => $ojtPaginator->firstItem(),
                'to' => $ojtPaginator->lastItem(),
                'previousPageUrl' => $ojtPaginator->previousPageUrl(),
                'nextPageUrl' => $ojtPaginator->nextPageUrl(),
            ],
            'stats' => [
                'totalOjtCount' => $totalOjtCount,
                'activeOjtCount' => $activeOjtCount,
                'completedOjtCount' => $completedOjtCount,
            ],
            'supervisors' => $company->users()
                ->where('role', 'supervisor')
                ->orderBy('name')
                ->get(['id', 'name', 'email', 'last_seen_at'])
                ->map(fn (User $supervisor): array => [
                    'id' => $supervisor->id,
                    'name' => $supervisor->name,
                    'email' => $supervisor->email,
                    'isOnline' => $supervisor->isOnline(),
                    'lastSeenAt' => $supervisor->last_seen_at?->toIso8601String(),
                ]),
        ]);
    }

    public function show(Request $request, User $ojt): Response
    {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();

        abort_unless($companyAdmin->isCompanyAdmin(), 403);

        /** @var Company $company */
        $company = $companyAdmin->companyRecord;

        Gate::authorize('view', $company);

        abort_unless($ojt->company_id === $company->id && ! $ojt->isCompanyAdmin(), 404);

        $completedHours = (float) $ojt->approvedDailyReports()->sum('total_hours');

        return Inertia::render('company/ojt-reports', [
            'companyName' => $company->name,
            'viewer' => 'company',
            'ojt' => [
                'id' => $ojt->id,
                'name' => $ojt->name,
                'studentId' => $ojt->student_id,
                'program' => $ojt->program,
                'year' => $ojt->year,
                'department' => $ojt->department,
                'position' => $ojt->position,
                'supervisorName' => $ojt->supervisor_name,
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
