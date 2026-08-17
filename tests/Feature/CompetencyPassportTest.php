<?php

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\OjtTask;
use App\Models\PassportShare;
use App\Models\PerformanceEvaluation;
use App\Models\School;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('an OJT passport combines only verified evidence', function () {
    $company = Company::factory()->create(['name' => 'Evidence Company']);
    $school = School::factory()->create(['name' => 'Evidence School']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'school_id' => $school->id,
        'supervisor_id' => $supervisor->id,
        'required_hours' => 500,
    ]);
    DailyReport::factory()->create([
        'user_id' => $ojt->id,
        'approval_status' => DailyReport::STATUS_APPROVED,
        'total_hours' => 8,
    ]);
    DailyReport::factory()->create([
        'user_id' => $ojt->id,
        'approval_status' => DailyReport::STATUS_REJECTED,
        'total_hours' => 7,
    ]);
    OjtTask::factory()->create([
        'ojt_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
        'title' => 'Verified deployment task',
        'status' => 'finished',
    ]);
    PerformanceEvaluation::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
        'technical_score' => 5,
    ]);

    $this->actingAs($ojt)->get(route('passports.show', $ojt))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('passports/show')
            ->where('passport.companyName', 'Evidence Company')
            ->where('passport.schoolName', 'Evidence School')
            ->where('passport.approvedHours', 8)
            ->where('passport.approvedReports', 1)
            ->where('passport.completedTasks.0.title', 'Verified deployment task')
            ->where('passport.skills.0.score', 5)
            ->where('canManageSharing', true));
});

test('an OJT controls an expiring employer verification link', function () {
    $ojt = User::factory()->create();

    $this->actingAs($ojt)->post(route('passport-shares.store'), [
        'expires_days' => 30,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $share = PassportShare::query()->sole();
    expect($share->ojt_id)->toBe($ojt->id)
        ->and($share->expires_at->isFuture())->toBeTrue();

    $this->get(route('passports.verify', ['token' => $share->token]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('passports/verify')
            ->where('passport.name', $ojt->name));

    $this->actingAs($ojt)
        ->delete(route('passport-shares.destroy', $share))
        ->assertRedirect();

    $this->get(route('passports.verify', ['token' => $share->token]))
        ->assertGone();
});

test('passport tenant boundaries protect OJT records and share controls', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $otherAdmin = User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'company_admin']);
    $share = PassportShare::factory()->create(['ojt_id' => $ojt->id, 'created_by' => $ojt->id]);

    $this->actingAs($otherAdmin)->get(route('passports.show', $ojt))->assertNotFound();
    $this->actingAs($otherAdmin)->delete(route('passport-shares.destroy', $share))->assertForbidden();
});
