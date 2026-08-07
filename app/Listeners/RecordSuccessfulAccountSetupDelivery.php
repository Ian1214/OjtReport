<?php

namespace App\Listeners;

use App\Models\AccountSetupDelivery;
use App\Notifications\OjtAccountCreated;
use Illuminate\Notifications\Events\NotificationSent;

class RecordSuccessfulAccountSetupDelivery
{
    public function handle(NotificationSent $event): void
    {
        if ($event->channel !== 'mail' || ! $event->notification instanceof OjtAccountCreated) {
            return;
        }

        if ($event->notification->deliveryId === null) {
            return;
        }

        AccountSetupDelivery::query()
            ->whereKey($event->notification->deliveryId)
            ->where('user_id', $event->notifiable->getKey())
            ->first()
            ?->markSent();
    }
}
