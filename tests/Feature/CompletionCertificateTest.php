<?php

use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\CompletionCertificate;
use App\Models\DailyReport;
use App\Models\User;
use App\Notifications\CompletionCertificateIssued;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('an administrator can issue multiple partial certificates without exceeding approved hours', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
    ]);
    DailyReport::factory()->for($ojt)->create([
        'approval_status' => DailyReport::STATUS_APPROVED,
        'total_hours' => 500,
    ]);

    foreach ([250, 250] as $hours) {
        $this->actingAs($administrator)->post(route('certificates.store'), [
            'ojt_id' => $ojt->id,
            'allocated_hours' => $hours,
            'signature' => $administrator->name,
            'signature_data' => validCertificateSignature(),
        ])->assertSessionHasNoErrors()->assertRedirect();
    }

    expect(CompletionCertificate::query()->count())->toBe(2)
        ->and((float) CompletionCertificate::query()->sum('allocated_hours'))->toBe(500.0)
        ->and(CompletionCertificate::query()->first())
        ->status->toBe(CompletionCertificate::STATUS_PENDING_SUPERVISOR)
        ->admin_signature_strokes->toEqual(json_decode(validCertificateSignature(), true, flags: JSON_THROW_ON_ERROR));

    $this->actingAs($administrator)->get(route('certificates.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('certificates/index')
            ->where('role', 'company_admin')
            ->where('ojts.0.approvedHours', '500.00')
            ->where('ojts.0.allocatedHours', '500.00')
            ->where('ojts.0.availableHours', '0.00')
            ->has('certificates.data', 2));

    $this->actingAs($administrator)->post(route('certificates.store'), [
        'ojt_id' => $ojt->id,
        'allocated_hours' => 0.01,
        'signature' => $administrator->name,
        'signature_data' => validCertificateSignature(),
    ])->assertInvalid('allocated_hours');

    expect(CompletionCertificate::query()->count())->toBe(2);
});

test('only approved report hours can be allocated and an assigned supervisor is required', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => null]);
    DailyReport::factory()->for($ojt)->create([
        'approval_status' => DailyReport::STATUS_PENDING,
        'total_hours' => 100,
    ]);

    $payload = [
        'ojt_id' => $ojt->id,
        'allocated_hours' => 50,
        'signature' => $administrator->name,
        'signature_data' => validCertificateSignature(),
    ];

    $this->actingAs($administrator)->post(route('certificates.store'), $payload)
        ->assertInvalid('ojt_id');

    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt->update(['supervisor_id' => $supervisor->id]);

    $this->actingAs($administrator)->post(route('certificates.store'), $payload)
        ->assertInvalid('allocated_hours');
});

test('the assigned supervisor finalizes the certificate and queues it for the OJT', function () {
    Notification::fake();
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
    ]);
    DailyReport::factory()->for($ojt)->create([
        'approval_status' => DailyReport::STATUS_APPROVED,
        'total_hours' => 300,
    ]);

    $this->actingAs($administrator)->post(route('certificates.store'), [
        'ojt_id' => $ojt->id,
        'allocated_hours' => 250,
        'signature' => $administrator->name,
        'signature_data' => validCertificateSignature(),
    ])->assertRedirect();

    $certificate = CompletionCertificate::query()->sole();

    $this->actingAs($ojt)->get(route('certificates.print', $certificate))->assertForbidden();

    $this->actingAs($supervisor)->patch(route('certificates.sign', $certificate), [
        'signature' => $supervisor->name,
        'signature_data' => validCertificateSignature(100),
    ])->assertSessionHasNoErrors()->assertRedirect();

    expect($certificate->refresh())
        ->status->toBe(CompletionCertificate::STATUS_FINALIZED)
        ->supervisor_signature_name->toBe($supervisor->name)
        ->supervisor_signature_strokes->toEqual(json_decode(validCertificateSignature(100), true, flags: JSON_THROW_ON_ERROR))
        ->snapshot_hash->toHaveLength(64);

    Notification::assertSentTo($ojt, CompletionCertificateIssued::class, function (CompletionCertificateIssued $notification) use ($ojt, $certificate): bool {
        return $notification->toMail($ojt)->actionUrl === route('certificates.print', $certificate);
    });

    $this->actingAs($ojt)->get(route('certificates.print', $certificate))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('certificates/print')
            ->where('certificate.ojtName', $ojt->name)
            ->where('certificate.allocatedHours', '250.00')
            ->where('certificate.adminSignatureStrokes.version', 1)
            ->where('certificate.supervisorSignatureStrokes.version', 1));
});

test('another company and an unassigned supervisor cannot access or sign a certificate', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $wrongSupervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $outsider = User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'company_admin']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);
    DailyReport::factory()->for($ojt)->create(['approval_status' => DailyReport::STATUS_APPROVED, 'total_hours' => 50]);

    $payload = [
        'ojt_id' => $ojt->id,
        'allocated_hours' => 25,
        'signature' => $administrator->name,
        'signature_data' => validCertificateSignature(),
    ];
    $this->actingAs($administrator)->post(route('certificates.store'), $payload)->assertRedirect();
    $certificate = CompletionCertificate::query()->sole();

    $this->actingAs($wrongSupervisor)->patch(route('certificates.sign', $certificate), [
        'signature' => $wrongSupervisor->name,
        'signature_data' => validCertificateSignature(),
    ])->assertForbidden();

    $this->actingAs($outsider)->get(route('certificates.print', $certificate))->assertNotFound();
    $this->actingAs($outsider)->post(route('certificates.store'), [
        ...$payload,
        'signature' => $outsider->name,
    ])->assertNotFound();
});

test('only the company administrator can revoke a finalized certificate with a reason and release its hours', function () {
    Notification::fake();
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $outsider = User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);
    DailyReport::factory()->for($ojt)->create([
        'approval_status' => DailyReport::STATUS_APPROVED,
        'total_hours' => 300,
    ]);

    $this->actingAs($administrator)->post(route('certificates.store'), [
        'ojt_id' => $ojt->id,
        'allocated_hours' => 250,
        'signature' => $administrator->name,
        'signature_data' => validCertificateSignature(),
    ])->assertRedirect();

    $certificate = CompletionCertificate::query()->sole();
    $this->actingAs($supervisor)->patch(route('certificates.sign', $certificate), [
        'signature' => $supervisor->name,
        'signature_data' => validCertificateSignature(100),
    ])->assertRedirect();

    $this->actingAs($supervisor)
        ->delete(route('certificates.destroy', $certificate))
        ->assertForbidden();
    $this->actingAs($ojt)
        ->delete(route('certificates.destroy', $certificate))
        ->assertForbidden();
    $this->actingAs($outsider)
        ->delete(route('certificates.destroy', $certificate))
        ->assertNotFound();

    $this->actingAs($administrator)
        ->delete(route('certificates.destroy', $certificate))
        ->assertInvalid('revocation_reason');

    $this->actingAs($administrator)
        ->delete(route('certificates.destroy', $certificate), [
            'revocation_reason' => 'The certified hour allocation was entered incorrectly.',
        ])
        ->assertRedirect();

    $this->assertSoftDeleted($certificate);
    expect($certificate->refresh())
        ->revoked_by->toBe($administrator->id)
        ->revoked_at->not->toBeNull()
        ->revocation_reason->toBe('The certified hour allocation was entered incorrectly.');
    expect(ActivityLog::query()->where('event', 'certificate.revoked')->exists())->toBeTrue();

    $this->actingAs($administrator)
        ->get(route('certificates.print', $certificate))
        ->assertNotFound();
    $this->actingAs($administrator)
        ->get(route('certificates.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('ojts.0.allocatedHours', '0.00')
            ->where('ojts.0.availableHours', '300.00')
            ->has('certificates.data', 0));

    $this->get(route('certificates.verify', $certificate->certificate_number))
        ->assertInertia(fn (Assert $page) => $page
            ->where('certificate.status', 'revoked'));
});

function validCertificateSignature(int $offset = 0): string
{
    return json_encode([
        'version' => 1,
        'strokes' => [[
            ['x' => 1000 + $offset, 'y' => 5000],
            ['x' => 2000 + $offset, 'y' => 4000],
            ['x' => 3000 + $offset, 'y' => 6000],
            ['x' => 4000 + $offset, 'y' => 3500],
            ['x' => 5000 + $offset, 'y' => 5500],
            ['x' => 7000 + $offset, 'y' => 4000],
        ]],
    ], JSON_THROW_ON_ERROR);
}
