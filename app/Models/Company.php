<?php

namespace App\Models;

use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Collection;

/**
 * @property int $id
 * @property string $name
 * @property string $work_start_time
 * @property int $late_grace_minutes
 * @property string $timezone
 * @property list<int>|null $work_days
 * @property string $attendance_verification_mode
 * @property string|null $attendance_latitude
 * @property string|null $attendance_longitude
 * @property int $attendance_radius_meters
 * @property-read Collection<int, CompanyHoliday> $holidays
 */
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
        'attendance_verification_mode',
        'attendance_latitude',
        'attendance_longitude',
        'attendance_radius_meters',
    ];

    protected function casts(): array
    {
        return [
            'late_grace_minutes' => 'integer',
            'work_days' => 'array',
            'attendance_latitude' => 'decimal:7',
            'attendance_longitude' => 'decimal:7',
            'attendance_radius_meters' => 'integer',
        ];
    }

    /** @return Attribute<string|null, string|null> */
    protected function workStartTime(): Attribute
    {
        return Attribute::make(
            set: fn (?string $value): ?string => self::normalizeTime($value),
        );
    }

    private static function normalizeTime(?string $value): ?string
    {
        if ($value === null || $value === '') {
            return $value;
        }

        return preg_match('/^\d{2}:\d{2}$/', $value) === 1 ? "{$value}:00" : $value;
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

    public function completionCertificates(): HasMany
    {
        return $this->hasMany(CompletionCertificate::class);
    }

    public function documents(): HasMany
    {
        return $this->hasMany(Document::class);
    }

    public function departments(): HasMany
    {
        return $this->hasMany(Department::class);
    }

    public function isWorkDay(\DateTimeInterface $date): bool
    {
        /** @var list<int|string> $configuredWorkDays */
        $configuredWorkDays = $this->work_days ?? [1, 2, 3, 4, 5];
        $workDays = array_map(static fn (int|string $day): int => (int) $day, $configuredWorkDays);
        $dayOfWeek = (int) $date->format('N');

        return in_array($dayOfWeek, $workDays, true)
            && ! $this->holidays()->whereDate('holiday_date', $date)->exists();
    }
}
