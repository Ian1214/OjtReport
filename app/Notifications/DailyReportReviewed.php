<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class DailyReportReviewed extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        private readonly int $reportId,
        private readonly string $reportDate,
        private readonly string $status,
        private readonly string $reviewerName,
        private readonly ?string $rejectionReason = null,
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
        if ($notifiable instanceof User && ! $notifiable->wantsNotification('report_updates')) {
            return [];
        }

        return $notifiable instanceof User && $notifiable->wantsNotification('email_workflow_updates')
            ? ['database', 'mail']
            : ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Daily report {$this->status}")
            ->greeting("Hello {$notifiable->name},")
            ->line("Your daily report for {$this->reportDate} was {$this->status} by {$this->reviewerName}.")
            ->when($this->rejectionReason !== null, fn (MailMessage $mail): MailMessage => $mail->line("Feedback: {$this->rejectionReason}"))
            ->action('Open daily reports', route('reports.index'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'report_id' => $this->reportId,
            'report_date' => $this->reportDate,
            'status' => $this->status,
            'reviewer_name' => $this->reviewerName,
            'rejection_reason' => $this->rejectionReason,
        ];
    }
}
