<?php

use App\Models\User;

test('authenticated activity records presence without writing on every request', function () {
    $this->freezeTime();
    $ojt = User::factory()->create(['last_seen_at' => null]);

    $this->actingAs($ojt)->get(route('dashboard'))->assertSuccessful();

    $firstSeenAt = $ojt->refresh()->last_seen_at;

    expect($firstSeenAt)->not->toBeNull()
        ->and($ojt->isOnline())->toBeTrue();

    $this->travel(30)->seconds();
    $this->get(route('dashboard'))->assertSuccessful();
    expect($ojt->refresh()->last_seen_at?->equalTo($firstSeenAt))->toBeTrue();

    $this->travel(31)->seconds();
    $this->get(route('dashboard'))->assertSuccessful();
    expect($ojt->refresh()->last_seen_at?->greaterThan($firstSeenAt))->toBeTrue();
});

test('accounts outside the presence window are offline', function () {
    $user = User::factory()->create([
        'last_seen_at' => now()->subSeconds(User::ONLINE_WINDOW_SECONDS + 1),
    ]);

    expect($user->isOnline())->toBeFalse();
});
