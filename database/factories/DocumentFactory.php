<?php

namespace Database\Factories;

use App\Models\Company;
use App\Models\Document;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Document>
 */
class DocumentFactory extends Factory
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
            'ojt_id' => User::factory(),
            'uploaded_by' => User::factory()->state(['role' => 'company_admin']),
            'title' => fake()->sentence(3),
            'category' => Document::CATEGORY_OTHER,
            'disk' => 'local',
            'path' => 'documents/example.pdf',
            'original_name' => 'example.pdf',
            'mime_type' => 'application/pdf',
            'size' => 1024,
            'shared_with_school' => false,
            'status' => Document::STATUS_APPROVED,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'rejection_reason' => null,
        ];
    }
}
