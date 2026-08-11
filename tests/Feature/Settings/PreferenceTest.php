<?php

use App\Models\User;
use App\Notifications\AttendanceCorrectionUpdated;
use App\Notifications\DailyReportReviewed;
use Inertia\Testing\AssertableInertia as Assert;

test('settings overview is displayed with account health', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('settings.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/index')
            ->where('security.emailVerified', true)
            ->where('preferences.interface_density', 'comfortable')
            ->where('preferences.report_updates', true));
});

test('preferences page displays resolved defaults', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->get(route('preferences.edit'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('settings/preferences')
            ->where('timezone', 'Asia/Manila')
            ->where('preferences.reduce_motion', false)
            ->where('options.timezones.0', 'Asia/Manila'));
});

test('user can update workspace preferences', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->patch(route('preferences.update'), [
            'timezone' => 'Asia/Singapore',
            'date_format' => 'day_first',
            'interface_density' => 'compact',
            'reduce_motion' => true,
            'high_contrast' => true,
            'report_updates' => false,
            'attendance_updates' => true,
        ])
        ->assertSessionHasNoErrors()
        ->assertRedirect(route('preferences.edit'));

    $user->refresh();

    expect($user->timezone)->toBe('Asia/Singapore')
        ->and($user->preferences)->toMatchArray([
            'date_format' => 'day_first',
            'interface_density' => 'compact',
            'reduce_motion' => true,
            'high_contrast' => true,
            'report_updates' => false,
            'attendance_updates' => true,
        ]);
});

test('preference options are strictly validated', function () {
    $user = User::factory()->create();

    $this->actingAs($user)
        ->from(route('preferences.edit'))
        ->patch(route('preferences.update'), [
            'timezone' => 'Invalid/Timezone',
            'date_format' => 'invalid',
            'interface_density' => 'tiny',
        ])
        ->assertSessionHasErrors([
            'timezone',
            'date_format',
            'interface_density',
        ])
        ->assertRedirect(route('preferences.edit'));
});

test('disabled workflow alerts do not select a delivery channel', function () {
    $user = User::factory()->create([
        'preferences' => [
            ...User::DEFAULT_PREFERENCES,
            'report_updates' => false,
            'attendance_updates' => false,
        ],
    ]);

    $reportNotification = new DailyReportReviewed(
        reportId: 1,
        reportDate: '2026-08-11',
        status: 'approved',
        reviewerName: 'Supervisor',
    );
    $attendanceNotification = new AttendanceCorrectionUpdated(
        correctionId: 1,
        reportDate: '2026-08-11',
        title: 'Correction reviewed',
        message: 'Your request was reviewed.',
        status: 'approved',
    );

    expect($reportNotification->via($user))->toBe([])
        ->and($attendanceNotification->via($user))->toBe([]);
});
