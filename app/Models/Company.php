<?php

namespace App\Models;

use Database\Factories\CompanyFactory;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;

/**
 * @property int $id
 * @property string $name
 * @property string|null $legal_name
 * @property string|null $logo_path
 * @property array<string, mixed>|null $settings
 * @property string $status
 * @property Carbon|null $suspended_at
 * @property string|null $status_reason
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

    public const STATUS_ACTIVE = 'active';

    public const STATUS_SUSPENDED = 'suspended';

    public const STATUS_ARCHIVED = 'archived';

    /** @var list<string> */
    public const STATUSES = [self::STATUS_ACTIVE, self::STATUS_SUSPENDED, self::STATUS_ARCHIVED];

    /** @var array<string, bool|int|string> */
    public const DEFAULT_SETTINGS = [
        'break_start_time' => '12:00',
        'break_end_time' => '13:00',
        'break_minutes' => 60,
        'earliest_time_in' => '06:00',
        'latest_time_out' => '22:00',
        'overtime_requires_approval' => true,
        'holiday_attendance_allowed' => false,
        'digest_time' => '08:00',
        'quiet_hours_start' => '20:00',
        'quiet_hours_end' => '07:00',
        'email_notifications' => true,
        'escalation_email' => '',
        'message_retention_days' => 365,
        'location_retention_days' => 90,
        'audit_retention_days' => 730,
        'archive_grace_days' => 365,
        'default_required_hours' => 486,
        'default_program' => '',
        'default_year_level' => 4,
        'certificate_number_prefix' => 'CERT',
        'session_timeout_minutes' => 120,
        'allowed_email_domains' => '',
        'require_admin_mfa' => false,
        'require_supervisor_mfa' => false,
    ];

    protected $fillable = [
        'name',
        'legal_name',
        'logo_path',
        'address',
        'contact_email',
        'contact_phone',
        'authorized_signatory_name',
        'authorized_signatory_title',
        'settings',
        'status',
        'suspended_at',
        'status_reason',
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
            'suspended_at' => 'datetime',
            'work_days' => 'array',
            'attendance_latitude' => 'decimal:7',
            'attendance_longitude' => 'decimal:7',
            'attendance_radius_meters' => 'integer',
            'settings' => 'array',
        ];
    }

    /** @return array<string, mixed> */
    public function resolvedSettings(): array
    {
        return array_replace(self::DEFAULT_SETTINGS, $this->settings ?? []);
    }

    /** @return list<string> */
    public function allowedStaffEmailDomains(): array
    {
        $configuredDomains = (string) $this->resolvedSettings()['allowed_email_domains'];

        return collect(explode(',', $configuredDomains))
            ->map(fn (string $domain): string => ltrim(strtolower(trim($domain)), '@'))
            ->filter(fn (string $domain): bool => $domain !== '')
            ->unique()
            ->values()
            ->all();
    }

    public function allowsStaffEmail(string $email): bool
    {
        $allowedDomains = $this->allowedStaffEmailDomains();

        if ($allowedDomains === []) {
            return true;
        }

        $emailDomain = str($email)->afterLast('@')->lower()->toString();

        return in_array($emailDomain, $allowedDomains, true);
    }

    public function isActive(): bool
    {
        return $this->status === self::STATUS_ACTIVE;
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
