<?php

use App\Models\Company;
use App\Models\CompletionCertificate;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('a finalized certificate can be verified publicly without exposing signature drawings', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);
    $certificate = CompletionCertificate::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
        'admin_signed_by' => $administrator->id,
        'status' => CompletionCertificate::STATUS_FINALIZED,
        'ojt_name' => $ojt->name,
        'company_name' => $company->name,
        'supervisor_signature_name' => $supervisor->name,
        'supervisor_signature_strokes' => ['version' => 1, 'strokes' => [[['x' => 1000, 'y' => 1000]]]],
        'supervisor_signed_at' => now(),
        'finalized_at' => now(),
        'snapshot_hash' => str_repeat('a', 64),
    ]);

    $this->get(route('certificates.verify', $certificate->certificate_number))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('certificates/verify')
            ->where('certificate.status', 'finalized')
            ->where('certificate.ojtName', $ojt->name)
            ->where('certificate.verificationHash', str_repeat('a', 64))
            ->missing('certificate.adminSignatureStrokes')
            ->missing('certificate.supervisorSignatureStrokes'));
});

test('a revoked certificate remains publicly discoverable and is marked invalid', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $certificate = CompletionCertificate::factory()->create([
        'company_id' => $company->id,
        'admin_signed_by' => $administrator->id,
        'status' => CompletionCertificate::STATUS_FINALIZED,
        'revoked_by' => $administrator->id,
        'revoked_at' => now(),
        'revocation_reason' => 'The allocated hours were entered incorrectly.',
    ]);
    $certificate->delete();

    $this->get(route('certificates.verify', $certificate->certificate_number))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('certificates/verify')
            ->where('certificate.status', 'revoked')
            ->missing('certificate.revocationReason'));
});
