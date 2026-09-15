<?php

use App\Actions\PruneExpiredSystemBackups;
use App\Models\Company;
use App\Models\PlatformActivityLog;
use App\Models\PlatformAnnouncement;
use App\Models\PlatformSetting;
use App\Models\SystemBackup;
use App\Models\User;
use App\Notifications\SystemHealthAlert;
use App\Services\SystemHealthService;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

function platformAdministrator(): User
{
    return User::factory()->create([
        'company_id' => null,
        'company' => null,
        'role' => 'platform_admin',
    ]);
}

test('platform administrator can suspend a company and the action is audited', function () {
    $administrator = platformAdministrator();
    $company = Company::factory()->create();

    $this->actingAs($administrator)
        ->withSession(['auth.password_confirmed_at' => now()->timestamp])
        ->patch(route('platform.tenants.update', $company), [
            'status' => Company::STATUS_SUSPENDED,
            'reason' => 'Security review in progress.',
        ])
        ->assertRedirect();

    expect($company->refresh())
        ->status->toBe(Company::STATUS_SUSPENDED)
        ->status_reason->toBe('Security review in progress.')
        ->suspended_at->not->toBeNull();

    expect(PlatformActivityLog::query()->where('event', 'tenant.status_changed')->exists())->toBeTrue();
});

test('company users cannot access platform controls', function () {
    $company = Company::factory()->create();
    $companyAdmin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);

    $this->actingAs($companyAdmin)->get(route('platform.tenants.index'))->assertForbidden();
    $this->actingAs($companyAdmin)->get(route('platform.operations.index'))->assertForbidden();
    $this->actingAs($companyAdmin)->get(route('platform.activity-logs.index'))->assertForbidden();
});

test('users of suspended companies are signed out of existing sessions and cannot log in', function () {
    $company = Company::factory()->create(['status' => Company::STATUS_SUSPENDED]);
    $user = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);

    $this->actingAs($user)->get(route('dashboard'))->assertRedirect(route('login'));
    $this->assertGuest();

    $this->post(route('login'), ['email' => $user->email, 'password' => 'password'])
        ->assertSessionHasErrors('email');
});

test('operations page exposes safe failed job metadata without payload or exception', function () {
    $administrator = platformAdministrator();
    $uuid = (string) Str::uuid();
    DB::table('failed_jobs')->insert([
        'uuid' => $uuid,
        'connection' => 'database',
        'queue' => 'default',
        'payload' => json_encode(['private' => 'tenant secret']),
        'exception' => 'private stack trace',
        'failed_at' => now(),
    ]);

    $this->actingAs($administrator)
        ->get(route('platform.operations.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('platform/operations')
            ->where('failedJobs.0.uuid', $uuid)
            ->missing('failedJobs.0.payload')
            ->missing('failedJobs.0.exception'));
});

test('platform announcement is visible to signed in users during its window', function () {
    $administrator = platformAdministrator();
    $company = Company::factory()->create();
    $companyUser = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);

    $this->actingAs($administrator)->post(route('platform.announcements.store'), [
        'title' => 'Scheduled maintenance',
        'message' => 'The service will restart after office hours.',
        'severity' => 'warning',
        'starts_at' => now()->subMinute()->toDateTimeString(),
        'ends_at' => now()->addHour()->toDateTimeString(),
    ])->assertRedirect();

    expect(PlatformAnnouncement::query()->count())->toBe(1);

    $this->actingAs($companyUser)
        ->get(route('dashboard'))
        ->assertInertia(fn (Assert $page) => $page
            ->where('platformAnnouncement.title', 'Scheduled maintenance')
            ->where('platformAnnouncement.severity', 'warning'));
});

test('backup pruning follows the platform retention policy', function () {
    Storage::fake('local');
    PlatformSetting::query()->create([
        'key' => PlatformSetting::POLICY_KEY,
        'value' => [...PlatformSetting::DEFAULT_POLICY, 'backup_retention_days' => 14],
    ]);
    $expired = SystemBackup::query()->create([
        'disk' => 'local',
        'path' => 'backups/expired.sql',
        'status' => SystemBackup::STATUS_COMPLETED,
    ]);
    $expired->forceFill(['created_at' => now()->subDays(15)])->save();
    $retained = SystemBackup::query()->create([
        'disk' => 'local',
        'path' => 'backups/retained.sql',
        'status' => SystemBackup::STATUS_COMPLETED,
    ]);
    $retained->forceFill(['created_at' => now()->subDays(13)])->save();
    Storage::disk('local')->put($expired->path, 'expired');
    Storage::disk('local')->put($retained->path, 'retained');

    app(PruneExpiredSystemBackups::class)->handle('local');

    expect(SystemBackup::query()->find($expired->id))->toBeNull()
        ->and(SystemBackup::query()->find($retained->id))->not->toBeNull();
    Storage::disk('local')->assertMissing($expired->path);
    Storage::disk('local')->assertExists($retained->path);
});

test('health monitoring alerts the configured operational email', function () {
    Notification::fake();
    Queue::fake();
    Cache::flush();
    PlatformSetting::query()->create([
        'key' => PlatformSetting::POLICY_KEY,
        'value' => [...PlatformSetting::DEFAULT_POLICY, 'health_alert_email' => 'health@example.com'],
    ]);
    $health = Mockery::mock(SystemHealthService::class);
    $health->shouldReceive('snapshot')->once()->andReturn([
        'database' => ['healthy' => false],
        'cache' => ['healthy' => true],
        'storage' => ['healthy' => true],
        'scheduler' => ['healthy' => true],
        'queue' => ['healthy' => true],
        'mail' => ['healthy' => true],
        'backup' => ['healthy' => true],
    ]);
    app()->instance(SystemHealthService::class, $health);

    expect(Artisan::call('system:health-monitor'))->toBe(0);

    Notification::assertSentOnDemand(
        SystemHealthAlert::class,
        fn (SystemHealthAlert $notification, array $channels, object $notifiable): bool => $channels === ['mail']
            && $notifiable->routeNotificationFor('mail') === 'health@example.com',
    );
});
