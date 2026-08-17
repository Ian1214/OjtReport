<?php

use App\Models\Company;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('only a platform administrator can view global tenant operations', function () {
    $company = Company::factory()->create();
    $companyOwner = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $platformAdmin = User::factory()->create(['company_id' => null, 'company' => null, 'role' => 'platform_admin']);

    $this->actingAs($companyOwner)->get(route('platform.dashboard'))->assertForbidden();
    $this->actingAs($platformAdmin)->get(route('platform.dashboard'))->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('platform/dashboard')
            ->where('stats.companies', 1)
            ->where('stats.users', 2)
            ->has('companies', 1));
});

test('a platform administrator reaches the platform dashboard through the shared dashboard route', function () {
    $platformAdmin = User::factory()->create([
        'company_id' => null,
        'company' => null,
        'role' => 'platform_admin',
    ]);

    $this->actingAs($platformAdmin)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('platform/dashboard')
            ->where('stats.users', 1));
});
