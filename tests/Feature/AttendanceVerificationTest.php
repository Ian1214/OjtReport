<?php

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\User;
use Illuminate\Support\Facades\URL;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('an administrator configures optional attendance verification', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);

    $this->actingAs($admin)->patch(route('company.attendance-verification.update'), [
        'attendance_verification_mode' => 'qr_and_geolocation',
        'attendance_latitude' => 8.4853,
        'attendance_longitude' => 124.6459,
        'attendance_radius_meters' => 200,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($company->refresh()->attendance_verification_mode)->toBe('qr_and_geolocation')
        ->and($company->attendance_radius_meters)->toBe(200);
});

test('an administrator can display a designed rotating attendance QR page', function () {
    $company = Company::factory()->create([
        'name' => 'Acme Internship Hub',
        'attendance_verification_mode' => 'qr_and_geolocation',
    ]);
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);

    $this->actingAs($admin)
        ->get(route('company.attendance-verification.qr'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/attendance-verification-qr')
            ->where('company.name', 'Acme Internship Hub')
            ->where('company.verificationMode', 'qr_and_geolocation')
            ->where('qrImage', fn (string $value): bool => str_starts_with($value, 'data:image/svg+xml;base64,'))
            ->where('expiresAt', fn (string $value): bool => filled($value))
        );
});

test('the attendance policy includes a rotating QR for inline display', function () {
    $company = Company::factory()->create([
        'attendance_verification_mode' => 'qr_and_geolocation',
    ]);
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);

    $this->actingAs($admin)
        ->get(route('company.attendance-policy.edit'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/attendance-policy')
            ->where('attendanceQr.qrImage', fn (string $value): bool => str_starts_with($value, 'data:image/svg+xml;base64,'))
            ->where('attendanceQr.expiresAt', fn (string $value): bool => filled($value))
        );
});

test('an OJT cannot display the company attendance QR page', function () {
    $company = Company::factory()->create(['attendance_verification_mode' => 'qr']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'role' => 'ojt']);

    $this->actingAs($ojt)
        ->get(route('company.attendance-verification.qr'))
        ->assertForbidden();
});

test('an OJT must scan a valid company QR before QR verified time in', function () {
    $company = Company::factory()->create(['attendance_verification_mode' => 'qr']);
    $ojt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($ojt)->post(route('reports.time-in'))->assertInvalid('attendance');

    $url = URL::temporarySignedRoute('reports.verify-attendance', now()->addMinutes(10), ['company' => $company->id]);
    $this->actingAs($ojt)->get($url)->assertRedirect(route('reports.index'));
    $this->actingAs($ojt)->post(route('reports.time-in'))->assertRedirect(route('reports.index'));

    expect(DailyReport::query()->sole()->verification_method)->toBe('qr');
});

test('geolocation verification requires consent and an approved radius', function () {
    $company = Company::factory()->create([
        'attendance_verification_mode' => 'geolocation',
        'attendance_latitude' => 8.4853,
        'attendance_longitude' => 124.6459,
        'attendance_radius_meters' => 200,
    ]);
    $ojt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($ojt)->post(route('reports.time-in'), [
        'latitude' => 8.4853,
        'longitude' => 124.6459,
    ])->assertInvalid('location_consent');

    $this->actingAs($ojt)->post(route('reports.time-in'), [
        'latitude' => 8.4853,
        'longitude' => 124.6459,
        'location_consent' => '1',
    ])->assertRedirect(route('reports.index'));

    expect(DailyReport::query()->sole()->verification_distance_meters)->toBe(0);
});
