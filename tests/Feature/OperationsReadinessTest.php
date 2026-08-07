<?php

use App\Models\Company;
use App\Models\User;
use Illuminate\Support\Facades\Storage;

test('only company administrators can view system operations', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $ojt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($admin)->get(route('company.operations.index'))->assertSuccessful();
    $this->actingAs($ojt)->get(route('company.operations.index'))->assertForbidden();
});

test('an OJT can download a portable privacy export', function () {
    Storage::fake('local');
    $company = Company::factory()->create();
    $ojt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($ojt);
    session(['auth.password_confirmed_at' => time()]);
    $this->get(route('privacy.export'))->assertSuccessful()->assertHeader('content-type', 'application/json');
});
