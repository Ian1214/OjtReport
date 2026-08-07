<?php

namespace App\Console\Commands;

use App\Models\SystemBackup;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

class VerifySystemBackup extends Command
{
    protected $signature = 'system:backup-verify {backup?}';

    protected $description = 'Verify a stored backup checksum and SQL signature';

    public function handle(): int
    {
        $backup = $this->argument('backup')
            ? SystemBackup::query()->find($this->argument('backup'))
            : SystemBackup::query()->where('status', SystemBackup::STATUS_COMPLETED)->latest('completed_at')->first();

        if ($backup === null || ! Storage::disk($backup->disk)->exists($backup->path)) {
            $this->error('No readable backup was found.');

            return self::FAILURE;
        }

        $stream = Storage::disk($backup->disk)->readStream($backup->path);
        if ($stream === false) {
            $this->error('The backup could not be opened.');

            return self::FAILURE;
        }
        $context = hash_init('sha256');
        hash_update_stream($context, $stream);
        fclose($stream);
        $checksum = hash_final($context);

        if (! hash_equals((string) $backup->checksum, $checksum)) {
            $this->error('Backup checksum mismatch.');

            return self::FAILURE;
        }

        $backup->update(['verified_at' => now()]);
        $this->info('Backup integrity verified.');

        return self::SUCCESS;
    }
}
