<?php

namespace App\Actions;

use App\Models\Company;
use App\Models\DailyReport;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Relations\HasMany;

class BuildAttendanceMonitor
{
    /**
     * @param  array{search?: string, status?: string, supervisor_id?: int, date?: string}  $filters
     * @return Builder<User>
     */
    public function query(Company $company, array $filters, CarbonImmutable $date): Builder
    {
        $dateString = $date->toDateString();

        return User::query()
            ->where('company_id', $company->id)
            ->where('role', 'ojt')
            ->select([
                'id',
                'name',
                'student_id',
                'department',
                'position',
                'supervisor_id',
                'required_hours',
                'last_seen_at',
            ])
            ->with([
                'assignedSupervisor:id,name',
                'dailyReports' => fn (HasMany $query): HasMany => $query
                    ->whereDate('report_date', $dateString)
                    ->select([
                        'id',
                        'user_id',
                        'report_date',
                        'time_in',
                        'time_out',
                        'total_hours',
                        'summary',
                        'approval_status',
                        'attendance_status',
                        'late_minutes',
                    ]),
            ])
            ->withSum('approvedDailyReports as approved_hours', 'total_hours')
            ->withCount([
                'dailyReports as missing_time_out_count' => fn (Builder $query): Builder => $query
                    ->whereDate('report_date', '<', $dateString)
                    ->whereNull('time_out'),
            ])
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $matchingOjt) use ($search): void {
                    $matchingOjt
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('student_id', 'like', "%{$search}%")
                        ->orWhere('department', 'like', "%{$search}%")
                        ->orWhere('position', 'like', "%{$search}%");
                });
            })
            ->when(
                $filters['supervisor_id'] ?? null,
                fn (Builder $query, int $supervisorId): Builder => $query->where('supervisor_id', $supervisorId),
            )
            ->when(
                ($filters['status'] ?? 'all') !== 'all',
                fn (Builder $query): Builder => $this->applyStatusFilter(
                    $query,
                    $filters['status'] ?? 'all',
                    $dateString,
                ),
            );
    }

    /**
     * @return array{id: int, name: string, studentId: ?string, department: ?string, position: ?string, supervisorName: ?string, state: string, punctuality: ?string, timeIn: ?string, timeOut: ?string, totalHours: float, approvalStatus: ?string, lateMinutes: int, approvedHours: float, requiredHours: float, remainingHours: float, missingTimeOutCount: int, isOnline: bool}
     */
    public function row(User $ojt): array
    {
        /** @var DailyReport|null $report */
        $report = $ojt->dailyReports->first();
        $approvedHours = (float) ($ojt->approved_hours ?? 0);
        $requiredHours = (float) ($ojt->required_hours ?? 0);

        return [
            'id' => $ojt->id,
            'name' => $ojt->name,
            'studentId' => $ojt->student_id,
            'department' => $ojt->department,
            'position' => $ojt->position,
            'supervisorName' => $ojt->assignedSupervisor?->name,
            'state' => match (true) {
                $report === null => 'absent',
                $report->time_out === null => 'timed_in',
                $report->summary === null => 'summary_due',
                default => 'completed',
            },
            'punctuality' => $report?->attendance_status,
            'timeIn' => $report?->time_in,
            'timeOut' => $report?->time_out,
            'totalHours' => (float) ($report?->total_hours ?? 0),
            'approvalStatus' => $report?->approval_status,
            'lateMinutes' => (int) ($report?->late_minutes ?? 0),
            'approvedHours' => round($approvedHours, 2),
            'requiredHours' => $requiredHours,
            'remainingHours' => round(max(0, $requiredHours - $approvedHours), 2),
            'missingTimeOutCount' => (int) $ojt->missing_time_out_count,
            'isOnline' => $ojt->isOnline(),
        ];
    }

    /** @return array{total: int, present: int, absent: int, timedIn: int, completed: int, onTime: int, late: int, missingTimeOut: int} */
    public function stats(Company $company, CarbonImmutable $date): array
    {
        $dateString = $date->toDateString();
        $reports = DailyReport::query()
            ->whereDate('report_date', $dateString)
            ->whereHas('user', fn (Builder $query): Builder => $query
                ->where('company_id', $company->id)
                ->where('role', 'ojt'));
        $total = $company->ojts()->count();
        $present = (clone $reports)->count();

        return [
            'total' => $total,
            'present' => $present,
            'absent' => max(0, $total - $present),
            'timedIn' => (clone $reports)->whereNull('time_out')->count(),
            'completed' => (clone $reports)->whereNotNull('time_out')->count(),
            'onTime' => (clone $reports)->where('attendance_status', DailyReport::ATTENDANCE_ON_TIME)->count(),
            'late' => (clone $reports)->where('attendance_status', DailyReport::ATTENDANCE_LATE)->count(),
            'missingTimeOut' => DailyReport::query()
                ->whereDate('report_date', '<', $dateString)
                ->whereNull('time_out')
                ->whereHas('user', fn (Builder $query): Builder => $query
                    ->where('company_id', $company->id)
                    ->where('role', 'ojt'))
                ->count(),
        ];
    }

    /** @param Builder<User> $query */
    private function applyStatusFilter(Builder $query, string $status, string $date): Builder
    {
        if ($status === 'absent') {
            return $query->whereDoesntHave(
                'dailyReports',
                fn (Builder $reportQuery): Builder => $reportQuery->whereDate('report_date', $date),
            );
        }

        return $query->whereHas('dailyReports', function (Builder $reportQuery) use ($status, $date): void {
            $reportQuery->whereDate('report_date', $date);

            match ($status) {
                'timed_in' => $reportQuery->whereNull('time_out'),
                'completed' => $reportQuery->whereNotNull('time_out'),
                'on_time' => $reportQuery->where('attendance_status', DailyReport::ATTENDANCE_ON_TIME),
                'late' => $reportQuery->where('attendance_status', DailyReport::ATTENDANCE_LATE),
                default => $reportQuery,
            };
        });
    }
}
