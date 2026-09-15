<?php

namespace App\Actions;

use App\Models\AttendanceCorrectionRequest;
use App\Models\CompletionCertificate;
use App\Models\DailyReport;
use App\Models\Document;
use App\Models\DtrSubmission;
use App\Models\LeaveRequest;
use App\Models\PerformanceEvaluation;
use App\Models\User;
use App\Support\CompanyPermissions;
use Illuminate\Database\Eloquent\Builder;

class BuildActionCenter
{
    /** @return list<array{id: string, title: string, description: string, count: int, href: string, priority: int, group: string, tone: string}> */
    public function handle(User $user): array
    {
        $items = match ($user->role) {
            'company_admin', 'company_staff' => $this->companyItems($user),
            'supervisor' => $this->supervisorItems($user),
            'ojt' => $this->ojtItems($user),
            default => [],
        };

        return collect($items)
            ->filter(fn (array $item): bool => $item['count'] > 0)
            ->sortByDesc('priority')
            ->values()
            ->all();
    }

    /** @return list<array{id: string, title: string, description: string, count: int, href: string, priority: int, group: string, tone: string}> */
    private function companyItems(User $user): array
    {
        $ojtIds = User::query()
            ->where('company_id', $user->company_id)
            ->where('role', 'ojt')
            ->select('id');
        $items = [];

        if ($user->canCompany(CompanyPermissions::REPORTS_REVIEW)) {
            $items[] = $this->item(
                'daily-reports',
                'Daily reports',
                'Approve submitted work summaries and the hours they contain.',
                DailyReport::query()->whereIn('user_id', clone $ojtIds)->where('approval_status', DailyReport::STATUS_PENDING)->whereNotNull('summary')->count(),
                'company.approvals.index',
                100,
                'Approvals',
                'urgent',
            );
        }

        if ($user->canCompany(CompanyPermissions::ATTENDANCE_MANAGE)) {
            $items[] = $this->item('time-corrections', 'Time corrections', 'Make the final decision on supervisor-reviewed attendance changes.', AttendanceCorrectionRequest::query()->whereIn('requested_by', clone $ojtIds)->where('status', AttendanceCorrectionRequest::STATUS_PENDING_ADMIN)->count(), 'attendance-corrections.index', 95, 'Approvals', 'urgent');
            $items[] = $this->item('leave-requests', 'Leave requests', 'Approve or reject leave requests that completed supervisor review.', LeaveRequest::query()->where('company_id', $user->company_id)->where('status', LeaveRequest::STATUS_PENDING_ADMIN)->count(), 'leave.index', 90, 'Approvals', 'urgent');
        }

        if ($user->canCompany(CompanyPermissions::RECORDS_SIGN_OFF)) {
            $items[] = $this->item('dtr-sign-offs', 'DTR sign-offs', 'Finalize supervisor-signed DTR periods and lock their attendance records.', DtrSubmission::query()->where('company_id', $user->company_id)->where('status', DtrSubmission::STATUS_PENDING_ADMIN)->count(), 'dtr-submissions.index', 85, 'Official records', 'attention');
        }

        if ($user->canCompany(CompanyPermissions::DOCUMENTS_REVIEW)) {
            $items[] = $this->item('document-reviews', 'Document reviews', 'Check uploaded OJT documents before they enter the verified vault.', Document::query()->where('company_id', $user->company_id)->where('status', Document::STATUS_PENDING)->count(), 'documents.index', 80, 'Official records', 'attention');
        }

        if ($user->canCompany(CompanyPermissions::PEOPLE_MANAGE)) {
            $items[] = $this->item('unassigned-ojts', 'Unassigned OJTs', 'Assign each OJT to a supervisor so reviews and support have a clear owner.', User::query()->where('company_id', $user->company_id)->where('role', 'ojt')->whereNull('supervisor_id')->count(), 'company.ojts.index', 70, 'People', 'attention');
        }

        return $items;
    }

    /** @return list<array{id: string, title: string, description: string, count: int, href: string, priority: int, group: string, tone: string}> */
    private function supervisorItems(User $user): array
    {
        return [
            $this->item('time-corrections', 'Time corrections', 'Review proposed attendance changes before company approval.', AttendanceCorrectionRequest::query()->where('status', AttendanceCorrectionRequest::STATUS_PENDING_SUPERVISOR)->whereHas('requester', fn (Builder $query): Builder => $query->where('supervisor_id', $user->id))->count(), 'attendance-corrections.index', 100, 'Approvals', 'urgent'),
            $this->item('dtr-sign-offs', 'DTR sign-offs', 'Verify the included attendance and add your signature.', DtrSubmission::query()->where('status', DtrSubmission::STATUS_PENDING_SUPERVISOR)->whereHas('user', fn (Builder $query): Builder => $query->where('supervisor_id', $user->id))->count(), 'dtr-submissions.index', 95, 'Approvals', 'urgent'),
            $this->item('leave-requests', 'Leave requests', 'Review leave from OJTs assigned to you.', LeaveRequest::query()->where('status', LeaveRequest::STATUS_PENDING_SUPERVISOR)->whereHas('user', fn (Builder $query): Builder => $query->where('supervisor_id', $user->id))->count(), 'leave.index', 90, 'Approvals', 'urgent'),
            $this->item('certificate-signatures', 'Certificate signatures', 'Sign completion certificates already prepared by the company administrator.', CompletionCertificate::query()->where('supervisor_id', $user->id)->where('status', CompletionCertificate::STATUS_PENDING_SUPERVISOR)->count(), 'certificates.index', 85, 'Official records', 'attention'),
            $this->item('evaluation-drafts', 'Evaluation drafts', 'Finish and submit saved performance evaluations.', PerformanceEvaluation::query()->where('supervisor_id', $user->id)->where('status', PerformanceEvaluation::STATUS_DRAFT)->count(), 'evaluations.index', 70, 'OJT development', 'standard'),
        ];
    }

    /** @return list<array{id: string, title: string, description: string, count: int, href: string, priority: int, group: string, tone: string}> */
    private function ojtItems(User $user): array
    {
        return [
            $this->item('reports-needing-changes', 'Reports needing changes', 'Update work summaries returned by your company, then submit them again.', $user->dailyReports()->where('approval_status', DailyReport::STATUS_REJECTED)->count(), 'reports.index', 100, 'Daily work', 'urgent'),
            $this->item('unfinished-workdays', 'Workdays missing a summary', 'Add the day’s work summary so completed attendance can be submitted.', $user->dailyReports()->whereNotNull('time_out')->whereNull('summary')->count(), 'reports.index', 95, 'Daily work', 'urgent'),
            $this->item('rejected-dtr-periods', 'DTR periods needing changes', 'Review the rejection reason and submit a corrected DTR period.', $user->dtrSubmissions()->where('status', DtrSubmission::STATUS_REJECTED)->count(), 'dtr-submissions.index', 85, 'Official records', 'attention'),
            $this->item('rejected-documents', 'Documents needing changes', 'Replace or correct documents returned during company review.', Document::query()->where('ojt_id', $user->id)->where('status', Document::STATUS_REJECTED)->count(), 'documents.index', 80, 'Official records', 'attention'),
            $this->item('onboarding-checklist', 'Onboarding checklist', 'Complete the remaining company requirements for your internship.', $user->onboardingChecklistItems()->whereNull('completed_at')->count(), 'dashboard', 60, 'Getting started', 'standard'),
        ];
    }

    /** @return array{id: string, title: string, description: string, count: int, href: string, priority: int, group: string, tone: string} */
    private function item(string $id, string $title, string $description, int $count, string $routeName, int $priority, string $group, string $tone): array
    {
        return [
            'id' => $id,
            'title' => $title,
            'description' => $description,
            'count' => $count,
            'href' => route($routeName),
            'priority' => $priority,
            'group' => $group,
            'tone' => $tone,
        ];
    }
}
