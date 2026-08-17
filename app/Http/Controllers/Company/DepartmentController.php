<?php

namespace App\Http\Controllers\Company;

use App\Actions\RecordActivity;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreDepartmentRequest;
use App\Http\Requests\UpdateDepartmentRequest;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class DepartmentController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $administrator */
        $administrator = $request->user();
        Gate::authorize('viewAny', Department::class);

        return Inertia::render('company/departments', [
            'departments' => Department::query()
                ->where('company_id', $administrator->company_id)
                ->with('headSupervisor:id,name')
                ->withCount([
                    'ojts',
                    'ojts as active_ojts_count' => fn ($query) => $query->whereIn('ojt_status', [User::OJT_STATUS_ONBOARDING, User::OJT_STATUS_ACTIVE]),
                    'pendingReports',
                    'lateReports',
                ])
                ->withSum('approvedReports as approved_hours', 'total_hours')
                ->orderByDesc('is_active')
                ->orderBy('name')
                ->get()
                ->map(fn (Department $department): array => [
                    'id' => $department->id,
                    'name' => $department->name,
                    'description' => $department->description,
                    'headSupervisorId' => $department->head_supervisor_id,
                    'headSupervisorName' => $department->headSupervisor?->name,
                    'capacity' => $department->capacity,
                    'workStartTime' => $department->work_start_time,
                    'workEndTime' => $department->work_end_time,
                    'lateGraceMinutes' => $department->late_grace_minutes,
                    'workDays' => $department->work_days,
                    'isActive' => $department->is_active,
                    'ojtCount' => (int) $department->ojts_count,
                    'activeOjtCount' => (int) $department->active_ojts_count,
                    'approvedHours' => (float) ($department->approved_hours ?? 0),
                    'pendingReports' => (int) $department->pending_reports_count,
                    'lateDays' => (int) $department->late_reports_count,
                ]),
            'supervisors' => User::query()
                ->where('company_id', $administrator->company_id)
                ->where('role', 'supervisor')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function store(StoreDepartmentRequest $request, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $administrator */
        $administrator = $request->user();
        Gate::authorize('create', Department::class);
        $department = Department::query()->create([...$request->validated(), 'company_id' => $administrator->company_id]);
        $recordActivity->handle($administrator, 'department.created', "{$administrator->name} created the {$department->name} department.", $department);
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$department->name} department created."]);

        return to_route('company.departments.index');
    }

    public function update(UpdateDepartmentRequest $request, Department $department, RecordActivity $recordActivity): RedirectResponse
    {
        Gate::authorize('update', $department);
        /** @var User $administrator */
        $administrator = $request->user();
        $previousName = $department->name;

        DB::transaction(function () use ($request, $department): void {
            $department->update($request->validated());
            $department->ojts()->update(['department' => $department->name]);
        }, attempts: 3);
        $recordActivity->handle($administrator, 'department.updated', "{$administrator->name} updated the {$previousName} department.", $department);
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$department->name} department updated."]);

        return to_route('company.departments.index');
    }

    public function destroy(Request $request, Department $department, RecordActivity $recordActivity): RedirectResponse
    {
        Gate::authorize('delete', $department);
        /** @var User $administrator */
        $administrator = $request->user();
        $department->update(['is_active' => false]);
        $recordActivity->handle($administrator, 'department.archived', "{$administrator->name} archived the {$department->name} department.", $department);
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$department->name} was archived. Existing records were preserved."]);

        return to_route('company.departments.index');
    }
}
