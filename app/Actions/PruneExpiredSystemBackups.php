<?php

namespace App\Actions;

use App\Models\PlatformSetting;
use App\Models\SystemBackup;
use Illuminate\Support\Facades\Storage;

class PruneExpiredSystemBackups
{
    public function handle(string $disk): void
    {
        $retentionDays = (int) PlatformSetting::resolvedPolicy()['backup_retention_days'];

        SystemBackup::query()
            ->where('disk', $disk)
            ->where('created_at', '<', now()->subDays($retentionDays))
            ->eachById(function (SystemBackup $expired): void {
                Storage::disk($expired->disk)->delete($expired->path);
                $expired->delete();
            });
    }
}
