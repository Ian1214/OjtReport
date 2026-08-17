<?php

namespace Database\Factories;

use App\Models\CurriculumOutcome;
use App\Models\School;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<CurriculumOutcome>
 */
class CurriculumOutcomeFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'school_id' => School::factory(),
            'code' => strtoupper(fake()->unique()->bothify('CO-###')),
            'title' => fake()->sentence(4),
            'description' => fake()->sentence(),
            'is_active' => true,
        ];
    }
}
