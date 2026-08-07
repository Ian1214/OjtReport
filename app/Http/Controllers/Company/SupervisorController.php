<?php

namespace App\Http\Controllers\Company;

use App\Actions\RecordActivity;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSupervisorRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class SupervisorController extends Controller
{
    public function store(StoreSupervisorRequest $request, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $companyAdmin */
        $companyAdmin = $request->user();
        $company = $companyAdmin->companyRecord;

        Gate::authorize('update', $company);

        $supervisor = $company->users()->create([
            ...$request->validated(),
            'role' => 'supervisor',
            'company' => $company->name,
            'student_id' => 'SUP-'.Str::upper(Str::random(12)),
            'program' => 'Not applicable',
            'year' => 0,
            'department' => 'Supervision',
            'position' => 'OJT Supervisor',
            'required_hours' => 0,
            'password' => Str::password(32, letters: true, numbers: true, symbols: false),
            'must_change_password' => true,
            'email_verified_at' => now(),
        ]);

        $status = Password::sendResetLink(['email' => $supervisor->email]);

        if ($status !== Password::ResetLinkSent) {
            $supervisor->delete();

            return back()->withErrors([
                'email' => 'The supervisor setup email could not be sent. Please try again shortly.',
            ]);
        }

        $recordActivity->handle(
            $companyAdmin,
            'account.supervisor_created',
            "{$companyAdmin->name} created the supervisor account for {$supervisor->name}.",
            $supervisor,
        );

        return back()->with('status', "Supervisor setup email queued for {$supervisor->email}.");
    }
}
