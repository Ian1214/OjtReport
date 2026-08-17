<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\PreferenceUpdateRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PreferenceController extends Controller
{
    public function edit(Request $request): Response
    {
        return Inertia::render('settings/preferences', [
            'preferences' => $request->user()->resolvedPreferences(),
            'timezone' => $request->user()->timezone,
            'options' => [
                'timezones' => User::SUPPORTED_TIMEZONES,
                'dateFormats' => User::SUPPORTED_DATE_FORMATS,
                'densities' => User::SUPPORTED_INTERFACE_DENSITIES,
            ],
        ]);
    }

    public function update(PreferenceUpdateRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $request->user()->update([
            'timezone' => $validated['timezone'],
            'preferences' => [
                'date_format' => $validated['date_format'],
                'interface_density' => $validated['interface_density'],
                'reduce_motion' => $validated['reduce_motion'],
                'high_contrast' => $validated['high_contrast'],
                'report_updates' => $validated['report_updates'],
                'attendance_updates' => $validated['attendance_updates'],
                'email_workflow_updates' => $validated['email_workflow_updates'],
                'daily_digest' => $validated['daily_digest'],
                'escalation_alerts' => $validated['escalation_alerts'],
            ],
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => __('Preferences updated.'),
        ]);

        return to_route('preferences.edit');
    }
}
