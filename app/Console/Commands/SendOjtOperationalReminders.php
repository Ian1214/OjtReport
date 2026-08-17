<?php

namespace App\Console\Commands;

use App\Models\LeaveRequest;
use App\Models\User;
use App\Notifications\OjtOperationalReminder;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Cache;

#[Signature('ojt:send-operational-reminders')]
#[Description('Send deduplicated reminders for missing daily reports and overdue onboarding items')]
class SendOjtOperationalReminders extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $sent = 0;

        User::query()
            ->where('role', 'ojt')
            ->whereIn('ojt_status', [User::OJT_STATUS_ONBOARDING, User::OJT_STATUS_ACTIVE])
            ->whereNull('end_date')
            ->with(['companyRecord.holidays', 'departmentRecord', 'onboardingChecklistItems'])
            ->chunkById(100, function ($ojts) use (&$sent): void {
                foreach ($ojts as $ojt) {
                    /** @var User $ojt */
                    $company = $ojt->companyRecord;

                    if ($company === null) {
                        continue;
                    }

                    $yesterday = Carbon::yesterday($company->timezone ?? config('app.timezone'));
                    $configuredDays = $ojt->departmentRecord?->work_days ?? $company->work_days ?? [1, 2, 3, 4, 5];
                    $isScheduledDay = in_array($yesterday->dayOfWeekIso, array_map('intval', $configuredDays), true)
                        && ! $company->holidays->contains(fn ($holiday): bool => $holiday->holiday_date->isSameDay($yesterday));
                    $wasStarted = $ojt->start_date === null || $ojt->start_date->lte($yesterday);
                    $hasLeave = $ojt->leaveRequests()
                        ->where('status', LeaveRequest::STATUS_APPROVED)
                        ->whereDate('start_date', '<=', $yesterday)
                        ->whereDate('end_date', '>=', $yesterday)
                        ->exists();
                    $hasReport = $ojt->dailyReports()->whereDate('report_date', $yesterday)->exists();

                    if ($isScheduledDay && $wasStarted && ! $hasLeave && ! $hasReport) {
                        $sent += $this->notifyOnce(
                            $ojt,
                            "missing-report:{$yesterday->toDateString()}",
                            new OjtOperationalReminder(
                                'missing_report',
                                'Daily report reminder',
                                "No attendance report was recorded for {$yesterday->format('M j, Y')}. Submit it or request a correction if needed.",
                                route('reports.index', absolute: false),
                            ),
                        );
                    }

                    $overdueCount = $ojt->onboardingChecklistItems
                        ->whereNull('completed_at')
                        ->filter(fn ($item): bool => $item->due_date !== null && $item->due_date->isBefore(today()))
                        ->count();

                    if ($overdueCount > 0) {
                        $sent += $this->notifyOnce(
                            $ojt,
                            'overdue-onboarding:'.today()->toDateString(),
                            new OjtOperationalReminder(
                                'overdue_onboarding',
                                'Onboarding action needed',
                                "You have {$overdueCount} overdue onboarding ".str('requirement')->plural($overdueCount).'. Contact your company administrator if you need help.',
                                route('dashboard', absolute: false),
                            ),
                        );
                    }
                }
            });

        $this->info("Queued {$sent} operational reminders.");

        return self::SUCCESS;
    }

    private function notifyOnce(User $ojt, string $key, OjtOperationalReminder $notification): int
    {
        if (! Cache::add("operational-reminder:{$ojt->id}:{$key}", true, now()->addDays(2))) {
            return 0;
        }

        $ojt->notify($notification);

        return 1;
    }
}
