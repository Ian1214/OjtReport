<?php

namespace App\Models;

use Database\Factories\OjtTaskFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class OjtTask extends Model
{
    /** @use HasFactory<OjtTaskFactory> */
    use HasFactory;

    protected $fillable = ['ojt_id', 'supervisor_id', 'title', 'description', 'status', 'due_date'];

    protected function casts(): array
    {
        return ['due_date' => 'date'];
    }

    public function ojt(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ojt_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function curriculumOutcomes(): BelongsToMany
    {
        return $this->belongsToMany(CurriculumOutcome::class);
    }
}
