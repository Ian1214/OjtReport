<?php

namespace App\Actions;

use App\Models\CompletionCertificate;
use App\Models\DailyReport;
use App\Models\User;
use App\Rules\SignatureStrokes;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class CreateCompletionCertificate
{
    public function handle(User $administrator, int $ojtId, string $hours, string $signatureData): CompletionCertificate
    {
        return DB::transaction(function () use ($administrator, $ojtId, $hours, $signatureData): CompletionCertificate {
            $ojt = User::query()->with('companyRecord:id,name')->lockForUpdate()->findOrFail($ojtId);

            abort_unless($ojt->role === 'ojt' && $ojt->company_id === $administrator->company_id, 404);

            if ($ojt->supervisor_id === null) {
                throw ValidationException::withMessages(['ojt_id' => 'Assign a supervisor to this OJT before creating a certificate.']);
            }

            $approvedHundredths = (int) round((float) DailyReport::query()
                ->where('user_id', $ojt->id)
                ->where('approval_status', DailyReport::STATUS_APPROVED)
                ->sum('total_hours') * 100);
            $allocatedHundredths = (int) round((float) CompletionCertificate::query()
                ->where('user_id', $ojt->id)
                ->sum('allocated_hours') * 100);
            $requestedHundredths = (int) round((float) $hours * 100);

            if ($requestedHundredths <= 0 || $requestedHundredths > $approvedHundredths - $allocatedHundredths) {
                throw ValidationException::withMessages(['allocated_hours' => 'The certificate hours exceed this OJT’s remaining approved hours.']);
            }

            return CompletionCertificate::query()->create([
                'certificate_number' => 'CERT-'.now()->format('Y').'-'.Str::upper((string) Str::ulid()),
                'company_id' => $administrator->company_id,
                'user_id' => $ojt->id,
                'supervisor_id' => $ojt->supervisor_id,
                'allocated_hours' => $requestedHundredths / 100,
                'approved_hours_snapshot' => $approvedHundredths / 100,
                'status' => CompletionCertificate::STATUS_PENDING_SUPERVISOR,
                'ojt_name' => $ojt->name,
                'student_id' => $ojt->student_id,
                'company_name' => $ojt->companyRecord?->name ?? $ojt->company ?? 'Company',
                'program' => $ojt->program,
                'position' => $ojt->position,
                'department' => $ojt->department,
                'admin_signed_by' => $administrator->id,
                'admin_signature_name' => $administrator->name,
                'admin_signature_strokes' => SignatureStrokes::normalize($signatureData),
                'admin_signed_at' => now(),
            ]);
        }, attempts: 3);
    }
}
