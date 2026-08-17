<?php

namespace App\Console\Commands;

use App\Jobs\RecordSystemHeartbeat;
use App\Services\SystemHealthService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;

#[Signature('system:health-monitor')]
#[Description('Record scheduler and queue heartbeats for system health monitoring')]
class MonitorSystemHealth extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(SystemHealthService $health): int
    {
        Cache::put(SystemHealthService::SCHEDULER_HEARTBEAT_KEY, now()->toIso8601String(), now()->addMinutes(10));
        RecordSystemHeartbeat::dispatch();
        Cache::put('system-health:last-snapshot', $health->snapshot(), now()->addMinutes(10));

        $this->info('System health heartbeat recorded and queue probe dispatched.');

        return self::SUCCESS;
    }
}
