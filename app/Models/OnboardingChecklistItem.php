<?php

namespace App\Models;

use Database\Factories\OnboardingChecklistItemFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OnboardingChecklistItem extends Model
{
    /** @use HasFactory<OnboardingChecklistItemFactory> */
    use HasFactory;

    protected $fillable = [
        'company_id',
        'ojt_id',
        'completed_by',
        'title',
        'description',
        'due_date',
        'completed_at',
    ];

    protected function casts(): array
    {
        return ['due_date' => 'date', 'completed_at' => 'datetime'];
    }

    public function ojt(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ojt_id');
    }

    public function completedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'completed_by');
    }
}
