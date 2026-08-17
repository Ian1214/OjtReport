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

    protected $fillable = ['name', 'contact_email'];

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
