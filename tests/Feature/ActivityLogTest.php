<?php

use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('a successful login is recorded for the company administrator', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
        'password' => 'password',
    ]);

    $this->post(route('login.store'), [
        'email' => $admin->email,
        'password' => 'password',
    ])->assertRedirect();

    $log = ActivityLog::query()->where('event', 'user.login')->firstOrFail();
    expect($log)
        ->company_id->toBe($company->id)
        ->actor_id->toBe($admin->id)
        ->description->toContain($admin->name);
});

test('a company administrator sees only its own company activity', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company_admin',
    ]);
    $actor = User::factory()->create(['company_id' => $company->id]);
    $otherActor = User::factory()->create(['company_id' => $otherCompany->id]);
    $ownLog = ActivityLog::factory()->create([
        'company_id' => $company->id,
        'actor_id' => $actor->id,
        'event' => 'attendance.time_in',
        'description' => 'Own company activity.',
    ]);
    ActivityLog::factory()->create([
        'company_id' => $otherCompany->id,
        'actor_id' => $otherActor->id,
        'description' => 'Other company secret activity.',
    ]);

    $this->actingAs($admin)
        ->get(route('company.activity-logs.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/activity-logs')
            ->has('logs.data', 1)
            ->where('logs.data.0.id', $ownLog->id))
        ->assertDontSee('Other company secret activity.');
});

test('non administrators cannot view company activity logs', function (string $role) {
    $user = User::factory()->create(['role' => $role]);

    $this->actingAs($user)
        ->get(route('company.activity-logs.index'))
        ->assertForbidden();
})->with(['ojt', 'supervisor']);
