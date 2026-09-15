<?php

namespace Database\Factories;

use App\Models\PlatformAnnouncement;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<PlatformAnnouncement>
 */
class PlatformAnnouncementFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'created_by' => User::factory()->state(['role' => 'platform_admin', 'company_id' => null]),
            'title' => fake()->sentence(4),
            'message' => fake()->paragraph(),
            'severity' => fake()->randomElement(PlatformAnnouncement::SEVERITIES),
            'published_at' => now(),
        ];
    }
}
