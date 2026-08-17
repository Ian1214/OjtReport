<?php

namespace App\Http\Middleware;

use App\Models\AttendanceCorrectionRequest;
use App\Models\DailyReport;
use App\Models\DirectMessage;
use App\Models\User;
use App\Support\CompanyPermissions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        /** @var User|null $user */
        $user = $request->user();

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'auth' => [
                'user' => $user,
            ],
            'navigation' => [
                'pendingReportsCount' => fn (): int => $user?->canCompany(CompanyPermissions::REPORTS_REVIEW) === true
                    ? DailyReport::query()
                        ->where('approval_status', DailyReport::STATUS_PENDING)
                        ->whereNotNull('summary')
                        ->whereHas('user', fn (Builder $query): Builder => $query
                            ->where('company_id', $user->company_id)
                            ->where('role', 'ojt'))
                        ->count()
                    : 0,
                'unreadNotificationsCount' => fn (): int => $user?->unreadNotifications()->count() ?? 0,
                'unreadMessagesCount' => fn (): int => $user === null || $user->isCompanyAdmin()
                    ? 0
                    : DirectMessage::query()
                        ->where('recipient_id', $user->id)
                        ->whereNull('read_at')
                        ->count(),
                'pendingCorrectionsCount' => fn (): int => match ($user?->role) {
                    'ojt' => AttendanceCorrectionRequest::query()
                        ->where('requested_by', $user->id)
                        ->whereIn('status', [
                            AttendanceCorrectionRequest::STATUS_PENDING_SUPERVISOR,
                            AttendanceCorrectionRequest::STATUS_PENDING_ADMIN,
                        ])->count(),
                    'supervisor' => AttendanceCorrectionRequest::query()
                        ->where('status', AttendanceCorrectionRequest::STATUS_PENDING_SUPERVISOR)
                        ->whereHas('requester', fn (Builder $query): Builder => $query->where('supervisor_id', $user->id))
                        ->count(),
                    'company_admin', 'company_staff' => $user->canCompany(CompanyPermissions::ATTENDANCE_MANAGE)
                        ? AttendanceCorrectionRequest::query()
                            ->where('status', AttendanceCorrectionRequest::STATUS_PENDING_ADMIN)
                            ->whereHas('requester', fn (Builder $query): Builder => $query
                                ->where('company_id', $user->company_id)
                                ->where('role', 'ojt'))
                            ->count()
                        : 0,
                    default => 0,
                },
            ],
            'flash' => [
                'createdAccount' => fn () => $request->session()->get('createdAccount'),
                'status' => fn () => $request->session()->get('status'),
            ],
            'sidebarOpen' => ! $request->hasCookie('sidebar_state') || $request->cookie('sidebar_state') === 'true',
        ];
    }
}
