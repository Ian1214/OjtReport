<?php

use App\Models\Company;
use App\Models\Department;
use App\Models\User;
use App\Notifications\OjtAccountCreated;
use App\Notifications\OjtOperationalReminder;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;

test('the bulk import CSV template contains the required columns', function () {
    $contents = file_get_contents(public_path('templates/ojt-import-template.csv'));

    expect($contents)->toStartWith('name,email,program,year,department,position,required_hours,start_date');
});

test('completing onboarding activates an OJT account', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'role' => 'company_admin']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'ojt_status' => User::OJT_STATUS_ONBOARDING]);

    $this->actingAs($administrator)->post(route('company.onboarding.store', $ojt), [
        'title' => 'Submit endorsement letter',
        'due_date' => '2026-08-20',
    ])->assertSessionHasNoErrors();
    $item = $ojt->onboardingChecklistItems()->firstOrFail();

    $this->actingAs($administrator)->patch(route('company.onboarding.update', $item), ['completed' => true])->assertSessionHasNoErrors();

    expect($item->refresh()->completed_at)->not->toBeNull()
        ->and($ojt->refresh()->ojt_status)->toBe(User::OJT_STATUS_ACTIVE);
});

test('only the assigned supervisor can add feedback', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'role' => 'supervisor']);
    $otherSupervisor = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'supervisor_id' => $supervisor->id]);
    $payload = ['category' => 'professionalism', 'rating' => 5, 'comments' => 'Consistently prepared and communicates clearly.', 'shared_with_school' => true];

    $this->actingAs($otherSupervisor)->post(route('supervisor.feedback.store', $ojt), $payload)->assertForbidden();
    $this->actingAs($supervisor)->post(route('supervisor.feedback.store', $ojt), $payload)->assertSessionHasNoErrors();

    expect($ojt->supervisorFeedback()->count())->toBe(1)
        ->and($ojt->supervisorFeedback()->first()->shared_with_school)->toBeTrue();
});

test('an administrator can bulk import validated OJT accounts', function () {
    Notification::fake();
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'role' => 'company_admin']);
    $csv = implode("\n", [
        'name,email,program,year,department,position,required_hours,start_date',
        'Alex Cruz,alex.import@example.com,BS Information Technology,4,Human Resources,HR Intern,500,2026-08-04',
        'Jamie Lee,jamie.import@example.com,BS Business Administration,3,Finance,Finance Intern,400,2026-08-04',
    ]);

    $this->actingAs($administrator)
        ->post(route('company.ojts.import'), ['file' => UploadedFile::fake()->createWithContent('ojts.csv', $csv)])
        ->assertRedirect(route('company.ojts.index', absolute: false))
        ->assertSessionHasNoErrors();

    expect(User::query()->whereIn('email', ['alex.import@example.com', 'jamie.import@example.com'])->count())->toBe(2)
        ->and(Department::query()->where('company_id', $company->id)->count())->toBe(2);
    Notification::assertSentTimes(OjtAccountCreated::class, 2);
});

test('the reminder command sends one deduplicated missing report reminder', function () {
    Notification::fake();
    Carbon::setTestNow('2026-08-11 09:00:00');
    $company = Company::factory()->create(['work_days' => [1, 2, 3, 4, 5]]);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'start_date' => '2026-08-01',
        'ojt_status' => User::OJT_STATUS_ACTIVE,
    ]);

    $this->artisan('ojt:send-operational-reminders')->assertSuccessful();
    $this->artisan('ojt:send-operational-reminders')->assertSuccessful();

    Notification::assertSentToTimes($ojt, OjtOperationalReminder::class, 1);
});
