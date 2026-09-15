<?php

namespace Database\Factories;

use App\Models\PlatformActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PlatformActivityLog>
 */
class PlatformActivityLogFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'actor_id' => User::factory(),
            'event' => 'platform.test',
            'description' => fake()->sentence(),
            'properties' => [],
        ];
    }
}
