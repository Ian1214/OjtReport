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
        ];
    }
}
