<?php

namespace App\Models;

use Database\Factories\CurriculumOutcomeFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CurriculumOutcome extends Model
{
    /** @use HasFactory<CurriculumOutcomeFactory> */
    use HasFactory;

    protected $fillable = ['school_id', 'code', 'title', 'description', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function school(): BelongsTo
    {
        return $this->belongsTo(School::class);
    }

    public function tasks(): BelongsToMany
    {
        return $this->belongsToMany(OjtTask::class);
    }
}
