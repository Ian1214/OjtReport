<?php

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\DtrSubmission;
use App\Models\User;
use App\Services\DtrIntegrityService;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

test('a finalized DTR can be verified publicly without exposing signatures', function () {
    $company = Company::factory()->create();
    $ojt = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'name' => 'Verified Student']);
    $submission = DtrSubmission::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'status' => DtrSubmission::STATUS_APPROVED,
        'locked_at' => now(),
        'reviewed_at' => now(),
        'supervisor_signature_name' => 'Assigned Supervisor',
        'supervisor_signature_strokes' => ['version' => 1, 'strokes' => [[['x' => 500, 'y' => 500], ['x' => 5000, 'y' => 5000], ['x' => 9000, 'y' => 3000]]]],
        'supervisor_signed_at' => now(),
        'verification_token' => (string) Str::uuid(),
    ]);
    DailyReport::factory()->create(['user_id' => $ojt->id, 'dtr_submission_id' => $submission->id, 'approval_status' => DailyReport::STATUS_APPROVED, 'total_hours' => 8]);
    $submission->update(['snapshot_hash' => app(DtrIntegrityService::class)->hash($submission)]);

    $this->get(route('dtr.verify', $submission->verification_token))->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dtr-submissions/verify')
            ->where('record.valid', true)
            ->where('record.ojtName', 'Verified Student')
            ->missing('record.studentSignatureStrokes')
            ->missing('record.supervisorSignatureStrokes'));
});

test('tampering with an approved DTR report fails the integrity check', function () {
    $company = Company::factory()->create();
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $submission = DtrSubmission::factory()->create(['company_id' => $company->id, 'user_id' => $ojt->id, 'status' => DtrSubmission::STATUS_APPROVED, 'verification_token' => (string) Str::uuid()]);
    $report = DailyReport::factory()->create(['user_id' => $ojt->id, 'dtr_submission_id' => $submission->id, 'total_hours' => 8]);
    $submission->update(['snapshot_hash' => app(DtrIntegrityService::class)->hash($submission)]);
    $report->update(['total_hours' => 7]);

    $this->get(route('dtr.verify', $submission->verification_token))->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->where('record.valid', false));
});
