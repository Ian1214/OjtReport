<?php

use App\Models\Company;
use App\Models\CompletionCertificate;
use App\Models\DailyReport;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('a company administrator sees only its own OJT analytics', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
        'required_hours' => 500,
        'start_date' => now()->startOfMonth(),
    ]);
    DailyReport::factory()->for($ojt)->create([
        'report_date' => now(),
        'approval_status' => DailyReport::STATUS_APPROVED,
        'attendance_status' => DailyReport::ATTENDANCE_LATE,
        'total_hours' => 8,
    ]);
    DailyReport::factory()->for($ojt)->create([
        'report_date' => now()->subDay(),
        'approval_status' => DailyReport::STATUS_PENDING,
        'total_hours' => 8,
    ]);
    CompletionCertificate::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
        'admin_signed_by' => $administrator->id,
        'status' => CompletionCertificate::STATUS_FINALIZED,
        'allocated_hours' => 5,
    ]);

    $otherCompany = Company::factory()->create();
    $otherOjt = User::factory()->create(['company_id' => $otherCompany->id]);
    DailyReport::factory()->for($otherOjt)->create([
        'approval_status' => DailyReport::STATUS_APPROVED,
        'total_hours' => 100,
    ]);

    $this->actingAs($administrator)
        ->get(route('company.analytics.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/analytics')
            ->where('summary.totalOjts', 1)
            ->where('summary.approvedHours', '8.00')
            ->where('summary.certifiedHours', '5.00')
            ->where('summary.uncertifiedHours', '3.00')
            ->where('summary.pendingReports', 1)
            ->where('summary.lateDays', 1)
            ->where('ojts.data.0.name', $ojt->name)
            ->where('ojts.data.0.remainingHours', '492.00'));
});

test('non administrators cannot open company analytics', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($supervisor)->get(route('company.analytics.index'))->assertForbidden();
    $this->actingAs($ojt)->get(route('company.analytics.index'))->assertForbidden();
});
