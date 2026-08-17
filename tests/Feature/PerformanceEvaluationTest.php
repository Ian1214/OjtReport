<?php

use App\Models\ActivityLog;
use App\Models\Company;
use App\Models\PerformanceEvaluation;
use App\Models\School;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

function evaluationPayload(string $action = PerformanceEvaluation::STATUS_SUBMITTED): array
{
    return [
        'period_start' => now()->subDays(7)->toDateString(),
        'period_end' => now()->toDateString(),
        'technical_score' => 4,
        'work_quality_score' => 5,
        'communication_score' => 4,
        'professionalism_score' => 5,
        'attendance_score' => 4,
        'strengths' => 'Consistently produces reliable work.',
        'improvements' => 'Continue documenting technical decisions.',
        'comments' => 'Ready for more independent tasks.',
        'action' => $action,
    ];
}

test('an assigned supervisor can save a draft and submit a complete evaluation', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);

    $this->actingAs($supervisor)->post(route('evaluations.store'), [
        'ojt_id' => $ojt->id,
        'period_start' => now()->subDays(14)->toDateString(),
        'period_end' => now()->subDays(8)->toDateString(),
        'action' => PerformanceEvaluation::STATUS_DRAFT,
    ])->assertRedirect()->assertSessionHasNoErrors();

    $draft = PerformanceEvaluation::query()->sole();
    expect($draft->status)->toBe(PerformanceEvaluation::STATUS_DRAFT)
        ->and($draft->technical_score)->toBeNull()
        ->and($draft->submitted_at)->toBeNull();

    $this->actingAs($supervisor)
        ->patch(route('evaluations.update', $draft), evaluationPayload())
        ->assertRedirect()
        ->assertSessionHasNoErrors();

    expect($draft->refresh()->status)->toBe(PerformanceEvaluation::STATUS_SUBMITTED)
        ->and($draft->averageScore())->toBe(4.4)
        ->and($draft->submitted_at)->not->toBeNull();

    $this->actingAs($supervisor)
        ->patch(route('evaluations.update', $draft), evaluationPayload(PerformanceEvaluation::STATUS_DRAFT))
        ->assertForbidden();
});

test('submitting requires every rubric score and constructive feedback', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);

    $this->actingAs($supervisor)->post(route('evaluations.store'), [
        'ojt_id' => $ojt->id,
        'period_start' => now()->subWeek()->toDateString(),
        'period_end' => now()->toDateString(),
        'action' => PerformanceEvaluation::STATUS_SUBMITTED,
    ])->assertInvalid([
        'technical_score',
        'work_quality_score',
        'communication_score',
        'professionalism_score',
        'attendance_score',
        'strengths',
        'improvements',
    ]);
});

test('a supervisor cannot evaluate an unassigned OJT', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $otherSupervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $otherSupervisor->id]);

    $this->actingAs($supervisor)->post(route('evaluations.store'), [
        'ojt_id' => $ojt->id,
        ...evaluationPayload(),
    ])->assertInvalid('ojt_id');

    expect(PerformanceEvaluation::query()->count())->toBe(0);
});

test('submitted evaluations are visible only to authorized stakeholders', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $school = School::factory()->create();
    $otherSchool = School::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'school_id' => $school->id,
        'supervisor_id' => $supervisor->id,
        'name' => 'Visible Student',
    ]);
    $otherOjt = User::factory()->create([
        'company_id' => $otherCompany->id,
        'school_id' => $otherSchool->id,
        'name' => 'Hidden Student',
    ]);
    PerformanceEvaluation::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
    ]);
    PerformanceEvaluation::factory()->create([
        'company_id' => $otherCompany->id,
        'ojt_id' => $otherOjt->id,
        'supervisor_id' => User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'supervisor'])->id,
        'period_start' => now()->subMonths(2)->startOfMonth(),
        'period_end' => now()->subMonths(2)->endOfMonth(),
    ]);
    PerformanceEvaluation::factory()->draft()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
        'period_start' => now()->subMonths(3)->startOfMonth(),
        'period_end' => now()->subMonths(3)->endOfMonth(),
    ]);

    $coordinator = User::factory()->create(['role' => 'school_coordinator', 'school_id' => $school->id, 'company_id' => null]);
    $otherCoordinator = User::factory()->create(['role' => 'school_coordinator', 'school_id' => $otherSchool->id, 'company_id' => null]);

    foreach ([$administrator, $ojt, $coordinator] as $viewer) {
        $this->actingAs($viewer)->get(route('evaluations.index'))
            ->assertSuccessful()
            ->assertInertia(fn (Assert $page) => $page
                ->component('evaluations/index')
                ->has('evaluations.data', 1)
                ->where('evaluations.data.0.ojtName', 'Visible Student')
                ->where('evaluations.data.0.status', PerformanceEvaluation::STATUS_SUBMITTED));
    }

    $this->actingAs($otherCoordinator)->get(route('evaluations.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('evaluations.data', 1)
            ->where('evaluations.data.0.ojtName', 'Hidden Student'));
});

test('a company administrator can delete an evaluation from their company', function () {
    $company = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);
    $evaluation = PerformanceEvaluation::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
    ]);

    $this->actingAs($administrator)
        ->delete(route('evaluations.destroy', $evaluation))
        ->assertRedirect(route('evaluations.index'));

    $this->assertSoftDeleted($evaluation);
    expect(ActivityLog::query()->where('event', 'evaluation.deleted')->exists())->toBeTrue();
});

test('an administrator cannot delete another company evaluation', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $administrator = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $otherCompany->id, 'supervisor_id' => $supervisor->id]);
    $evaluation = PerformanceEvaluation::factory()->create([
        'company_id' => $otherCompany->id,
        'ojt_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
    ]);

    $this->actingAs($administrator)
        ->delete(route('evaluations.destroy', $evaluation))
        ->assertNotFound();

    $this->assertModelExists($evaluation);
});

test('a supervisor cannot delete an evaluation', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);
    $evaluation = PerformanceEvaluation::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
    ]);

    $this->actingAs($supervisor)
        ->delete(route('evaluations.destroy', $evaluation))
        ->assertForbidden();

    $this->assertModelExists($evaluation);
});
