<?php

use App\Actions\AssessOjtRisk;
use App\Models\Company;
use App\Models\DailyReport;
use App\Models\User;

test('risk assessment is deterministic and explains every warning', function () {
    $assessment = app(AssessOjtRisk::class)->handle(
        missingWorkdays: 6,
        pendingReports: 4,
        lateDays: 3,
        unfinishedTasks: 6,
        completionPercentage: 15,
    );

    expect($assessment['level'])->toBe('high')
        ->and($assessment['score'])->toBeGreaterThanOrEqual(60)
        ->and($assessment['signals'])->toHaveCount(5)
        ->and($assessment['recommendedAction'])->toContain('Contact the OJT');
});

test('a compliance evidence export is tenant scoped and excludes report narratives', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'name' => 'Included Student']);
    $otherOjt = User::factory()->create(['company_id' => $otherCompany->id, 'name' => 'Excluded Student']);
    DailyReport::factory()->for($ojt)->create([
        'approval_status' => DailyReport::STATUS_APPROVED,
        'summary' => 'Private daily narrative',
    ]);
    DailyReport::factory()->for($otherOjt)->create(['approval_status' => DailyReport::STATUS_APPROVED]);

    $response = $this->actingAs($administrator)->get(route('company.analytics.compliance-evidence'));
    $content = $response->streamedContent();

    $response->assertSuccessful()->assertHeader('content-type', 'application/x-ndjson');
    expect($content)->toContain('Included Student')
        ->not->toContain('Excluded Student')
        ->not->toContain('Private daily narrative');
});

test('non administrators cannot export company compliance evidence', function () {
    $this->actingAs(User::factory()->create())
        ->get(route('company.analytics.compliance-evidence'))
        ->assertForbidden();
});
