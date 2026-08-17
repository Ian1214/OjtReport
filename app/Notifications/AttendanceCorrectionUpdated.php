<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AttendanceCorrectionUpdated extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        private readonly int $correctionId,
        private readonly string $reportDate,
        private readonly string $title,
        private readonly string $message,
        private readonly string $status,
    ) {
        $this->afterCommit();
    }

    public int $tries = 3;

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        if ($notifiable instanceof User && ! $notifiable->wantsNotification('attendance_updates')) {
            return [];
        }

        return $notifiable instanceof User && $notifiable->wantsNotification('email_workflow_updates')
            ? ['database', 'mail']
            : ['database'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject($this->title)
            ->greeting("Hello {$notifiable->name},")
            ->line($this->message)
            ->line("Attendance date: {$this->reportDate}")
            ->action('Open time corrections', route('attendance-corrections.index'));
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'correction_id' => $this->correctionId,
            'report_date' => $this->reportDate,
            'title' => $this->title,
            'message' => $this->message,
            'status' => $this->status,
        ];
    }
}
