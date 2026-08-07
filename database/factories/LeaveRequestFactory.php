<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<LeaveRequest> */
class LeaveRequestFactory extends Factory
{
    public function definition(): array
    {
        $start = now()->addDays(fake()->numberBetween(1, 20));

        return [
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'type' => 'leave',
            'start_date' => $start->toDateString(),
            'end_date' => $start->copy()->addDay()->toDateString(),
            'reason' => fake()->sentence(),
            'status' => LeaveRequest::STATUS_PENDING_SUPERVISOR,
        ];
    }
}
