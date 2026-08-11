<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\DtrSubmission;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<DtrSubmission> */
class DtrSubmissionFactory extends Factory
{
    public function definition(): array
    {
        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'period_start' => now()->startOfMonth()->toDateString(),
            'period_end' => now()->toDateString(),
            'total_hours' => 8,
            'status' => DtrSubmission::STATUS_PENDING_SUPERVISOR,
            'submitted_at' => now(),
            'student_signature_name' => fake()->name(),
            'student_signature_strokes' => [
                'version' => 1,
                'strokes' => [[
                    ['x' => 800, 'y' => 6_200],
                    ['x' => 2_100, 'y' => 3_800],
                    ['x' => 3_400, 'y' => 6_100],
                    ['x' => 4_800, 'y' => 3_600],
                    ['x' => 6_100, 'y' => 5_900],
                    ['x' => 8_900, 'y' => 4_100],
                ]],
            ],
            'student_signed_at' => now(),
        ];
    }
}
