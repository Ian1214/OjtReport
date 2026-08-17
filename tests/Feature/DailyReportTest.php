<?php

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\DtrSubmission;
use App\Models\User;
use Illuminate\Support\Carbon;

test('an OJT can time in using the current system time', function () {
    Carbon::setTestNow('2026-08-03 08:30:15');
    $user = User::factory()->create();

    $response = $this->actingAs($user)->post(route('reports.time-in'));

    $report = DailyReport::query()->whereBelongsTo($user)->firstOrFail();

    $response->assertRedirect(route('reports.index', absolute: false));
    $this->assertModelExists($report);
    expect($report)
        ->report_date->toDateString()->toBe('2026-08-03')
        ->time_in->toBe('08:30:15')
        ->time_out->toBeNull()
        ->summary->toBeNull();
    expect($report)
        ->scheduled_time_in->toBe('08:00:00')
        ->attendance_status->toBe(DailyReport::ATTENDANCE_LATE)
        ->late_minutes->toBe(31);
});

test('an OJT can time in when configured work days are stored as strings', function () {
    Carbon::setTestNow('2026-08-13 08:30:15');
    $company = Company::factory()->create([
        'work_days' => ['1', '2', '3', '4', '5'],
    ]);
    $user = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
    ]);

    $this->actingAs($user)
        ->post(route('reports.time-in'))
        ->assertRedirect(route('reports.index', absolute: false));

    expect($user->dailyReports()->firstOrFail())
        ->report_date->toDateString()->toBe('2026-08-13')
        ->time_in->toBe('08:30:15');
});

test('an OJT can submit a previous workday for company approval', function () {
    Carbon::setTestNow('2026-08-11 10:00:00');
    $company = Company::factory()->create();
    $user = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'start_date' => '2026-08-04',
    ]);

    $response = $this->actingAs($user)->post(route('reports.historical.store'), [
        'report_date' => '2026-08-04',
        'time_in' => '08:00',
        'time_out' => '17:00',
        'summary' => 'Completed onboarding and prepared the assigned workstation.',
    ]);

    $response
        ->assertRedirect(route('reports.index', absolute: false))
        ->assertInertiaFlash('toast.type', 'success');

    $report = $user->dailyReports()->firstOrFail();

    expect($report)
        ->report_date->toDateString()->toBe('2026-08-04')
        ->time_in->toBe('08:00:00')
        ->time_out->toBe('17:00:00')
        ->total_hours->toBe('8.00')
        ->approval_status->toBe(DailyReport::STATUS_PENDING)
        ->attendance_status->toBe(DailyReport::ATTENDANCE_ON_TIME)
        ->late_minutes->toBe(0);
    expect($user->refresh()->end_date)->toBeNull();

    $this->actingAs($user)
        ->get(route('reports.index'))
        ->assertSuccessful()
        ->assertInertia(fn ($page) => $page
            ->where('reports.0.is_historical', true)
            ->where('historicalEntry.earliestDate', '2026-08-04')
            ->where('historicalEntry.latestDate', '2026-08-10')
            ->where('historicalEntry.enabled', true));
});

test('historical workdays must be within the OJT period and use an unused past date', function () {
    Carbon::setTestNow('2026-08-11 10:00:00');
    $company = Company::factory()->create();
    $user = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'start_date' => '2026-08-04',
    ]);
    DailyReport::factory()->for($user)->create(['report_date' => '2026-08-05']);
    $validPayload = [
        'time_in' => '08:00',
        'time_out' => '17:00',
        'summary' => 'Completed verified historical OJT work for this date.',
    ];

    foreach (['2026-08-03', '2026-08-11', '2026-08-12', '2026-08-05'] as $reportDate) {
        $this->actingAs($user)
            ->post(route('reports.historical.store'), [
                ...$validPayload,
                'report_date' => $reportDate,
            ])
            ->assertInvalid('report_date');
    }

    $this->actingAs($user)
        ->post(route('reports.historical.store'), [
            ...$validPayload,
            'report_date' => '2026-08-06',
            'time_in' => '17:00',
            'time_out' => '08:00',
        ])
        ->assertInvalid('time_out');

    expect($user->dailyReports()->count())->toBe(1);
});

test('historical workdays cannot alter dates covered by a submitted DTR', function () {
    Carbon::setTestNow('2026-08-11 10:00:00');
    $company = Company::factory()->create();
    $user = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'start_date' => '2026-08-04',
    ]);
    DtrSubmission::factory()->create([
        'company_id' => $company->id,
        'user_id' => $user->id,
        'period_start' => '2026-08-04',
        'period_end' => '2026-08-08',
    ]);

    $this->actingAs($user)
        ->post(route('reports.historical.store'), [
            'report_date' => '2026-08-06',
            'time_in' => '08:00',
            'time_out' => '17:00',
            'summary' => 'Attempted historical work entry in a submitted period.',
        ])
        ->assertInvalid('report_date');

    expect($user->dailyReports()->count())->toBe(0);
});

test('company administrators cannot submit historical OJT workdays', function () {
    Carbon::setTestNow('2026-08-11 10:00:00');
    $company = Company::factory()->create();
    $companyAdmin = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
        'role' => 'company_admin',
        'start_date' => '2026-08-04',
    ]);

    $this->actingAs($companyAdmin)
        ->post(route('reports.historical.store'), [
            'report_date' => '2026-08-04',
            'time_in' => '08:00',
            'time_out' => '17:00',
            'summary' => 'Administrators must not create attendance for an OJT.',
        ])
        ->assertForbidden();
});

test('time in uses the company schedule and grace period', function (
    string $timeIn,
    string $expectedStatus,
    int $expectedLateMinutes,
) {
    Carbon::setTestNow("2026-08-03 {$timeIn}");
    $company = Company::factory()->create([
        'work_start_time' => '08:00:00',
        'late_grace_minutes' => 10,
    ]);
    $user = User::factory()->create([
        'company_id' => $company->id,
        'company' => $company->name,
    ]);

    $this->actingAs($user)->post(route('reports.time-in'))->assertRedirect();

    $report = $user->dailyReports()->firstOrFail();
    expect($report)
        ->scheduled_time_in->toBe('08:00:00')
        ->scheduled_grace_minutes->toBe(10)
        ->attendance_status->toBe($expectedStatus)
        ->late_minutes->toBe($expectedLateMinutes);
})->with([
    'before start' => ['07:59:59', DailyReport::ATTENDANCE_ON_TIME, 0],
    'at start' => ['08:00:00', DailyReport::ATTENDANCE_ON_TIME, 0],
    'inside grace period' => ['08:10:00', DailyReport::ATTENDANCE_ON_TIME, 0],
    'after grace period' => ['08:10:01', DailyReport::ATTENDANCE_LATE, 11],
    'late by part of a minute rounds up' => ['08:31:01', DailyReport::ATTENDANCE_LATE, 32],
]);

test('an OJT can time out after timing in', function () {
    Carbon::setTestNow('2026-08-03 17:00:30');
    $user = User::factory()->create();
    $report = DailyReport::factory()->for($user)->create([
        'report_date' => '2026-08-03',
        'time_in' => '08:30:15',
        'time_out' => null,
        'total_hours' => null,
        'summary' => null,
    ]);

    $response = $this->actingAs($user)->post(route('reports.time-out', $report));

    $response->assertRedirect(route('reports.index', absolute: false));
    expect($report->refresh())
        ->time_out->toBe('17:00:30')
        ->summary->toBeNull()
        ->total_hours->toBeNull();
});

test('an OJT submission stays pending and is excluded from the DTR until approval', function () {
    $user = User::factory()->create(['required_hours' => 7.5]);
    $report = DailyReport::factory()->for($user)->create([
        'report_date' => '2026-08-03',
        'time_in' => '08:30:00',
        'time_out' => '17:00:00',
        'total_hours' => null,
        'summary' => null,
    ]);

    $response = $this->actingAs($user)->patch(route('reports.complete', $report), [
        'summary' => 'Updated the OJT reporting module and tested the attendance flow.',
    ]);

    $response->assertRedirect(route('reports.index', absolute: false));
    expect($report->refresh())
        ->total_hours->toBe('7.50')
        ->summary->toBe('Updated the OJT reporting module and tested the attendance flow.')
        ->approval_status->toBe(DailyReport::STATUS_PENDING);
    expect($user->refresh()->end_date)->toBeNull();

    $this->actingAs($user)
        ->get(route('reports.dtr'))
        ->assertSuccessful()
        ->assertDontSee('7.50');
});

test('daily report totals deduct lunch only for attendance that spans the full lunch period', function (
    string $timeIn,
    string $timeOut,
    float $expectedHours,
) {
    expect(DailyReport::calculateTotalHours(
        Carbon::createFromFormat('H:i:s', $timeIn),
        Carbon::createFromFormat('H:i:s', $timeOut),
    ))->toBe($expectedHours);
})->with([
    'full day through lunch' => ['08:00:00', '17:00:00', 8.0],
    'morning only' => ['08:00:00', '12:00:00', 4.0],
    'afternoon only' => ['13:00:00', '17:00:00', 4.0],
    'ends at six after lunch' => ['08:00:00', '18:00:00', 9.0],
]);

test('an OJT cannot create a second report or time out another OJT report', function () {
    Carbon::setTestNow('2026-08-03 09:00:00');
    $user = User::factory()->create();
    $otherUser = User::factory()->create();
    $activeReport = DailyReport::factory()->for($user)->create([
        'report_date' => '2026-08-03',
        'time_out' => null,
        'total_hours' => null,
        'summary' => null,
    ]);
    $otherReport = DailyReport::factory()->for($otherUser)->create([
        'time_out' => null,
        'total_hours' => null,
        'summary' => null,
    ]);

    $this->actingAs($user)
        ->post(route('reports.time-in'))
        ->assertInvalid('attendance');

    $this->actingAs($user)
        ->post(route('reports.time-out', $otherReport))
        ->assertForbidden();

    expect($activeReport->refresh()->time_out)->toBeNull();
});

test('users can view only their completed report history', function () {
    $user = User::factory()->create();
    $ownReport = DailyReport::factory()->for($user)->create();
    DailyReport::factory()->for($user)->create([
        'time_out' => null,
        'total_hours' => null,
        'summary' => null,
    ]);
    $otherReport = DailyReport::factory()->create(['total_hours' => 7.25]);

    $response = $this->actingAs($user)->get(route('reports.index'));

    $response->assertSuccessful();
    $response->assertSee($ownReport->summary);
    $response->assertDontSee($otherReport->summary);
});

test('an OJT can correct and resubmit a rejected report', function () {
    $user = User::factory()->create();
    $report = DailyReport::factory()->for($user)->create([
        'time_in' => '08:30:00',
        'time_out' => '17:00:00',
        'total_hours' => 8.5,
        'summary' => 'Original summary.',
        'approval_status' => DailyReport::STATUS_REJECTED,
        'rejection_reason' => 'Please add the completed task details.',
    ]);

    $response = $this->actingAs($user)->patch(route('reports.update', $report), [
        'summary' => 'Corrected summary of the completed work.',
    ]);

    $response->assertRedirect(route('reports.index', absolute: false));
    expect($report->refresh())
        ->summary->toBe('Corrected summary of the completed work.')
        ->approval_status->toBe(DailyReport::STATUS_PENDING)
        ->rejection_reason->toBeNull()
        ->time_in->toBe('08:30:00')
        ->time_out->toBe('17:00:00');
});

test('an OJT can delete a rejected report', function () {
    $user = User::factory()->create([
        'required_hours' => 8,
        'end_date' => null,
    ]);
    $report = DailyReport::factory()->for($user)->create([
        'total_hours' => 8,
        'approval_status' => DailyReport::STATUS_REJECTED,
    ]);

    $response = $this->actingAs($user)->delete(route('reports.destroy', $report));

    $response->assertRedirect(route('reports.index', absolute: false));
    $this->assertSoftDeleted($report);
});

test('an OJT cannot edit or delete a pending or approved report', function (string $status) {
    $user = User::factory()->create();
    $report = DailyReport::factory()->for($user)->create([
        'approval_status' => $status,
    ]);

    $this->actingAs($user)
        ->patch(route('reports.update', $report), ['summary' => 'Changed summary.'])
        ->assertInvalid('summary');

    $this->actingAs($user)
        ->delete(route('reports.destroy', $report))
        ->assertInvalid('report');

    $this->assertModelExists($report);
})->with([
    'pending' => DailyReport::STATUS_PENDING,
    'approved' => DailyReport::STATUS_APPROVED,
]);

test('an OJT cannot edit or delete another OJT report', function () {
    $user = User::factory()->create();
    $otherReport = DailyReport::factory()->create();

    $this->actingAs($user)
        ->patch(route('reports.update', $otherReport), ['summary' => 'Not allowed.'])
        ->assertForbidden();

    $this->actingAs($user)
        ->delete(route('reports.destroy', $otherReport))
        ->assertForbidden();

    $this->assertModelExists($otherReport);
});
