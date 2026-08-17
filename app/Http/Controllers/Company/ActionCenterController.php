<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\AttendanceCorrectionRequest;
use App\Models\DailyReport;
use App\Models\Document;
use App\Models\DtrSubmission;
use App\Models\LeaveRequest;
use App\Models\User;
use App\Support\CompanyPermissions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActionCenterController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        $items = match ($user->role) {
            'company_admin', 'company_staff' => $this->companyItems($user),
            'supervisor' => $this->supervisorItems($user),
            'ojt' => $this->ojtItems($user),
            default => [],
        };

        return Inertia::render('action-center/index', [
            'items' => collect($items)->sortByDesc('priority')->values(),
        ]);
    }

    /** @return list<array<string, int|string>> */
    private function companyItems(User $user): array
    {
        $ojtIds = User::query()->where('company_id', $user->company_id)->where('role', 'ojt')->select('id');

        $items = [];

        if ($user->canCompany(CompanyPermissions::REPORTS_REVIEW)) {
            $items[] = $this->item('Daily reports', DailyReport::query()->whereIn('user_id', clone $ojtIds)->where('approval_status', DailyReport::STATUS_PENDING)->whereNotNull('summary')->count(), 'company.approvals.index', 100);
        }

        if ($user->canCompany(CompanyPermissions::ATTENDANCE_MANAGE)) {
            $items[] = $this->item('Time corrections', AttendanceCorrectionRequest::query()->whereIn('requested_by', clone $ojtIds)->where('status', AttendanceCorrectionRequest::STATUS_PENDING_ADMIN)->count(), 'attendance-corrections.index', 90);
            $items[] = $this->item('Leave requests', LeaveRequest::query()->where('company_id', $user->company_id)->where('status', LeaveRequest::STATUS_PENDING_ADMIN)->count(), 'leave.index', 80);
        }

        if ($user->canCompany(CompanyPermissions::RECORDS_SIGN_OFF)) {
            $items[] = $this->item('DTR sign-offs', DtrSubmission::query()->where('company_id', $user->company_id)->where('status', DtrSubmission::STATUS_PENDING_ADMIN)->count(), 'dtr-submissions.index', 70);
        }

        if ($user->canCompany(CompanyPermissions::DOCUMENTS_REVIEW)) {
            $items[] = $this->item('Document reviews', Document::query()->where('company_id', $user->company_id)->where('status', Document::STATUS_PENDING)->count(), 'documents.index', 60);
        }

        if ($user->canCompany(CompanyPermissions::PEOPLE_MANAGE)) {
            $items[] = $this->item('Unassigned OJTs', User::query()->where('company_id', $user->company_id)->where('role', 'ojt')->whereNull('supervisor_id')->count(), 'company.ojts.index', 50);
        }

        return $items;
    }

    /** @return list<array<string, int|string>> */
    private function supervisorItems(User $user): array
    {
        return [
            $this->item('Time corrections', AttendanceCorrectionRequest::query()->where('status', AttendanceCorrectionRequest::STATUS_PENDING_SUPERVISOR)->whereHas('requester', fn (Builder $query): Builder => $query->where('supervisor_id', $user->id))->count(), 'attendance-corrections.index', 100),
            $this->item('DTR sign-offs', DtrSubmission::query()->where('status', DtrSubmission::STATUS_PENDING_SUPERVISOR)->whereHas('user', fn (Builder $query): Builder => $query->where('supervisor_id', $user->id))->count(), 'dtr-submissions.index', 90),
            $this->item('Leave requests', LeaveRequest::query()->where('supervisor_id', $user->id)->where('status', LeaveRequest::STATUS_PENDING_SUPERVISOR)->count(), 'leave.index', 80),
        ];
    }

    /** @return list<array<string, int|string>> */
    private function ojtItems(User $user): array
    {
        return [
            $this->item('Reports needing changes', $user->dailyReports()->where('approval_status', DailyReport::STATUS_REJECTED)->count(), 'reports.index', 100),
            $this->item('Unsubmitted workdays', $user->dailyReports()->whereNotNull('time_out')->whereNull('summary')->count(), 'reports.index', 90),
            $this->item('DTR periods awaiting action', $user->dtrSubmissions()->whereIn('status', [DtrSubmission::STATUS_REJECTED])->count(), 'dtr-submissions.index', 80),
        ];
    }

    /** @return array{title: string, count: int, href: string, priority: int} */
    private function item(string $title, int $count, string $routeName, int $priority): array
    {
        return ['title' => $title, 'count' => $count, 'href' => route($routeName), 'priority' => $priority];
    }
}
