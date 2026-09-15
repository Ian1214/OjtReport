<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\PlatformAnnouncement;
use App\Models\SystemBackup;
use App\Models\User;
use App\Services\PlatformAuditLogger;
use App\Services\SystemHealthService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class OperationsController extends Controller
{
    public function index(Request $request, SystemHealthService $health): Response
    {
        $this->authorizePlatform($request);

        return Inertia::render('platform/operations', [
            'health' => $health->snapshot(),
            'environment' => app()->environment(),
            'backups' => SystemBackup::query()->latest()->limit(15)->get()->map(fn (SystemBackup $backup): array => [
                'id' => $backup->id,
                'path' => $backup->path,
                'size' => $backup->size,
                'status' => $backup->status,
                'completedAt' => $backup->completed_at?->toIso8601String(),
                'verifiedAt' => $backup->verified_at?->toIso8601String(),
            ]),
            'failedJobs' => DB::table('failed_jobs')->latest('failed_at')->limit(25)->get()->map(fn (object $job): array => [
                'uuid' => $job->uuid,
                'connection' => $job->connection,
                'queue' => $job->queue,
                'failedAt' => $job->failed_at,
            ]),
            'announcements' => PlatformAnnouncement::query()->latest()->limit(15)->get()->map(fn (PlatformAnnouncement $announcement): array => [
                'id' => $announcement->id,
                'title' => $announcement->title,
                'message' => $announcement->message,
                'severity' => $announcement->severity,
                'startsAt' => $announcement->starts_at?->toIso8601String(),
                'endsAt' => $announcement->ends_at?->toIso8601String(),
                'publishedAt' => $announcement->published_at?->toIso8601String(),
            ]),
        ]);
    }

    public function backup(Request $request, PlatformAuditLogger $audit): RedirectResponse
    {
        $actor = $this->authorizePlatform($request);
        $exitCode = Artisan::call('system:backup');
        $audit->record($actor, 'backup.created', 'Triggered a system-wide database backup.', $request, properties: ['succeeded' => $exitCode === 0]);
        Inertia::flash('toast', [
            'type' => $exitCode === 0 ? 'success' : 'error',
            'message' => $exitCode === 0 ? 'System backup completed.' : 'System backup failed. Review the latest backup status.',
        ]);

        return back();
    }

    public function verify(Request $request, SystemBackup $systemBackup, PlatformAuditLogger $audit): RedirectResponse
    {
        $actor = $this->authorizePlatform($request);
        $exitCode = Artisan::call('system:backup-verify', ['backup' => $systemBackup->id]);
        $audit->record($actor, 'backup.verified', "Verified system backup #{$systemBackup->id}.", $request, $systemBackup, ['succeeded' => $exitCode === 0]);
        Inertia::flash('toast', [
            'type' => $exitCode === 0 ? 'success' : 'error',
            'message' => $exitCode === 0 ? 'Backup integrity verified.' : 'Backup verification failed.',
        ]);

        return back();
    }

    public function retryFailedJob(Request $request, string $uuid, PlatformAuditLogger $audit): RedirectResponse
    {
        $actor = $this->authorizePlatform($request);
        abort_unless(Str::isUuid($uuid) && DB::table('failed_jobs')->where('uuid', $uuid)->exists(), 404);
        $exitCode = Artisan::call('queue:retry', ['id' => [$uuid]]);
        $audit->record($actor, 'queue.failed_job_retried', 'Retried a failed background job.', $request, properties: ['job_uuid' => $uuid, 'succeeded' => $exitCode === 0]);
        Inertia::flash('toast', [
            'type' => $exitCode === 0 ? 'success' : 'error',
            'message' => $exitCode === 0 ? 'Failed job returned to the queue.' : 'The failed job could not be retried.',
        ]);

        return back();
    }

    public function forgetFailedJob(Request $request, string $uuid, PlatformAuditLogger $audit): RedirectResponse
    {
        $actor = $this->authorizePlatform($request);
        abort_unless(Str::isUuid($uuid) && DB::table('failed_jobs')->where('uuid', $uuid)->exists(), 404);
        $exitCode = Artisan::call('queue:forget', ['id' => $uuid]);
        $audit->record($actor, 'queue.failed_job_forgotten', 'Removed a failed job record.', $request, properties: ['job_uuid' => $uuid, 'succeeded' => $exitCode === 0]);
        Inertia::flash('toast', [
            'type' => $exitCode === 0 ? 'success' : 'error',
            'message' => $exitCode === 0 ? 'Failed job record removed.' : 'The failed job record could not be removed.',
        ]);

        return back();
    }

    private function authorizePlatform(Request $request): User
    {
        /** @var User|null $user */
        $user = $request->user();
        abort_unless($user?->isPlatformAdmin(), 403);

        return $user;
    }
}
