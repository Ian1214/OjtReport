<?php

use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Storage;

test('production preflight passes with hardened persistent configuration', function () {
    Storage::fake('local');

    config([
        'app.env' => 'production',
        'app.debug' => false,
        'app.url' => 'https://ojt.example.com',
        'cache.default' => 'file',
        'logging.default' => 'single',
        'logging.channels.single.level' => 'warning',
        'mail.default' => 'array',
        'operations.backup.disk' => 'local',
        'operations.security.require_privileged_mfa' => true,
        'queue.default' => 'database',
        'session.driver' => 'database',
        'session.secure' => true,
    ]);

    expect(Artisan::call('system:preflight', ['--production' => true]))->toBe(0)
        ->and(Artisan::output())
        ->toContain('PASS Production environment')
        ->toContain('PASS Stable application hostname')
        ->toContain('PASS Secure session cookies');
});

test('production preflight rejects temporary tunnels and insecure runtime settings', function () {
    Storage::fake('local');

    config([
        'app.env' => 'local',
        'app.url' => 'https://temporary.trycloudflare.com',
        'session.driver' => 'array',
        'session.secure' => false,
    ]);

    expect(Artisan::call('system:preflight', ['--production' => true]))->toBe(1)
        ->and(Artisan::output())
        ->toContain('FAIL Production environment')
        ->toContain('FAIL Stable application hostname')
        ->toContain('FAIL Secure session cookies')
        ->toContain('FAIL Persistent session store');
});
