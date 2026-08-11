<?php

use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\DailyReport;
use App\Models\DtrSubmission;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('a DTR is printable only after the OJT and supervisor sign and the administrator verifies it', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);
    $report = DailyReport::factory()->for($ojt)->create(['report_date' => today()->toDateString(), 'approval_status' => DailyReport::STATUS_APPROVED, 'total_hours' => 8]);

    expect($report->user_id)->toBe($ojt->id)
        ->and($ojt->dailyReports()->approved()->count())->toBe(1);

    $period = [
        'period_start' => today()->toDateString(),
        'period_end' => today()->toDateString(),
    ];

    $this->actingAs($ojt)
        ->post(route('dtr-submissions.store'), [
            ...$period,
            'signature' => 'Wrong name',
            'signature_data' => validDtrSignature(),
        ])
        ->assertInvalid('signature');

    $this->actingAs($ojt)
        ->post(route('dtr-submissions.store'), [...$period, 'signature' => $ojt->name])
        ->assertInvalid('signature_data');

    $this->actingAs($ojt)
        ->post(route('dtr-submissions.store'), [
            ...$period,
            'signature' => $ojt->name,
            'signature_data' => validDtrSignature(),
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect();

    $submission = DtrSubmission::query()->sole();
    expect($report->refresh()->dtr_submission_id)->toBe($submission->id)
        ->and($submission->student_signature_name)->toBe($ojt->name)
        ->and($submission->student_signature_strokes)->toEqual(json_decode(validDtrSignature(), true, flags: JSON_THROW_ON_ERROR))
        ->and($submission->student_signed_at)->not->toBeNull();

    $this->actingAs($ojt)
        ->get(route('dtr-submissions.print', $submission))
        ->assertForbidden();

    $this->actingAs($supervisor)
        ->patch(route('dtr-submissions.review', $submission), ['decision' => 'approve'])
        ->assertInvalid('signature');

    $this->actingAs($supervisor)->patch(route('dtr-submissions.review', $submission), [
        'decision' => 'approve',
        'signature' => $supervisor->name,
    ])->assertInvalid('signature_data');

    $this->actingAs($supervisor)->patch(route('dtr-submissions.review', $submission), [
        'decision' => 'approve',
        'signature' => $supervisor->name,
        'signature_data' => validDtrSignature(),
    ])->assertRedirect();

    expect($submission->refresh())
        ->supervisor_signature_name->toBe($supervisor->name)
        ->supervisor_signature_strokes->toEqual(json_decode(validDtrSignature(), true, flags: JSON_THROW_ON_ERROR))
        ->supervisor_signed_at->not->toBeNull();

    $this->actingAs($supervisor)->patch(route('dtr-submissions.review', $submission), [
        'decision' => 'approve',
        'signature' => $supervisor->name,
        'signature_data' => validDtrSignature(200),
    ])->assertInvalid('decision');

    expect($submission->refresh()->supervisor_signature_strokes)
        ->toEqual(json_decode(validDtrSignature(), true, flags: JSON_THROW_ON_ERROR));

    $this->actingAs($ojt)
        ->get(route('dtr-submissions.print', $submission))
        ->assertForbidden();

    $this->actingAs($admin)->patch(route('dtr-submissions.review', $submission), ['decision' => 'approve'])->assertRedirect();

    expect($submission->refresh())->status->toBe(DtrSubmission::STATUS_APPROVED)->locked_at->not->toBeNull()->snapshot_hash->toHaveLength(64);

    $this->actingAs($ojt)
        ->get(route('dtr-submissions.print', $submission))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reports/dtr')
            ->where('printable', true)
            ->where('profile.name', $ojt->name)
            ->where('submission.studentSignatureName', $ojt->name)
            ->where('submission.studentSignatureStrokes.version', 1)
            ->where('submission.supervisorSignatureName', $supervisor->name)
            ->where('submission.supervisorSignatureStrokes.version', 1)
            ->has('reports', 1),
        );

    $this->actingAs($ojt)->post(route('attendance-corrections.store', $report), [
        'proposed_time_in' => '08:05', 'proposed_time_out' => '17:00', 'reason' => 'This should be blocked because the DTR is final.',
    ])->assertInvalid('attendance');
});

test('a printable DTR displays an incomplete attendance time without crashing', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
    ]);
    $submission = DtrSubmission::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'status' => DtrSubmission::STATUS_APPROVED,
        'student_signature_name' => $ojt->name,
        'student_signature_strokes' => null,
        'student_signed_at' => now(),
        'supervisor_signature_name' => $supervisor->name,
        'supervisor_signature_strokes' => null,
        'supervisor_signed_at' => now(),
        'reviewed_at' => now(),
        'locked_at' => now(),
    ]);
    DailyReport::factory()->for($ojt)->create([
        'dtr_submission_id' => $submission->id,
        'approval_status' => DailyReport::STATUS_APPROVED,
        'time_out' => null,
        'total_hours' => null,
    ]);

    $this->actingAs($ojt)
        ->get(route('dtr-submissions.print', $submission))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('reports/dtr')
            ->where('reports.0.time_out', null)
            ->has('reports', 1),
        );
});

test('an unrelated user cannot print another company DTR', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $outsider = User::factory()->create(['company_id' => $otherCompany->id]);
    $submission = DtrSubmission::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'status' => DtrSubmission::STATUS_APPROVED,
        'supervisor_signature_name' => 'Assigned Supervisor',
        'supervisor_signed_at' => now(),
        'locked_at' => now(),
    ]);

    $this->actingAs($outsider)
        ->get(route('dtr-submissions.print', $submission))
        ->assertNotFound();
});

test('an OJT must have an assigned supervisor before signing a DTR', function () {
    $company = Company::factory()->create();
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => null]);
    DailyReport::factory()->for($ojt)->create([
        'report_date' => today()->toDateString(),
        'approval_status' => DailyReport::STATUS_APPROVED,
    ]);

    $this->actingAs($ojt)->post(route('dtr-submissions.store'), [
        'period_start' => today()->toDateString(),
        'period_end' => today()->toDateString(),
        'signature' => $ojt->name,
        'signature_data' => validDtrSignature(),
    ])->assertInvalid('period_start');

    expect(DtrSubmission::query()->count())->toBe(0);
});

test('another company cannot review a DTR submission', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'company_admin']);
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $submission = DtrSubmission::factory()->create(['company_id' => $company->id, 'user_id' => $ojt->id, 'status' => DtrSubmission::STATUS_PENDING_ADMIN]);

    $this->actingAs($admin)->patch(route('dtr-submissions.review', $submission), ['decision' => 'approve'])->assertNotFound();
});

test('an unassigned supervisor in the same company cannot sign an OJT DTR', function () {
    $company = Company::factory()->create();
    $assignedSupervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $unassignedSupervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $assignedSupervisor->id,
    ]);
    $submission = DtrSubmission::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'status' => DtrSubmission::STATUS_PENDING_SUPERVISOR,
    ]);

    $this->actingAs($unassignedSupervisor)->patch(route('dtr-submissions.review', $submission), [
        'decision' => 'approve',
        'signature' => $unassignedSupervisor->name,
        'signature_data' => validDtrSignature(),
    ])->assertNotFound();

    expect($submission->refresh()->supervisor_signature_strokes)->toBeNull();
});

test('an OJT can delete an unfinalized DTR period without deleting its daily reports', function () {
    $company = Company::factory()->create();
    $ojt = User::factory()->create(['company_id' => $company->id, 'role' => 'ojt']);
    $submission = DtrSubmission::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'status' => DtrSubmission::STATUS_PENDING_ADMIN,
    ]);
    $report = DailyReport::factory()->for($ojt)->create([
        'dtr_submission_id' => $submission->id,
        'approval_status' => DailyReport::STATUS_APPROVED,
    ]);

    $this->actingAs($ojt)
        ->delete(route('dtr-submissions.destroy', $submission))
        ->assertRedirect();

    $this->assertModelMissing($submission);
    expect($report->refresh()->dtr_submission_id)->toBeNull()
        ->and($ojt->dailyReports()->whereKey($report)->exists())->toBeTrue();
});

test('an OJT cannot delete a finalized DTR period', function () {
    $company = Company::factory()->create();
    $ojt = User::factory()->create(['company_id' => $company->id, 'role' => 'ojt']);
    $submission = DtrSubmission::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'status' => DtrSubmission::STATUS_APPROVED,
        'locked_at' => now(),
    ]);

    $this->actingAs($ojt)
        ->delete(route('dtr-submissions.destroy', $submission))
        ->assertInvalid('dtr_submission');

    $this->assertModelExists($submission);
});

test('a company administrator can delete their finalized DTR sign-off without deleting daily reports', function () {
    $company = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company_admin',
    ]);
    $ojt = User::factory()->create(['company_id' => $company->id, 'role' => 'ojt']);
    $submission = DtrSubmission::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'status' => DtrSubmission::STATUS_APPROVED,
        'locked_at' => now(),
        'reviewed_at' => now(),
        'snapshot_hash' => str_repeat('a', 64),
    ]);
    $report = DailyReport::factory()->for($ojt)->create([
        'dtr_submission_id' => $submission->id,
        'approval_status' => DailyReport::STATUS_APPROVED,
    ]);

    $this->actingAs($companyAdmin)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->delete(route('company.dtr-submissions.destroy-finalized', $submission))
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    $this->assertModelMissing($submission);
    expect($report->refresh()->dtr_submission_id)->toBeNull()
        ->and($ojt->dailyReports()->whereKey($report)->exists())->toBeTrue();

    $activity = ActivityLog::query()->where('event', 'dtr.finalized_deleted')->sole();
    expect($activity->actor_id)->toBe($companyAdmin->id)
        ->and($activity->company_id)->toBe($company->id)
        ->and($activity->properties['dtr_submission_id'])->toBe($submission->id)
        ->and($activity->properties['report_ids'])->toBe([$report->id])
        ->and($activity->properties['snapshot_hash'])->toBe(str_repeat('a', 64));
});

test('a company administrator cannot delete another company finalized DTR', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $otherCompany->id,
        'role' => 'company_admin',
    ]);
    $ojt = User::factory()->create(['company_id' => $company->id, 'role' => 'ojt']);
    $submission = DtrSubmission::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'status' => DtrSubmission::STATUS_APPROVED,
        'locked_at' => now(),
    ]);

    $this->actingAs($companyAdmin)
        ->withSession(['auth.password_confirmed_at' => time()])
        ->delete(route('company.dtr-submissions.destroy-finalized', $submission))
        ->assertNotFound();

    $this->assertModelExists($submission);
});

test('other users cannot delete an OJT DTR period', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->create(['company_id' => $company->id, 'role' => 'ojt']);
    $otherOjt = User::factory()->create(['company_id' => $company->id, 'role' => 'ojt']);
    $companyAdmin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $submission = DtrSubmission::factory()->create([
        'company_id' => $company->id,
        'user_id' => $owner->id,
        'status' => DtrSubmission::STATUS_PENDING_SUPERVISOR,
    ]);

    $this->actingAs($otherOjt)
        ->delete(route('dtr-submissions.destroy', $submission))
        ->assertForbidden();

    $this->actingAs($companyAdmin)
        ->delete(route('dtr-submissions.destroy', $submission))
        ->assertForbidden();

    $this->actingAs($companyAdmin)
        ->delete(route('company.dtr-submissions.destroy-finalized', $submission))
        ->assertForbidden();

    $this->assertModelExists($submission);
});

function validDtrSignature(int $offset = 0): string
{
    return json_encode([
        'version' => 1,
        'strokes' => [[
            ['x' => 800 + $offset, 'y' => 6_200],
            ['x' => 2_100 + $offset, 'y' => 3_800],
            ['x' => 3_400 + $offset, 'y' => 6_100],
            ['x' => 4_800 + $offset, 'y' => 3_600],
            ['x' => 6_100 + $offset, 'y' => 5_900],
            ['x' => 8_900 + $offset, 'y' => 4_100],
        ]],
    ], JSON_THROW_ON_ERROR);
}
