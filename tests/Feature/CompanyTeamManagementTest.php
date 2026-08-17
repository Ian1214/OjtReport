<?php

use App\Models\Company;
use App\Models\User;
use App\Notifications\TeamMemberInvited;
use App\Support\CompanyPermissions;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('a company owner can invite a scoped team member', function () {
    Notification::fake();
    $company = Company::factory()->create();
    $owner = User::factory()->create(['company_id' => $company->id, 'company' => $company->name, 'role' => 'company_admin']);

    $this->actingAs($owner)->post(route('company.team.store'), [
        'name' => 'HR Reviewer',
        'email' => 'reviewer@example.test',
        'preset' => 'attendance_reviewer',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $member = User::query()->where('email', 'reviewer@example.test')->sole();
    expect($member->company_id)->toBe($company->id)
        ->and($member->role)->toBe('company_staff')
        ->and($member->company_permissions)->toBe(CompanyPermissions::forPreset('attendance_reviewer'));
    Notification::assertSentTo($member, TeamMemberInvited::class);
});

test('company team access is permission and tenant scoped', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $staff = User::factory()->create(['company_id' => $company->id, 'role' => 'company_staff', 'company_permissions' => [CompanyPermissions::PEOPLE_MANAGE]]);
    $auditor = User::factory()->create(['company_id' => $company->id, 'role' => 'company_staff', 'company_permissions' => [CompanyPermissions::AUDIT_VIEW]]);
    User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'company_admin', 'name' => 'Hidden Owner']);

    $this->actingAs($staff)->get(route('company.team.index'))->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('company/team')->has('members', 2));
    $this->actingAs($auditor)->get(route('company.team.index'))->assertForbidden();
});

test('a reviewer can access only the company modules granted to them', function () {
    $company = Company::factory()->create();
    $reportReviewer = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company_staff',
        'company_permissions' => [CompanyPermissions::REPORTS_REVIEW],
    ]);

    $this->actingAs($reportReviewer)
        ->get(route('company.approvals.index'))
        ->assertSuccessful();

    $this->actingAs($reportReviewer)
        ->get(route('company.attendance-monitor.index'))
        ->assertForbidden();

    $this->actingAs($reportReviewer)
        ->get(route('company.recovery.index'))
        ->assertForbidden();
});

test('suspending a team member prevents authentication', function () {
    $company = Company::factory()->create();
    $owner = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $member = User::factory()->create(['company_id' => $company->id, 'role' => 'company_staff', 'company_permissions' => [CompanyPermissions::REPORTS_REVIEW]]);

    $this->actingAs($owner)->patch(route('company.team.update', $member), [
        'name' => $member->name,
        'permissions' => [CompanyPermissions::REPORTS_REVIEW],
        'account_active' => false,
    ])->assertRedirect()->assertSessionHasNoErrors();

    expect($member->refresh()->account_active)->toBeFalse()->and($member->suspended_at)->not->toBeNull();

    auth()->logout();
    $this->post(route('login'), ['email' => $member->email, 'password' => 'password'])->assertSessionHasErrors('email');
    $this->assertGuest();
});
