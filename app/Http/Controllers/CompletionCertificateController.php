<?php

namespace App\Http\Controllers;

use App\Actions\CreateCompletionCertificate;
use App\Actions\FinalizeCompletionCertificate;
use App\Actions\RecordActivity;
use App\Http\Requests\RevokeCompletionCertificateRequest;
use App\Http\Requests\SignCompletionCertificateRequest;
use App\Http\Requests\StoreCompletionCertificateRequest;
use App\Models\CompletionCertificate;
use App\Models\User;
use App\Notifications\CompletionCertificateIssued;
use App\Support\CertificateQrCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CompletionCertificateController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $viewer */
        $viewer = $request->user();
        Gate::authorize('viewAny', CompletionCertificate::class);

        $query = CompletionCertificate::query()->with([
            'ojt:id,name',
            'supervisor:id,name',
            'adminSigner:id,name',
        ]);

        match ($viewer->role) {
            'company_admin' => $query->where('company_id', $viewer->company_id),
            'supervisor' => $query->where('supervisor_id', $viewer->id),
            'ojt' => $query->where('user_id', $viewer->id),
            default => abort(403),
        };

        $certificates = $query->latest()->paginate(15)->withQueryString()->through(
            fn (CompletionCertificate $certificate): array => [
                'id' => $certificate->id,
                'certificateNumber' => $certificate->certificate_number,
                'ojtName' => $certificate->ojt_name,
                'studentId' => $certificate->student_id,
                'allocatedHours' => $certificate->allocated_hours,
                'approvedHoursSnapshot' => $certificate->approved_hours_snapshot,
                'status' => $certificate->status,
                'companyName' => $certificate->company_name,
                'adminSignerName' => $certificate->admin_signature_name,
                'adminSignedAt' => $certificate->admin_signed_at->toIso8601String(),
                'supervisorName' => $certificate->supervisor_signature_name ?? $certificate->supervisor->name,
                'supervisorSignedAt' => $certificate->supervisor_signed_at?->toIso8601String(),
                'finalizedAt' => $certificate->finalized_at?->toIso8601String(),
            ],
        );

        $ojts = $viewer->isCompanyAdmin()
            ? User::query()
                ->where('company_id', $viewer->company_id)
                ->where('role', 'ojt')
                ->whereNotNull('supervisor_id')
                ->with('assignedSupervisor:id,name')
                ->withSum('approvedDailyReports as approved_hours', 'total_hours')
                ->withSum('completionCertificates as allocated_hours', 'allocated_hours')
                ->orderBy('name')
                ->get(['id', 'name', 'student_id', 'supervisor_id'])
                ->map(function (User $ojt): array {
                    $approved = (float) ($ojt->getAttribute('approved_hours') ?? 0);
                    $allocated = (float) ($ojt->getAttribute('allocated_hours') ?? 0);

                    return [
                        'id' => $ojt->id,
                        'name' => $ojt->name,
                        'studentId' => $ojt->student_id,
                        'supervisorName' => $ojt->assignedSupervisor?->name,
                        'approvedHours' => number_format($approved, 2, '.', ''),
                        'allocatedHours' => number_format($allocated, 2, '.', ''),
                        'availableHours' => number_format(max(0, $approved - $allocated), 2, '.', ''),
                    ];
                })
            : [];

        return Inertia::render('certificates/index', [
            'role' => $viewer->role,
            'signerName' => $viewer->name,
            'ojts' => $ojts,
            'certificates' => $certificates,
        ]);
    }

    public function store(
        StoreCompletionCertificateRequest $request,
        CreateCompletionCertificate $createCertificate,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $administrator */
        $administrator = $request->user();
        Gate::authorize('create', CompletionCertificate::class);

        $certificate = $createCertificate->handle(
            $administrator,
            (int) $request->validated('ojt_id'),
            (string) $request->validated('allocated_hours'),
            (string) $request->validated('signature_data'),
        );

        $recordActivity->handle(
            $administrator,
            'certificate.created',
            "{$administrator->name} created certificate {$certificate->certificate_number} for {$certificate->ojt_name}.",
            $certificate,
            ['allocated_hours' => $certificate->allocated_hours],
        );
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Certificate created and sent to the assigned supervisor for signature.']);

        return back();
    }

    public function sign(
        SignCompletionCertificateRequest $request,
        CompletionCertificate $completionCertificate,
        FinalizeCompletionCertificate $finalizeCertificate,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $supervisor */
        $supervisor = $request->user();
        abort_unless($completionCertificate->company_id === $supervisor->company_id, 404);
        Gate::authorize('update', $completionCertificate);

        $certificate = $finalizeCertificate->handle(
            $supervisor,
            $completionCertificate,
            (string) $request->validated('signature_data'),
        );

        $recordActivity->handle(
            $supervisor,
            'certificate.finalized',
            "{$supervisor->name} signed and finalized certificate {$certificate->certificate_number}.",
            $certificate,
            ['allocated_hours' => $certificate->allocated_hours],
        );
        $certificate->ojt->notify(new CompletionCertificateIssued(
            $certificate->id,
            $certificate->certificate_number,
            $certificate->company_name,
            $certificate->allocated_hours,
        ));
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Certificate finalized. The OJT has been emailed a printable copy link.']);

        return back();
    }

    public function print(
        Request $request,
        CompletionCertificate $completionCertificate,
        CertificateQrCode $qrCode,
    ): Response {
        /** @var User $viewer */
        $viewer = $request->user();
        abort_unless($completionCertificate->company_id === $viewer->company_id, 404);
        Gate::authorize('view', $completionCertificate);
        abort_unless($completionCertificate->status === CompletionCertificate::STATUS_FINALIZED, 403);

        $verificationUrl = route('certificates.verify', $completionCertificate->certificate_number);

        return Inertia::render('certificates/print', [
            'certificate' => [
                'certificateNumber' => $completionCertificate->certificate_number,
                'ojtName' => $completionCertificate->ojt_name,
                'studentId' => $completionCertificate->student_id,
                'companyName' => $completionCertificate->company_name,
                'program' => $completionCertificate->program,
                'position' => $completionCertificate->position,
                'department' => $completionCertificate->department,
                'allocatedHours' => $completionCertificate->allocated_hours,
                'adminSignatureName' => $completionCertificate->admin_signature_name,
                'adminSignatureStrokes' => $completionCertificate->admin_signature_strokes,
                'adminSignedAt' => $completionCertificate->admin_signed_at->toIso8601String(),
                'supervisorSignatureName' => $completionCertificate->supervisor_signature_name,
                'supervisorSignatureStrokes' => $completionCertificate->supervisor_signature_strokes,
                'supervisorSignedAt' => $completionCertificate->supervisor_signed_at?->toIso8601String(),
                'finalizedAt' => $completionCertificate->finalized_at?->toIso8601String(),
                'verificationHash' => $completionCertificate->snapshot_hash,
                'verificationUrl' => $verificationUrl,
                'verificationQrCode' => $qrCode->dataUri($verificationUrl),
            ],
        ]);
    }

    public function destroy(
        RevokeCompletionCertificateRequest $request,
        CompletionCertificate $completionCertificate,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $administrator */
        $administrator = $request->user();
        abort_unless($completionCertificate->company_id === $administrator->company_id, 404);
        Gate::authorize('delete', $completionCertificate);

        $isFinalized = $completionCertificate->status === CompletionCertificate::STATUS_FINALIZED;
        $reason = $request->validated('revocation_reason');

        $certificate = DB::transaction(function () use ($administrator, $completionCertificate, $isFinalized, $reason): CompletionCertificate {
            $locked = CompletionCertificate::query()->lockForUpdate()->findOrFail($completionCertificate->id);
            if ($isFinalized) {
                $locked->update([
                    'revoked_by' => $administrator->id,
                    'revoked_at' => now(),
                    'revocation_reason' => $reason,
                ]);
            }
            $locked->delete();

            return $locked;
        }, attempts: 3);

        $recordActivity->handle(
            $administrator,
            $isFinalized ? 'certificate.revoked' : 'certificate.draft_removed',
            $isFinalized
                ? "{$administrator->name} revoked certificate {$certificate->certificate_number} for {$certificate->ojt_name}."
                : "{$administrator->name} removed draft certificate {$certificate->certificate_number} for {$certificate->ojt_name}.",
            $certificate,
            [
                'allocated_hours' => $certificate->allocated_hours,
                'status' => $certificate->status,
                'revocation_reason' => $reason,
            ],
        );
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $isFinalized
                ? 'Certificate revoked. The public verification page now marks it invalid.'
                : 'Certificate draft removed. Its allocated hours are available again.',
        ]);

        return back();
    }
}
