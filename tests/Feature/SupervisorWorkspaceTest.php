<?php

use App\Models\Company;
use App\Models\DirectMessage;
use App\Models\OjtTask;
use App\Models\User;
use App\Notifications\OjtAccountCreated;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

test('a company administrator can create a supervisor account and assign it to an OJT', function () {
    Notification::fake();

    $company = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);
    $ojt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($companyAdmin)
        ->post(route('company.supervisors.store'), [
            'name' => 'Maria Supervisor',
            'email' => 'maria.supervisor@example.test',
        ])
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    $supervisor = User::query()->where('email', 'maria.supervisor@example.test')->firstOrFail();

    expect($supervisor->role)->toBe('supervisor')
        ->and($supervisor->company_id)->toBe($company->id)
        ->and($supervisor->must_change_password)->toBeTrue();
    Notification::assertSentTo($supervisor, OjtAccountCreated::class);

    $this->actingAs($companyAdmin)
        ->patch(route('company.ojts.update-supervisor', $ojt), ['supervisor_id' => $supervisor->id])
        ->assertRedirect(route('company.ojts.index', absolute: false));

    expect($ojt->refresh()->supervisor_id)->toBe($supervisor->id)
        ->and($ojt->supervisor_name)->toBe($supervisor->name);
});

test('a supervisor can manage tasks only for assigned OJTs', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $assignedOjt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);
    $unassignedOjt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($supervisor)
        ->post(route('supervisor.tasks.store', $assignedOjt), [
            'title' => 'Prepare daily report',
            'description' => 'Include the testing summary.',
            'due_date' => '2026-08-10',
        ])
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    $task = OjtTask::query()->where('ojt_id', $assignedOjt->id)->firstOrFail();

    expect($task->supervisor_id)->toBe($supervisor->id)
        ->and($task->status)->toBe('not_started');

    $this->actingAs($supervisor)
        ->post(route('supervisor.tasks.store', $unassignedOjt), ['title' => 'Forbidden task'])
        ->assertNotFound();
});

test('an OJT can update only their own assigned task status', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);
    $otherOjt = User::factory()->create(['company_id' => $company->id]);
    $task = OjtTask::factory()->create(['ojt_id' => $ojt->id, 'supervisor_id' => $supervisor->id]);

    $this->actingAs($ojt)
        ->patch(route('tasks.update-status', $task), ['status' => 'ongoing'])
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    expect($task->refresh()->status)->toBe('ongoing');

    $this->actingAs($otherOjt)
        ->patch(route('tasks.update-status', $task), ['status' => 'finished'])
        ->assertNotFound();
});

test('a supervisor dashboard only includes OJTs assigned to that supervisor', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $assignedOjt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
        'last_seen_at' => now(),
    ]);
    User::factory()->create(['company_id' => $company->id]);
    DirectMessage::factory()->create([
        'sender_id' => $assignedOjt->id,
        'recipient_id' => $supervisor->id,
    ]);

    $this->actingAs($supervisor)
        ->get(route('supervisor.dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('supervisor/dashboard')
            ->has('ojts', 1)
            ->where('ojts.0.id', $assignedOjt->id)
            ->where('ojts.0.isOnline', true)
            ->where('ojts.0.unreadCount', 1));
});

test('an assigned supervisor and OJT can privately message each other', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'supervisor',
    ]);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
    ]);

    $this->actingAs($supervisor)
        ->post(route('messages.store', $ojt), ['body' => 'Please review your assigned task.'])
        ->assertRedirect(route('messages.show', $ojt, absolute: false));

    $message = DirectMessage::query()->firstOrFail();

    expect($message->sender_id)->toBe($supervisor->id)
        ->and($message->recipient_id)->toBe($ojt->id)
        ->and($message->body)->toBe('Please review your assigned task.');

    $this->actingAs($ojt)
        ->get(route('messages.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('contacts.0.id', $supervisor->id)
            ->where('contacts.0.isOnline', true)
            ->where('contacts.0.unreadCount', 1)
            ->where('navigation.unreadMessagesCount', 1));

    $this->actingAs($ojt)
        ->get(route('messages.show', $supervisor))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('messages/index')
            ->where('participant.id', $supervisor->id)
            ->has('messages', 1)
            ->where('messages.0.body', $message->body)
            ->where('messages.0.isMine', false)
            ->where('participant.isOnline', true));

    expect($message->refresh()->read_at)->not->toBeNull();

    $this->actingAs($supervisor)
        ->get(route('messages.show', $ojt))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->where('messages.0.isMine', true)
            ->where('messages.0.isRead', true)
            ->where('navigation.unreadMessagesCount', 0));
});

test('users cannot open or send messages outside their assigned conversation', function () {
    $company = Company::factory()->create();
    $supervisor = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'supervisor',
    ]);
    $unassignedOjt = User::factory()->create(['company_id' => $company->id]);
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'company_admin',
    ]);

    $this->actingAs($supervisor)
        ->get(route('messages.show', $unassignedOjt))
        ->assertNotFound();

    $this->actingAs($supervisor)
        ->post(route('messages.store', $unassignedOjt), ['body' => 'Not allowed'])
        ->assertNotFound();

    $this->actingAs($companyAdmin)
        ->get(route('messages.index'))
        ->assertForbidden();

    expect(DirectMessage::query()->count())->toBe(0);
});

test('assigned users can send private images that outsiders cannot access', function () {
    Storage::fake('local');

    $company = Company::factory()->create();
    $supervisor = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'supervisor',
    ]);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
    ]);
    $outsider = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($supervisor)
        ->post(route('messages.store', $ojt), [
            'image' => UploadedFile::fake()->image('work-area.jpg', 1200, 800),
        ])
        ->assertRedirect(route('messages.show', $ojt, absolute: false));

    $message = DirectMessage::query()->firstOrFail();

    expect($message->body)->toBeNull()
        ->and($message->image_path)->not->toBeNull();
    Storage::disk('local')->assertExists($message->image_path);

    $this->actingAs($ojt)
        ->get(route('messages.image', $message))
        ->assertSuccessful();

    $this->actingAs($outsider)
        ->get(route('messages.image', $message))
        ->assertNotFound();
});

test('senders can edit messages for ten minutes and delete their own messages', function () {
    Storage::fake('local');

    $company = Company::factory()->create();
    $supervisor = User::factory()->create([
        'company_id' => $company->id,
        'role' => 'supervisor',
    ]);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'supervisor_id' => $supervisor->id,
    ]);
    Storage::disk('local')->put('chat-images/message.jpg', 'image contents');
    $message = DirectMessage::factory()->create([
        'sender_id' => $supervisor->id,
        'recipient_id' => $ojt->id,
        'body' => 'Original message',
        'image_path' => 'chat-images/message.jpg',
    ]);

    $this->actingAs($supervisor)
        ->patch(route('messages.update', $message), ['body' => 'Corrected message'])
        ->assertRedirect();

    expect($message->refresh()->body)->toBe('Corrected message')
        ->and($message->edited_at)->not->toBeNull();

    $this->travel(11)->minutes();

    $this->actingAs($supervisor)
        ->patch(route('messages.update', $message), ['body' => 'Too late'])
        ->assertForbidden();

    $this->actingAs($ojt)
        ->delete(route('messages.destroy', $message))
        ->assertNotFound();

    $this->actingAs($supervisor)
        ->delete(route('messages.destroy', $message))
        ->assertRedirect();

    $this->assertModelMissing($message);
    Storage::disk('local')->assertMissing('chat-images/message.jpg');
});
