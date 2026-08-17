<?php

use App\Models\Company;
use App\Models\Department;
use App\Models\User;
use Carbon\Carbon;
use Inertia\Testing\AssertableInertia as Assert;

test('a company administrator can create and manage a department', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'role' => 'supervisor']);

    $this->actingAs($administrator)->post(route('company.departments.store'), [
        'name' => 'Human Resources',
        'description' => 'People operations and recruitment.',
        'head_supervisor_id' => $supervisor->id,
        'capacity' => 12,
        'work_start_time' => '09:00',
        'work_end_time' => '18:00',
        'late_grace_minutes' => 10,
        'work_days' => [1, 2, 3, 4, 5],
    ])->assertRedirect(route('company.departments.index', absolute: false));

    $department = Department::query()->firstOrFail();
    expect($department->company_id)->toBe($company->id)
        ->and($department->head_supervisor_id)->toBe($supervisor->id)
        ->and($department->capacity)->toBe(12);

    $this->actingAs($administrator)
        ->get(route('company.departments.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/departments')
            ->has('departments', 1)
            ->where('departments.0.approvedHours', 0));
});

test('an administrator can transfer an OJT and update lifecycle details', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'role' => 'company_admin']);
    $department = Department::factory()->create(['company_id' => $company->id, 'name' => 'Finance']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'department' => 'IT']);

    $this->actingAs($administrator)->patch(route('company.ojts.update-profile', $ojt), [
        'name' => 'Updated Student',
        'email' => $ojt->email,
        'program' => $ojt->program,
        'year' => 4,
        'department_id' => $department->id,
        'position' => 'Finance Intern',
        'required_hours' => 500,
        'start_date' => '2026-08-04',
        'ojt_status' => User::OJT_STATUS_PAUSED,
    ])->assertSessionHasNoErrors();

    expect($ojt->refresh()->department_id)->toBe($department->id)
        ->and($ojt->department)->toBe('Finance')
        ->and($ojt->ojt_status)->toBe(User::OJT_STATUS_PAUSED);
});

test('department attendance schedules override the company schedule', function () {
    Carbon::setTestNow('2026-08-11 09:05:00');
    $company = Company::factory()->create(['work_start_time' => '08:00:00', 'late_grace_minutes' => 0]);
    $department = Department::factory()->create([
        'company_id' => $company->id,
        'work_start_time' => '09:00:00',
        'late_grace_minutes' => 10,
        'work_days' => [1, 2, 3, 4, 5],
    ]);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'department_id' => $department->id,
        'department' => $department->name,
    ]);

    $this->actingAs($ojt)->post(route('reports.time-in'))
        ->assertRedirect(route('reports.index', absolute: false))
        ->assertSessionHasNoErrors();

    $report = $ojt->dailyReports()->firstOrFail();
    expect($report->scheduled_time_in)->toBe('09:00:00')
        ->and($report->scheduled_grace_minutes)->toBe(10)
        ->and($report->attendance_status)->toBe('on_time');
});
