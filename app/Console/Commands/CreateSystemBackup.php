<?php

namespace App\Console\Commands;

use App\Models\SystemBackup;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class CreateSystemBackup extends Command
{
    protected $signature = 'system:backup';

    protected $description = 'Create a checksum-protected database backup';

    public function handle(): int
    {
        $disk = (string) config('operations.backup.disk');
        $path = Str::finish((string) config('operations.backup.path'), '/').'database-'.now()->format('Ymd-His').'.sql';
        $backup = SystemBackup::query()->create(['disk' => $disk, 'path' => $path, 'status' => SystemBackup::STATUS_RUNNING]);
        $temporaryPath = tempnam(sys_get_temp_dir(), 'ojt-backup-');

        try {
            if ($temporaryPath === false) {
                throw new \RuntimeException('Unable to create a temporary backup file.');
            }

            $connection = config('database.connections.'.config('database.default'));
            $result = Process::env(['MYSQL_PWD' => (string) $connection['password']])->timeout(600)->run([
                'mysqldump', '--single-transaction', '--quick', '--skip-lock-tables',
                '--host='.(string) $connection['host'], '--port='.(string) $connection['port'],
                '--user='.(string) $connection['username'],
                '--result-file='.$temporaryPath, (string) $connection['database'],
            ]);
            $result->throw();

            $stream = fopen($temporaryPath, 'rb');
            if ($stream === false || ! Storage::disk($disk)->put($path, $stream)) {
                throw new \RuntimeException('Unable to store the database backup.');
            }
            if (is_resource($stream)) {
                fclose($stream);
            }

            $backup->update([
                'status' => SystemBackup::STATUS_COMPLETED,
                'size' => Storage::disk($disk)->size($path),
                'checksum' => hash_file('sha256', $temporaryPath),
                'completed_at' => now(),
            ]);
            $this->pruneExpiredBackups($disk);
            $this->info("Backup created: {$path}");

            return self::SUCCESS;
        } catch (Throwable $exception) {
            report($exception);
            $backup->update(['status' => SystemBackup::STATUS_FAILED, 'failure_message' => Str::limit($exception->getMessage(), 2000)]);
            $this->error('Backup failed. Check the application log.');

            return self::FAILURE;
        } finally {
            if ($temporaryPath !== false && file_exists($temporaryPath)) {
                unlink($temporaryPath);
            }
        }
    }

    private function pruneExpiredBackups(string $disk): void
    {
        SystemBackup::query()
            ->where('disk', $disk)
            ->where('created_at', '<', now()->subDays((int) config('operations.backup.retention_days')))
            ->eachById(function (SystemBackup $expired): void {
                Storage::disk($expired->disk)->delete($expired->path);
                $expired->delete();
            });
    }
}
