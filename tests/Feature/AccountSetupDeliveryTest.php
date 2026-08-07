<?php

use App\Listeners\RecordSuccessfulAccountSetupDelivery;
use App\Models\AccountSetupDelivery;
use App\Models\Company;
use App\Models\User;
use App\Notifications\OjtAccountCreated;
use Illuminate\Notifications\Events\NotificationSent;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

test('sending an account setup notification records a queued delivery attempt', function () {
    Notification::fake();

    $company = Company::factory()->create();
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
    ]);

    $ojt->sendPasswordResetNotification('setup-token');

    $delivery = $ojt->accountSetupDeliveries()->sole();

    expect($delivery->company_id)->toBe($company->id)
        ->and($delivery->recipient_email)->toBe($ojt->email)
        ->and($delivery->status)->toBe(AccountSetupDelivery::STATUS_QUEUED)
        ->and($delivery->sent_at)->toBeNull()
        ->and($delivery->failed_at)->toBeNull();

    Notification::assertSentTo(
        $ojt,
        OjtAccountCreated::class,
        fn (OjtAccountCreated $notification): bool => $notification->deliveryId === $delivery->id,
    );
});

test('a successful mail notification marks its matching delivery as sent', function () {
    $company = Company::factory()->create();
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
    ]);
    $delivery = AccountSetupDelivery::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'recipient_email' => $ojt->email,
    ]);
    $notification = new OjtAccountCreated($company->name, 'setup-token', $delivery->id);

    (new RecordSuccessfulAccountSetupDelivery)->handle(
        new NotificationSent($ojt, $notification, 'mail'),
    );

    expect($delivery->refresh()->status)->toBe(AccountSetupDelivery::STATUS_SENT)
        ->and($delivery->sent_at)->not->toBeNull()
        ->and($delivery->failure_reason)->toBeNull();
});

test('a permanently failed setup notification records a safe failure reason', function () {
    $company = Company::factory()->create();
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
    ]);
    $delivery = AccountSetupDelivery::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'recipient_email' => $ojt->email,
    ]);
    $notification = new OjtAccountCreated($company->name, 'setup-token', $delivery->id);

    $notification->failed(new RuntimeException('535 Username and Password not accepted: secret-value'));

    expect($delivery->refresh()->status)->toBe(AccountSetupDelivery::STATUS_FAILED)
        ->and($delivery->failed_at)->not->toBeNull()
        ->and($delivery->failure_reason)->toContain('Gmail rejected')
        ->and($delivery->failure_reason)->not->toContain('secret-value');
});

test('managed OJTs expose only their latest tenant-scoped setup delivery', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
    ]);
    $otherOjt = User::factory()->create([
        'company_id' => $otherCompany->id,
        'company' => $otherCompany->name,
    ]);

    AccountSetupDelivery::factory()->failed()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'recipient_email' => $ojt->email,
        'created_at' => now()->subMinute(),
    ]);
    AccountSetupDelivery::factory()->sent()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'recipient_email' => $ojt->email,
    ]);
    AccountSetupDelivery::factory()->failed()->create([
        'company_id' => $otherCompany->id,
        'user_id' => $otherOjt->id,
        'recipient_email' => $otherOjt->email,
    ]);

    $this->actingAs($companyAdmin)
        ->get(route('company.ojts.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('ojts', 1)
            ->where('ojts.0.id', $ojt->id)
            ->where('ojts.0.email', $ojt->email)
            ->where('ojts.0.setupDelivery.status', AccountSetupDelivery::STATUS_SENT)
            ->where('ojts.0.setupDelivery.failureReason', null));
});

test('resending a setup link records a new delivery attempt', function () {
    Notification::fake();

    $company = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
    ]);

    $this->actingAs($companyAdmin)
        ->post(route('company.ojts.resend-setup-link', $ojt))
        ->assertRedirect(route('company.ojts.index', absolute: false));

    expect($ojt->accountSetupDeliveries()->count())->toBe(1)
        ->and($ojt->latestAccountSetupDelivery()->first()->status)
        ->toBe(AccountSetupDelivery::STATUS_QUEUED);
});
