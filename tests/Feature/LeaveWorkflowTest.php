<?php

use App\Models\Company;
use App\Models\LeaveRequest;
use App\Models\User;
use Illuminate\Support\Carbon;

test('leave follows supervisor and administrator approval', function () {
    Carbon::setTestNow('2026-08-07 09:00:00');
    $company = Company::factory()->create();
    $admin = User::factory()->create(['company_id' => $company->id, 'role' => 'company_admin']);
    $supervisor = User::factory()->create(['company_id' => $company->id, 'role' => 'supervisor']);
    $ojt = User::factory()->create(['company_id' => $company->id, 'supervisor_id' => $supervisor->id]);

    $this->actingAs($ojt)->post(route('leave.store'), [
        'type' => 'leave', 'start_date' => '2026-08-10', 'end_date' => '2026-08-11',
        'reason' => 'Required university appointment.',
    ])->assertRedirect();

    $leave = LeaveRequest::query()->sole();
    expect($leave->status)->toBe(LeaveRequest::STATUS_PENDING_SUPERVISOR);

    $this->actingAs($supervisor)->patch(route('leave.review', $leave), ['decision' => 'approve', 'comment' => 'Approved by supervisor.'])->assertRedirect();
    expect($leave->refresh()->status)->toBe(LeaveRequest::STATUS_PENDING_ADMIN);

    $this->actingAs($admin)->patch(route('leave.review', $leave), ['decision' => 'approve'])->assertRedirect();
    expect($leave->refresh())->status->toBe(LeaveRequest::STATUS_APPROVED)->reviewed_by->toBe($admin->id);
});

test('attendance is blocked on a company holiday', function () {
    Carbon::setTestNow('2026-08-10 08:00:00');
    $company = Company::factory()->create();
    $company->holidays()->create(['holiday_date' => '2026-08-10', 'name' => 'Company holiday']);
    $ojt = User::factory()->create(['company_id' => $company->id]);

    $this->actingAs($ojt)->post(route('reports.time-in'))->assertInvalid('attendance');
    expect($ojt->dailyReports()->count())->toBe(0);
});
