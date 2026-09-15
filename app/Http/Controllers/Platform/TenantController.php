<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Http\Requests\Platform\UpdateTenantStatusRequest;
use App\Models\Company;
use App\Models\User;
use App\Services\PlatformAuditLogger;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class TenantController extends Controller
{
    public function index(Request $request): Response
    {
        abort_unless($request->user()?->isPlatformAdmin(), 403);

        return Inertia::render('platform/tenants', [
            'companies' => Company::query()
                ->withCount([
                    'users',
                    'users as active_users_count' => fn ($query) => $query->where('account_active', true),
                    'ojts',
                ])
                ->latest()
                ->paginate(20)
                ->through(fn (Company $company): array => [
                    'id' => $company->id,
                    'name' => $company->name,
                    'status' => $company->status,
                    'reason' => $company->status_reason,
                    'suspendedAt' => $company->suspended_at?->toIso8601String(),
                    'users' => $company->users_count,
                    'activeUsers' => $company->active_users_count,
                    'ojts' => $company->ojts_count,
                    'createdAt' => $company->created_at?->toIso8601String(),
                ]),
        ]);
    }

    public function update(UpdateTenantStatusRequest $request, Company $company, PlatformAuditLogger $audit): RedirectResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $validated = $request->validated();
        $previousStatus = $company->status;

        $company->update([
            'status' => $validated['status'],
            'status_reason' => $validated['status'] === Company::STATUS_ACTIVE ? null : $validated['reason'],
            'suspended_at' => $validated['status'] === Company::STATUS_SUSPENDED ? now() : null,
        ]);

        $audit->record($actor, 'tenant.status_changed', "Changed {$company->name} from {$previousStatus} to {$company->status}.", $request, $company, [
            'previous_status' => $previousStatus,
            'new_status' => $company->status,
            'reason' => $company->status_reason,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Company access status updated.']);

        return back();
    }
}
