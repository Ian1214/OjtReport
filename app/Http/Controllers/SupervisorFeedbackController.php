<?php

namespace App\Http\Controllers;

use App\Actions\RecordActivity;
use App\Http\Requests\StoreSupervisorFeedbackRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;

class SupervisorFeedbackController extends Controller
{
    public function store(StoreSupervisorFeedbackRequest $request, User $ojt, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $supervisor */
        $supervisor = $request->user();
        $feedback = $ojt->supervisorFeedback()->create([
            ...$request->validated(),
            'company_id' => $supervisor->company_id,
            'supervisor_id' => $supervisor->id,
        ]);
        $recordActivity->handle($supervisor, 'feedback.created', "{$supervisor->name} recorded feedback for {$ojt->name}.", $feedback);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Feedback added to the OJT timeline.']);

        return back();
    }
}
