<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;

class PruneArchivedUsers extends Command
{
    protected $signature = 'privacy:prune-archives {--force : Permanently erase expired archived accounts}';

    protected $description = 'Permanently erase OJT accounts after the configured retention period';

    public function handle(): int
    {
        if (! $this->option('force')) {
            $this->error('Use --force to confirm permanent erasure.');

            return self::FAILURE;
        }

        $count = User::onlyTrashed()->where('role', 'ojt')
            ->where('deleted_at', '<=', now()->subDays((int) config('operations.privacy.archive_retention_days')))
            ->forceDelete();
        $this->info("Permanently erased {$count} expired archived account(s).");

        return self::SUCCESS;
    }
}
