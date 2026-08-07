<?php

namespace Database\Factories;

use App\Models\AccountSetupDelivery;
use App\Models\Company;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AccountSetupDelivery>
 */
class AccountSetupDeliveryFactory extends Factory
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
            'user_id' => User::factory(),
            'recipient_email' => fake()->safeEmail(),
            'status' => AccountSetupDelivery::STATUS_QUEUED,
            'queued_at' => now(),
            'sent_at' => null,
            'failed_at' => null,
            'failure_reason' => null,
        ];
    }

    public function sent(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => AccountSetupDelivery::STATUS_SENT,
            'sent_at' => now(),
            'failed_at' => null,
            'failure_reason' => null,
        ]);
    }

    public function failed(): static
    {
        return $this->state(fn (array $attributes): array => [
            'status' => AccountSetupDelivery::STATUS_FAILED,
            'sent_at' => null,
            'failed_at' => now(),
            'failure_reason' => 'The mail server did not accept the setup email.',
        ]);
    }
}
