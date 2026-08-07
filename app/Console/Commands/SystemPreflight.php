<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class SystemPreflight extends Command
{
    protected $signature = 'system:preflight';

    protected $description = 'Check production-critical application configuration and services';

    public function handle(): int
    {
        $checks = [
            'Application key configured' => filled(config('app.key')),
            'Debug disabled' => ! config('app.debug'),
            'HTTPS application URL' => str_starts_with((string) config('app.url'), 'https://'),
            'Queue is asynchronous' => config('queue.default') !== 'sync',
            'Mail is not log-only' => config('mail.default') !== 'log',
            'Privileged MFA enforced' => (bool) config('operations.security.require_privileged_mfa'),
        ];

        try {
            DB::select('select 1');
            $checks['Database reachable'] = true;
        } catch (\Throwable) {
            $checks['Database reachable'] = false;
        }
        try {
            Cache::put('system-preflight', true, 10);
            $checks['Cache writable'] = Cache::pull('system-preflight') === true;
        } catch (\Throwable) {
            $checks['Cache writable'] = false;
        }
        try {
            Storage::disk(config('operations.backup.disk'))->put('backups/.preflight', now()->toIso8601String());
            Storage::disk(config('operations.backup.disk'))->delete('backups/.preflight');
            $checks['Backup disk writable'] = true;
        } catch (\Throwable) {
            $checks['Backup disk writable'] = false;
        }

        foreach ($checks as $label => $passed) {
            $this->{$passed ? 'info' : 'error'}(($passed ? 'PASS ' : 'FAIL ').$label);
        }

        return in_array(false, $checks, true) ? self::FAILURE : self::SUCCESS;
    }
}
