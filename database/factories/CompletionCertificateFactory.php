<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\CompletionCertificate;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<CompletionCertificate>
 */
class CompletionCertificateFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'certificate_number' => 'CERT-'.now()->format('Y').'-'.Str::upper(Str::random(8)),
            'company_id' => Company::factory(),
            'user_id' => User::factory(),
            'supervisor_id' => User::factory()->state(['role' => 'supervisor']),
            'allocated_hours' => 250,
            'approved_hours_snapshot' => 500,
            'status' => CompletionCertificate::STATUS_PENDING_SUPERVISOR,
            'ojt_name' => fake()->name(),
            'student_id' => fake()->numerify('2026-####'),
            'company_name' => fake()->company(),
            'program' => 'Bachelor of Science in Information Technology',
            'position' => 'OJT Intern',
            'department' => 'Information Technology',
            'admin_signed_by' => User::factory()->state(['role' => 'company_admin']),
            'admin_signature_name' => fake()->name(),
            'admin_signature_strokes' => [
                'version' => 1,
                'strokes' => [[
                    ['x' => 1000, 'y' => 5000], ['x' => 2000, 'y' => 4000],
                    ['x' => 3000, 'y' => 6000], ['x' => 4000, 'y' => 3500],
                    ['x' => 5000, 'y' => 5500], ['x' => 7000, 'y' => 4000],
                ]],
            ],
            'admin_signed_at' => now(),
        ];
    }
}
