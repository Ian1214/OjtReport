<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Http\Requests\ReportApprovalInboxRequest;
use App\Models\Company;
use App\Models\DailyReport;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class ReportApprovalInboxController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(ReportApprovalInboxRequest $request): Response
    {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();
        /** @var Company $company */
        $company = $companyAdmin->companyRecord;
        $filters = $request->validated();

        $companyReports = DailyReport::query()
            ->whereNotNull('summary')
            ->whereHas('user', fn (Builder $query): Builder => $query
                ->where('company_id', $company->id)
                ->where('role', 'ojt'));

        $reports = (clone $companyReports)
            ->select([
                'id',
                'user_id',
                'report_date',
                'time_in',
                'time_out',
                'total_hours',
                'summary',
                'approval_status',
                'reviewed_by',
                'reviewed_at',
                'rejection_reason',
                'scheduled_time_in',
                'attendance_status',
                'late_minutes',
            ])
            ->with([
                'user:id,name,student_id,department,position,supervisor_id',
                'user.assignedSupervisor:id,name',
                'reviewer:id,name',
            ])
            ->when(
                ($filters['status'] ?? 'pending') !== 'all',
                fn (Builder $query): Builder => $query->where(
                    'approval_status',
                    $filters['status'] ?? DailyReport::STATUS_PENDING,
                ),
            )
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->whereHas('user', fn (Builder $userQuery): Builder => $userQuery
                    ->where(function (Builder $matchingUser) use ($search): void {
                        $matchingUser
                            ->where('name', 'like', "%{$search}%")
                            ->orWhere('student_id', 'like', "%{$search}%");
                    }));
            })
            ->when(
                $filters['supervisor_id'] ?? null,
                fn (Builder $query, int $supervisorId): Builder => $query->whereHas(
                    'user',
                    fn (Builder $userQuery): Builder => $userQuery->where('supervisor_id', $supervisorId),
                ),
            )
            ->when(
                $filters['date_from'] ?? null,
                fn (Builder $query, string $date): Builder => $query->whereDate('report_date', '>=', $date),
            )
            ->when(
                $filters['date_to'] ?? null,
                fn (Builder $query, string $date): Builder => $query->whereDate('report_date', '<=', $date),
            )
            ->latest('report_date')
            ->latest('id')
            ->paginate(15)
            ->withQueryString();

        return Inertia::render('company/approval-inbox', [
            'companyName' => $company->name,
            'reports' => $reports->through(fn (DailyReport $report): array => [
                'id' => $report->id,
                'reportDate' => $report->report_date->toDateString(),
                'timeIn' => $report->time_in,
                'timeOut' => $report->time_out,
                'totalHours' => (float) $report->total_hours,
                'summary' => $report->summary,
                'status' => $report->approval_status,
                'rejectionReason' => $report->rejection_reason,
                'reviewedAt' => $report->reviewed_at?->toIso8601String(),
                'reviewerName' => $report->reviewer?->name,
                'scheduledTimeIn' => $report->scheduled_time_in,
                'attendanceStatus' => $report->attendance_status,
                'lateMinutes' => $report->late_minutes,
                'ojt' => [
                    'id' => $report->user->id,
                    'name' => $report->user->name,
                    'studentId' => $report->user->student_id,
                    'position' => $report->user->position,
                    'department' => $report->user->department,
                    'supervisorName' => $report->user->assignedSupervisor?->name,
                ],
            ]),
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? 'pending',
                'supervisorId' => isset($filters['supervisor_id']) ? (string) $filters['supervisor_id'] : '',
                'dateFrom' => $filters['date_from'] ?? '',
                'dateTo' => $filters['date_to'] ?? '',
            ],
            'stats' => [
                'pending' => (clone $companyReports)->where('approval_status', DailyReport::STATUS_PENDING)->count(),
                'approved' => (clone $companyReports)->where('approval_status', DailyReport::STATUS_APPROVED)->count(),
                'rejected' => (clone $companyReports)->where('approval_status', DailyReport::STATUS_REJECTED)->count(),
            ],
            'supervisors' => $company->users()
                ->where('role', 'supervisor')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }
}
