<?php

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\User;
use App\Notifications\DailyReportReviewed;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

test('an OJT is notified when an administrator reviews a report', function (string $action) {
    Notification::fake();

    $company = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $report = DailyReport::factory()->for($ojt)->create([
        'approval_status' => DailyReport::STATUS_PENDING,
    ]);
    $payload = $action === 'reject'
        ? ['rejection_reason' => 'Please describe the completed work more clearly.']
        : [];

    $this->actingAs($admin)
        ->patch(route("company.reports.{$action}", $report), $payload)
        ->assertRedirect();

    Notification::assertSentTo($ojt, DailyReportReviewed::class);
})->with(['approve', 'reject']);

test('viewing notifications automatically marks only the displayed users notifications as read', function () {
    $user = User::factory()->create();
    $otherUser = User::factory()->create();

    Notification::sendNow($user, new DailyReportReviewed(
        reportId: 10,
        reportDate: '2026-08-06',
        status: DailyReport::STATUS_APPROVED,
        reviewerName: 'Company Administrator',
    ));
    Notification::sendNow($otherUser, new DailyReportReviewed(
        reportId: 20,
        reportDate: '2026-08-05',
        status: DailyReport::STATUS_REJECTED,
        reviewerName: 'Other Administrator',
        rejectionReason: 'Other user correction.',
    ));

    $notification = $user->notifications()->firstOrFail();
    $otherNotification = $otherUser->notifications()->firstOrFail();

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('notifications/index')
            ->has('notifications.data', 1)
            ->where('unreadCount', 0)
            ->where('notifications.data.0.data.report_id', 10)
            ->where('notifications.data.0.wasUnread', true)
            ->where('notifications.data.0.readAt', fn (string $readAt): bool => $readAt !== '')
            ->where('navigation.unreadNotificationsCount', 0));

    expect($notification->refresh()->read_at)->not->toBeNull();
    expect($otherNotification->refresh()->read_at)->toBeNull();

    $this->actingAs($user)
        ->patch(route('notifications.read', $otherNotification->id))
        ->assertNotFound();

    $this->actingAs($user)
        ->patch(route('notifications.read', $notification->id))
        ->assertRedirect();
});

test('a user can mark all of their notifications as read', function () {
    $user = User::factory()->create();

    foreach ([1, 2] as $reportId) {
        Notification::sendNow($user, new DailyReportReviewed(
            reportId: $reportId,
            reportDate: '2026-08-06',
            status: DailyReport::STATUS_APPROVED,
            reviewerName: 'Company Administrator',
        ));
    }

    $this->actingAs($user)
        ->patch(route('notifications.read-all'))
        ->assertRedirect();

    expect($user->unreadNotifications()->count())->toBe(0);
});

test('opening a notification page does not mark notifications on later pages as seen', function () {
    $user = User::factory()->create();

    foreach (range(1, 21) as $reportId) {
        Notification::sendNow($user, new DailyReportReviewed(
            reportId: $reportId,
            reportDate: '2026-08-06',
            status: DailyReport::STATUS_APPROVED,
            reviewerName: 'Company Administrator',
        ));
    }

    $this->actingAs($user)
        ->get(route('notifications.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('notifications.data', 20)
            ->where('unreadCount', 1)
            ->where('navigation.unreadNotificationsCount', 1));

    expect($user->unreadNotifications()->count())->toBe(1);

    $this->actingAs($user)
        ->get(route('notifications.index', ['page' => 2]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('notifications.data', 1)
            ->where('unreadCount', 0)
            ->where('navigation.unreadNotificationsCount', 0));

    expect($user->unreadNotifications()->count())->toBe(0);
});
