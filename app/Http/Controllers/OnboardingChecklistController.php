<?php

namespace App\Http\Controllers;

use App\Actions\RecordActivity;
use App\Http\Requests\StoreOnboardingChecklistItemRequest;
use App\Http\Requests\UpdateOnboardingChecklistItemRequest;
use App\Models\OnboardingChecklistItem;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class OnboardingChecklistController extends Controller
{
    public function store(StoreOnboardingChecklistItemRequest $request, User $ojt, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $administrator */
        $administrator = $request->user();
        $item = $ojt->onboardingChecklistItems()->create([
            ...$request->validated(),
            'company_id' => $administrator->company_id,
        ]);
        $recordActivity->handle($administrator, 'onboarding.item_created', "{$administrator->name} added an onboarding requirement for {$ojt->name}.", $item);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Onboarding item added.']);

        return back();
    }

    public function update(UpdateOnboardingChecklistItemRequest $request, OnboardingChecklistItem $onboardingChecklistItem, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $administrator */
        $administrator = $request->user();
        $completed = $request->boolean('completed');
        $onboardingChecklistItem->update([
            'completed_at' => $completed ? now() : null,
            'completed_by' => $completed ? $administrator->id : null,
        ]);
        $ojt = $onboardingChecklistItem->ojt;
        if ($ojt->ojt_status === User::OJT_STATUS_ONBOARDING && ! $ojt->onboardingChecklistItems()->whereNull('completed_at')->exists()) {
            $ojt->update(['ojt_status' => User::OJT_STATUS_ACTIVE]);
        }
        $recordActivity->handle($administrator, $completed ? 'onboarding.item_completed' : 'onboarding.item_reopened', "{$administrator->name} updated an onboarding requirement.", $onboardingChecklistItem);
        Inertia::flash('toast', ['type' => 'success', 'message' => $completed ? 'Onboarding item completed.' : 'Onboarding item reopened.']);

        return back();
    }

    public function destroy(Request $request, OnboardingChecklistItem $onboardingChecklistItem, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $administrator */
        $administrator = $request->user();
        abort_unless($administrator->isCompanyAdmin() && $administrator->company_id === $onboardingChecklistItem->company_id, 403);
        $recordActivity->handle($administrator, 'onboarding.item_deleted', "{$administrator->name} removed an onboarding requirement.", $onboardingChecklistItem);
        $onboardingChecklistItem->delete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Onboarding item removed.']);

        return back();
    }
}
