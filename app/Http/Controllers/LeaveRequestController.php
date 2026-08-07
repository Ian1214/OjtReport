<?php

namespace App\Http\Controllers;

use App\Actions\RecordActivity;
use App\Http\Requests\ReviewLeaveRequest;
use App\Http\Requests\StoreLeaveRequest;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class LeaveRequestController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $query = LeaveRequest::query()->with(['user:id,name,student_id,supervisor_id', 'supervisorReviewer:id,name', 'reviewer:id,name']);

        match ($user->role) {
            'ojt' => $query->where('user_id', $user->id),
            'supervisor' => $query->whereHas('user', fn (Builder $builder): Builder => $builder->where('supervisor_id', $user->id)),
            'company_admin' => $query->where('company_id', $user->company_id),
            default => abort(403),
        };

        $company = $user->companyRecord;

        return Inertia::render('leave/index', [
            'role' => $user->role,
            'requests' => $query->latest()->paginate(15)->withQueryString()->through(fn (LeaveRequest $leave): array => [
                'id' => $leave->id,
                'type' => $leave->type,
                'startDate' => $leave->start_date->toDateString(),
                'endDate' => $leave->end_date->toDateString(),
                'reason' => $leave->reason,
                'status' => $leave->status,
                'ojtName' => $leave->user->name,
                'studentId' => $leave->user->student_id,
                'supervisorName' => $leave->supervisorReviewer?->name,
                'supervisorComment' => $leave->supervisor_comment,
                'adminComment' => $leave->admin_comment,
            ]),
            'holidays' => $company?->holidays()->orderBy('holiday_date')->get()->map(fn ($holiday): array => [
                'id' => $holiday->id,
                'date' => $holiday->holiday_date->toDateString(),
                'name' => $holiday->name,
            ]) ?? [],
        ]);
    }

    public function store(StoreLeaveRequest $request, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $ojt */
        $ojt = $request->user();
        $leave = $ojt->leaveRequests()->create([
            ...$request->validated(),
            'company_id' => $ojt->company_id,
            'status' => $ojt->supervisor_id === null
                ? LeaveRequest::STATUS_PENDING_ADMIN
                : LeaveRequest::STATUS_PENDING_SUPERVISOR,
        ]);
        $recordActivity->handle($ojt, 'leave.requested', "{$ojt->name} submitted a leave request.", $leave);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Your request was submitted for review.']);

        return back();
    }

    public function review(ReviewLeaveRequest $request, LeaveRequest $leaveRequest, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $reviewer */
        $reviewer = $request->user();
        $leaveRequest->loadMissing('user');
        abort_unless($leaveRequest->company_id === $reviewer->company_id, 404);

        DB::transaction(function () use ($leaveRequest, $request, $reviewer): void {
            $locked = LeaveRequest::query()->lockForUpdate()->findOrFail($leaveRequest->id);
            $decision = $request->validated('decision');

            if ($reviewer->isSupervisor()) {
                abort_unless($locked->user->supervisor_id === $reviewer->id, 404);
                if ($locked->status !== LeaveRequest::STATUS_PENDING_SUPERVISOR) {
                    throw ValidationException::withMessages(['decision' => 'This request has already been reviewed.']);
                }
                $locked->update([
                    'status' => $decision === 'approve' ? LeaveRequest::STATUS_PENDING_ADMIN : LeaveRequest::STATUS_REJECTED,
                    'supervisor_reviewed_by' => $reviewer->id,
                    'supervisor_reviewed_at' => now(),
                    'supervisor_comment' => $request->validated('comment'),
                ]);
            } else {
                abort_unless($reviewer->isCompanyAdmin(), 403);
                if ($locked->status !== LeaveRequest::STATUS_PENDING_ADMIN) {
                    throw ValidationException::withMessages(['decision' => 'This request is not ready for final review.']);
                }
                $locked->update([
                    'status' => $decision === 'approve' ? LeaveRequest::STATUS_APPROVED : LeaveRequest::STATUS_REJECTED,
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => now(),
                    'admin_comment' => $request->validated('comment'),
                ]);
            }
        }, attempts: 3);

        $recordActivity->handle($reviewer, 'leave.reviewed', "{$reviewer->name} reviewed {$leaveRequest->user->name}'s leave request.", $leaveRequest);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Leave request updated.']);

        return back();
    }
}
