<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AttendanceCorrectionRequest extends Model
{
    /** @use HasFactory<\Database\Factories\AttendanceCorrectionRequestFactory> */
    use HasFactory;

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PENDING_ADMIN = 'pending_admin';

    public const STATUS_PENDING_SUPERVISOR = 'pending_supervisor';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'daily_report_id',
        'requested_by',
        'original_time_in',
        'original_time_out',
        'proposed_time_in',
        'proposed_time_out',
        'reason',
        'status',
        'supervisor_comment',
        'supervisor_reviewed_by',
        'supervisor_reviewed_at',
        'admin_comment',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'supervisor_reviewed_at' => 'datetime',
            'reviewed_at' => 'datetime',
        ];
    }

    public function dailyReport(): BelongsTo
    {
        return $this->belongsTo(DailyReport::class);
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function supervisorReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_reviewed_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
