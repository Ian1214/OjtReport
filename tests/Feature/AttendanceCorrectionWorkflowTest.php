<?php

use App\Models\AttendanceCorrectionRequest;
use App\Models\Company;
use App\Models\DailyReport;
use App\Models\User;
use App\Notifications\AttendanceCorrectionUpdated;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

function correctionActors(): array
{
    $company = Company::factory()->create();
    $admin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
    ]);
    $supervisor = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'supervisor',
    ]);
    $ojt = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'supervisor_id' => $supervisor->id,
        'required_hours' => 8,
    ]);
    $report = DailyReport::factory()->for($ojt)->create([
        'report_date' => '2026-08-06',
        'time_in' => '08:00:00',
        'time_out' => '17:00:00',
        'total_hours' => 8,
        'approval_status' => DailyReport::STATUS_APPROVED,
    ]);

    return [$company, $admin, $supervisor, $ojt, $report];
}

test('an OJT can request a correction without changing approved attendance', function () {
    Notification::fake();
    [, , $supervisor, $ojt, $report] = correctionActors();

    $this->actingAs($ojt)
        ->post(route('attendance-corrections.store', $report), [
            'proposed_time_in' => '08:30',
            'reason' => 'The original time was recorded before I arrived.',
        ])
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    $correction = AttendanceCorrectionRequest::query()->firstOrFail();
    expect($correction)
        ->original_time_in->toBe('08:00:00')
        ->original_time_out->toBe('17:00:00')
        ->proposed_time_in->toBe('08:30:00')
        ->status->toBe(AttendanceCorrectionRequest::STATUS_PENDING_SUPERVISOR);
    expect($report->refresh())
        ->time_in->toBe('08:00:00')
        ->total_hours->toBe('8.00');
    Notification::assertSentTo($supervisor, AttendanceCorrectionUpdated::class);

    $this->actingAs($ojt)
        ->post(route('attendance-corrections.store', $report), [
            'proposed_time_in' => '08:45',
            'reason' => 'A second pending request should not be accepted.',
        ])
        ->assertInvalid('attendance');
});

test('the assigned supervisor reviews and forwards a correction to the administrator', function () {
    Notification::fake();
    [, $admin, $supervisor, $ojt, $report] = correctionActors();
    $correction = AttendanceCorrectionRequest::factory()->create([
        'daily_report_id' => $report->id,
        'requested_by' => $ojt->id,
        'status' => AttendanceCorrectionRequest::STATUS_PENDING_SUPERVISOR,
    ]);

    $this->actingAs($supervisor)
        ->patch(route('attendance-corrections.supervisor-review', $correction), [
            'supervisor_comment' => 'I verified the corrected arrival time with the attendance log.',
        ])
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    expect($correction->refresh())
        ->status->toBe(AttendanceCorrectionRequest::STATUS_PENDING_ADMIN)
        ->supervisor_reviewed_by->toBe($supervisor->id)
        ->supervisor_reviewed_at->not->toBeNull();
    Notification::assertSentTo($admin, AttendanceCorrectionUpdated::class);
});

test('final approval updates the report recalculates hours and preserves the audit snapshot', function () {
    Notification::fake();
    [, $admin, $supervisor, $ojt, $report] = correctionActors();
    $ojt->update(['end_date' => '2026-08-06']);
    $correction = AttendanceCorrectionRequest::factory()->create([
        'daily_report_id' => $report->id,
        'requested_by' => $ojt->id,
        'original_time_in' => '08:00:00',
        'original_time_out' => '17:00:00',
        'proposed_time_in' => '09:00:00',
        'status' => AttendanceCorrectionRequest::STATUS_PENDING_ADMIN,
    ]);

    $this->actingAs($admin)
        ->patch(route('attendance-corrections.approve', $correction))
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'success');

    expect($report->refresh())
        ->time_in->toBe('09:00:00')
        ->time_out->toBe('17:00:00')
        ->total_hours->toBe('7.00');
    expect($correction->refresh())
        ->status->toBe(AttendanceCorrectionRequest::STATUS_APPROVED)
        ->original_time_in->toBe('08:00:00')
        ->reviewed_by->toBe($admin->id)
        ->reviewed_at->not->toBeNull();
    expect($ojt->refresh()->end_date)->toBeNull();
    Notification::assertSentTo($ojt, AttendanceCorrectionUpdated::class);
    Notification::assertSentTo($supervisor, AttendanceCorrectionUpdated::class);
});

test('rejection preserves original attendance and other companies cannot finalize requests', function () {
    Notification::fake();
    [, $admin, , $ojt, $report] = correctionActors();
    $otherCompany = Company::factory()->create();
    $otherAdmin = User::factory()->create([
        'company_id' => $otherCompany->id,
        'role' => 'company_admin',
    ]);
    $correction = AttendanceCorrectionRequest::factory()->create([
        'daily_report_id' => $report->id,
        'requested_by' => $ojt->id,
        'status' => AttendanceCorrectionRequest::STATUS_PENDING_ADMIN,
    ]);

    $this->actingAs($otherAdmin)
        ->patch(route('attendance-corrections.approve', $correction))
        ->assertNotFound();

    $this->actingAs($admin)
        ->patch(route('attendance-corrections.reject', $correction), [
            'admin_comment' => 'The attendance log confirms the original recorded time.',
        ])
        ->assertRedirect()
        ->assertInertiaFlash('toast.type', 'warning');

    expect($correction->refresh())
        ->status->toBe(AttendanceCorrectionRequest::STATUS_REJECTED)
        ->admin_comment->toBe('The attendance log confirms the original recorded time.');
    expect($report->refresh())
        ->time_in->toBe('08:00:00')
        ->time_out->toBe('17:00:00');
});

test('invalid correction times and unauthorized reports are rejected', function () {
    [, , , $ojt, $report] = correctionActors();
    $otherOjt = User::factory()->create();

    $this->actingAs($ojt)
        ->post(route('attendance-corrections.store', $report), [
            'proposed_time_in' => '18:00',
            'reason' => 'This proposed time would occur after time out.',
        ])
        ->assertInvalid('attendance');

    $this->actingAs($otherOjt)
        ->post(route('attendance-corrections.store', $report), [
            'proposed_time_in' => '08:30',
            'reason' => 'This report does not belong to this OJT account.',
        ])
        ->assertForbidden();
});

test('correction queues and sidebar counts are scoped to the current company', function () {
    [$company, $admin, , $ojt, $report] = correctionActors();
    $ownCorrection = AttendanceCorrectionRequest::factory()->create([
        'daily_report_id' => $report->id,
        'requested_by' => $ojt->id,
        'status' => AttendanceCorrectionRequest::STATUS_PENDING_ADMIN,
    ]);
    $otherCompany = Company::factory()->create();
    $otherOjt = User::factory()->create(['company_id' => $otherCompany->id]);
    $otherReport = DailyReport::factory()->for($otherOjt)->create();
    AttendanceCorrectionRequest::factory()->create([
        'daily_report_id' => $otherReport->id,
        'requested_by' => $otherOjt->id,
        'status' => AttendanceCorrectionRequest::STATUS_PENDING_ADMIN,
    ]);

    $this->actingAs($admin)
        ->get(route('attendance-corrections.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('attendance-corrections/index')
            ->has('corrections.data', 1)
            ->where('corrections.data.0.id', $ownCorrection->id)
            ->where('navigation.pendingCorrectionsCount', 1));
});
