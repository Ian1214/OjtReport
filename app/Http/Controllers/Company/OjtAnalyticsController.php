<?php

namespace App\Http\Controllers\Company;

use App\Actions\AssessOjtRisk;
use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\CompletionCertificate;
use App\Models\DailyReport;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OjtAnalyticsController extends Controller
{
    public function __invoke(Request $request, AssessOjtRisk $assessRisk): Response
    {
        /** @var User $administrator */
        $administrator = $request->user();
        abort_unless($administrator->isCompanyAdmin(), 403);

        $company = Company::query()->with('holidays')->findOrFail($administrator->company_id);
        $ojtIds = User::query()
            ->where('company_id', $company->id)
            ->where('role', 'ojt')
            ->select('id');

        $approvedHours = (float) DailyReport::query()
            ->whereIn('user_id', clone $ojtIds)
            ->where('approval_status', DailyReport::STATUS_APPROVED)
            ->sum('total_hours');
        $finalizedHours = (float) CompletionCertificate::query()
            ->where('company_id', $company->id)
            ->where('status', CompletionCertificate::STATUS_FINALIZED)
            ->sum('allocated_hours');
        $reservedHours = (float) CompletionCertificate::query()
            ->where('company_id', $company->id)
            ->where('status', CompletionCertificate::STATUS_PENDING_SUPERVISOR)
            ->sum('allocated_hours');

        $ojts = User::query()
            ->where('company_id', $company->id)
            ->where('role', 'ojt')
            ->with('assignedSupervisor:id,name')
            ->withSum([
                'dailyReports as approved_hours' => fn ($query) => $query->where('approval_status', DailyReport::STATUS_APPROVED),
            ], 'total_hours')
            ->withSum([
                'completionCertificates as finalized_certificate_hours' => fn ($query) => $query->where('status', CompletionCertificate::STATUS_FINALIZED),
            ], 'allocated_hours')
            ->withSum([
                'completionCertificates as reserved_certificate_hours' => fn ($query) => $query->where('status', CompletionCertificate::STATUS_PENDING_SUPERVISOR),
            ], 'allocated_hours')
            ->withCount([
                'dailyReports as pending_reports_count' => fn ($query) => $query->where('approval_status', DailyReport::STATUS_PENDING),
                'dailyReports as late_days_count' => fn ($query) => $query->where('attendance_status', DailyReport::ATTENDANCE_LATE),
                'assignedTasks as unfinished_tasks_count' => fn ($query) => $query->whereIn('status', ['not_started', 'ongoing']),
            ])
            ->orderBy('name')
            ->paginate(25)
            ->withQueryString();

        $pageOjtIds = $ojts->getCollection()->pluck('id');
        $today = CarbonImmutable::now($company->timezone)->startOfDay();
        $monthStart = $today->startOfMonth();
        $reportDatesByUser = DailyReport::query()
            ->whereIn('user_id', $pageOjtIds)
            ->whereBetween('report_date', [$monthStart->toDateString(), $today->toDateString()])
            ->get(['user_id', 'report_date'])
            ->groupBy('user_id')
            ->map(fn ($reports) => $reports->pluck('report_date')->map->toDateString()->unique()->all());
        $holidayDates = $company->holidays
            ->pluck('holiday_date')
            ->map->toDateString()
            ->all();
        $leaveDatesByUser = LeaveRequest::query()
            ->whereIn('user_id', $pageOjtIds)
            ->where('status', LeaveRequest::STATUS_APPROVED)
            ->whereDate('start_date', '<=', $today)
            ->whereDate('end_date', '>=', $monthStart)
            ->get(['user_id', 'start_date', 'end_date'])
            ->groupBy('user_id')
            ->map(function ($requests) use ($monthStart, $today): array {
                $dates = [];
                foreach ($requests as $leaveRequest) {
                    $start = CarbonImmutable::instance($leaveRequest->start_date)->max($monthStart);
                    $end = CarbonImmutable::instance($leaveRequest->end_date)->min($today);
                    for ($date = $start; $date->lessThanOrEqualTo($end); $date = $date->addDay()) {
                        $dates[] = $date->toDateString();
                    }
                }

                return array_values(array_unique($dates));
            });

        $ojts->through(function (User $ojt) use ($today, $monthStart, $reportDatesByUser, $holidayDates, $leaveDatesByUser, $company, $assessRisk): array {
            $approved = (float) ($ojt->getAttribute('approved_hours') ?? 0);
            $finalized = (float) ($ojt->getAttribute('finalized_certificate_hours') ?? 0);
            $reserved = (float) ($ojt->getAttribute('reserved_certificate_hours') ?? 0);
            $periodStart = CarbonImmutable::instance($ojt->start_date ?? $monthStart)->max($monthStart);
            $reportedDates = $reportDatesByUser->get($ojt->id, []);
            $leaveDates = $leaveDatesByUser->get($ojt->id, []);
            $missingWorkdays = 0;

            for ($date = $periodStart; $date->lessThanOrEqualTo($today); $date = $date->addDay()) {
                $dateString = $date->toDateString();
                if (in_array($date->dayOfWeekIso, $company->work_days ?? [1, 2, 3, 4, 5], true)
                    && ! in_array($dateString, $holidayDates, true)
                    && ! in_array($dateString, $leaveDates, true)
                    && ! in_array($dateString, $reportedDates, true)) {
                    $missingWorkdays++;
                }
            }

            $completionPercentage = min(100, ($approved / max(1, (float) ($ojt->required_hours ?? 0))) * 100);
            $risk = $assessRisk->handle(
                $missingWorkdays,
                (int) $ojt->getAttribute('pending_reports_count'),
                (int) $ojt->getAttribute('late_days_count'),
                (int) $ojt->getAttribute('unfinished_tasks_count'),
                $completionPercentage,
            );

            return [
                'id' => $ojt->id,
                'name' => $ojt->name,
                'studentId' => $ojt->student_id,
                'supervisorName' => $ojt->supervisor_id === null
                    ? 'Not assigned'
                    : $ojt->assignedSupervisor->name,
                'requiredHours' => $ojt->required_hours ?? 0,
                'approvedHours' => number_format($approved, 2, '.', ''),
                'remainingHours' => number_format(max(0, (float) ($ojt->required_hours ?? 0) - $approved), 2, '.', ''),
                'certifiedHours' => number_format($finalized, 2, '.', ''),
                'reservedHours' => number_format($reserved, 2, '.', ''),
                'uncertifiedHours' => number_format(max(0, $approved - $finalized - $reserved), 2, '.', ''),
                'pendingReports' => (int) $ojt->getAttribute('pending_reports_count'),
                'lateDays' => (int) $ojt->getAttribute('late_days_count'),
                'missingWorkdays' => $missingWorkdays,
                'risk' => $risk,
            ];
        });

        return Inertia::render('company/analytics', [
            'companyName' => $company->name,
            'periodLabel' => $today->format('F Y'),
            'summary' => [
                'totalOjts' => (clone $ojtIds)->count(),
                'approvedHours' => number_format($approvedHours, 2, '.', ''),
                'certifiedHours' => number_format($finalizedHours, 2, '.', ''),
                'reservedHours' => number_format($reservedHours, 2, '.', ''),
                'uncertifiedHours' => number_format(max(0, $approvedHours - $finalizedHours - $reservedHours), 2, '.', ''),
                'pendingReports' => DailyReport::query()
                    ->whereIn('user_id', clone $ojtIds)
                    ->where('approval_status', DailyReport::STATUS_PENDING)
                    ->count(),
                'lateDays' => DailyReport::query()
                    ->whereIn('user_id', clone $ojtIds)
                    ->where('attendance_status', DailyReport::ATTENDANCE_LATE)
                    ->count(),
            ],
            'ojts' => $ojts,
        ]);
    }
}
