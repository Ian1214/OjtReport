<?php

use App\Models\Company;
use App\Models\PerformanceEvaluation;
use App\Models\User;
use App\Support\CompanyPermissions;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('deleted operational records can be restored by authorized company users', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);
    $owner = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $evaluation = PerformanceEvaluation::factory()->create(['company_id' => $company->id, 'ojt_id' => $ojt->id, 'supervisor_id' => $supervisor->id]);

    $this->actingAs($owner)->delete(route('evaluations.destroy', $evaluation))->assertRedirect();
    expect(PerformanceEvaluation::onlyTrashed()->find($evaluation->id))->not->toBeNull();

    $this->actingAs($owner)->get(route('company.recovery.index'))->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page->component('company/recovery')->has('records', 1)->where('records.0.type', 'evaluation'));

    $this->post(route('company.recovery.restore', ['recordType' => 'evaluation', 'recordId' => $evaluation->id]))
        ->assertRedirect()->assertSessionHasNoErrors();
    expect(PerformanceEvaluation::find($evaluation->id))->not->toBeNull();
});

test('a recovery reviewer cannot restore another company record', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $reviewer = User::factory()->create(['company_id' => $company->id, 'role' => 'company_staff', 'company_permissions' => [CompanyPermissions::AUDIT_VIEW]]);
    $supervisor = User::factory()->create(['company_id' => $otherCompany->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $otherCompany->id, 'supervisor_id' => $supervisor->id]);
    $evaluation = PerformanceEvaluation::factory()->create(['company_id' => $otherCompany->id, 'ojt_id' => $ojt->id, 'supervisor_id' => $supervisor->id]);
    $evaluation->delete();

    $this->actingAs($reviewer)->post(route('company.recovery.restore', ['recordType' => 'evaluation', 'recordId' => $evaluation->id]))->assertNotFound();
});
