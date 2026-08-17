<?php

namespace App\Http\Controllers;

use App\Models\DtrSubmission;
use App\Services\DtrIntegrityService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DtrVerificationController extends Controller
{
    public function __invoke(Request $request, string $token, DtrIntegrityService $integrity): Response
    {
        $submission = DtrSubmission::withTrashed()
            ->with(['user:id,name,student_id,company_id', 'user.companyRecord:id,name', 'reports'])
            ->where('verification_token', $token)
            ->where('status', DtrSubmission::STATUS_APPROVED)
            ->firstOrFail();

        return Inertia::render('dtr-submissions/verify', [
            'record' => [
                'valid' => ! $submission->trashed() && $integrity->isValid($submission),
                'revoked' => $submission->trashed(),
                'ojtName' => $submission->user->name,
                'studentId' => $submission->user->student_id,
                'companyName' => $submission->user->companyRecord?->name,
                'periodStart' => $submission->period_start->toDateString(),
                'periodEnd' => $submission->period_end->toDateString(),
                'totalHours' => $submission->total_hours,
                'verifiedAt' => $submission->reviewed_at?->toIso8601String(),
                'fingerprint' => $submission->snapshot_hash,
            ],
        ]);
    }
}
