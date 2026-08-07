<?php

namespace Database\Factories;

use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ActivityLog>
 */
class ActivityLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'actor_id' => User::factory(),
            'event' => 'user.login',
            'description' => fake()->sentence(),
            'properties' => [],
            'ip_address' => fake()->ipv4(),
            'user_agent' => fake()->userAgent(),
        ];
    }
}
