<?php

namespace App\Models;

use Database\Factories\SchoolFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class School extends Model
{
    /** @use HasFactory<SchoolFactory> */
    use HasFactory;

    /** @var array<string, bool|string> */
    public const DEFAULT_SETTINGS = [
        'email_progress_alerts' => true,
        'email_completion_alerts' => true,
        'digest_frequency' => 'weekly',
        'required_document_labels' => '',
        'evaluation_template_name' => 'Standard OJT Evaluation',
    ];

    protected $fillable = [
        'name',
        'logo_path',
        'address',
        'contact_email',
        'contact_phone',
        'settings',
    ];

    protected function casts(): array
    {
        return ['settings' => 'array'];
    }

    /** @return array<string, mixed> */
    public function resolvedSettings(): array
    {
        return array_replace(self::DEFAULT_SETTINGS, $this->settings ?? []);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function ojts(): HasMany
    {
        return $this->users()->where('role', 'ojt');
    }

    public function coordinators(): HasMany
    {
        return $this->users()->where('role', 'school_coordinator');
    }

    public function curriculumOutcomes(): HasMany
    {
        return $this->hasMany(CurriculumOutcome::class);
    }
}
