<?php

use App\Models\Company;
use App\Models\CompanyHoliday;
use App\Models\DailyReport;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow('2026-08-11 09:00:00');
});

test('an OJT calendar shows only their attendance company holidays and approved leave', function () {
    $company = Company::factory()->create(['work_days' => [1, 2, 3, 4, 5], 'timezone' => 'Asia/Manila']);
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $otherOjt = User::factory()->create(['company_id' => $company->id]);
    $report = DailyReport::factory()->for($ojt)->create([
        'report_date' => '2026-08-04',
        'approval_status' => DailyReport::STATUS_APPROVED,
        'total_hours' => 8,
    ]);
    DailyReport::factory()->for($otherOjt)->create(['report_date' => '2026-08-05']);
    $holiday = CompanyHoliday::factory()->for($company)->create([
        'holiday_date' => '2026-08-21',
        'name' => 'Company Foundation Day',
    ]);
    $leave = LeaveRequest::factory()->for($company)->for($ojt)->create([
        'start_date' => '2026-08-17',
        'end_date' => '2026-08-18',
        'status' => LeaveRequest::STATUS_APPROVED,
    ]);
    LeaveRequest::factory()->for($company)->for($ojt)->create([
        'start_date' => '2026-08-24',
        'end_date' => '2026-08-24',
        'status' => LeaveRequest::STATUS_PENDING_ADMIN,
    ]);

    $this->actingAs($ojt)
        ->get(route('attendance-calendar.index', ['month' => '2026-08']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('attendance-calendar/index')
            ->where('month', '2026-08')
            ->where('timezone', 'Asia/Manila')
            ->where('workDays', [1, 2, 3, 4, 5])
            ->where('canManageHolidays', false)
            ->has('attendance', 1)
            ->where('attendance.0.id', $report->id)
            ->where('attendance.0.date', '2026-08-04')
            ->has('holidays', 1)
            ->where('holidays.0.id', $holiday->id)
            ->has('approvedLeave', 1)
            ->where('approvedLeave.0.id', $leave->id));
});

test('a company administrator can manage holidays from the shared calendar', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);

    $this->actingAs($administrator)
        ->post(route('company.holidays.store'), [
            'holiday_date' => '2026-08-20',
            'name' => 'Company Wellness Day',
        ])
        ->assertRedirect();

    $holiday = CompanyHoliday::query()->sole();
    expect($holiday)
        ->company_id->toBe($company->id)
        ->name->toBe('Company Wellness Day');

    $this->actingAs($administrator)
        ->get(route('attendance-calendar.index', ['month' => '2026-08']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('canManageHolidays', true)
            ->has('holidays', 1)
            ->where('holidays.0.id', $holiday->id)
            ->has('attendance', 0));

    $this->actingAs($administrator)
        ->delete(route('company.holidays.destroy', $holiday))
        ->assertRedirect();

    $this->assertModelMissing($holiday);
});

test('OJT users cannot create company holidays', function () {
    $ojt = User::factory()->create();

    $this->actingAs($ojt)
        ->post(route('company.holidays.store'), [
            'holiday_date' => '2026-08-20',
            'name' => 'Unauthorized holiday',
        ])
        ->assertForbidden();

    expect(CompanyHoliday::query()->count())->toBe(0);
});
