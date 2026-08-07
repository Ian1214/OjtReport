<?php

use App\Models\Company;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('registration screen can be rendered', function () {
    $this->get(route('register'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('auth/register'));
});

test('a company administrator account is created at registration', function () {
    $response = $this->post(route('register.store'), [
        'company_name' => 'Example Company',
        'name' => 'Juan Dela Cruz',
        'email' => 'juan@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'terms' => '1',
    ]);

    $user = User::query()->where('email', 'juan@example.com')->firstOrFail();

    $response->assertRedirect(route('dashboard', absolute: false));
    expect($user->role)->toBe('company_admin');
    expect($user->company_id)->not->toBeNull();
    expect($user->terms_accepted_at)->not->toBeNull();
    expect(Company::query()->find($user->company_id)?->name)->toBe('Example Company');
    $this->assertAuthenticatedAs($user);
});

test('company registration requires acceptance of the terms', function () {
    $this->post(route('register.store'), [
        'company_name' => 'Example Company',
        'name' => 'Juan Dela Cruz',
        'email' => 'juan@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
    ])->assertInvalid('terms');

    expect(User::query()->where('email', 'juan@example.com')->exists())->toBeFalse();
});

test('terms and company rules are publicly accessible', function () {
    $this->get(route('terms'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('terms'));
});
