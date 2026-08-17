<?php

namespace App\Models;

use Database\Factories\SupervisorFeedbackFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SupervisorFeedback extends Model
{
    /** @use HasFactory<SupervisorFeedbackFactory> */
    use HasFactory;

    protected $table = 'supervisor_feedback';

    protected $fillable = [
        'company_id',
        'ojt_id',
        'supervisor_id',
        'category',
        'rating',
        'comments',
        'shared_with_school',
    ];

    protected function casts(): array
    {
        return ['rating' => 'integer', 'shared_with_school' => 'boolean'];
    }

    public function ojt(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ojt_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }
}
