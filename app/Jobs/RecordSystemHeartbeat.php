<?php

namespace App\Jobs;

use App\Services\SystemHealthService;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Cache;
use Throwable;

class RecordSystemHeartbeat implements ShouldQueue
{
    use Queueable;

    public int $tries = 3;

    /** @var list<int> */
    public array $backoff = [5, 15, 60];

    /**
     * Execute the job.
     */
    public function handle(): void
    {
        Cache::put(SystemHealthService::QUEUE_HEARTBEAT_KEY, now()->toIso8601String(), now()->addMinutes(10));
    }

    public function failed(?Throwable $exception): void
    {
        logger()->error('Queue heartbeat failed.', ['exception' => $exception?->getMessage()]);
    }
}
