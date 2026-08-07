<?php

namespace App\Http\Controllers;

use App\Actions\RecordActivity;
use App\Http\Requests\ReviewDtrSubmissionRequest;
use App\Http\Requests\StoreDtrSubmissionRequest;
use App\Models\DailyReport;
use App\Models\DtrSubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DtrSubmissionController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $query = DtrSubmission::query()->with(['user:id,name,student_id,supervisor_id', 'reports:id,dtr_submission_id,report_date,time_in,time_out,total_hours']);

        match ($user->role) {
            'ojt' => $query->where('user_id', $user->id),
            'supervisor' => $query->whereHas('user', fn (Builder $builder): Builder => $builder->where('supervisor_id', $user->id)),
            'company_admin' => $query->where('company_id', $user->company_id),
            default => abort(403),
        };

        return Inertia::render('dtr-submissions/index', [
            'role' => $user->role,
            'submissions' => $query->latest()->paginate(15)->withQueryString()->through(fn (DtrSubmission $submission): array => [
                'id' => $submission->id,
                'ojtName' => $submission->user->name,
                'studentId' => $submission->user->student_id,
                'periodStart' => $submission->period_start->toDateString(),
                'periodEnd' => $submission->period_end->toDateString(),
                'totalHours' => $submission->total_hours,
                'reportCount' => $submission->reports->count(),
                'status' => $submission->status,
                'lockedAt' => $submission->locked_at?->toIso8601String(),
                'rejectionReason' => $submission->rejection_reason,
            ]),
        ]);
    }

    public function store(StoreDtrSubmissionRequest $request, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $ojt */
        $ojt = $request->user();
        $validated = $request->validated();

        $submission = DB::transaction(function () use ($ojt, $validated): DtrSubmission {
            $reports = $ojt->dailyReports()->approved()
                ->whereNull('dtr_submission_id')
                ->whereBetween('report_date', [$validated['period_start'], $validated['period_end']])
                ->lockForUpdate()
                ->get();

            if ($reports->isEmpty()) {
                throw ValidationException::withMessages(['period_start' => 'No approved, unsubmitted reports exist in this period.']);
            }

            $submission = $ojt->dtrSubmissions()->create([
                'company_id' => $ojt->company_id,
                ...$validated,
                'total_hours' => $reports->sum('total_hours'),
                'status' => $ojt->supervisor_id === null ? DtrSubmission::STATUS_PENDING_ADMIN : DtrSubmission::STATUS_PENDING_SUPERVISOR,
                'submitted_at' => now(),
            ]);
            $reports->each->update(['dtr_submission_id' => $submission->id]);

            return $submission;
        }, attempts: 3);

        $recordActivity->handle($ojt, 'dtr.submitted', "{$ojt->name} submitted a DTR period for approval.", $submission);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'DTR period submitted for sign-off.']);

        return back();
    }

    public function review(ReviewDtrSubmissionRequest $request, DtrSubmission $dtrSubmission, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $reviewer */
        $reviewer = $request->user();
        $dtrSubmission->loadMissing('user');
        abort_unless($dtrSubmission->company_id === $reviewer->company_id, 404);

        $submission = DB::transaction(function () use ($request, $dtrSubmission, $reviewer): DtrSubmission {
            $locked = DtrSubmission::query()->with(['user', 'reports'])->lockForUpdate()->findOrFail($dtrSubmission->id);
            $approve = $request->validated('decision') === 'approve';

            if ($reviewer->isSupervisor()) {
                abort_unless($locked->user->supervisor_id === $reviewer->id, 404);
                $this->ensureStatus($locked, DtrSubmission::STATUS_PENDING_SUPERVISOR);
                $locked->update([
                    'status' => $approve ? DtrSubmission::STATUS_PENDING_ADMIN : DtrSubmission::STATUS_REJECTED,
                    'supervisor_reviewed_by' => $reviewer->id,
                    'supervisor_reviewed_at' => now(),
                    'rejection_reason' => $request->validated('rejection_reason'),
                ]);
            } else {
                abort_unless($reviewer->isCompanyAdmin(), 403);
                $this->ensureStatus($locked, DtrSubmission::STATUS_PENDING_ADMIN);
                $locked->update([
                    'status' => $approve ? DtrSubmission::STATUS_APPROVED : DtrSubmission::STATUS_REJECTED,
                    'reviewed_by' => $reviewer->id,
                    'reviewed_at' => now(),
                    'locked_at' => $approve ? now() : null,
                    'rejection_reason' => $request->validated('rejection_reason'),
                    'snapshot_hash' => $approve ? $this->snapshotHash($locked) : null,
                ]);
            }

            if (! $approve) {
                $locked->reports()->update(['dtr_submission_id' => null]);
            }

            return $locked;
        }, attempts: 3);

        $recordActivity->handle($reviewer, 'dtr.reviewed', "{$reviewer->name} reviewed {$submission->user->name}'s DTR period.", $submission, ['status' => $submission->status]);
        Inertia::flash('toast', ['type' => 'success', 'message' => $submission->locked_at ? 'DTR approved and permanently locked.' : 'DTR review saved.']);

        return back();
    }

    private function ensureStatus(DtrSubmission $submission, string $status): void
    {
        if ($submission->status !== $status) {
            throw ValidationException::withMessages(['decision' => 'This DTR is no longer awaiting your review.']);
        }
    }

    private function snapshotHash(DtrSubmission $submission): string
    {
        $snapshot = $submission->reports->sortBy('id')->map(fn (DailyReport $report): array => [
            $report->id, $report->report_date->toDateString(), $report->time_in, $report->time_out, $report->total_hours,
        ])->values()->toJson();

        return hash('sha256', Str::of($snapshot)->append('|', (string) $submission->user_id, '|', $submission->period_start->toDateString(), '|', $submission->period_end->toDateString())->toString());
    }
}
