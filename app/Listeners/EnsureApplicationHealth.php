<?php

namespace App\Listeners;

use Illuminate\Foundation\Events\DiagnosingHealth;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

class EnsureApplicationHealth
{
    public function handle(DiagnosingHealth $event): void
    {
        DB::select('select 1');
        Cache::put('health:last_check', now()->timestamp, 30);

        $disk = Storage::disk(config('operations.backup.disk'));
        $path = 'health/.write-test';
        $disk->put($path, 'ok');
        $disk->delete($path);
    }
}
