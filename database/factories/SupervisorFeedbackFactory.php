<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\SupervisorFeedback;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<SupervisorFeedback>
 */
class SupervisorFeedbackFactory extends Factory
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
            'ojt_id' => User::factory(),
            'supervisor_id' => User::factory()->state(['role' => 'supervisor']),
            'category' => 'progress',
            'rating' => fake()->numberBetween(1, 5),
            'comments' => fake()->paragraph(),
            'shared_with_school' => false,
        ];
    }
}
