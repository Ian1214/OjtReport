<?php

namespace App\Console\Commands;

use App\Models\User;
use App\Notifications\DailyNotificationDigest;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('notifications:send-daily-digests')]
#[Description('Queue daily email summaries for users who opted in and have unread notifications')]
class SendDailyNotificationDigests extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $queued = 0;

        User::query()
            ->where('account_active', true)
            ->chunkById(200, function ($users) use (&$queued): void {
                foreach ($users as $user) {
                    /** @var User $user */
                    if (! $user->wantsNotification('daily_digest')) {
                        continue;
                    }

                    $unreadCount = $user->unreadNotifications()->count();

                    if ($unreadCount === 0) {
                        continue;
                    }

                    $user->notify(new DailyNotificationDigest($unreadCount));
                    $queued++;
                }
            });

        $this->info("Queued {$queued} daily notification digests.");

        return self::SUCCESS;
    }
}
