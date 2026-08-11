<?php

namespace App\Actions;

use App\Models\CompletionCertificate;
use App\Models\User;
use App\Rules\SignatureStrokes;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class FinalizeCompletionCertificate
{
    public function handle(User $supervisor, CompletionCertificate $certificate, string $signatureData): CompletionCertificate
    {
        return DB::transaction(function () use ($supervisor, $certificate, $signatureData): CompletionCertificate {
            $locked = CompletionCertificate::query()->with('ojt')->lockForUpdate()->findOrFail($certificate->id);
            abort_unless($locked->supervisor_id === $supervisor->id, 404);

            if ($locked->status !== CompletionCertificate::STATUS_PENDING_SUPERVISOR) {
                throw ValidationException::withMessages(['signature' => 'This certificate has already been finalized.']);
            }

            $signature = SignatureStrokes::normalize($signatureData);
            $finalizedAt = now();
            $snapshot = [
                'certificate_number' => $locked->certificate_number,
                'company_id' => $locked->company_id,
                'user_id' => $locked->user_id,
                'supervisor_id' => $locked->supervisor_id,
                'allocated_hours' => $locked->allocated_hours,
                'ojt_name' => $locked->ojt_name,
                'student_id' => $locked->student_id,
                'company_name' => $locked->company_name,
                'admin_signature_name' => $locked->admin_signature_name,
                'admin_signature_strokes' => $locked->admin_signature_strokes,
                'supervisor_signature_name' => $supervisor->name,
                'supervisor_signature_strokes' => $signature,
                'finalized_at' => $finalizedAt->toIso8601String(),
            ];

            $locked->update([
                'status' => CompletionCertificate::STATUS_FINALIZED,
                'supervisor_signature_name' => $supervisor->name,
                'supervisor_signature_strokes' => $signature,
                'supervisor_signed_at' => $finalizedAt,
                'finalized_at' => $finalizedAt,
                'snapshot_hash' => hash('sha256', json_encode($snapshot, JSON_THROW_ON_ERROR)),
            ]);

            return $locked->fresh(['ojt']) ?? $locked;
        }, attempts: 3);
    }
}
