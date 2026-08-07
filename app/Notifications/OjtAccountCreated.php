<?php

namespace App\Notifications;

use App\Models\AccountSetupDelivery;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Log;
use Throwable;

class OjtAccountCreated extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        private readonly string $companyName,
        public readonly string $token,
        public readonly ?int $deliveryId = null,
    ) {
        $this->afterCommit();
    }

    public int $tries = 3;

    /** @var array<int, int> */
    public array $backoff = [10, 60, 300];

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Set up your OJT Report account')
            ->markdown('mail.ojt-account-created', [
                'companyName' => $this->companyName,
                'recipientName' => $notifiable->name,
                'email' => $notifiable->email,
                'setupUrl' => route('password.reset', [
                    'token' => $this->token,
                    'email' => $notifiable->getEmailForPasswordReset(),
                ]),
            ]);
    }

    public function failed(?Throwable $exception): void
    {
        if ($this->deliveryId !== null && $exception !== null) {
            AccountSetupDelivery::query()->find($this->deliveryId)?->markFailed($exception);
        }

        Log::error('Unable to send OJT password setup email.', [
            'company' => $this->companyName,
            'exception' => $exception?->getMessage(),
        ]);
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'company_name' => $this->companyName,
        ];
    }
}
