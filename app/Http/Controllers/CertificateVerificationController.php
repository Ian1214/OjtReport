<?php

namespace App\Http\Controllers;

use App\Models\CompletionCertificate;
use Inertia\Inertia;
use Inertia\Response;

class CertificateVerificationController extends Controller
{
    public function __invoke(string $certificateNumber): Response
    {
        $certificate = CompletionCertificate::withTrashed()
            ->where('certificate_number', $certificateNumber)
            ->where('status', CompletionCertificate::STATUS_FINALIZED)
            ->firstOrFail();

        return Inertia::render('certificates/verify', [
            'certificate' => [
                'certificateNumber' => $certificate->certificate_number,
                'status' => $certificate->trashed() ? 'revoked' : $certificate->status,
                'ojtName' => $certificate->ojt_name,
                'studentId' => $certificate->student_id,
                'companyName' => $certificate->company_name,
                'allocatedHours' => $certificate->allocated_hours,
                'adminSignerName' => $certificate->admin_signature_name,
                'supervisorSignerName' => $certificate->supervisor_signature_name,
                'finalizedAt' => $certificate->finalized_at?->toIso8601String(),
                'verificationHash' => $certificate->snapshot_hash,
                'revokedAt' => $certificate->revoked_at?->toIso8601String(),
            ],
        ]);
    }
}
