<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\DailyReport;
use App\Models\User;
use App\Services\SystemHealthService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(private readonly SystemHealthService $health) {}

    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->isPlatformAdmin(), 403);

        return Inertia::render('platform/dashboard', [
            'stats' => [
                'companies' => Company::query()->count(),
                'users' => User::query()->count(),
                'activeUsers' => User::query()->where('account_active', true)->count(),
                'ojts' => User::query()->where('role', 'ojt')->count(),
                'reportsThisMonth' => DailyReport::query()->where('report_date', '>=', now()->startOfMonth())->count(),
            ],
            'companies' => Company::query()
                ->withCount([
                    'users',
                    'users as active_users_count' => fn ($query) => $query->where('account_active', true),
                    'ojts',
                ])
                ->latest()
                ->limit(50)
                ->get(['id', 'name', 'created_at'])
                ->map(fn (Company $company): array => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'users' => $company->users_count,
                    'activeUsers' => $company->active_users_count,
                    'ojts' => $company->ojts_count,
                    'createdAt' => $company->created_at?->toIso8601String(),
                ]),
            'health' => $this->health->snapshot(),
        ]);
    }
}
