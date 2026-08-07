<?php

namespace App\Http\Controllers\Company;

use App\Actions\RecordActivity;
use App\Http\Controllers\Controller;
use App\Http\Requests\RejectDailyReportRequest;
use App\Models\DailyReport;
use App\Models\User;
use App\Notifications\DailyReportReviewed;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class DailyReportReviewController extends Controller
{
    public function approve(Request $request, DailyReport $dailyReport, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();

        $this->authorizeCompanyReport($companyAdmin, $dailyReport);

        $ojt = DB::transaction(function () use ($dailyReport, $companyAdmin): User {
            $ojt = User::query()->lockForUpdate()->findOrFail($dailyReport->user_id);
            $lockedReport = DailyReport::query()->lockForUpdate()->findOrFail($dailyReport->id);

            $this->ensurePending($lockedReport);

            $lockedReport->update([
                'approval_status' => DailyReport::STATUS_APPROVED,
                'reviewed_by' => $companyAdmin->id,
                'reviewed_at' => now(),
                'rejection_reason' => null,
            ]);

            $ojt->syncCompletionFromApprovedReports();

            return $ojt;
        }, attempts: 3);

        $ojt->notify(new DailyReportReviewed(
            reportId: $dailyReport->id,
            reportDate: $dailyReport->report_date->toDateString(),
            status: DailyReport::STATUS_APPROVED,
            reviewerName: $companyAdmin->name,
        ));
        $recordActivity->handle(
            $companyAdmin,
            'report.approved',
            "{$companyAdmin->name} approved {$ojt->name}'s daily report.",
            $dailyReport,
        );

        return back()->with('success', 'Daily report approved. Its hours now count toward completion.');
    }

    public function reject(
        RejectDailyReportRequest $request,
        DailyReport $dailyReport,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();

        $this->authorizeCompanyReport($companyAdmin, $dailyReport);

        $rejectionReason = $request->validated('rejection_reason');

        $ojt = DB::transaction(function () use ($dailyReport, $companyAdmin, $rejectionReason): User {
            $ojt = User::query()->lockForUpdate()->findOrFail($dailyReport->user_id);
            $lockedReport = DailyReport::query()->lockForUpdate()->findOrFail($dailyReport->id);

            $this->ensurePending($lockedReport);

            $lockedReport->update([
                'approval_status' => DailyReport::STATUS_REJECTED,
                'reviewed_by' => $companyAdmin->id,
                'reviewed_at' => now(),
                'rejection_reason' => $rejectionReason,
            ]);

            $ojt->syncCompletionFromApprovedReports();

            return $ojt;
        }, attempts: 3);

        $ojt->notify(new DailyReportReviewed(
            reportId: $dailyReport->id,
            reportDate: $dailyReport->report_date->toDateString(),
            status: DailyReport::STATUS_REJECTED,
            reviewerName: $companyAdmin->name,
            rejectionReason: $rejectionReason,
        ));
        $recordActivity->handle(
            $companyAdmin,
            'report.rejected',
            "{$companyAdmin->name} returned {$ojt->name}'s daily report for correction.",
            $dailyReport,
        );

        return back()->with('success', 'Daily report returned to the OJT for correction.');
    }

    private function authorizeCompanyReport(User $companyAdmin, DailyReport $dailyReport): void
    {
        abort_unless($companyAdmin->isCompanyAdmin(), 403);

        $dailyReport->loadMissing('user');

        abort_unless(
            $dailyReport->user->role === 'ojt'
                && $dailyReport->user->company_id === $companyAdmin->company_id,
            404,
        );

        abort_unless($dailyReport->summary !== null && $dailyReport->time_out !== null, 422);
    }

    private function ensurePending(DailyReport $dailyReport): void
    {
        if ($dailyReport->approval_status !== DailyReport::STATUS_PENDING) {
            throw ValidationException::withMessages([
                'approval' => 'Only pending daily reports can be reviewed.',
            ]);
        }
    }
}
