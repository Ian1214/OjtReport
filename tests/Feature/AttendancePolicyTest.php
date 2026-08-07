<?php

use App\Models\Company;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('a company administrator can view and update its attendance policy', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);

    $this->actingAs($admin)
        ->get(route('company.attendance-policy.edit'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/attendance-policy')
            ->where('company.name', $company->name)
            ->where('company.workStartTime', '08:00'));

    $this->actingAs($admin)
        ->patch(route('company.attendance-policy.update'), [
            'work_start_time' => '07:45',
            'late_grace_minutes' => 15,
        ])
        ->assertRedirect();

    expect($company->refresh())
        ->work_start_time->toBe('07:45:00')
        ->late_grace_minutes->toBe(15);
});

test('an OJT cannot access or change company attendance policy', function () {
    $company = Company::factory()->create();
    $ojt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($ojt)
        ->get(route('company.attendance-policy.edit'))
        ->assertForbidden();

    $this->actingAs($ojt)
        ->patch(route('company.attendance-policy.update'), [
            'work_start_time' => '07:00',
            'late_grace_minutes' => 5,
        ])
        ->assertForbidden();

    expect($company->refresh()->work_start_time)->toBe('08:00:00');
});

test('attendance policy rejects an invalid schedule', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company_admin',
    ]);

    $this->actingAs($admin)
        ->patch(route('company.attendance-policy.update'), [
            'work_start_time' => '25:00',
            'late_grace_minutes' => 121,
        ])
        ->assertInvalid(['work_start_time', 'late_grace_minutes']);
});
