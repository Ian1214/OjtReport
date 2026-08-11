<?php

namespace App\Models;

use App\Notifications\OjtAccountCreated;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Hidden;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Carbon;
use Laravel\Fortify\Contracts\PasskeyUser;
use Laravel\Fortify\PasskeyAuthenticatable;
use Laravel\Fortify\TwoFactorAuthenticatable;

/**
 * @property int $id
 * @property int|null $company_id
 * @property int|null $supervisor_id
 * @property string $role
 * @property bool $must_change_password
 * @property string $name
 * @property string|null $student_id
 * @property string|null $program
 * @property int|null $year
 * @property string|null $company
 * @property string|null $department
 * @property string|null $position
 * @property string|null $supervisor_name
 * @property int|null $required_hours
 * @property Carbon|null $start_date
 * @property Carbon|null $end_date
 * @property string $email
 * @property Carbon|null $email_verified_at
 * @property Carbon|null $terms_accepted_at
 * @property Carbon|null $last_seen_at
 * @property string $timezone
 * @property array<string, bool|string>|null $preferences
 * @property string $password
 * @property string|null $remember_token
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read User|null $assignedSupervisor
 */
#[Fillable([
    'name',
    'company_id',
    'supervisor_id',
    'role',
    'must_change_password',
    'student_id',
    'program',
    'year',
    'company',
    'department',
    'position',
    'supervisor_name',
    'required_hours',
    'start_date',
    'end_date',
    'email',
    'password',
    'terms_accepted_at',
    'timezone',
    'preferences',
])]
#[Hidden([
    'password',
    'remember_token',
])]
class User extends Authenticatable implements PasskeyUser
{
    use HasFactory, Notifiable, PasskeyAuthenticatable, SoftDeletes, TwoFactorAuthenticatable;

    /** @var array<string, mixed> */
    protected $attributes = [
        'timezone' => 'Asia/Manila',
    ];

    public const ONLINE_WINDOW_SECONDS = 120;

    /** @var list<string> */
    public const SUPPORTED_TIMEZONES = [
        'Asia/Manila',
        'Asia/Singapore',
        'Asia/Tokyo',
        'UTC',
    ];

    /** @var array<string, string> */
    public const SUPPORTED_DATE_FORMATS = [
        'month_first' => 'Aug 11, 2026',
        'day_first' => '11 Aug 2026',
        'iso' => '2026-08-11',
    ];

    /** @var array<string, string> */
    public const SUPPORTED_INTERFACE_DENSITIES = [
        'comfortable' => 'Comfortable',
        'compact' => 'Compact',
    ];

    /** @var array<string, bool|string> */
    public const DEFAULT_PREFERENCES = [
        'date_format' => 'month_first',
        'interface_density' => 'comfortable',
        'reduce_motion' => false,
        'high_contrast' => false,
        'report_updates' => true,
        'attendance_updates' => true,
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'terms_accepted_at' => 'datetime',
            'last_seen_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
            'start_date' => 'date',
            'end_date' => 'date',
            'preferences' => 'array',
        ];
    }

    /**
     * @return array<string, bool|string>
     */
    public function resolvedPreferences(): array
    {
        return array_replace(self::DEFAULT_PREFERENCES, $this->preferences ?? []);
    }

    public function wantsNotification(string $preference): bool
    {
        return (bool) ($this->resolvedPreferences()[$preference] ?? true);
    }

    public function dailyReports(): HasMany
    {
        return $this->hasMany(DailyReport::class);
    }

    public function leaveRequests(): HasMany
    {
        return $this->hasMany(LeaveRequest::class);
    }

    public function dtrSubmissions(): HasMany
    {
        return $this->hasMany(DtrSubmission::class);
    }

    public function completionCertificates(): HasMany
    {
        return $this->hasMany(CompletionCertificate::class);
    }

    public function supervisedCompletionCertificates(): HasMany
    {
        return $this->hasMany(CompletionCertificate::class, 'supervisor_id');
    }

    public function attendanceCorrectionRequests(): HasMany
    {
        return $this->hasMany(AttendanceCorrectionRequest::class, 'requested_by');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class, 'actor_id');
    }

    public function accountSetupDeliveries(): HasMany
    {
        return $this->hasMany(AccountSetupDelivery::class);
    }

    public function latestAccountSetupDelivery(): HasOne
    {
        return $this->hasOne(AccountSetupDelivery::class)->latestOfMany();
    }

    public function approvedDailyReports(): HasMany
    {
        return $this->hasMany(DailyReport::class)
            ->where('approval_status', DailyReport::STATUS_APPROVED);
    }

    public function syncCompletionFromApprovedReports(): void
    {
        $approvedHours = (float) $this->approvedDailyReports()->sum('total_hours');

        $this->update([
            'end_date' => $approvedHours >= (float) $this->required_hours
                ? $this->approvedDailyReports()->max('report_date')
                : null,
        ]);
    }

    public function assignedSupervisor(): BelongsTo
    {
        return $this->belongsTo(self::class, 'supervisor_id');
    }

    public function assignedOjts(): HasMany
    {
        return $this->hasMany(self::class, 'supervisor_id')->where('role', 'ojt');
    }

    public function assignedTasks(): HasMany
    {
        return $this->hasMany(OjtTask::class, 'ojt_id');
    }

    public function createdTasks(): HasMany
    {
        return $this->hasMany(OjtTask::class, 'supervisor_id');
    }

    public function sentDirectMessages(): HasMany
    {
        return $this->hasMany(DirectMessage::class, 'sender_id');
    }

    public function receivedDirectMessages(): HasMany
    {
        return $this->hasMany(DirectMessage::class, 'recipient_id');
    }

    public function companyRecord(): BelongsTo
    {
        return $this->belongsTo(Company::class, 'company_id');
    }

    public function isCompanyAdmin(): bool
    {
        return $this->role === 'company_admin';
    }

    public function isSupervisor(): bool
    {
        return $this->role === 'supervisor';
    }

    public function isOnline(): bool
    {
        return $this->last_seen_at?->greaterThanOrEqualTo(
            now()->subSeconds(self::ONLINE_WINDOW_SECONDS),
        ) ?? false;
    }

    public function sendPasswordResetNotification($token): void
    {
        $delivery = $this->company_id === null
            ? null
            : $this->accountSetupDeliveries()->create([
                'company_id' => $this->company_id,
                'recipient_email' => $this->email,
                'queued_at' => now(),
            ]);

        $this->notify(new OjtAccountCreated(
            companyName: $this->company ?? config('app.name'),
            token: $token,
            deliveryId: $delivery?->id,
        ));
    }
}
