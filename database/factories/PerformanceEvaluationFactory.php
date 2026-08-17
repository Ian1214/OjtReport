<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\PerformanceEvaluation;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PerformanceEvaluation>
 */
class PerformanceEvaluationFactory extends Factory
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
            'period_start' => now()->subMonth()->startOfMonth(),
            'period_end' => now()->subMonth()->endOfMonth(),
            'technical_score' => fake()->numberBetween(3, 5),
            'work_quality_score' => fake()->numberBetween(3, 5),
            'communication_score' => fake()->numberBetween(3, 5),
            'professionalism_score' => fake()->numberBetween(3, 5),
            'attendance_score' => fake()->numberBetween(3, 5),
            'strengths' => fake()->sentence(),
            'improvements' => fake()->sentence(),
            'comments' => fake()->sentence(),
            'status' => PerformanceEvaluation::STATUS_SUBMITTED,
            'submitted_at' => now(),
        ];
    }

    public function draft(): static
    {
        return $this->state(fn (): array => [
            'status' => PerformanceEvaluation::STATUS_DRAFT,
            'submitted_at' => null,
        ]);
    }
}
