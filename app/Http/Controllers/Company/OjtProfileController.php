<?php

namespace App\Http\Controllers\Company;

use App\Actions\RecordActivity;
use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOjtProfileRequest;
use App\Models\Department;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class OjtProfileController extends Controller
{
    public function update(UpdateOjtProfileRequest $request, User $ojt, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $administrator */
        $administrator = $request->user();
        $validated = $request->validated();
        $department = Department::query()->findOrFail($validated['department_id']);
        $tracked = ['name', 'email', 'department_id', 'position', 'required_hours', 'start_date', 'ojt_status'];
        $before = $ojt->only($tracked);

        DB::transaction(fn () => $ojt->update([...$validated, 'department' => $department->name]), attempts: 3);
        $wasTransferred = $before['department_id'] !== $department->id;
        $recordActivity->handle(
            $administrator,
            $wasTransferred ? 'account.ojt_transferred' : 'account.ojt_profile_updated',
            $wasTransferred
                ? "{$administrator->name} transferred {$ojt->name} to {$department->name}."
                : "{$administrator->name} updated {$ojt->name}'s OJT profile.",
            $ojt,
            ['before' => $before, 'after' => $ojt->only($tracked)],
        );
        Inertia::flash('toast', ['type' => 'success', 'message' => "{$ojt->name}'s profile was updated."]);

        return to_route('company.ojts.index');
    }
}
