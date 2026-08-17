<?php

namespace App\Console\Commands;

use App\Jobs\RecordSystemHeartbeat;
use App\Models\User;
use App\Notifications\SystemHealthAlert;
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
        $snapshot = $health->snapshot();
        Cache::put('system-health:last-snapshot', $snapshot, now()->addMinutes(10));

        $failedChecks = collect(['database', 'cache', 'storage', 'scheduler', 'queue', 'mail', 'backup'])
            ->reject(fn (string $check): bool => (bool) data_get($snapshot, "{$check}.healthy"))
            ->values()
            ->all();

        if ($failedChecks !== [] && Cache::add('system-health:alert:'.sha1(implode('|', $failedChecks)), true, now()->addHour())) {
            User::query()->where('role', 'platform_admin')->where('account_active', true)->chunkById(100, function ($administrators) use ($failedChecks): void {
                foreach ($administrators as $administrator) {
                    $administrator->notify(new SystemHealthAlert($failedChecks));
                }
            });
        }

        $this->info('System health heartbeat recorded and queue probe dispatched.');

        return self::SUCCESS;
    }
}
