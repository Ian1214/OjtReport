<?php

namespace App\Http\Controllers;

use App\Actions\RecordActivity;
use App\Http\Requests\ReviewDtrSubmissionRequest;
use App\Http\Requests\StoreDtrSubmissionRequest;
use App\Models\DailyReport;
use App\Models\DtrSubmission;
use App\Models\User;
use App\Rules\SignatureStrokes;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
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
            'school_coordinator' => $query
                ->where('status', DtrSubmission::STATUS_APPROVED)
                ->whereHas('user', fn (Builder $builder): Builder => $builder
                    ->where('school_id', $user->school_id)
                    ->where('role', 'ojt')),
            default => abort(403),
        };

        return Inertia::render('dtr-submissions/index', [
            'role' => $user->role,
            'signerName' => $user->name,
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
                'studentSignatureName' => $submission->student_signature_name,
                'studentSignedAt' => $submission->student_signed_at?->toIso8601String(),
                'supervisorSignatureName' => $submission->supervisor_signature_name,
                'supervisorSignedAt' => $submission->supervisor_signed_at?->toIso8601String(),
            ]),
        ]);
    }

    public function store(StoreDtrSubmissionRequest $request, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $ojt */
        $ojt = $request->user();
        $period = $request->safe()->only(['period_start', 'period_end']);
        $signatureStrokes = SignatureStrokes::normalize($request->validated('signature_data'));

        $submission = DB::transaction(function () use ($ojt, $period, $signatureStrokes): DtrSubmission {
            $reports = $ojt->dailyReports()->approved()
                ->whereNull('dtr_submission_id')
                ->whereDate('report_date', '>=', $period['period_start'])
                ->whereDate('report_date', '<=', $period['period_end'])
                ->lockForUpdate()
                ->get();

            if ($reports->isEmpty()) {
                throw ValidationException::withMessages(['period_start' => 'No approved, unsubmitted reports exist in this period.']);
            }

            $submission = $ojt->dtrSubmissions()->create([
                'company_id' => $ojt->company_id,
                ...$period,
                'total_hours' => $reports->sum('total_hours'),
                'status' => DtrSubmission::STATUS_PENDING_SUPERVISOR,
                'submitted_at' => now(),
                'student_signature_name' => $ojt->name,
                'student_signature_strokes' => $signatureStrokes,
                'student_signed_at' => now(),
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
        $approve = $request->validated('decision') === 'approve';
        $signatureStrokes = $reviewer->isSupervisor() && $approve
            ? SignatureStrokes::normalize($request->validated('signature_data'))
            : null;

        $submission = DB::transaction(function () use ($request, $dtrSubmission, $reviewer, $approve, $signatureStrokes): DtrSubmission {
            $locked = DtrSubmission::query()->with(['user', 'reports'])->lockForUpdate()->findOrFail($dtrSubmission->id);

            if ($reviewer->isSupervisor()) {
                abort_unless($locked->user->supervisor_id === $reviewer->id, 404);
                $this->ensureStatus($locked, DtrSubmission::STATUS_PENDING_SUPERVISOR);
                $locked->update([
                    'status' => $approve ? DtrSubmission::STATUS_PENDING_ADMIN : DtrSubmission::STATUS_REJECTED,
                    'supervisor_reviewed_by' => $reviewer->id,
                    'supervisor_reviewed_at' => now(),
                    'supervisor_signature_name' => $approve ? $reviewer->name : null,
                    'supervisor_signature_strokes' => $signatureStrokes,
                    'supervisor_signed_at' => $approve ? now() : null,
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

    public function showPrintable(Request $request, DtrSubmission $dtrSubmission): Response
    {
        /** @var User $viewer */
        $viewer = $request->user();
        $dtrSubmission->loadMissing([
            'user.companyRecord:id,name',
            'reports' => fn (HasMany $query): HasMany => $query->oldest('report_date'),
        ]);

        $canView = match ($viewer->role) {
            'ojt' => $dtrSubmission->user_id === $viewer->id,
            'supervisor' => $dtrSubmission->user->supervisor_id === $viewer->id,
            'company_admin' => $dtrSubmission->company_id === $viewer->company_id,
            'school_coordinator' => $viewer->school_id !== null
                && $dtrSubmission->user->school_id === $viewer->school_id,
            default => false,
        };

        abort_unless($canView, 404);
        abort_unless(
            $dtrSubmission->status === DtrSubmission::STATUS_APPROVED
                && $dtrSubmission->locked_at !== null
                && $dtrSubmission->student_signed_at !== null
                && $dtrSubmission->supervisor_signed_at !== null,
            403,
            'This DTR cannot be printed until the OJT, supervisor, and company administrator complete sign-off.',
        );

        return Inertia::render('reports/dtr', [
            'profile' => [
                'name' => $dtrSubmission->user->name,
                'studentId' => $dtrSubmission->user->student_id,
                'position' => $dtrSubmission->user->position,
                'department' => $dtrSubmission->user->department,
                'company' => $dtrSubmission->user->companyRecord?->name ?? $dtrSubmission->user->company,
            ],
            'reports' => $dtrSubmission->reports->map(fn (DailyReport $report): array => [
                'id' => $report->id,
                'report_date' => $report->report_date->toDateString(),
                'time_in' => $report->time_in,
                'time_out' => $report->time_out,
                'total_hours' => $report->total_hours,
                'attendance_status' => $report->attendance_status,
                'late_minutes' => $report->late_minutes,
            ]),
            'totalHours' => $dtrSubmission->total_hours,
            'printable' => true,
            'submission' => [
                'periodStart' => $dtrSubmission->period_start->toDateString(),
                'periodEnd' => $dtrSubmission->period_end->toDateString(),
                'studentSignatureName' => $dtrSubmission->student_signature_name,
                'studentSignatureStrokes' => $dtrSubmission->student_signature_strokes,
                'studentSignedAt' => $dtrSubmission->student_signed_at->toIso8601String(),
                'supervisorSignatureName' => $dtrSubmission->supervisor_signature_name,
                'supervisorSignatureStrokes' => $dtrSubmission->supervisor_signature_strokes,
                'supervisorSignedAt' => $dtrSubmission->supervisor_signed_at->toIso8601String(),
                'verifiedAt' => $dtrSubmission->reviewed_at?->toIso8601String(),
            ],
        ]);
    }

    public function destroy(Request $request, DtrSubmission $dtrSubmission, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $ojt */
        $ojt = $request->user();

        $periodLabel = DB::transaction(function () use ($dtrSubmission, $ojt, $recordActivity): string {
            $lockedSubmission = DtrSubmission::query()
                ->withCount('reports')
                ->lockForUpdate()
                ->findOrFail($dtrSubmission->id);

            Gate::authorize('delete', $lockedSubmission);

            if ($lockedSubmission->locked_at !== null || $lockedSubmission->status === DtrSubmission::STATUS_APPROVED) {
                throw ValidationException::withMessages([
                    'dtr_submission' => 'Finalized DTR periods are protected records and cannot be deleted.',
                ]);
            }

            $periodLabel = $lockedSubmission->period_start->toDateString().' to '.$lockedSubmission->period_end->toDateString();

            $recordActivity->handle(
                $ojt,
                'dtr.deleted',
                "{$ojt->name} deleted an unfinalized DTR period.",
                $lockedSubmission,
                [
                    'period_start' => $lockedSubmission->period_start->toDateString(),
                    'period_end' => $lockedSubmission->period_end->toDateString(),
                    'report_count' => $lockedSubmission->reports_count,
                    'status' => $lockedSubmission->status,
                ],
            );

            $lockedSubmission->reports()->update(['dtr_submission_id' => null]);
            $lockedSubmission->delete();

            return $periodLabel;
        }, attempts: 3);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "DTR period {$periodLabel} was deleted. Its daily reports are available for resubmission.",
        ]);

        return back();
    }

    public function destroyFinalized(
        Request $request,
        DtrSubmission $dtrSubmission,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();

        abort_unless($dtrSubmission->company_id === $companyAdmin->company_id, 404);

        $periodLabel = DB::transaction(function () use ($dtrSubmission, $companyAdmin, $recordActivity): string {
            $lockedSubmission = DtrSubmission::query()
                ->with(['user:id,name,student_id', 'reports:id,dtr_submission_id'])
                ->lockForUpdate()
                ->findOrFail($dtrSubmission->id);

            Gate::authorize('deleteFinalized', $lockedSubmission);

            $periodLabel = $lockedSubmission->period_start->toDateString().' to '.$lockedSubmission->period_end->toDateString();
            $reportIds = $lockedSubmission->reports->modelKeys();

            $recordActivity->handle(
                $companyAdmin,
                'dtr.finalized_deleted',
                "{$companyAdmin->name} deleted {$lockedSubmission->user->name}'s finalized DTR sign-off.",
                $lockedSubmission,
                [
                    'dtr_submission_id' => $lockedSubmission->id,
                    'ojt_id' => $lockedSubmission->user_id,
                    'ojt_name' => $lockedSubmission->user->name,
                    'student_id' => $lockedSubmission->user->student_id,
                    'period_start' => $lockedSubmission->period_start->toDateString(),
                    'period_end' => $lockedSubmission->period_end->toDateString(),
                    'total_hours' => $lockedSubmission->total_hours,
                    'report_ids' => $reportIds,
                    'report_count' => count($reportIds),
                    'student_signature_name' => $lockedSubmission->student_signature_name,
                    'student_signed_at' => $lockedSubmission->student_signed_at?->toIso8601String(),
                    'supervisor_signature_name' => $lockedSubmission->supervisor_signature_name,
                    'supervisor_signed_at' => $lockedSubmission->supervisor_signed_at?->toIso8601String(),
                    'reviewed_by' => $lockedSubmission->reviewed_by,
                    'reviewed_at' => $lockedSubmission->reviewed_at?->toIso8601String(),
                    'locked_at' => $lockedSubmission->locked_at?->toIso8601String(),
                    'snapshot_hash' => $lockedSubmission->snapshot_hash,
                ],
            );

            $lockedSubmission->reports()->update(['dtr_submission_id' => null]);
            $lockedSubmission->delete();

            return $periodLabel;
        }, attempts: 3);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "Finalized DTR {$periodLabel} was deleted. Its approved daily reports are available for a new sign-off.",
        ]);

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

        return hash('sha256', Str::of($snapshot)->append(
            '|',
            (string) $submission->user_id,
            '|',
            $submission->period_start->toDateString(),
            '|',
            $submission->period_end->toDateString(),
            '|',
            (string) $submission->student_signature_name,
            '|',
            $this->signatureSnapshot($submission->student_signature_strokes),
            '|',
            (string) $submission->student_signed_at?->toIso8601String(),
            '|',
            (string) $submission->supervisor_signature_name,
            '|',
            $this->signatureSnapshot($submission->supervisor_signature_strokes),
            '|',
            (string) $submission->supervisor_signed_at?->toIso8601String(),
        )->toString());
    }

    /**
     * @param  array{version?: mixed, strokes?: mixed}|null  $signature
     */
    private function signatureSnapshot(?array $signature): string
    {
        if ($signature === null) {
            return 'null';
        }

        return json_encode([
            'version' => $signature['version'] ?? null,
            'strokes' => $signature['strokes'] ?? null,
        ], JSON_THROW_ON_ERROR);
    }
}
