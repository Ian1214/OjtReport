<?php

namespace App\Http\Controllers;

use App\Actions\RecordActivity;
use App\Http\Requests\AcceptOjtTermsRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OjtTermsController extends Controller
{
    public function show(Request $request): Response|RedirectResponse
    {
        /** @var User $ojt */
        $ojt = $request->user();
        abort_unless($ojt->role === 'ojt', 403);

        if ($ojt->terms_accepted_at !== null) {
            return to_route('dashboard');
        }

        return Inertia::render('terms/accept', [
            'companyName' => $ojt->company ?? config('app.name'),
        ]);
    }

    public function update(
        AcceptOjtTermsRequest $request,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $ojt */
        $ojt = $request->user();

        if ($ojt->terms_accepted_at === null) {
            $ojt->forceFill(['terms_accepted_at' => now()])->save();

            $recordActivity->handle(
                $ojt,
                'terms.accepted',
                "{$ojt->name} accepted the OJT terms and company rules.",
                $ojt,
            );
        }

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Terms accepted. Welcome to your OJT dashboard.',
        ]);

        return to_route('dashboard');
    }
}
