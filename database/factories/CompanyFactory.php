<?php

namespace Database\Factories;

use App\Models\Company;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Company>
 */
class CompanyFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'name' => fake()->company(),
            'work_start_time' => '08:00:00',
            'late_grace_minutes' => 0,
            'timezone' => 'Asia/Manila',
            'work_days' => [1, 2, 3, 4, 5],
            'attendance_verification_mode' => 'disabled',
            'attendance_latitude' => null,
            'attendance_longitude' => null,
            'attendance_radius_meters' => 150,
        ];
    }
}
