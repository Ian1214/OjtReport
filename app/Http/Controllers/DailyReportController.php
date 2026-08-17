<?php

namespace App\Http\Controllers;

use App\Actions\RecordActivity;
use App\Http\Requests\CompleteDailyReportRequest;
use App\Http\Requests\StoreDailyReportRequest;
use App\Http\Requests\UpdateDailyReportRequest;
use App\Http\Requests\VerifyAttendanceRequest;
use App\Models\Company;
use App\Models\DailyReport;
use App\Models\LeaveRequest;
use App\Models\User;
use Carbon\Carbon;
use Carbon\CarbonInterface;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class DailyReportController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        Gate::authorize('viewAny', DailyReport::class);
        $attendanceSchedule = $this->attendanceSchedule($user);

        return Inertia::render('reports/index', [
            'attendancePolicy' => [
                'workStartTime' => $attendanceSchedule['workStartTime'],
                'graceMinutes' => $attendanceSchedule['graceMinutes'],
                'verificationMode' => $user->companyRecord?->attendance_verification_mode ?? 'disabled',
            ],
            'reports' => $user->dailyReports()
                ->with(['latestCorrectionRequest' => fn ($query) => $query->select([
                    'attendance_correction_requests.id',
                    'attendance_correction_requests.daily_report_id',
                    'attendance_correction_requests.status',
                ])])
                ->whereNotNull('summary')
                ->latest('report_date')
                ->get([
                    'id',
                    'report_date',
                    'time_in',
                    'time_out',
                    'total_hours',
                    'summary',
                    'approval_status',
                    'reviewed_at',
                    'rejection_reason',
                    'scheduled_time_in',
                    'scheduled_grace_minutes',
                    'attendance_status',
                    'late_minutes',
                    'created_at',
                ])
                ->map(fn (DailyReport $report): array => [
                    'id' => $report->id,
                    'report_date' => $report->report_date->toDateString(),
                    'time_in' => $report->time_in,
                    'time_out' => $report->time_out,
                    'total_hours' => $report->total_hours,
                    'summary' => $report->summary,
                    'approval_status' => $report->approval_status,
                    'reviewed_at' => $report->reviewed_at?->toIso8601String(),
                    'rejection_reason' => $report->rejection_reason,
                    'latest_correction_status' => $report->latestCorrectionRequest?->status,
                    'scheduled_time_in' => $report->scheduled_time_in,
                    'attendance_status' => $report->attendance_status,
                    'late_minutes' => $report->late_minutes,
                    'is_historical' => ! $report->created_at->isSameDay($report->report_date),
                ]),
            'activeReport' => $user->dailyReports()
                ->whereNull('summary')
                ->oldest('report_date')
                ->first(['id', 'report_date', 'time_in', 'time_out', 'scheduled_time_in', 'attendance_status', 'late_minutes']),
            'today' => today()->toDateString(),
            'historicalEntry' => [
                'earliestDate' => $user->start_date?->toDateString(),
                'latestDate' => now($user->companyRecord?->timezone ?? config('app.timezone'))
                    ->subDay()
                    ->toDateString(),
                'enabled' => $user->start_date !== null
                    && $user->start_date->isBefore(
                        now($user->companyRecord?->timezone ?? config('app.timezone'))->startOfDay(),
                    ),
            ],
        ]);
    }

    public function scanAttendance(Request $request, Company $company): RedirectResponse
    {
        abort_unless($request->hasValidSignature(), 403);
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->role === 'ojt' && $user->company_id === $company->id, 403);

        $request->session()->put('attendance_qr_verified_at', now()->timestamp);

        return to_route('reports.index');
    }

    public function timeIn(VerifyAttendanceRequest $request, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        Gate::authorize('create', DailyReport::class);

        if ($user->dailyReports()->whereNull('summary')->exists()) {
            throw ValidationException::withMessages([
                'attendance' => 'Complete your current daily report before starting a new one.',
            ]);
        }

        if ($user->dailyReports()->whereDate('report_date', today())->exists()) {
            throw ValidationException::withMessages([
                'attendance' => 'You have already completed a daily report for today.',
            ]);
        }

        $company = $user->companyRecord;
        $timeIn = now($company?->timezone ?? config('app.timezone'));
        $attendanceSchedule = $this->attendanceSchedule($user);

        $verification = $this->attendanceVerification($request, $company);

        if ($company !== null && ! $this->isWorkDay($user, $timeIn)) {
            throw ValidationException::withMessages([
                'attendance' => 'Today is not a scheduled work day. Ask your administrator if attendance should be enabled.',
            ]);
        }

        if ($user->leaveRequests()
            ->where('status', LeaveRequest::STATUS_APPROVED)
            ->whereDate('start_date', '<=', $timeIn)
            ->whereDate('end_date', '>=', $timeIn)
            ->exists()) {
            throw ValidationException::withMessages([
                'attendance' => 'You have approved leave today, so attendance cannot be started.',
            ]);
        }
        $scheduledTimeIn = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            $timeIn->toDateString().' '.$attendanceSchedule['workStartTime'],
            $company?->timezone ?? config('app.timezone'),
        );
        $punctuality = DailyReport::classifyPunctuality(
            $timeIn,
            $scheduledTimeIn,
            $attendanceSchedule['graceMinutes'],
        );

        $report = $user->dailyReports()->create([
            'report_date' => $timeIn->toDateString(),
            'time_in' => $timeIn->format('H:i:s'),
            ...$verification,
            'scheduled_time_in' => $scheduledTimeIn->format('H:i:s'),
            'scheduled_grace_minutes' => $attendanceSchedule['graceMinutes'],
            ...$punctuality,
        ]);

        $recordActivity->handle(
            $user,
            'attendance.time_in',
            "{$user->name} timed in at {$report->time_in}.",
            $report,
            ['attendance_status' => $report->attendance_status],
        );

        return to_route('reports.index');
    }

    /** @return array<string, int|float|string|null> */
    private function attendanceVerification(VerifyAttendanceRequest $request, ?Company $company): array
    {
        $mode = $company?->attendance_verification_mode ?? 'disabled';

        if ($mode === 'disabled') {
            return ['verification_method' => null, 'verified_at' => null];
        }

        if (in_array($mode, ['qr', 'qr_and_geolocation'], true)) {
            $verifiedAt = (int) $request->session()->pull('attendance_qr_verified_at', 0);
            if ($verifiedAt < now()->subMinutes(10)->timestamp) {
                throw ValidationException::withMessages(['attendance' => 'Scan the current company QR code before timing in.']);
            }
        }

        $result = [
            'verification_method' => $mode,
            'verified_at' => now(),
            'verification_latitude' => null,
            'verification_longitude' => null,
            'verification_distance_meters' => null,
        ];

        if (in_array($mode, ['geolocation', 'qr_and_geolocation'], true)) {
            if (! $request->boolean('location_consent')) {
                throw ValidationException::withMessages(['location_consent' => 'Consent is required before location verification.']);
            }

            if ($request->validated('latitude') === null || $request->validated('longitude') === null) {
                throw ValidationException::withMessages(['attendance' => 'Share your current location to verify attendance.']);
            }
            $latitude = (float) $request->validated('latitude');
            $longitude = (float) $request->validated('longitude');
            $distance = $this->distanceInMeters(
                $latitude,
                $longitude,
                (float) $company->attendance_latitude,
                (float) $company->attendance_longitude,
            );

            if ($distance > $company->attendance_radius_meters) {
                throw ValidationException::withMessages(['attendance' => "You are {$distance} meters from the approved workplace area."]);
            }

            $result['verification_latitude'] = $latitude;
            $result['verification_longitude'] = $longitude;
            $result['verification_distance_meters'] = $distance;
        }

        return $result;
    }

    private function distanceInMeters(float $latitude, float $longitude, float $targetLatitude, float $targetLongitude): int
    {
        $earthRadius = 6371000;
        $latitudeDelta = deg2rad($targetLatitude - $latitude);
        $longitudeDelta = deg2rad($targetLongitude - $longitude);
        $value = sin($latitudeDelta / 2) ** 2
            + cos(deg2rad($latitude)) * cos(deg2rad($targetLatitude)) * sin($longitudeDelta / 2) ** 2;

        return (int) round($earthRadius * 2 * atan2(sqrt($value), sqrt(1 - $value)));
    }

    public function storeHistorical(
        StoreDailyReportRequest $request,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();
        $timezone = $user->companyRecord?->timezone ?? config('app.timezone');
        $attendanceSchedule = $this->attendanceSchedule($user);
        $reportDate = (string) $validated['report_date'];
        $timeIn = Carbon::createFromFormat('Y-m-d H:i', "{$reportDate} {$validated['time_in']}", $timezone);
        $timeOut = Carbon::createFromFormat('Y-m-d H:i', "{$reportDate} {$validated['time_out']}", $timezone);

        if (! $this->isWorkDay($user, $timeIn)) {
            throw ValidationException::withMessages([
                'report_date' => 'The selected date is not a scheduled work day for your department.',
            ]);
        }

        $scheduledTimeIn = Carbon::createFromFormat(
            'Y-m-d H:i:s',
            "{$reportDate} ".$attendanceSchedule['workStartTime'],
            $timezone,
        );
        $punctuality = DailyReport::classifyPunctuality(
            $timeIn,
            $scheduledTimeIn,
            $attendanceSchedule['graceMinutes'],
        );

        $report = DB::transaction(fn (): DailyReport => $user->dailyReports()->create([
            'report_date' => $reportDate,
            'time_in' => $timeIn->format('H:i:s'),
            'scheduled_time_in' => $scheduledTimeIn->format('H:i:s'),
            'scheduled_grace_minutes' => $attendanceSchedule['graceMinutes'],
            ...$punctuality,
            'time_out' => $timeOut->format('H:i:s'),
            'total_hours' => DailyReport::calculateTotalHours($timeIn, $timeOut),
            'summary' => $validated['summary'],
            'approval_status' => DailyReport::STATUS_PENDING,
        ]), attempts: 3);

        $recordActivity->handle(
            $user,
            'report.historical_submitted',
            "{$user->name} submitted a historical daily report for {$reportDate}.",
            $report,
            [
                'entry_type' => 'historical',
                'total_hours' => (float) $report->total_hours,
            ],
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Past workday submitted. Its hours will count after company approval.',
        ]);

        return to_route('reports.index');
    }

    public function timeOut(Request $request, DailyReport $dailyReport, RecordActivity $recordActivity): RedirectResponse
    {
        Gate::authorize('update', $dailyReport);

        if ($dailyReport->loadMissing('dtrSubmission')->isLocked()) {
            throw ValidationException::withMessages(['summary' => 'A finalized DTR record cannot be edited.']);
        }

        if ($dailyReport->time_out !== null) {
            throw ValidationException::withMessages([
                'attendance' => 'Time out has already been recorded for this report.',
            ]);
        }

        $timeOut = now();
        $timeIn = Carbon::createFromFormat('H:i:s', $dailyReport->time_in);

        if ($timeOut->lessThanOrEqualTo($timeIn)) {
            throw ValidationException::withMessages([
                'attendance' => 'Time out must be later than time in.',
            ]);
        }

        $dailyReport->update(['time_out' => $timeOut->format('H:i:s')]);

        /** @var User $user */
        $user = $request->user();
        $recordActivity->handle(
            $user,
            'attendance.time_out',
            "{$user->name} timed out at {$dailyReport->time_out}.",
            $dailyReport,
        );

        return to_route('reports.index');
    }

    public function complete(
        CompleteDailyReportRequest $request,
        DailyReport $dailyReport,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        Gate::authorize('update', $dailyReport);

        if ($dailyReport->time_out === null) {
            throw ValidationException::withMessages([
                'attendance' => 'Record your time out before submitting your summary.',
            ]);
        }

        $timeIn = Carbon::createFromFormat('H:i:s', $dailyReport->time_in);
        $timeOut = Carbon::createFromFormat('H:i:s', $dailyReport->time_out);
        $totalHours = DailyReport::calculateTotalHours($timeIn, $timeOut);

        DB::transaction(function () use ($dailyReport, $request, $totalHours): void {
            $dailyReport->update([
                'summary' => $request->validated('summary'),
                'total_hours' => $totalHours,
                'approval_status' => DailyReport::STATUS_PENDING,
                'reviewed_by' => null,
                'reviewed_at' => null,
                'rejection_reason' => null,
            ]);
        }, attempts: 3);

        /** @var User $user */
        $user = $request->user();
        $recordActivity->handle(
            $user,
            'report.submitted',
            "{$user->name} submitted a daily report for {$dailyReport->report_date->toDateString()}.",
            $dailyReport,
        );

        return to_route('reports.index');
    }

    public function dtr(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        Gate::authorize('viewAny', DailyReport::class);

        return Inertia::render('reports/dtr', [
            'profile' => [
                'name' => $user->name,
                'studentId' => $user->student_id,
                'position' => $user->position,
                'department' => $user->department,
                'company' => $user->companyRecord?->name ?? $user->company,
            ],
            'reports' => $user->dailyReports()
                ->whereNotNull('summary')
                ->approved()
                ->oldest('report_date')
                ->get(['id', 'report_date', 'time_in', 'time_out', 'total_hours', 'attendance_status', 'late_minutes']),
            'totalHours' => $user->approvedDailyReports()->sum('total_hours'),
            'printable' => false,
            'submission' => null,
        ]);
    }

    public function update(
        UpdateDailyReportRequest $request,
        DailyReport $dailyReport,
    ): RedirectResponse {
        Gate::authorize('update', $dailyReport);

        if ($dailyReport->time_out === null || $dailyReport->summary === null) {
            throw ValidationException::withMessages([
                'summary' => 'Complete your attendance record before editing its summary.',
            ]);
        }

        if ($dailyReport->approval_status !== DailyReport::STATUS_REJECTED) {
            throw ValidationException::withMessages([
                'summary' => 'Only a rejected report can be corrected and resubmitted.',
            ]);
        }

        $dailyReport->update([
            ...$request->validated(),
            'approval_status' => DailyReport::STATUS_PENDING,
            'reviewed_by' => null,
            'reviewed_at' => null,
            'rejection_reason' => null,
        ]);

        return to_route('reports.index');
    }

    public function destroy(Request $request, DailyReport $dailyReport): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();

        Gate::authorize('delete', $dailyReport);

        if ($dailyReport->loadMissing('dtrSubmission')->isLocked()) {
            throw ValidationException::withMessages(['report' => 'A finalized DTR record cannot be deleted.']);
        }

        if ($dailyReport->approval_status !== DailyReport::STATUS_REJECTED) {
            throw ValidationException::withMessages([
                'report' => 'Only rejected reports can be deleted.',
            ]);
        }

        DB::transaction(function () use ($dailyReport, $user): void {
            $dailyReport->delete();
            $user->syncCompletionFromApprovedReports();
        }, attempts: 3);

        return to_route('reports.index');
    }

    /** @return array{workStartTime: string, graceMinutes: int, workDays: list<int>} */
    private function attendanceSchedule(User $user): array
    {
        $user->loadMissing(['companyRecord', 'departmentRecord']);
        $company = $user->companyRecord;
        $department = $user->departmentRecord;

        return [
            'workStartTime' => $department?->work_start_time ?? $company?->work_start_time ?? '08:00:00',
            'graceMinutes' => $department?->late_grace_minutes ?? $company?->late_grace_minutes ?? 0,
            'workDays' => array_map('intval', $department?->work_days ?? $company?->work_days ?? [1, 2, 3, 4, 5]),
        ];
    }

    private function isWorkDay(User $user, CarbonInterface $date): bool
    {
        $schedule = $this->attendanceSchedule($user);
        $company = $user->companyRecord;
        $isHoliday = $company !== null && $company->holidays()->whereDate('holiday_date', $date)->exists();

        return in_array($date->dayOfWeekIso, $schedule['workDays'], true)
            && ! $isHoliday;
    }
}
