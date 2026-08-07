<?php

namespace App\Models;

use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    /** @use HasFactory<CompanyFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'work_start_time',
        'late_grace_minutes',
        'timezone',
        'work_days',
    ];

    protected function casts(): array
    {
        return [
            'late_grace_minutes' => 'integer',
            'work_days' => 'array',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function ojts(): HasMany
    {
        return $this->users()->where('role', 'ojt');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function accountSetupDeliveries(): HasMany
    {
        return $this->hasMany(AccountSetupDelivery::class);
    }

    public function holidays(): HasMany
    {
        return $this->hasMany(CompanyHoliday::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function isWorkDay(\DateTimeInterface $date): bool
    {
        $workDays = $this->work_days ?? [1, 2, 3, 4, 5];
        $dayOfWeek = (int) $date->format('N');

        return in_array($dayOfWeek, $workDays, true)
            && ! $this->holidays()->whereDate('holiday_date', $date)->exists();
    }
}
