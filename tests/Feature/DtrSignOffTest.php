<?php

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\DtrSubmission;
use App\Models\User;

test('a DTR period is locked after supervisor and administrator sign-off', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);
    $report = DailyReport::factory()->for($ojt)->create(['report_date' => today(), 'approval_status' => DailyReport::STATUS_APPROVED, 'total_hours' => 8]);

    $this->actingAs($ojt)->post(route('dtr-submissions.store'), ['period_start' => today()->toDateString(), 'period_end' => today()->toDateString()])->assertRedirect();
    $submission = DtrSubmission::query()->sole();
    expect($report->refresh()->dtr_submission_id)->toBe($submission->id);

    $this->actingAs($supervisor)->patch(route('dtr-submissions.review', $submission), ['decision' => 'approve'])->assertRedirect();
    $this->actingAs($admin)->patch(route('dtr-submissions.review', $submission), ['decision' => 'approve'])->assertRedirect();

    expect($submission->refresh())->status->toBe(DtrSubmission::STATUS_APPROVED)->locked_at->not->toBeNull()->snapshot_hash->toHaveLength(64);
    $this->actingAs($ojt)->post(route('attendance-corrections.store', $report), [
        'proposed_time_in' => '08:05', 'proposed_time_out' => '17:00', 'reason' => 'This should be blocked because the DTR is final.',
    ])->assertInvalid('attendance');
});

test('another company cannot review a DTR submission', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'company_admin']);
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $submission = DtrSubmission::factory()->create(['company_id' => $company->id, 'user_id' => $ojt->id, 'status' => DtrSubmission::STATUS_PENDING_ADMIN]);

    $this->actingAs($admin)->patch(route('dtr-submissions.review', $submission), ['decision' => 'approve'])->assertNotFound();
});
