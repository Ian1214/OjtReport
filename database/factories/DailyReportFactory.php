<?php

namespace Database\Factories;

use App\Models\DailyReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DailyReport>
 */
class DailyReportFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'report_date' => fake()->unique()->dateTimeBetween('-30 days', 'today')->format('Y-m-d'),
            'time_in' => '08:00:00',
            'scheduled_time_in' => '08:00:00',
            'scheduled_grace_minutes' => 0,
            'attendance_status' => DailyReport::ATTENDANCE_ON_TIME,
            'late_minutes' => 0,
            'time_out' => '17:00:00',
            'total_hours' => 9,
            'summary' => fake()->paragraph(),
        ];
    }
}
