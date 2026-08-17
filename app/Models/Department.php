<?php

namespace App\Models;

use Database\Factories\DepartmentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

class Department extends Model
{
    /** @use HasFactory<DepartmentFactory> */
    use HasFactory;

    protected $fillable = [
        'company_id',
        'head_supervisor_id',
        'name',
        'description',
        'capacity',
        'work_start_time',
        'work_end_time',
        'late_grace_minutes',
        'work_days',
        'is_active',
    ];

    protected $attributes = ['is_active' => true];

    protected function casts(): array
    {
        return [
            'capacity' => 'integer',
            'late_grace_minutes' => 'integer',
            'work_days' => 'array',
            'is_active' => 'boolean',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function headSupervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'head_supervisor_id');
    }

    public function ojts(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'ojt');
    }

    public function dailyReports(): HasManyThrough
    {
        return $this->hasManyThrough(DailyReport::class, User::class, 'department_id', 'user_id');
    }

    public function approvedReports(): HasManyThrough
    {
        return $this->dailyReports()->where('approval_status', DailyReport::STATUS_APPROVED);
    }

    public function pendingReports(): HasManyThrough
    {
        return $this->dailyReports()->where('approval_status', DailyReport::STATUS_PENDING)->whereNotNull('summary');
    }

    public function lateReports(): HasManyThrough
    {
        return $this->dailyReports()->where('attendance_status', DailyReport::ATTENDANCE_LATE);
    }
}
