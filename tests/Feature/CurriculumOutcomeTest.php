<?php

use App\Models\Company;
use App\Models\CurriculumOutcome;
use App\Models\OjtTask;
use App\Models\School;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('a school coordinator manages only their curriculum outcome catalog', function () {
    $school = School::factory()->create(['name' => 'Example College']);
    $otherSchool = School::factory()->create();
    $coordinator = User::factory()->create([
        'role' => 'school_coordinator',
        'school_id' => $school->id,
        'company_id' => null,
    ]);
    CurriculumOutcome::factory()->create(['school_id' => $otherSchool->id, 'code' => 'HIDDEN-1']);

    $this->actingAs($coordinator)->post(route('school.curriculum-outcomes.store'), [
        'code' => 'it-lo1',
        'title' => 'Build secure web applications',
        'description' => 'Demonstrate secure implementation in workplace tasks.',
    ])->assertRedirect()->assertSessionHasNoErrors();

    $outcome = CurriculumOutcome::query()->where('school_id', $school->id)->sole();
    expect($outcome->code)->toBe('IT-LO1');

    $this->actingAs($coordinator)->get(route('school.curriculum-outcomes.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('school/curriculum-outcomes')
            ->where('schoolName', 'Example College')
            ->has('outcomes', 1)
            ->where('outcomes.0.code', 'IT-LO1'));

    $this->actingAs($coordinator)
        ->patch(route('school.curriculum-outcomes.update', $outcome))
        ->assertRedirect();

    expect($outcome->refresh()->is_active)->toBeFalse();
});

test('an assigned supervisor maps tasks only to the OJT school outcomes', function () {
    $company = Company::factory()->create();
    $school = School::factory()->create();
    $otherSchool = School::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'school_id' => $school->id,
        'supervisor_id' => $supervisor->id,
    ]);
    $outcome = CurriculumOutcome::factory()->create(['school_id' => $school->id]);
    $foreignOutcome = CurriculumOutcome::factory()->create(['school_id' => $otherSchool->id]);

    $this->actingAs($supervisor)->post(route('supervisor.tasks.store', $ojt), [
        'title' => 'Implement access controls',
        'outcome_ids' => [$outcome->id],
    ])->assertRedirect()->assertSessionHasNoErrors();

    $task = OjtTask::query()->sole();
    expect($task->curriculumOutcomes()->pluck('curriculum_outcomes.id')->all())->toBe([$outcome->id]);

    $this->actingAs($supervisor)->post(route('supervisor.tasks.store', $ojt), [
        'title' => 'Invalid mapping',
        'outcome_ids' => [$foreignOutcome->id],
    ])->assertInvalid('outcome_ids.0');

    expect(OjtTask::query()->count())->toBe(1);
});

test('completed mapped outcomes become verified passport evidence', function () {
    $company = Company::factory()->create();
    $school = School::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'school_id' => $school->id,
        'supervisor_id' => $supervisor->id,
    ]);
    $outcome = CurriculumOutcome::factory()->create([
        'school_id' => $school->id,
        'code' => 'SEC-01',
        'title' => 'Apply secure coding practices',
    ]);
    $task = OjtTask::factory()->create([
        'ojt_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
        'status' => 'finished',
    ]);
    $task->curriculumOutcomes()->attach($outcome);

    $this->actingAs($ojt)->get(route('passports.show', $ojt))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('passport.completedTasks.0.outcomes.0.code', 'SEC-01')
            ->where('passport.completedTasks.0.outcomes.0.title', 'Apply secure coding practices'));
});
