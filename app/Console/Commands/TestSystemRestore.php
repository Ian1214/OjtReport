<?php

namespace App\Console\Commands;

use App\Models\SystemBackup;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Process;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class TestSystemRestore extends Command
{
    protected $signature = 'system:restore-test {backup?}';

    protected $description = 'Restore the latest backup into an isolated temporary database and verify core tables';

    public function handle(): int
    {
        $backup = $this->argument('backup')
            ? SystemBackup::query()->find($this->argument('backup'))
            : SystemBackup::query()->where('status', SystemBackup::STATUS_COMPLETED)->latest('completed_at')->first();

        if ($backup === null || ! Storage::disk($backup->disk)->exists($backup->path)) {
            $this->error('No readable backup was found.');

            return self::FAILURE;
        }

        $connection = config('database.connections.'.config('database.default'));
        if (($connection['driver'] ?? null) !== 'mysql') {
            $this->error('Automated restore testing currently requires MySQL.');

            return self::FAILURE;
        }
        $connection['username'] = config('operations.restore_test.username');
        $connection['password'] = config('operations.restore_test.password');

        $database = 'ojt_restore_check_'.Str::lower(Str::random(10));
        $temporaryPath = tempnam(sys_get_temp_dir(), 'ojt-restore-');

        try {
            if ($temporaryPath === false) {
                throw new \RuntimeException('Unable to allocate a temporary restore file.');
            }
            $stream = Storage::disk($backup->disk)->readStream($backup->path);
            $destination = fopen($temporaryPath, 'wb');
            if ($stream === false || $destination === false) {
                throw new \RuntimeException('Unable to read the backup artifact.');
            }
            stream_copy_to_stream($stream, $destination);
            fclose($stream);
            fclose($destination);

            $mysql = $this->mysqlCommand($connection);
            Process::env(['MYSQL_PWD' => (string) $connection['password']])->timeout(30)->run([...$mysql, '--execute=CREATE DATABASE `'.$database.'`'])->throw();
            Process::env(['MYSQL_PWD' => (string) $connection['password']])->timeout(600)->run([...$mysql, $database, '--execute=source '.$temporaryPath])->throw();
            $result = Process::env(['MYSQL_PWD' => (string) $connection['password']])->timeout(30)->run([...$mysql, '--batch', '--skip-column-names', $database, '--execute=SELECT COUNT(*) FROM migrations; SELECT COUNT(*) FROM users;']);
            $result->throw();

            $backup->update(['verified_at' => now()]);
            $this->info('Restore test passed in an isolated temporary database.');

            return self::SUCCESS;
        } catch (\Throwable $exception) {
            report($exception);
            $this->error('Restore test failed. Check the application log.');

            return self::FAILURE;
        } finally {
            Process::env(['MYSQL_PWD' => (string) $connection['password']])->timeout(30)->run([...$this->mysqlCommand($connection), '--execute=DROP DATABASE IF EXISTS `'.$database.'`']);
            if ($temporaryPath !== false && file_exists($temporaryPath)) {
                unlink($temporaryPath);
            }
        }
    }

    /** @param array<string, mixed> $connection */
    private function mysqlCommand(array $connection): array
    {
        return [
            'mysql', '--host='.(string) $connection['host'], '--port='.(string) $connection['port'],
            '--user='.(string) $connection['username'],
        ];
    }
}
