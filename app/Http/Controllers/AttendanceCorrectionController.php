<?php

namespace App\Http\Controllers;

use App\Actions\RecordActivity;
use App\Http\Requests\RejectAttendanceCorrectionRequest;
use App\Http\Requests\ReviewAttendanceCorrectionRequest;
use App\Http\Requests\StoreAttendanceCorrectionRequest;
use App\Models\AttendanceCorrectionRequest;
use App\Models\DailyReport;
use App\Models\User;
use App\Notifications\AttendanceCorrectionUpdated;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceCorrectionController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $query = AttendanceCorrectionRequest::query()
            ->select([
                'id', 'daily_report_id', 'requested_by', 'original_time_in', 'original_time_out',
                'proposed_time_in', 'proposed_time_out', 'reason', 'status', 'supervisor_comment',
                'supervisor_reviewed_by', 'supervisor_reviewed_at', 'admin_comment', 'reviewed_by',
                'reviewed_at', 'created_at',
            ])
            ->with([
                'dailyReport:id,user_id,report_date,time_in,time_out,total_hours',
                'requester:id,name,student_id,company_id,supervisor_id',
                'supervisorReviewer:id,name',
                'reviewer:id,name',
            ]);

        if ($user->role === 'ojt') {
            $query->where('requested_by', $user->id);
        } elseif ($user->isSupervisor()) {
            $query->whereHas('requester', fn (Builder $requester): Builder => $requester
                ->where('supervisor_id', $user->id));
        } elseif ($user->isCompanyAdmin()) {
            $query->whereHas('requester', fn (Builder $requester): Builder => $requester
                ->where('company_id', $user->company_id)
                ->where('role', 'ojt'));
        } else {
            abort(403);
        }

        $corrections = $query->latest()->paginate(15)->withQueryString();

        return Inertia::render('attendance-corrections/index', [
            'role' => $user->role,
            'corrections' => $corrections->through(fn (AttendanceCorrectionRequest $correction): array => [
                'id' => $correction->id,
                'reportDate' => $correction->dailyReport->report_date->toDateString(),
                'originalTimeIn' => $correction->original_time_in,
                'originalTimeOut' => $correction->original_time_out,
                'proposedTimeIn' => $correction->proposed_time_in,
                'proposedTimeOut' => $correction->proposed_time_out,
                'reason' => $correction->reason,
                'status' => $correction->status,
                'supervisorComment' => $correction->supervisor_comment,
                'supervisorName' => $correction->supervisorReviewer?->name,
                'supervisorReviewedAt' => $correction->supervisor_reviewed_at?->toIso8601String(),
                'adminComment' => $correction->admin_comment,
                'reviewerName' => $correction->reviewer?->name,
                'reviewedAt' => $correction->reviewed_at?->toIso8601String(),
                'createdAt' => $correction->created_at?->toIso8601String(),
                'ojt' => [
                    'id' => $correction->requester->id,
                    'name' => $correction->requester->name,
                    'studentId' => $correction->requester->student_id,
                ],
            ]),
        ]);
    }

    public function store(
        StoreAttendanceCorrectionRequest $request,
        DailyReport $dailyReport,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $ojt */
        $ojt = $request->user();

        $correction = DB::transaction(function () use ($request, $dailyReport, $ojt): AttendanceCorrectionRequest {
            $lockedReport = DailyReport::query()->lockForUpdate()->findOrFail($dailyReport->id);

            if ($lockedReport->loadMissing('dtrSubmission')->isLocked()) {
                throw ValidationException::withMessages([
                    'attendance' => 'This attendance record belongs to a finalized DTR and can no longer be changed.',
                ]);
            }

            if ($lockedReport->correctionRequests()
                ->whereIn('status', [
                    AttendanceCorrectionRequest::STATUS_PENDING_SUPERVISOR,
                    AttendanceCorrectionRequest::STATUS_PENDING_ADMIN,
                ])->exists()) {
                throw ValidationException::withMessages([
                    'attendance' => 'This report already has a pending correction request.',
                ]);
            }

            return $lockedReport->correctionRequests()->create([
                'requested_by' => $ojt->id,
                'original_time_in' => $lockedReport->time_in,
                'original_time_out' => $lockedReport->time_out,
                'proposed_time_in' => $request->validated('proposed_time_in'),
                'proposed_time_out' => $request->validated('proposed_time_out'),
                'reason' => $request->validated('reason'),
                'status' => $ojt->supervisor_id === null
                    ? AttendanceCorrectionRequest::STATUS_PENDING_ADMIN
                    : AttendanceCorrectionRequest::STATUS_PENDING_SUPERVISOR,
            ]);
        }, attempts: 3);

        $recipients = $ojt->supervisor_id !== null
            ? User::query()->whereKey($ojt->supervisor_id)->get()
            : User::query()->where('company_id', $ojt->company_id)->where('role', 'company_admin')->get();

        Notification::send($recipients, $this->notification(
            $correction,
            'Attendance correction submitted',
            "{$ojt->name} requested an attendance time correction.",
        ));
        $recordActivity->handle(
            $ojt,
            'correction.requested',
            "{$ojt->name} requested a time correction.",
            $correction,
            ['report_date' => $dailyReport->report_date->toDateString()],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Attendance correction request submitted.']);

        return back();
    }

    public function supervisorReview(
        ReviewAttendanceCorrectionRequest $request,
        AttendanceCorrectionRequest $attendanceCorrection,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $supervisor */
        $supervisor = $request->user();
        $attendanceCorrection->loadMissing('requester');

        abort_unless($attendanceCorrection->requester->supervisor_id === $supervisor->id, 404);

        $correction = DB::transaction(function () use ($attendanceCorrection, $request, $supervisor): AttendanceCorrectionRequest {
            $locked = AttendanceCorrectionRequest::query()->lockForUpdate()->findOrFail($attendanceCorrection->id);
            $this->ensureStatus($locked, AttendanceCorrectionRequest::STATUS_PENDING_SUPERVISOR);
            $locked->update([
                'status' => AttendanceCorrectionRequest::STATUS_PENDING_ADMIN,
                'supervisor_comment' => $request->validated('supervisor_comment'),
                'supervisor_reviewed_by' => $supervisor->id,
                'supervisor_reviewed_at' => now(),
            ]);

            return $locked->fresh(['requester', 'dailyReport']);
        }, attempts: 3);

        $admins = User::query()
            ->where('company_id', $correction->requester->company_id)
            ->where('role', 'company_admin')
            ->get();
        Notification::send($admins, $this->notification(
            $correction,
            'Correction ready for final review',
            "{$correction->requester->name}'s request was reviewed by {$supervisor->name}.",
        ));
        $recordActivity->handle(
            $supervisor,
            'correction.supervisor_reviewed',
            "{$supervisor->name} forwarded {$correction->requester->name}'s time correction for final review.",
            $correction,
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Correction forwarded for final administrator review.',
        ]);

        return back();
    }

    public function approve(
        Request $request,
        AttendanceCorrectionRequest $attendanceCorrection,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $admin */
        $admin = $request->user();
        $this->authorizeAdmin($admin, $attendanceCorrection);

        $correction = DB::transaction(function () use ($attendanceCorrection, $admin): AttendanceCorrectionRequest {
            $ojt = User::query()->lockForUpdate()->findOrFail($attendanceCorrection->requested_by);
            $locked = AttendanceCorrectionRequest::query()->lockForUpdate()->findOrFail($attendanceCorrection->id);
            $this->ensureStatus($locked, AttendanceCorrectionRequest::STATUS_PENDING_ADMIN);
            $report = DailyReport::query()->lockForUpdate()->findOrFail($locked->daily_report_id);
            if ($report->loadMissing('dtrSubmission')->isLocked()) {
                throw ValidationException::withMessages([
                    'decision' => 'This DTR was finalized before the correction could be applied.',
                ]);
            }
            $timeIn = $locked->proposed_time_in ?? $report->time_in;
            $timeOut = $locked->proposed_time_out ?? $report->time_out;
            $scheduledTimeIn = Carbon::createFromFormat(
                'H:i:s',
                $report->scheduled_time_in ?? $ojt->companyRecord?->work_start_time ?? '08:00:00',
            );
            $punctuality = DailyReport::classifyPunctuality(
                Carbon::createFromFormat('H:i:s', $timeIn),
                $scheduledTimeIn,
                $report->scheduled_grace_minutes ?? $ojt->companyRecord?->late_grace_minutes ?? 0,
            );

            $report->update([
                'time_in' => $timeIn,
                'time_out' => $timeOut,
                ...$punctuality,
                'total_hours' => DailyReport::calculateTotalHours(
                    Carbon::createFromFormat('H:i:s', $timeIn),
                    Carbon::createFromFormat('H:i:s', $timeOut),
                ),
            ]);
            $locked->update([
                'status' => AttendanceCorrectionRequest::STATUS_APPROVED,
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
                'admin_comment' => null,
            ]);
            $ojt->syncCompletionFromApprovedReports();

            return $locked->fresh(['requester', 'dailyReport']);
        }, attempts: 3);

        $this->notifyOjtAndSupervisor($correction, 'Attendance correction approved', 'Your corrected attendance times are now reflected in your report.');
        $recordActivity->handle(
            $admin,
            'correction.approved',
            "{$admin->name} approved {$correction->requester->name}'s time correction.",
            $correction,
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Attendance correction approved and hours recalculated.',
        ]);

        return back();
    }

    public function reject(
        RejectAttendanceCorrectionRequest $request,
        AttendanceCorrectionRequest $attendanceCorrection,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $admin */
        $admin = $request->user();
        $this->authorizeAdmin($admin, $attendanceCorrection);

        $correction = DB::transaction(function () use ($attendanceCorrection, $request, $admin): AttendanceCorrectionRequest {
            $locked = AttendanceCorrectionRequest::query()->lockForUpdate()->findOrFail($attendanceCorrection->id);
            $this->ensureStatus($locked, AttendanceCorrectionRequest::STATUS_PENDING_ADMIN);
            $locked->update([
                'status' => AttendanceCorrectionRequest::STATUS_REJECTED,
                'admin_comment' => $request->validated('admin_comment'),
                'reviewed_by' => $admin->id,
                'reviewed_at' => now(),
            ]);

            return $locked->fresh(['requester', 'dailyReport']);
        }, attempts: 3);

        $this->notifyOjtAndSupervisor($correction, 'Attendance correction rejected', $correction->admin_comment);
        $recordActivity->handle(
            $admin,
            'correction.rejected',
            "{$admin->name} rejected {$correction->requester->name}'s time correction.",
            $correction,
        );

        Inertia::flash('toast', [
            'type' => 'warning',
            'message' => 'Attendance correction rejected. Original attendance was preserved.',
        ]);

        return back();
    }

    private function authorizeAdmin(User $admin, AttendanceCorrectionRequest $correction): void
    {
        abort_unless($admin->isCompanyAdmin(), 403);
        $correction->loadMissing('requester');
        abort_unless($correction->requester->company_id === $admin->company_id, 404);
    }

    private function ensureStatus(AttendanceCorrectionRequest $correction, string $status): void
    {
        if ($correction->status !== $status) {
            throw ValidationException::withMessages(['correction' => 'This correction request is no longer awaiting this review.']);
        }
    }

    private function notification(AttendanceCorrectionRequest $correction, string $title, string $message): AttendanceCorrectionUpdated
    {
        $correction->loadMissing('dailyReport');

        return new AttendanceCorrectionUpdated(
            correctionId: $correction->id,
            reportDate: $correction->dailyReport->report_date->toDateString(),
            title: $title,
            message: $message,
            status: $correction->status,
        );
    }

    private function notifyOjtAndSupervisor(AttendanceCorrectionRequest $correction, string $title, string $message): void
    {
        $recipientIds = array_filter([
            $correction->requested_by,
            $correction->requester->supervisor_id,
        ]);
        Notification::send(User::query()->whereKey($recipientIds)->get(), $this->notification($correction, $title, $message));
    }
}
