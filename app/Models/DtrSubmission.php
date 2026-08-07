<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class DtrSubmission extends Model
{
    use HasFactory;

    public const STATUS_PENDING_SUPERVISOR = 'pending_supervisor';

    public const STATUS_PENDING_ADMIN = 'pending_admin';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'company_id', 'user_id', 'period_start', 'period_end', 'total_hours', 'status',
        'submitted_at', 'supervisor_reviewed_by', 'supervisor_reviewed_at', 'reviewed_by',
        'reviewed_at', 'locked_at', 'rejection_reason', 'snapshot_hash',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date', 'period_end' => 'date', 'total_hours' => 'decimal:2',
            'submitted_at' => 'datetime', 'supervisor_reviewed_at' => 'datetime',
            'reviewed_at' => 'datetime', 'locked_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reports(): HasMany
    {
        return $this->hasMany(DailyReport::class);
    }
}
