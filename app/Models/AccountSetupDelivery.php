<?php

namespace App\Models;

use Database\Factories\AccountSetupDeliveryFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Throwable;

/**
 * @property int $id
 * @property int $company_id
 * @property int $user_id
 * @property string $recipient_email
 * @property string $status
 * @property Carbon $queued_at
 * @property Carbon|null $sent_at
 * @property Carbon|null $failed_at
 * @property string|null $failure_reason
 */
class AccountSetupDelivery extends Model
{
    /** @use HasFactory<AccountSetupDeliveryFactory> */
    use HasFactory;

    public const STATUS_QUEUED = 'queued';

    public const STATUS_SENT = 'sent';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'company_id',
        'user_id',
        'recipient_email',
        'status',
        'queued_at',
        'sent_at',
        'failed_at',
        'failure_reason',
    ];

    protected $attributes = [
        'status' => self::STATUS_QUEUED,
    ];

    protected function casts(): array
    {
        return [
            'queued_at' => 'datetime',
            'sent_at' => 'datetime',
            'failed_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function markSent(): void
    {
        $this->update([
            'status' => self::STATUS_SENT,
            'sent_at' => now(),
            'failed_at' => null,
            'failure_reason' => null,
        ]);
    }

    public function markFailed(Throwable $exception): void
    {
        $this->update([
            'status' => self::STATUS_FAILED,
            'failed_at' => now(),
            'failure_reason' => self::safeFailureReason($exception),
        ]);
    }

    private static function safeFailureReason(Throwable $exception): string
    {
        $message = Str::lower($exception->getMessage());

        if (Str::contains($message, ['authenticate', 'credentials', 'password not accepted', 'code "535"'])) {
            return 'Gmail rejected the sender credentials. Update the Gmail address and app password, then resend the setup link.';
        }

        if (Str::contains($message, ['connection refused', 'could not connect', 'timed out', 'getaddrinfo', 'network'])) {
            return 'The system could not connect to Gmail. Check the internet connection and SMTP settings, then resend the setup link.';
        }

        return 'The mail server did not accept the setup email. Check the mail configuration and resend the setup link.';
    }
}
