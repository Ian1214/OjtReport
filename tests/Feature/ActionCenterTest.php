<?php

use App\Models\Company;
use App\Models\CompletionCertificate;
use App\Models\Document;
use App\Models\OnboardingChecklistItem;
use App\Models\PerformanceEvaluation;
use App\Models\School;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('a supervisor action center includes every assigned signature and draft workflow', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'supervisor',
    ]);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
    ]);

    CompletionCertificate::factory()->create([
        'company_id' => $company->id,
        'user_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
        'status' => CompletionCertificate::STATUS_PENDING_SUPERVISOR,
    ]);
    PerformanceEvaluation::factory()->draft()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
    ]);
    PerformanceEvaluation::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
        'period_start' => now()->subMonths(2)->startOfMonth(),
        'period_end' => now()->subMonths(2)->endOfMonth(),
    ]);

    $this->actingAs($supervisor)
        ->get(route('action-center.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('action-center/index')
            ->has('items', 2)
            ->where('items.0.id', 'certificate-signatures')
            ->where('items.0.count', 1)
            ->where('items.0.group', 'Official records')
            ->where('items.1.id', 'evaluation-drafts')
            ->where('items.1.count', 1));
});

test('an ojt action center shows only their own actionable records', function () {
    $company = Company::factory()->create();
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $otherOjt = User::factory()->create(['company_id' => $company->id]);

    Document::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'uploaded_by' => $ojt->id,
        'status' => Document::STATUS_REJECTED,
    ]);
    Document::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $otherOjt->id,
        'uploaded_by' => $otherOjt->id,
        'status' => Document::STATUS_REJECTED,
    ]);
    OnboardingChecklistItem::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
    ]);
    OnboardingChecklistItem::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'completed_at' => now(),
        'completed_by' => $ojt->id,
    ]);

    $this->actingAs($ojt)
        ->get(route('action-center.index'))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('action-center/index')
            ->has('items', 2)
            ->where('items.0.id', 'rejected-documents')
            ->where('items.0.count', 1)
            ->where('items.1.id', 'onboarding-checklist')
            ->where('items.1.count', 1));
});

test('a school coordinator cannot open an unrelated action center', function () {
    $school = School::factory()->create();
    $coordinator = User::factory()->create([
        'role' => 'school_coordinator',
        'school_id' => $school->id,
        'company_id' => null,
    ]);

    $this->actingAs($coordinator)
        ->get(route('action-center.index'))
        ->assertForbidden();
});
