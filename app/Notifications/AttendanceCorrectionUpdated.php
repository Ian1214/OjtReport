<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
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

        return ['database'];
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
