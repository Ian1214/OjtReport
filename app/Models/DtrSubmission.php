<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class DtrSubmission extends Model
{
    use HasFactory, SoftDeletes;

    public const STATUS_PENDING_SUPERVISOR = 'pending_supervisor';

    public const STATUS_PENDING_ADMIN = 'pending_admin';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    protected $fillable = [
        'company_id', 'user_id', 'period_start', 'period_end', 'total_hours', 'status',
        'submitted_at', 'student_signature_name', 'student_signature_strokes', 'student_signed_at',
        'supervisor_reviewed_by', 'supervisor_reviewed_at', 'supervisor_signature_name',
        'supervisor_signature_strokes', 'supervisor_signed_at',
        'reviewed_by', 'reviewed_at', 'locked_at', 'rejection_reason', 'snapshot_hash',
        'verification_token', 'deletion_reason', 'deleted_by',
    ];

    protected $hidden = [
        'student_signature_strokes',
        'supervisor_signature_strokes',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date', 'period_end' => 'date', 'total_hours' => 'decimal:2',
            'submitted_at' => 'datetime', 'student_signature_strokes' => 'array',
            'student_signed_at' => 'datetime',
            'supervisor_reviewed_at' => 'datetime', 'supervisor_signed_at' => 'datetime',
            'supervisor_signature_strokes' => 'array',
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

    public function supervisorReviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_reviewed_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
