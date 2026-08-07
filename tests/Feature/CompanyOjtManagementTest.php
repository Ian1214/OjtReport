<?php

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\User;
use App\Notifications\OjtAccountCreated;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

test('a company administrator can create an OJT account with a secure password setup link', function () {
    Notification::fake();

    $company = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);

    $response = $this->actingAs($companyAdmin)->post(route('company.ojts.store'), [
        'name' => 'Maria Santos',
        'email' => 'maria.santos@gmail.com',
        'program' => 'Bachelor of Science in Information Technology',
        'year' => 4,
        'department' => 'Engineering',
        'position' => 'OJT Intern',
        'supervisor_name' => 'Ana Reyes',
        'required_hours' => 486,
        'start_date' => '2026-08-05',
    ]);

    $response->assertRedirect(route('company.ojts.index', absolute: false));

    $ojt = User::query()->where('name', 'Maria Santos')->firstOrFail();

    expect($ojt->company_id)->toBe($company->id);
    expect($ojt->role)->toBe('ojt');
    expect($ojt->must_change_password)->toBeTrue();
    expect($ojt->email)->toBe('maria.santos@gmail.com');
    expect($ojt->supervisor_name)->toBe('Ana Reyes');
    Notification::assertSentTo($ojt, OjtAccountCreated::class);
});

test('a company administrator can assign a supervisor to an OJT', function () {
    $company = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);
    $ojt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($companyAdmin)
        ->patch(route('company.ojts.update-supervisor', $ojt), ['supervisor_name' => 'Maria Cruz'])
        ->assertRedirect(route('company.ojts.index', absolute: false));

    expect($ojt->refresh()->supervisor_name)->toBe('Maria Cruz');
});

test('a company administrator can resend an OJT password setup link', function () {
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

    Notification::assertSentTo($ojt, OjtAccountCreated::class);
});

test('a company dashboard shows a focused overview', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);
    User::factory()->create(['company_id' => $company->id, 'company' => $company->name]);
    User::factory()->create(['company_id' => $otherCompany->id, 'company' => $otherCompany->name]);

    $this->actingAs($companyAdmin)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/overview')
            ->where('company.name', $company->name)
            ->where('stats.totalOjtCount', 1));
});

test('a company administrator can view only their own OJT reports', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);
    $ownOjt = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
    ]);
    $otherOjt = User::factory()->create([
        'company_id' => $otherCompany->id,
        'company' => $otherCompany->name,
    ]);
    $report = DailyReport::factory()->for($ownOjt)->create([
        'summary' => 'Completed daily work report.',
    ]);

    $this->actingAs($companyAdmin)
        ->get(route('company.ojts.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/dashboard')
            ->has('ojts', 1)
            ->where('ojts.0.id', $ownOjt->id));

    $this->actingAs($companyAdmin)
        ->get(route('company.ojts.show', $ownOjt))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/ojt-reports')
            ->where('ojt.id', $ownOjt->id)
            ->has('reports', 1)
            ->where('reports.0.summary', $report->summary));

    $this->actingAs($companyAdmin)
        ->get(route('company.ojts.show', $otherOjt))
        ->assertNotFound();

    $this->actingAs($companyAdmin)
        ->patch(route('reports.update', $report), ['summary' => 'Not allowed.'])
        ->assertForbidden();
});

test('a company administrator can filter and paginate managed OJTs', function () {
    $company = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);

    User::factory()->count(12)->create([
        'company_id' => $company->id,
        'company' => $company->name,
    ]);
    $completedOjt = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'name' => 'Completed Intern',
        'end_date' => now()->toDateString(),
    ]);

    $this->actingAs($companyAdmin)
        ->get(route('company.ojts.index', ['search' => 'Completed', 'status' => 'completed']))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('company/dashboard')
            ->has('ojts', 1)
            ->where('ojts.0.id', $completedOjt->id)
            ->where('pagination.total', 1)
            ->where('filters.search', 'Completed')
            ->where('filters.status', 'completed'));

    $this->actingAs($companyAdmin)
        ->get(route('company.ojts.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->has('ojts', 12)
            ->where('pagination.total', 13)
            ->where('pagination.lastPage', 2));
});

test('an OJT cannot access company management pages', function () {
    $ojt = User::factory()->create();

    $this->actingAs($ojt)
        ->get(route('company.ojts.index'))
        ->assertForbidden();
});

test('an OJT must change the temporary password before accessing reports', function () {
    $ojt = User::factory()->create(['must_change_password' => true]);

    $this->actingAs($ojt)
        ->get(route('reports.index'))
        ->assertRedirect(route('security.edit', absolute: false));
});

test('a company administrator can delete one of their OJT accounts', function () {
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
        ->delete(route('company.ojts.destroy', $ojt))
        ->assertRedirect(route('company.ojts.index', absolute: false));

    $this->assertModelMissing($ojt);
});

test('a company administrator cannot delete an OJT from another company', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);
    $otherOjt = User::factory()->create([
        'company_id' => $otherCompany->id,
        'company' => $otherCompany->name,
    ]);

    $this->actingAs($companyAdmin)
        ->delete(route('company.ojts.destroy', $otherOjt))
        ->assertNotFound();

    $this->assertModelExists($otherOjt);
});
