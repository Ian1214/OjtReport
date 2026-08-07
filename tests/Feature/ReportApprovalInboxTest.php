<?php

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

function approvalInboxActors(): array
{
    $company = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);

    return [$company, $admin];
}

test('the approval inbox defaults to pending reports from the administrators company', function () {
    [$company, $admin] = approvalInboxActors();
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $pendingReport = DailyReport::factory()->for($ojt)->create([
        'approval_status' => DailyReport::STATUS_PENDING,
    ]);
    DailyReport::factory()->for($ojt)->create([
        'approval_status' => DailyReport::STATUS_APPROVED,
    ]);

    $otherCompany = Company::factory()->create();
    $otherOjt = User::factory()->create(['company_id' => $otherCompany->id]);
    DailyReport::factory()->for($otherOjt)->create([
        'approval_status' => DailyReport::STATUS_PENDING,
    ]);

    $this->actingAs($admin)
        ->get(route('company.approvals.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/approval-inbox')
            ->has('reports.data', 1)
            ->where('reports.data.0.id', $pendingReport->id)
            ->where('filters.status', 'pending')
            ->where('stats.pending', 1)
            ->where('stats.approved', 1)
            ->where('navigation.pendingReportsCount', 1));
});

test('the approval inbox filters by OJT supervisor dates and status', function () {
    [$company, $admin] = approvalInboxActors();
    $supervisor = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'supervisor',
    ]);
    $matchingOjt = User::factory()->create([
        'company_id' => $company->id,
        'name' => 'Maria Santos',
        'supervisor_id' => $supervisor->id,
    ]);
    $matchingReport = DailyReport::factory()->for($matchingOjt)->create([
        'report_date' => '2026-08-05',
        'approval_status' => DailyReport::STATUS_APPROVED,
    ]);
    $otherOjt = User::factory()->create(['company_id' => $company->id]);
    DailyReport::factory()->for($otherOjt)->create([
        'report_date' => '2026-08-06',
        'approval_status' => DailyReport::STATUS_APPROVED,
    ]);

    $this->actingAs($admin)
        ->get(route('company.approvals.index', [
            'search' => 'Maria',
            'status' => 'approved',
            'supervisor_id' => $supervisor->id,
            'date_from' => '2026-08-05',
            'date_to' => '2026-08-05',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('reports.data', 1)
            ->where('reports.data.0.id', $matchingReport->id)
            ->where('reports.data.0.ojt.name', 'Maria Santos'));
});

test('non administrators cannot open the approval inbox', function () {
    $ojt = User::factory()->create();

    $this->actingAs($ojt)
        ->get(route('company.approvals.index'))
        ->assertForbidden();
});
