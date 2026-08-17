<?php

namespace Database\Factories;

use App\Models\PassportShare;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<PassportShare>
 */
class PassportShareFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $token = Str::random(64);

        return [
            'ojt_id' => User::factory(),
            'created_by' => fn (array $attributes): int => $attributes['ojt_id'],
            'token_hash' => hash('sha256', $token),
            'token' => $token,
            'expires_at' => now()->addDays(30),
            'revoked_at' => null,
            'last_accessed_at' => null,
            'access_count' => 0,
        ];
    }
}
