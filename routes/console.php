<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Schedule::command('system:backup')->dailyAt('01:30')->withoutOverlapping(120);
Schedule::command('system:backup-verify')->dailyAt('03:00')->withoutOverlapping(60);
Schedule::command('system:restore-test')->weeklyOn(1, '03:30')->withoutOverlapping(120);
Schedule::command('ojt:send-operational-reminders')->dailyAt('09:00')->withoutOverlapping(30);
Schedule::command('system:health-monitor')->everyMinute()->withoutOverlapping(2);
Schedule::command('notifications:send-daily-digests')->dailyAt('07:00')->withoutOverlapping(30);

if (config('operations.privacy.automatic_pruning')) {
    Schedule::command('privacy:prune-archives --force')->dailyAt('02:30')->withoutOverlapping(60);
}
