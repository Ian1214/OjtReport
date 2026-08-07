<?php

namespace Database\Factories;

use App\Models\AttendanceCorrectionRequest;
use App\Models\DailyReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AttendanceCorrectionRequest>
 */
class AttendanceCorrectionRequestFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'daily_report_id' => DailyReport::factory(),
            'requested_by' => User::factory(),
            'original_time_in' => '08:00:00',
            'original_time_out' => '17:00:00',
            'proposed_time_in' => '08:30:00',
            'proposed_time_out' => null,
            'reason' => fake()->sentence(),
            'status' => AttendanceCorrectionRequest::STATUS_PENDING_ADMIN,
        ];
    }
}
