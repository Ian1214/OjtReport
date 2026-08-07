<?php

use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('an OJT must accept the terms before accessing protected pages', function () {
    $company = Company::factory()->create();
    $ojt = User::factory()->withoutAcceptedTerms()->create([
        'company_id' => $company->id,
        'company' => $company->name,
    ]);

    $this->actingAs($ojt)
        ->get(route('dashboard'))
        ->assertRedirect(route('ojt-terms.show', absolute: false));

    $this->actingAs($ojt)
        ->get(route('ojt-terms.show'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('terms/accept')
            ->where('companyName', $company->name));
});

test('an OJT can accept the terms and continue to the dashboard', function () {
    $company = Company::factory()->create();
    $ojt = User::factory()->withoutAcceptedTerms()->create([
        'company_id' => $company->id,
        'company' => $company->name,
    ]);

    $this->actingAs($ojt)
        ->post(route('ojt-terms.update'), ['terms' => '1'])
        ->assertRedirect(route('dashboard', absolute: false));

    expect($ojt->refresh()->terms_accepted_at)->not->toBeNull();
    expect(ActivityLog::query()
        ->where('company_id', $company->id)
        ->where('actor_id', $ojt->id)
        ->where('event', 'terms.accepted')
        ->exists())->toBeTrue();

    $this->actingAs($ojt)->get(route('dashboard'))->assertSuccessful();
});

test('the acceptance checkbox is required', function () {
    $ojt = User::factory()->withoutAcceptedTerms()->create();

    $this->actingAs($ojt)
        ->post(route('ojt-terms.update'))
        ->assertInvalid('terms');

    expect($ojt->refresh()->terms_accepted_at)->toBeNull();
});

test('company administrators cannot use the OJT acceptance endpoint', function () {
    $admin = User::factory()->create(['role' => 'company_admin']);

    $this->actingAs($admin)->get(route('ojt-terms.show'))->assertForbidden();
    $this->actingAs($admin)->post(route('ojt-terms.update'), ['terms' => '1'])->assertForbidden();
});
