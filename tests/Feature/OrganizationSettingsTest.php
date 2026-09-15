<?php

use App\Models\Company;
use App\Models\PlatformSetting;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('a company administrator can update organization settings and branding', function () {
    Storage::fake('public');
    $company = Company::factory()->create();
    $admin = User::factory()->create(['role' => 'company_admin', 'company_id' => $company->id]);

    $payload = companySettingsPayload([
        'name' => 'Acme Internship Hub',
        'logo' => UploadedFile::fake()->image('logo.png'),
        'break_minutes' => 45,
        'session_timeout_minutes' => 60,
    ]);

    $this->actingAs($admin)
        ->post(route('organization-settings.update'), $payload)
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('organization-settings.edit'));

    $company->refresh();

    expect($company->name)->toBe('Acme Internship Hub')
        ->and($company->resolvedSettings()['break_minutes'])->toBe(45)
        ->and($company->resolvedSettings()['session_timeout_minutes'])->toBe(60)
        ->and($company->logo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($company->logo_path);
});

test('a school coordinator can update school oversight settings', function () {
    $school = School::factory()->create();
    $coordinator = User::factory()->create([
        'role' => 'school_coordinator',
        'company_id' => null,
        'school_id' => $school->id,
    ]);

    $this->actingAs($coordinator)
        ->post(route('organization-settings.update'), [
            'name' => 'Updated State University',
            'address' => 'Main Campus',
            'contact_email' => 'coordinator@example.edu',
            'contact_phone' => '123456',
            'email_progress_alerts' => true,
            'email_completion_alerts' => false,
            'digest_frequency' => 'weekly',
            'required_document_labels' => 'MOA, Endorsement',
            'evaluation_template_name' => 'University Final Evaluation',
        ])
        ->assertSessionHasNoErrors();

    expect($school->refresh()->name)->toBe('Updated State University')
        ->and($school->resolvedSettings()['email_completion_alerts'])->toBeFalse();
});

test('ordinary users cannot manage organization policy', function () {
    $user = User::factory()->create();

    $this->actingAs($user)->get(route('organization-settings.edit'))->assertForbidden();
});

test('platform administrator can manage platform defaults', function () {
    $admin = User::factory()->create(['role' => 'platform_admin', 'company_id' => null]);

    $this->actingAs($admin)
        ->patch(route('platform-settings.update'), [
            'company_registration_enabled' => false,
            'default_storage_limit_mb' => 4096,
            'default_user_limit' => 1000,
            'invitation_expiry_days' => 14,
            'backup_retention_days' => 60,
            'health_alert_email' => 'health@example.com',
            'support_email' => 'support@example.com',
            'maintenance_contact' => 'Operations desk',
            'require_company_admin_mfa' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('platform-settings.edit'));

    expect(PlatformSetting::resolvedPolicy())->toMatchArray([
        'company_registration_enabled' => false,
        'default_storage_limit_mb' => 4096,
        'require_company_admin_mfa' => true,
    ]);
});

test('platform policy can close public company registration', function () {
    PlatformSetting::query()->create([
        'key' => PlatformSetting::POLICY_KEY,
        'value' => [
            ...PlatformSetting::DEFAULT_POLICY,
            'company_registration_enabled' => false,
        ],
    ]);

    $this->get(route('register'))->assertForbidden();
});

test('platform invitation validity configures password setup link expiration', function () {
    PlatformSetting::query()->updateOrCreate([
        'key' => PlatformSetting::POLICY_KEY,
    ], [
        'value' => [
            ...PlatformSetting::DEFAULT_POLICY,
            'invitation_expiry_days' => 14,
        ],
    ]);

    $this->get(route('password.request'))->assertSuccessful();

    expect(config('auth.passwords.users.expire'))->toBe(20_160);
});

test('company session timeout signs out an inactive workspace user', function () {
    $company = Company::factory()->create([
        'settings' => [
            ...Company::DEFAULT_SETTINGS,
            'session_timeout_minutes' => 15,
        ],
    ]);
    $admin = User::factory()->create(['role' => 'company_admin', 'company_id' => $company->id]);

    $this->actingAs($admin)
        ->withSession(['workspace_last_activity' => now()->subMinutes(16)->timestamp])
        ->get(route('dashboard'))
        ->assertRedirect(route('login'));

    $this->assertGuest();
});

test('organization settings page returns resolved defaults', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->create(['role' => 'company_admin', 'company_id' => $company->id]);

    $this->actingAs($admin)
        ->get(route('organization-settings.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/organization')
            ->where('organizationType', 'company')
            ->where('organization.settings.default_required_hours', 486));
});

test('company OJT account form receives the configured defaults', function () {
    $company = Company::factory()->create([
        'settings' => [
            ...Company::DEFAULT_SETTINGS,
            'default_required_hours' => 600,
            'default_program' => 'Bachelor of Science in Human Resources',
            'default_year_level' => 3,
        ],
    ]);
    $admin = User::factory()->create(['role' => 'company_admin', 'company_id' => $company->id]);

    $this->actingAs($admin)
        ->get(route('company.ojts.index'))
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/dashboard')
            ->where('ojtDefaults.requiredHours', 600)
            ->where('ojtDefaults.program', 'Bachelor of Science in Human Resources')
            ->where('ojtDefaults.yearLevel', 3));
});

test('company user creation respects the platform workspace limit', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->create(['role' => 'company_admin', 'company_id' => $company->id]);
    PlatformSetting::query()->updateOrCreate([
        'key' => PlatformSetting::POLICY_KEY,
    ], [
        'value' => [
            ...PlatformSetting::DEFAULT_POLICY,
            'default_user_limit' => 1,
        ],
    ]);

    $this->actingAs($admin)
        ->post(route('company.ojts.store'), [
            'name' => 'Limited OJT',
            'email' => 'limited@example.test',
            'program' => 'Bachelor of Science in Information Technology',
            'year' => 4,
            'department' => 'Engineering',
            'position' => 'OJT Intern',
            'required_hours' => 486,
            'start_date' => '2026-08-19',
        ])
        ->assertInvalid('email');
});

test('company allowed staff domains restrict supervisor invitations but not OJT accounts', function () {
    Notification::fake();

    $company = Company::factory()->create([
        'settings' => [
            ...Company::DEFAULT_SETTINGS,
            'allowed_email_domains' => 'company.example',
        ],
    ]);
    $admin = User::factory()->create(['role' => 'company_admin', 'company_id' => $company->id]);

    $this->actingAs($admin)
        ->post(route('company.supervisors.store'), [
            'name' => 'Outside Supervisor',
            'email' => 'supervisor@gmail.com',
        ])
        ->assertInvalid('email');

    $this->actingAs($admin)
        ->post(route('company.ojts.store'), [
            'name' => 'Personal Email OJT',
            'email' => 'ojt@gmail.com',
            'program' => 'Bachelor of Science in Information Technology',
            'year' => 4,
            'department' => 'Engineering',
            'position' => 'OJT Intern',
            'required_hours' => 486,
            'start_date' => '2026-08-19',
        ])
        ->assertSessionHasNoErrors();
});

/** @param array<string, mixed> $overrides */
function companySettingsPayload(array $overrides = []): array
{
    return array_replace([
        'name' => 'Example Company', 'legal_name' => '', 'address' => '',
        'contact_email' => 'hr@example.com', 'contact_phone' => '',
        'authorized_signatory_name' => '', 'authorized_signatory_title' => '',
        ...Company::DEFAULT_SETTINGS,
    ], $overrides);
}
