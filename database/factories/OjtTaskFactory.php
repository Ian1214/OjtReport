<?php

namespace Database\Factories;

use App\Models\OjtTask;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OjtTask>
 */
class OjtTaskFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'ojt_id' => User::factory(),
            'supervisor_id' => User::factory()->state(['role' => 'supervisor']),
            'title' => fake()->sentence(4),
            'description' => fake()->paragraph(),
            'status' => 'not_started',
            'due_date' => fake()->dateTimeBetween('now', '+1 month')->format('Y-m-d'),
        ];
    }
}
