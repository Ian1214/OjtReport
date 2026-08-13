<?php

namespace App\Http\Controllers;

use App\Http\Requests\AttendanceCalendarRequest;
use App\Models\Company;
use App\Models\DailyReport;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\CarbonImmutable;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceCalendarController extends Controller
{
    public function __invoke(AttendanceCalendarRequest $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        /** @var Company|null $company */
        $company = $user->companyRecord;
        abort_if($company === null, 403);

        $month = CarbonImmutable::createFromFormat(
            '!Y-m',
            $request->validated('month') ?? now($company->timezone)->format('Y-m'),
            $company->timezone,
        );
        abort_if($month === false, 422);
        $start = $month->startOfMonth();
        $end = $month->endOfMonth();

        return Inertia::render('attendance-calendar/index', [
            'month' => $month->format('Y-m'),
            'timezone' => $company->timezone,
            'workDays' => $company->work_days ?? [1, 2, 3, 4, 5],
            'canManageHolidays' => $user->isCompanyAdmin(),
            'attendance' => $user->role === 'ojt'
                ? $user->dailyReports()
                    ->whereBetween('report_date', [$start->toDateString(), $end->toDateString()])
                    ->orderBy('report_date')
                    ->get(['id', 'report_date', 'time_in', 'time_out', 'total_hours', 'approval_status', 'attendance_status'])
                    ->map(fn (DailyReport $report): array => [
                        'id' => $report->id,
                        'date' => $report->report_date->toDateString(),
                        'timeIn' => $report->time_in,
                        'timeOut' => $report->time_out,
                        'hours' => (float) $report->total_hours,
                        'approvalStatus' => $report->approval_status,
                        'punctuality' => $report->attendance_status,
                    ])
                : [],
            'holidays' => $company->holidays()
                ->whereBetween('holiday_date', [$start->toDateString(), $end->toDateString()])
                ->orderBy('holiday_date')
                ->get(['id', 'holiday_date', 'name'])
                ->map(fn ($holiday): array => [
                    'id' => $holiday->id,
                    'date' => $holiday->holiday_date->toDateString(),
                    'name' => $holiday->name,
                ]),
            'approvedLeave' => $user->role === 'ojt'
                ? $user->leaveRequests()
                    ->where('status', LeaveRequest::STATUS_APPROVED)
                    ->whereDate('start_date', '<=', $end->toDateString())
                    ->whereDate('end_date', '>=', $start->toDateString())
                    ->orderBy('start_date')
                    ->get(['id', 'type', 'start_date', 'end_date'])
                    ->map(fn (LeaveRequest $leave): array => [
                        'id' => $leave->id,
                        'type' => $leave->type,
                        'startDate' => $leave->start_date->toDateString(),
                        'endDate' => $leave->end_date->toDateString(),
                    ])
                : [],
        ]);
    }
}
