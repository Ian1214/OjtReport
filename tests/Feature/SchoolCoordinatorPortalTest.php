<?php

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\School;
use App\Models\User;
use App\Notifications\OjtAccountCreated;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('a company administrator can invite a school coordinator', function () {
    Notification::fake();
    $company = Company::factory()->create();
    $administrator = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company_admin',
    ]);

    $this->actingAs($administrator)->post(route('company.school-coordinators.store'), [
        'school_name' => 'Northern Mindanao State University',
        'name' => 'Maria Santos',
        'email' => 'maria.santos@example.edu',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $school = School::query()->where('name', 'Northern Mindanao State University')->sole();
    $coordinator = User::query()->where('email', 'maria.santos@example.edu')->sole();

    expect($coordinator->role)->toBe('school_coordinator')
        ->and($coordinator->school_id)->toBe($school->id)
        ->and($coordinator->company_id)->toBeNull()
        ->and($coordinator->must_change_password)->toBeTrue();

    Notification::assertSentTo($coordinator, OjtAccountCreated::class);
});

test('a connected company administrator can resend a school coordinator invitation', function () {
    Notification::fake();
    $company = Company::factory()->create();
    $administrator = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company_admin',
    ]);
    $school = School::factory()->create();
    $coordinator = User::factory()->create([
        'role' => 'school_coordinator',
        'school_id' => $school->id,
        'company_id' => null,
    ]);
    User::factory()->create([
        'company_id' => $company->id,
        'school_id' => $school->id,
        'role' => 'ojt',
    ]);

    $this->actingAs($administrator)
        ->post(route('company.school-coordinators.resend', $coordinator))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    Notification::assertSentTo($coordinator, OjtAccountCreated::class);
    $this->assertDatabaseHas('activity_logs', [
        'company_id' => $company->id,
        'actor_id' => $administrator->id,
        'event' => 'account.school_coordinator_invitation_resent',
        'subject_id' => $coordinator->id,
    ]);
});

test('unrelated companies cannot view contact details or resend school invitations', function () {
    Notification::fake();
    $school = School::factory()->create(['name' => 'Protected University']);
    $coordinator = User::factory()->create([
        'role' => 'school_coordinator',
        'school_id' => $school->id,
        'company_id' => null,
    ]);
    $connectedCompany = Company::factory()->create();
    User::factory()->create([
        'company_id' => $connectedCompany->id,
        'school_id' => $school->id,
        'role' => 'ojt',
    ]);
    $unrelatedCompany = Company::factory()->create();
    $unrelatedAdministrator = User::factory()->create([
        'company_id' => $unrelatedCompany->id,
        'role' => 'company_admin',
    ]);

    $this->actingAs($unrelatedAdministrator)
        ->get(route('company.school-access.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('schools.0.name', 'Protected University')
            ->where('schools.0.coordinator', null));

    $this->actingAs($unrelatedAdministrator)
        ->post(route('company.school-coordinators.resend', $coordinator))
        ->assertNotFound();

    Notification::assertNothingSent();
});

test('only company administrators can manage school assignments for their own OJTs', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $otherOjt = User::factory()->create(['company_id' => $otherCompany->id]);
    $school = School::factory()->create();
    User::factory()->create(['role' => 'school_coordinator', 'school_id' => $school->id, 'company_id' => null]);

    $this->actingAs($administrator)
        ->patch(route('company.ojts.update-school', $ojt), ['school_id' => $school->id])
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($ojt->refresh()->school_id)->toBe($school->id);

    $this->actingAs($administrator)
        ->patch(route('company.ojts.update-school', $otherOjt), ['school_id' => $school->id])
        ->assertForbidden();

    $this->actingAs($supervisor)
        ->patch(route('company.ojts.update-school', $ojt), ['school_id' => null])
        ->assertForbidden();
});

test('a school coordinator sees assigned students across companies and no other school data', function () {
    $school = School::factory()->create(['name' => 'Partner University']);
    $otherSchool = School::factory()->create();
    $coordinator = User::factory()->create([
        'role' => 'school_coordinator',
        'school_id' => $school->id,
        'company_id' => null,
    ]);
    $firstCompany = Company::factory()->create();
    $secondCompany = Company::factory()->create();
    $firstStudent = User::factory()->create([
        'company_id' => $firstCompany->id,
        'school_id' => $school->id,
        'name' => 'Alpha Student',
    ]);
    $secondStudent = User::factory()->create([
        'company_id' => $secondCompany->id,
        'school_id' => $school->id,
        'name' => 'Beta Student',
    ]);
    $hiddenStudent = User::factory()->create([
        'company_id' => $firstCompany->id,
        'school_id' => $otherSchool->id,
        'name' => 'Hidden Student',
    ]);
    DailyReport::factory()->for($firstStudent)->create([
        'approval_status' => DailyReport::STATUS_APPROVED,
        'total_hours' => 8,
    ]);

    $this->actingAs($coordinator)->get(route('school.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('school/dashboard')
            ->where('schoolName', 'Partner University')
            ->where('summary.students', 2)
            ->has('students.data', 2)
            ->where('students.data.0.name', 'Alpha Student')
            ->where('students.data.0.approvedHours', 8)
            ->where('students.data.1.name', 'Beta Student'));

    $this->actingAs($coordinator)
        ->get(route('school.students.show', $secondStudent))
        ->assertSuccessful();

    $this->actingAs($coordinator)
        ->get(route('school.students.show', $hiddenStudent))
        ->assertNotFound();
});

test('a coordinator can acknowledge only a completed student from their school', function () {
    $school = School::factory()->create();
    $coordinator = User::factory()->create([
        'role' => 'school_coordinator',
        'school_id' => $school->id,
        'company_id' => null,
    ]);
    $completedStudent = User::factory()->create([
        'school_id' => $school->id,
        'end_date' => now()->toDateString(),
    ]);
    $activeStudent = User::factory()->create(['school_id' => $school->id, 'end_date' => null]);
    $otherStudent = User::factory()->create([
        'school_id' => School::factory()->create()->id,
        'end_date' => now()->toDateString(),
    ]);

    $this->actingAs($coordinator)
        ->patch(route('school.students.acknowledge', $completedStudent))
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($completedStudent->refresh()->school_acknowledged_by)->toBe($coordinator->id)
        ->and($completedStudent->school_acknowledged_at)->not->toBeNull();

    $this->actingAs($coordinator)
        ->patch(route('school.students.acknowledge', $activeStudent))
        ->assertInvalid('completion');

    $this->actingAs($coordinator)
        ->patch(route('school.students.acknowledge', $otherStudent))
        ->assertForbidden();
});
