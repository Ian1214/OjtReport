<?php

use App\Models\DailyReport;
use App\Models\OjtTask;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('an OJT can view a focused list of assigned tasks', function () {
    $ojt = User::factory()->create();
    $supervisor = User::factory()->create(['role' => 'supervisor']);
    $ojt->update(['supervisor_id' => $supervisor->id]);

    OjtTask::factory()->count(2)->create([
        'ojt_id' => $ojt->id,
        'supervisor_id' => $supervisor->id,
    ]);

    $this->actingAs($ojt)
        ->get(route('tasks.index'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('tasks/index')
            ->where('supervisorName', $supervisor->name)
            ->has('tasks', 2)
        );
});

test('non OJT users cannot open the OJT task workspace', function (string $role) {
    $this->actingAs(User::factory()->create(['role' => $role]))
        ->get(route('tasks.index'))
        ->assertForbidden();
})->with(['company_admin', 'supervisor']);

test('the OJT dashboard provides a clear daily status and approved hours progress', function () {
    $ojt = User::factory()->create(['required_hours' => 100]);

    DailyReport::factory()->create([
        'user_id' => $ojt->id,
        'report_date' => today()->subDay(),
        'approval_status' => DailyReport::STATUS_APPROVED,
        'total_hours' => 8,
    ]);
    DailyReport::factory()->create([
        'user_id' => $ojt->id,
        'report_date' => today(),
        'time_out' => null,
        'total_hours' => null,
        'summary' => null,
    ]);

    $this->actingAs($ojt)
        ->get(route('dashboard'))
        ->assertSuccessful()
        ->assertInertia(fn (Assert $page) => $page
            ->component('dashboard')
            ->where('today.status', 'timed_in')
            ->where('progress.approvedHours', 8)
            ->where('progress.remainingHours', 92)
            ->where('progress.percentage', 8)
        );
});
