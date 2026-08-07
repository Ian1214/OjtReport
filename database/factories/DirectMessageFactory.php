<?php

namespace Database\Factories;

use App\Models\DirectMessage;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<DirectMessage>
 */
class DirectMessageFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sender_id' => User::factory(),
            'recipient_id' => User::factory(),
            'body' => fake()->sentence(),
            'read_at' => null,
        ];
    }
}
