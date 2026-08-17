<?php

use App\Services\SystemHealthService;
use Illuminate\Support\Facades\Cache;

test('public status exposes only safe service availability data', function () {
    Cache::put(SystemHealthService::SCHEDULER_HEARTBEAT_KEY, now()->toIso8601String());
    Cache::put(SystemHealthService::QUEUE_HEARTBEAT_KEY, now()->toIso8601String());

    $this->getJson(route('status'))
        ->assertSuccessful()
        ->assertJsonPath('status', 'operational')
        ->assertJsonStructure(['status', 'checked_at', 'checks' => ['database', 'cache', 'storage', 'scheduler', 'queue']])
        ->assertJsonMissingPath('checks.mailer');
});
