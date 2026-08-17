<?php

namespace App\Http\Controllers\Company;

use App\Actions\RecordActivity;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSchoolCoordinatorRequest;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;
use Inertia\Inertia;

class SchoolCoordinatorController extends Controller
{
    public function store(
        StoreSchoolCoordinatorRequest $request,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $companyAdministrator */
        $companyAdministrator = $request->user();
        $company = $companyAdministrator->companyRecord;

        Gate::authorize('update', $company);

        [$school, $coordinator] = DB::transaction(function () use ($request): array {
            $school = School::query()->create([
                'name' => $request->string('school_name')->squish()->toString(),
                'contact_email' => $request->string('email')->lower()->toString(),
            ]);
            $coordinator = $school->users()->create([
                'role' => 'school_coordinator',
                'name' => $request->string('name')->squish()->toString(),
                'email' => $request->string('email')->lower()->toString(),
                'student_id' => 'SCH-'.Str::upper(Str::random(12)),
                'program' => 'Not applicable',
                'year' => 0,
                'department' => 'School coordination',
                'position' => 'School coordinator',
                'required_hours' => 0,
                'password' => Str::password(32, letters: true, numbers: true, symbols: false),
                'must_change_password' => true,
                'email_verified_at' => now(),
            ]);

            return [$school, $coordinator];
        }, attempts: 3);

        $status = Password::sendResetLink(['email' => $coordinator->email]);

        if ($status !== Password::ResetLinkSent) {
            DB::transaction(function () use ($coordinator, $school): void {
                $coordinator->forceDelete();
                $school->delete();
            });

            return back()->withErrors([
                'email' => 'The school coordinator setup email could not be sent. Please try again shortly.',
            ]);
        }

        $recordActivity->handle(
            $companyAdministrator,
            'account.school_coordinator_created',
            "{$companyAdministrator->name} created school access for {$coordinator->name} at {$school->name}.",
            $coordinator,
            ['school_id' => $school->id],
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "School coordinator setup email queued for {$coordinator->email}.",
        ]);

        return back();
    }

    public function resend(
        Request $request,
        User $schoolCoordinator,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $companyAdministrator */
        $companyAdministrator = $request->user();
        abort_unless($companyAdministrator->isCompanyAdmin(), 403);
        Gate::authorize('update', $companyAdministrator->companyRecord);
        abort_unless(
            $schoolCoordinator->isSchoolCoordinator()
                && $schoolCoordinator->school_id !== null
                && User::query()
                    ->where('role', 'ojt')
                    ->where('company_id', $companyAdministrator->company_id)
                    ->where('school_id', $schoolCoordinator->school_id)
                    ->exists(),
            404,
        );

        $status = Password::sendResetLink(['email' => $schoolCoordinator->email]);

        if ($status !== Password::ResetLinkSent) {
            return back()->withErrors([
                'invitation' => 'The school coordinator invitation could not be sent. Please try again shortly.',
            ]);
        }

        $recordActivity->handle(
            $companyAdministrator,
            'account.school_coordinator_invitation_resent',
            "{$companyAdministrator->name} resent the school coordinator invitation to {$schoolCoordinator->name}.",
            $schoolCoordinator,
            ['school_id' => $schoolCoordinator->school_id],
        );

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "A fresh setup link was sent to {$schoolCoordinator->email}.",
        ]);

        return back();
    }
}
