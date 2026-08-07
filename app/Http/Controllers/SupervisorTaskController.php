<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreOjtTaskRequest;
use App\Http\Requests\UpdateOjtTaskStatusRequest;
use App\Models\OjtTask;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class SupervisorTaskController extends Controller
{
    public function store(StoreOjtTaskRequest $request, User $ojt): RedirectResponse
    {
        /** @var User $supervisor */
        $supervisor = $request->user();

        abort_unless($ojt->supervisor_id === $supervisor->id && $ojt->role === 'ojt', 404);

        $supervisor->createdTasks()->create([
            ...$request->validated(),
            'ojt_id' => $ojt->id,
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task assigned successfully.']);

        return back();
    }

    public function updateStatus(UpdateOjtTaskStatusRequest $request, OjtTask $ojtTask): RedirectResponse
    {
        abort_unless($ojtTask->ojt_id === $request->user()?->id, 404);

        $ojtTask->update($request->validated());

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Task status updated.']);

        return back();
    }
}
