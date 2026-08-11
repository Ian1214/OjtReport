<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CompletionCertificateIssued extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    public function __construct(
        private readonly int $certificateId,
        private readonly string $certificateNumber,
        private readonly string $companyName,
        private readonly string $allocatedHours,
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
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject("Your OJT completion certificate {$this->certificateNumber}")
            ->greeting("Hello {$notifiable->name},")
            ->line("{$this->companyName} has issued your certificate of completion for {$this->allocatedHours} rendered OJT hours.")
            ->line('Your company administrator and assigned supervisor have signed and finalized the certificate.')
            ->action('Open printable certificate', route('certificates.print', $this->certificateId))
            ->line('Open the certificate and select Print to save it as a PDF or print a paper copy.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'certificate_id' => $this->certificateId,
            'certificate_number' => $this->certificateNumber,
            'company_name' => $this->companyName,
            'allocated_hours' => $this->allocatedHours,
            'message' => "Certificate {$this->certificateNumber} is ready to print.",
        ];
    }
}
