<?php

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\User;
use Illuminate\Support\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    Carbon::setTestNow('2026-08-11 10:30:00');
});

test('company administrators can monitor live attendance without seeing another company', function () {
    $company = Company::factory()->create(['timezone' => 'Asia/Manila']);
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $presentOjt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
        'name' => 'Maria Present',
        'required_hours' => 500,
    ]);
    $absentOjt = User::factory()->create([
        'company_id' => $company->id,
        'name' => 'Noel Absent',
    ]);
    DailyReport::factory()->for($presentOjt)->create([
        'report_date' => '2026-08-11',
        'time_in' => '08:20:00',
        'time_out' => null,
        'summary' => null,
        'total_hours' => 0,
        'attendance_status' => DailyReport::ATTENDANCE_LATE,
        'late_minutes' => 20,
        'approval_status' => DailyReport::STATUS_PENDING,
    ]);
    DailyReport::factory()->for($absentOjt)->create([
        'report_date' => '2026-08-10',
        'time_out' => null,
        'summary' => null,
        'total_hours' => 0,
    ]);

    $otherCompany = Company::factory()->create();
    $otherOjt = User::factory()->create(['company_id' => $otherCompany->id]);
    DailyReport::factory()->for($otherOjt)->create(['report_date' => '2026-08-11']);

    $this->actingAs($administrator)
        ->get(route('company.attendance-monitor.index', ['date' => '2026-08-11']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/attendance-monitor')
            ->where('date', '2026-08-11')
            ->where('timezone', 'Asia/Manila')
            ->where('stats.total', 2)
            ->where('stats.present', 1)
            ->where('stats.absent', 1)
            ->where('stats.timedIn', 1)
            ->where('stats.late', 1)
            ->where('stats.missingTimeOut', 1)
            ->has('ojts.data', 2)
            ->where('ojts.data.0.name', 'Maria Present')
            ->where('ojts.data.0.state', 'timed_in')
            ->where('ojts.data.0.punctuality', DailyReport::ATTENDANCE_LATE)
            ->where('ojts.data.1.name', 'Noel Absent')
            ->where('ojts.data.1.state', 'absent')
            ->where('ojts.data.1.missingTimeOutCount', 1));
});

test('attendance monitoring filters status and supervisor within the company', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
        'name' => 'Late OJT',
    ]);
    User::factory()->create(['company_id' => $company->id, 'name' => 'Absent OJT']);
    DailyReport::factory()->for($ojt)->create([
        'report_date' => '2026-08-11',
        'attendance_status' => DailyReport::ATTENDANCE_LATE,
        'late_minutes' => 12,
    ]);

    $this->actingAs($administrator)
        ->get(route('company.attendance-monitor.index', [
            'date' => '2026-08-11',
            'status' => 'late',
            'supervisor_id' => $supervisor->id,
            'search' => 'Late',
        ]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('ojts.data', 1)
            ->where('ojts.data.0.id', $ojt->id)
            ->where('filters.status', 'late')
            ->where('filters.supervisorId', (string) $supervisor->id));
});

test('company administrators can export filtered attendance safely', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'name' => '=Unsafe Formula',
        'student_id' => '2026-0001',
    ]);
    DailyReport::factory()->for($ojt)->create(['report_date' => '2026-08-11']);

    $response = $this->actingAs($administrator)
        ->get(route('company.attendance-monitor.export', ['date' => '2026-08-11']));

    $response->assertSuccessful()
        ->assertDownload('attendance-2026-08-11.csv');

    expect($response->streamedContent())
        ->toContain('Date,OJT,"Student ID",Supervisor,Status')
        ->toContain("'=Unsafe Formula");
});

test('non administrators cannot monitor or export company attendance', function () {
    $ojt = User::factory()->create();

    $this->actingAs($ojt)
        ->get(route('company.attendance-monitor.index'))
        ->assertForbidden();

    $this->actingAs($ojt)
        ->get(route('company.attendance-monitor.export'))
        ->assertForbidden();
});
