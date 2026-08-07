<?php

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\User;

function approvalActors(): array
{
    $company = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'required_hours' => 8,
    ]);

    return [$company, $admin, $ojt];
}

test('a company administrator can approve pending hours and complete the OJT', function () {
    [, $admin, $ojt] = approvalActors();
    $report = DailyReport::factory()->for($ojt)->create([
        'report_date' => '2026-08-06',
        'total_hours' => 8,
        'approval_status' => DailyReport::STATUS_PENDING,
    ]);

    $this->actingAs($admin)
        ->patch(route('company.reports.approve', $report))
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    expect($report->refresh())
        ->approval_status->toBe(DailyReport::STATUS_APPROVED)
        ->reviewed_by->toBe($admin->id)
        ->reviewed_at->not->toBeNull()
        ->rejection_reason->toBeNull();
    expect($ojt->refresh()->end_date?->toDateString())->toBe('2026-08-06');

    $this->actingAs($ojt)
        ->get(route('reports.dtr'))
        ->assertSuccessful()
        ->assertSee('8.00');
});

test('a company administrator can reject a report with a correction reason', function () {
    [, $admin, $ojt] = approvalActors();
    $report = DailyReport::factory()->for($ojt)->create([
        'total_hours' => 8,
        'approval_status' => DailyReport::STATUS_PENDING,
    ]);

    $this->actingAs($admin)
        ->patch(route('company.reports.reject', $report), [
            'rejection_reason' => 'Please provide a more detailed work summary.',
        ])
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'warning');

    expect($report->refresh())
        ->approval_status->toBe(DailyReport::STATUS_REJECTED)
        ->reviewed_by->toBe($admin->id)
        ->rejection_reason->toBe('Please provide a more detailed work summary.');
    expect($ojt->refresh()->end_date)->toBeNull();
});

test('a company administrator cannot review another company report', function () {
    [, $admin] = approvalActors();
    $otherCompany = Company::factory()->create();
    $otherOjt = User::factory()->create(['company_id' => $otherCompany->id]);
    $report = DailyReport::factory()->for($otherOjt)->create([
        'approval_status' => DailyReport::STATUS_PENDING,
    ]);

    $this->actingAs($admin)
        ->patch(route('company.reports.approve', $report))
        ->assertNotFound();

    expect($report->refresh()->approval_status)->toBe(DailyReport::STATUS_PENDING);
});

test('only a pending report can be reviewed', function () {
    [, $admin, $ojt] = approvalActors();
    $report = DailyReport::factory()->for($ojt)->create([
        'approval_status' => DailyReport::STATUS_APPROVED,
    ]);

    $this->actingAs($admin)
        ->patch(route('company.reports.reject', $report), [
            'rejection_reason' => 'This should not change the approved report.',
        ])
        ->assertInvalid('approval');

    expect($report->refresh()->approval_status)->toBe(DailyReport::STATUS_APPROVED);
});

test('an assigned supervisor can view reports but cannot review them', function () {
    [$company, $admin, $ojt] = approvalActors();
    $supervisor = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'supervisor',
    ]);
    $ojt->update(['supervisor_id' => $supervisor->id]);
    $report = DailyReport::factory()->for($ojt)->create([
        'approval_status' => DailyReport::STATUS_PENDING,
    ]);

    $this->actingAs($supervisor)
        ->get(route('supervisor.ojts.reports', $ojt))
        ->assertSuccessful();

    $this->actingAs($supervisor)
        ->patch(route('company.reports.approve', $report))
        ->assertForbidden();

    $this->actingAs($admin)
        ->patch(route('company.reports.approve', $report))
        ->assertRedirect();
});
