<?php

namespace App\Services;

use App\Models\SystemBackup;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Throwable;

class SystemHealthService
{
    public const SCHEDULER_HEARTBEAT_KEY = 'system-health:scheduler-heartbeat';

    public const QUEUE_HEARTBEAT_KEY = 'system-health:queue-heartbeat';

    /** @return array<string, mixed> */
    public function snapshot(): array
    {
        $database = $this->databaseCheck();
        $cache = $this->cacheCheck();
        $storage = $this->storageCheck();
        $scheduler = $this->heartbeat(self::SCHEDULER_HEARTBEAT_KEY);
        $queueHeartbeat = $this->heartbeat(self::QUEUE_HEARTBEAT_KEY);
        $queue = $this->queueCheck();

        return [
            'checkedAt' => now()->toIso8601String(),
            'database' => $database,
            'cache' => $cache,
            'storage' => $storage,
            'scheduler' => [
                ...$scheduler,
                'healthy' => $scheduler['ageSeconds'] !== null && $scheduler['ageSeconds'] <= 180,
                'remedy' => 'Start the scheduler service or run php artisan schedule:work.',
            ],
            'queue' => [
                ...$queue,
                ...$queueHeartbeat,
                'healthy' => $queue['reachable'] && $queue['failedJobs'] === 0
                    && $queueHeartbeat['ageSeconds'] !== null && $queueHeartbeat['ageSeconds'] <= 300,
                'remedy' => 'Start the queue worker, inspect failed jobs, then retry only verified safe jobs.',
            ],
            'mail' => [
                'healthy' => config('mail.default') !== 'log' && filled(config('mail.from.address')),
                'mailer' => (string) config('mail.default'),
                'remedy' => 'Configure a working mail transport and sender address, then clear the config cache.',
            ],
            'backup' => $this->lastBackup(),
            'configuration' => [
                'debugDisabled' => ! (bool) config('app.debug'),
                'https' => str_starts_with((string) config('app.url'), 'https://'),
                'asyncQueue' => config('queue.default') !== 'sync',
                'mfaRequired' => (bool) config('operations.security.require_privileged_mfa'),
            ],
        ];
    }

    /** @return array{healthy: bool, latencyMs: int|null, remedy: string} */
    private function databaseCheck(): array
    {
        $startedAt = hrtime(true);

        try {
            DB::select('select 1');

            return ['healthy' => true, 'latencyMs' => (int) ((hrtime(true) - $startedAt) / 1_000_000), 'remedy' => 'No action required.'];
        } catch (Throwable) {
            return ['healthy' => false, 'latencyMs' => null, 'remedy' => 'Check the MySQL container, DB_HOST credentials, and database health logs.'];
        }
    }

    /** @return array{healthy: bool, remedy: string} */
    private function cacheCheck(): array
    {
        try {
            $key = 'system-health:probe:'.str()->uuid();
            Cache::put($key, true, 10);
            $healthy = Cache::pull($key) === true;

            return ['healthy' => $healthy, 'remedy' => $healthy ? 'No action required.' : 'Check the configured cache store and permissions.'];
        } catch (Throwable) {
            return ['healthy' => false, 'remedy' => 'Check the configured cache store, database connection, and cache table.'];
        }
    }

    /** @return array{healthy: bool, disk: string, remedy: string} */
    private function storageCheck(): array
    {
        $disk = (string) config('operations.backup.disk');

        try {
            $path = 'health/.probe-'.str()->uuid();
            Storage::disk($disk)->put($path, now()->toIso8601String());
            Storage::disk($disk)->delete($path);

            return ['healthy' => true, 'disk' => $disk, 'remedy' => 'No action required.'];
        } catch (Throwable) {
            return ['healthy' => false, 'disk' => $disk, 'remedy' => 'Check storage permissions, free disk space, and the configured backup disk.'];
        }
    }

    /** @return array{reachable: bool, waitingJobs: int, failedJobs: int} */
    private function queueCheck(): array
    {
        try {
            return ['reachable' => true, 'waitingJobs' => DB::table('jobs')->count(), 'failedJobs' => DB::table('failed_jobs')->count()];
        } catch (Throwable) {
            return ['reachable' => false, 'waitingJobs' => 0, 'failedJobs' => 0];
        }
    }

    /** @return array{lastSeenAt: string|null, ageSeconds: int|null} */
    private function heartbeat(string $key): array
    {
        try {
            $lastSeenAt = Cache::get($key);

            if (! is_string($lastSeenAt)) {
                return ['lastSeenAt' => null, 'ageSeconds' => null];
            }

            $heartbeat = now()->parse($lastSeenAt);

            return ['lastSeenAt' => $heartbeat->toIso8601String(), 'ageSeconds' => max(0, (int) $heartbeat->diffInSeconds(now()))];
        } catch (Throwable) {
            return ['lastSeenAt' => null, 'ageSeconds' => null];
        }
    }

    /** @return array{healthy: bool, status: string, completedAt: string|null, verifiedAt: string|null, remedy: string} */
    private function lastBackup(): array
    {
        try {
            $backup = SystemBackup::query()->latest()->first();
            $healthy = $backup?->status === 'completed' && $backup->verified_at !== null
                && $backup->completed_at?->greaterThan(now()->subDays(2));

            return [
                'healthy' => $healthy,
                'status' => $backup?->status ?? 'missing',
                'completedAt' => $backup?->completed_at?->toIso8601String(),
                'verifiedAt' => $backup?->verified_at?->toIso8601String(),
                'remedy' => $healthy ? 'No action required.' : 'Run and verify a fresh system backup from this page.',
            ];
        } catch (Throwable) {
            return ['healthy' => false, 'status' => 'unavailable', 'completedAt' => null, 'verifiedAt' => null, 'remedy' => 'Restore database access before checking backups.'];
        }
    }
}
