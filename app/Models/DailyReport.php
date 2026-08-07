<?php

namespace App\Models;

use Carbon\Carbon;
use Carbon\CarbonInterface;
use Database\Factories\DailyReportFactory;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class DailyReport extends Model
{
    /** @use HasFactory<DailyReportFactory> */
    use HasFactory;

    public const STATUS_APPROVED = 'approved';

    public const STATUS_PENDING = 'pending';

    public const STATUS_REJECTED = 'rejected';

    public const ATTENDANCE_ON_TIME = 'on_time';

    public const ATTENDANCE_LATE = 'late';

    protected $fillable = [
        'report_date',
        'time_in',
        'scheduled_time_in',
        'scheduled_grace_minutes',
        'attendance_status',
        'late_minutes',
        'time_out',
        'total_hours',
        'summary',
        'approval_status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
        'dtr_submission_id',
    ];

    protected function casts(): array
    {
        return [
            'report_date' => 'date',
            'total_hours' => 'decimal:2',
            'reviewed_at' => 'datetime',
            'late_minutes' => 'integer',
            'scheduled_grace_minutes' => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function correctionRequests(): HasMany
    {
        return $this->hasMany(AttendanceCorrectionRequest::class);
    }

    public function latestCorrectionRequest(): HasOne
    {
        return $this->hasOne(AttendanceCorrectionRequest::class)->latestOfMany();
    }

    public function dtrSubmission(): BelongsTo
    {
        return $this->belongsTo(DtrSubmission::class);
    }

    public function isLocked(): bool
    {
        return $this->dtrSubmission?->locked_at !== null;
    }

    public function scopeApproved(Builder $query): void
    {
        $query->where('approval_status', self::STATUS_APPROVED);
    }

    public static function calculateTotalHours(Carbon $timeIn, Carbon $timeOut): float
    {
        $totalHours = $timeIn->diffInSeconds($timeOut) / 3600;
        $lunchStart = $timeIn->copy()->setTime(12, 0);
        $lunchEnd = $timeIn->copy()->setTime(13, 0);

        if ($timeIn->lessThan($lunchStart) && $timeOut->greaterThanOrEqualTo($lunchEnd)) {
            $totalHours -= 1;
        }

        return round(max(0, $totalHours), 2);
    }

    /**
     * @return array{attendance_status: string, late_minutes: int}
     */
    public static function classifyPunctuality(
        CarbonInterface $timeIn,
        CarbonInterface $scheduledTimeIn,
        int $graceMinutes = 0,
    ): array {
        $isLate = $timeIn->greaterThan($scheduledTimeIn->copy()->addMinutes($graceMinutes));
        $lateMinutes = $isLate
            ? max(0, (int) ceil($scheduledTimeIn->diffInSeconds($timeIn, false) / 60))
            : 0;

        return [
            'attendance_status' => $isLate ? self::ATTENDANCE_LATE : self::ATTENDANCE_ON_TIME,
            'late_minutes' => $lateMinutes,
        ];
    }
}
