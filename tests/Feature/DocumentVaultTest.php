<?php

use App\Models\Company;
use App\Models\Document;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

beforeEach(function () {
    config(['operations.security.require_privileged_mfa' => false]);
});

test('an administrator uploads a private document assigned to its OJT', function () {
    Storage::fake('local');
    $company = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $ojt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($admin)->post(route('documents.store'), [
        'title' => 'Signed MOA',
        'category' => 'moa',
        'ojt_id' => $ojt->id,
        'shared_with_school' => true,
        'document' => UploadedFile::fake()->create('agreement.pdf', 120, 'application/pdf'),
    ])->assertRedirect(route('documents.index'))->assertSessionHasNoErrors();

    $document = Document::query()->sole();
    expect($document->company_id)->toBe($company->id)
        ->and($document->ojt_id)->toBe($ojt->id)
        ->and($document->shared_with_school)->toBeTrue()
        ->and($document->status)->toBe(Document::STATUS_APPROVED);
    Storage::disk('local')->assertExists($document->path);
});

test('an OJT submits a document only for their own account and awaits administrator review', function () {
    Storage::fake('local');
    $company = Company::factory()->create();
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $otherOjt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($ojt)->post(route('documents.store'), [
        'title' => 'My endorsement letter',
        'category' => 'endorsement',
        'document' => UploadedFile::fake()->create('endorsement.pdf', 100, 'application/pdf'),
    ])->assertRedirect(route('documents.index'))->assertSessionHasNoErrors();

    $document = Document::query()->sole();
    expect($document->ojt_id)->toBe($ojt->id)
        ->and($document->uploaded_by)->toBe($ojt->id)
        ->and($document->status)->toBe(Document::STATUS_PENDING)
        ->and($document->shared_with_school)->toBeFalse();

    $this->actingAs($ojt)->post(route('documents.store'), [
        'title' => 'Spoofed assignment',
        'category' => 'other',
        'ojt_id' => $otherOjt->id,
        'shared_with_school' => true,
        'document' => UploadedFile::fake()->create('other.pdf', 100, 'application/pdf'),
    ])->assertInvalid(['ojt_id', 'shared_with_school']);
});

test('an administrator reviews student submissions before other stakeholders can access them', function () {
    Storage::fake('local');
    $company = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'uploaded_by' => $ojt->id,
        'status' => Document::STATUS_PENDING,
    ]);
    Storage::disk('local')->put($document->path, 'document');

    $this->actingAs($supervisor)->get(route('documents.download', $document))->assertForbidden();

    $this->actingAs($admin)->patch(route('documents.review', $document), [
        'status' => Document::STATUS_APPROVED,
    ])->assertRedirect(route('documents.index'))->assertSessionHasNoErrors();

    expect($document->refresh()->status)->toBe(Document::STATUS_APPROVED)
        ->and($document->reviewed_by)->toBe($admin->id)
        ->and($document->reviewed_at)->not->toBeNull();
    $this->actingAs($supervisor)->get(route('documents.download', $document))->assertSuccessful();
});

test('an administrator can return a student document with feedback', function () {
    $company = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'uploaded_by' => $ojt->id,
        'status' => Document::STATUS_PENDING,
    ]);

    $this->actingAs($admin)->patch(route('documents.review', $document), [
        'status' => Document::STATUS_REJECTED,
        'rejection_reason' => 'Upload the page with both signatures visible.',
    ])->assertRedirect(route('documents.index'))->assertSessionHasNoErrors();

    expect($document->refresh()->status)->toBe(Document::STATUS_REJECTED)
        ->and($document->rejection_reason)->toBe('Upload the page with both signatures visible.');
});

test('documents are visible only to authorized stakeholders', function () {
    Storage::fake('local');
    $school = School::factory()->create();
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'school_id' => $school->id]);
    $otherOjt = User::factory()->create(['company_id' => $otherCompany->id]);
    $coordinator = User::factory()->create(['company_id' => null, 'school_id' => $school->id, 'role' => 'school_coordinator']);
    $document = Document::factory()->create(['company_id' => $company->id, 'ojt_id' => $ojt->id, 'uploaded_by' => $admin->id, 'shared_with_school' => true]);
    Storage::disk('local')->put($document->path, 'document');

    $this->actingAs($ojt)->get(route('documents.download', $document))->assertSuccessful();
    $this->actingAs($coordinator)->get(route('documents.download', $document))->assertSuccessful();
    $this->actingAs($otherOjt)->get(route('documents.download', $document))->assertForbidden();
});

test('authorized stakeholders can preview supported documents inline', function () {
    Storage::fake('local');
    $school = School::factory()->create();
    $company = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company_admin',
    ]);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'school_id' => $school->id,
    ]);
    $coordinator = User::factory()->create([
        'company_id' => null,
        'school_id' => $school->id,
        'role' => 'school_coordinator',
    ]);
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'uploaded_by' => $admin->id,
        'shared_with_school' => true,
        'mime_type' => 'application/pdf',
    ]);
    Storage::disk('local')->put($document->path, 'document');

    $this->actingAs($coordinator)
        ->get(route('documents.preview', $document))
        ->assertSuccessful()
        ->assertHeader('content-type', 'application/pdf')
        ->assertHeader('content-disposition', 'inline; filename=example.pdf');
});

test('unsupported documents cannot be rendered as an inline preview', function () {
    Storage::fake('local');
    $company = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company_admin',
    ]);
    $ojt = User::factory()->create(['company_id' => $company->id]);
    $document = Document::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $ojt->id,
        'uploaded_by' => $admin->id,
        'mime_type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ]);
    Storage::disk('local')->put($document->path, 'document');

    $this->actingAs($admin)
        ->get(route('documents.preview', $document))
        ->assertUnsupportedMediaType();
});

test('school coordinators cannot access documents not explicitly shared', function () {
    $school = School::factory()->create();
    $company = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'school_id' => $school->id]);
    $coordinator = User::factory()->create(['company_id' => null, 'school_id' => $school->id, 'role' => 'school_coordinator']);
    $document = Document::factory()->create(['company_id' => $company->id, 'ojt_id' => $ojt->id, 'uploaded_by' => $admin->id, 'shared_with_school' => false]);

    $this->actingAs($coordinator)->get(route('documents.download', $document))->assertForbidden();
});

test('an administrator can browse document folders only for students in their company', function () {
    $company = Company::factory()->create();
    $otherCompany = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company_admin',
    ]);
    $ian = User::factory()->create([
        'company_id' => $company->id,
        'name' => 'Ian Cadiz',
    ]);
    $otherStudent = User::factory()->create(['company_id' => $company->id]);
    $outsideStudent = User::factory()->create(['company_id' => $otherCompany->id]);

    Document::factory()->count(2)->create([
        'company_id' => $company->id,
        'ojt_id' => $ian->id,
        'uploaded_by' => $admin->id,
    ]);
    Document::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $otherStudent->id,
        'uploaded_by' => $admin->id,
    ]);

    $this->actingAs($admin)
        ->get(route('documents.index', ['ojt' => $ian->id]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('documents/index')
            ->where('selectedStudent.id', $ian->id)
            ->where('selectedStudent.name', 'Ian Cadiz')
            ->has('studentFolders', 2)
            ->where('documents.data.0.ojt.name', 'Ian Cadiz')
            ->where('documents.data.1.ojt.name', 'Ian Cadiz')
            ->has('documents.data', 2));

    $this->actingAs($admin)
        ->get(route('documents.index', ['ojt' => $outsideStudent->id]))
        ->assertNotFound();
});

test('a school coordinator sees student folders and counts only approved shared documents', function () {
    $school = School::factory()->create();
    $otherSchool = School::factory()->create();
    $company = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company_admin',
    ]);
    $student = User::factory()->create([
        'company_id' => $company->id,
        'school_id' => $school->id,
        'name' => 'Ian Cadiz',
    ]);
    $outsideStudent = User::factory()->create([
        'company_id' => $company->id,
        'school_id' => $otherSchool->id,
    ]);
    $coordinator = User::factory()->create([
        'company_id' => null,
        'school_id' => $school->id,
        'role' => 'school_coordinator',
    ]);

    Document::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $student->id,
        'uploaded_by' => $admin->id,
        'status' => Document::STATUS_APPROVED,
        'shared_with_school' => true,
    ]);
    Document::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $student->id,
        'uploaded_by' => $admin->id,
        'status' => Document::STATUS_APPROVED,
        'shared_with_school' => false,
    ]);
    Document::factory()->create([
        'company_id' => $company->id,
        'ojt_id' => $student->id,
        'uploaded_by' => $admin->id,
        'status' => Document::STATUS_PENDING,
        'shared_with_school' => true,
    ]);

    $this->actingAs($coordinator)
        ->get(route('documents.index', ['ojt' => $student->id]))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('documents/index')
            ->has('studentFolders', 1)
            ->where('studentFolders.0.name', 'Ian Cadiz')
            ->where('studentFolders.0.documentsCount', 1)
            ->has('documents.data', 1)
            ->where('documents.data.0.sharedWithSchool', true)
            ->where('documents.data.0.status', Document::STATUS_APPROVED));

    $this->actingAs($coordinator)
        ->get(route('documents.index', ['ojt' => $outsideStudent->id]))
        ->assertNotFound();
});
