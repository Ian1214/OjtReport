<?php

namespace App\Http\Controllers\Company;

use App\Actions\RecordActivity;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTeamMemberRequest;
use App\Http\Requests\UpdateTeamMemberRequest;
use App\Models\User;
use App\Notifications\TeamMemberInvited;
use App\Support\CompanyPermissions;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class TeamMemberController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $owner */
        $owner = $request->user();
        abort_unless($owner->canCompany(CompanyPermissions::PEOPLE_MANAGE), 403);

        return Inertia::render('company/team', [
            'members' => User::query()
                ->where('company_id', $owner->company_id)
                ->whereIn('role', ['company_admin', 'company_staff'])
                ->latest()
                ->get(['id', 'name', 'email', 'role', 'company_permissions', 'account_active', 'last_seen_at', 'created_at'])
                ->map(fn (User $member): array => [
                    'id' => $member->id,
                    'name' => $member->name,
                    'email' => $member->email,
                    'role' => $member->role,
                    'permissions' => $member->isCompanyAdmin() ? CompanyPermissions::all() : ($member->company_permissions ?? []),
                    'active' => $member->account_active,
                    'lastSeenAt' => $member->last_seen_at?->toIso8601String(),
                    'createdAt' => $member->created_at?->toIso8601String(),
                ]),
            'permissionOptions' => CompanyPermissions::LABELS,
            'presets' => [
                'hr_admin' => CompanyPermissions::forPreset('hr_admin'),
                'attendance_reviewer' => CompanyPermissions::forPreset('attendance_reviewer'),
                'document_reviewer' => CompanyPermissions::forPreset('document_reviewer'),
                'auditor' => CompanyPermissions::forPreset('auditor'),
            ],
        ]);
    }

    public function store(StoreTeamMemberRequest $request, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $owner */
        $owner = $request->user();
        $validated = $request->validated();
        $permissions = $validated['preset'] === 'custom'
            ? array_values(array_unique($validated['permissions'] ?? []))
            : CompanyPermissions::forPreset($validated['preset']);

        $member = DB::transaction(function () use ($owner, $validated, $permissions): User {
            $member = User::query()->create([
                'company_id' => $owner->company_id,
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Str::password(32),
                'role' => 'company_staff',
                'company' => $owner->companyRecord?->name,
                'company_permissions' => $permissions,
                'account_active' => true,
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]);

            $token = Password::broker()->createToken($member);
            $member->notify(new TeamMemberInvited($member->company ?? config('app.name'), $token));

            return $member;
        }, attempts: 3);

        $recordActivity->handle($owner, 'team.invited', "{$owner->name} invited {$member->name} to the company team.", $member, ['permissions' => $permissions]);
        Inertia::flash('toast', ['type' => 'success', 'message' => "Invitation queued for {$member->email}."]);

        return back();
    }

    public function update(UpdateTeamMemberRequest $request, User $teamMember, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $owner */
        $owner = $request->user();
        $validated = $request->validated();
        $active = (bool) $validated['account_active'];

        $teamMember->update([
            'name' => $validated['name'],
            'company_permissions' => array_values(array_unique($validated['permissions'])),
            'account_active' => $active,
            'suspended_at' => $active ? null : now(),
            'suspended_by' => $active ? null : $owner->id,
        ]);

        if (! $active) {
            DB::table('sessions')->where('user_id', $teamMember->id)->delete();
        }

        $recordActivity->handle($owner, $active ? 'team.updated' : 'team.suspended', "{$owner->name} updated access for {$teamMember->name}.", $teamMember, ['permissions' => $teamMember->company_permissions, 'active' => $active]);
        Inertia::flash('toast', ['type' => 'success', 'message' => $active ? 'Team member access updated.' : 'Team member access suspended.']);

        return back();
    }
}
