<?php

namespace App\Listeners;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Logout;
use Illuminate\Support\Str;

class RecordAuthenticationActivity
{
    public function handle(Failed|Logout $event): void
    {
        if (! $event->user instanceof User || $event->user->company_id === null) {
            return;
        }

        $isFailed = $event instanceof Failed;
        ActivityLog::query()->create([
            'company_id' => $event->user->company_id,
            'actor_id' => $event->user->id,
            'event' => $isFailed ? 'auth.failed' : 'auth.logout',
            'description' => $event->user->name.($isFailed ? ' had a failed sign-in attempt.' : ' signed out.'),
            'properties' => $isFailed ? ['guard' => $event->guard] : null,
            'ip_address' => request()->ip(),
            'user_agent' => Str::limit((string) request()->userAgent(), 500, ''),
        ]);
    }
}
