<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class SystemHealthAlert extends Notification implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    public function __construct(private readonly array $failedChecks)
    {
        $this->afterCommit();
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('OJT Report system health alert')
            ->line('Automated monitoring detected degraded platform services.')
            ->line('Checks: '.implode(', ', $this->failedChecks))
            ->action('Open platform operations', route('platform.dashboard'))
            ->line('The system did not perform destructive automated recovery. Review the diagnostics before taking action.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'system_health_alert',
            'title' => 'System health needs attention',
            'message' => 'Degraded checks: '.implode(', ', $this->failedChecks),
            'url' => route('platform.dashboard', absolute: false),
        ];
    }
}
