<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\SystemBackup;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class OperationsController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $admin */
        $admin = $request->user();
        abort_unless($admin->isCompanyAdmin(), 403);

        return Inertia::render('company/operations', [
            'health' => [
                'database' => $this->databaseHealthy(),
                'queueDepth' => DB::table('jobs')->count(),
                'failedJobs' => DB::table('failed_jobs')->count(),
                'environment' => app()->environment(),
                'debug' => (bool) config('app.debug'),
                'https' => str_starts_with((string) config('app.url'), 'https://'),
                'mfaRequired' => (bool) config('operations.security.require_privileged_mfa'),
            ],
            'backups' => SystemBackup::query()->latest()->limit(10)->get()->map(fn (SystemBackup $backup): array => [
                'id' => $backup->id,
                'path' => $backup->path,
                'size' => $backup->size,
                'status' => $backup->status,
                'completedAt' => $backup->completed_at?->toIso8601String(),
                'verifiedAt' => $backup->verified_at?->toIso8601String(),
                'failureMessage' => $backup->failure_message,
            ]),
            'archivedOjts' => User::onlyTrashed()
                ->where('company_id', $admin->company_id)
                ->where('role', 'ojt')
                ->latest('deleted_at')
                ->limit(25)
                ->get(['id', 'name', 'email', 'deleted_at'])
                ->map(fn (User $ojt): array => [
                    'id' => $ojt->id,
                    'name' => $ojt->name,
                    'email' => $ojt->email,
                    'archivedAt' => $ojt->deleted_at?->toIso8601String(),
                ]),
        ]);
    }

    public function backup(Request $request): RedirectResponse
    {
        abort_unless($request->user()?->isCompanyAdmin(), 403);
        $exitCode = Artisan::call('system:backup');
        Inertia::flash('toast', [
            'type' => $exitCode === 0 ? 'success' : 'error',
            'message' => $exitCode === 0 ? 'Backup completed successfully.' : 'Backup failed. Check Operations for details.',
        ]);

        return back();
    }

    public function verify(Request $request, SystemBackup $systemBackup): RedirectResponse
    {
        abort_unless($request->user()?->isCompanyAdmin(), 403);
        $exitCode = Artisan::call('system:backup-verify', ['backup' => $systemBackup->id]);
        Inertia::flash('toast', [
            'type' => $exitCode === 0 ? 'success' : 'error',
            'message' => $exitCode === 0 ? 'Backup integrity verified.' : 'Backup verification failed.',
        ]);

        return back();
    }

    private function databaseHealthy(): bool
    {
        try {
            DB::select('select 1');

            return true;
        } catch (\Throwable) {
            return false;
        }
    }
}
