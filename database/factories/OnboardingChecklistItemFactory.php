<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\OnboardingChecklistItem;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<OnboardingChecklistItem>
 */
class OnboardingChecklistItemFactory extends Factory
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
            'title' => fake()->randomElement(['Submit MOA', 'Orientation', 'Submit endorsement letter']),
            'description' => fake()->sentence(),
            'due_date' => now()->addWeek()->toDateString(),
            'completed_at' => null,
            'completed_by' => null,
        ];
    }
}
