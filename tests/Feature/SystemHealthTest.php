<?php

use App\Jobs\RecordSystemHeartbeat;
use App\Services\SystemHealthService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;

test('the health monitor records scheduler and queue heartbeats', function () {
    config([
        'cache.default' => 'array',
        'filesystems.disks.local.root' => storage_path('framework/testing/disks/local'),
        'operations.backup.disk' => 'local',
    ]);
    Storage::fake('local');
    Queue::fake();

    $this->artisan('system:health-monitor')->assertSuccessful();

    expect(Cache::get(SystemHealthService::SCHEDULER_HEARTBEAT_KEY))->toBeString();
    Queue::assertPushed(RecordSystemHeartbeat::class);

    (new RecordSystemHeartbeat)->handle();
    $snapshot = app(SystemHealthService::class)->snapshot();

    expect($snapshot['database']['healthy'])->toBeTrue()
        ->and($snapshot['cache']['healthy'])->toBeTrue()
        ->and($snapshot['storage']['healthy'])->toBeTrue()
        ->and($snapshot['scheduler']['healthy'])->toBeTrue()
        ->and($snapshot['queue']['healthy'])->toBeTrue();
});
