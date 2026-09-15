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
                'timeFormats' => User::SUPPORTED_TIME_FORMATS,
                'weekStarts' => User::SUPPORTED_WEEK_STARTS,
                'fontSizes' => User::SUPPORTED_FONT_SIZES,
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
                'time_format' => $validated['time_format'],
                'week_starts_on' => $validated['week_starts_on'],
                'font_size' => $validated['font_size'],
                'quiet_hours_enabled' => $validated['quiet_hours_enabled'],
                'quiet_hours_start' => $validated['quiet_hours_start'],
                'quiet_hours_end' => $validated['quiet_hours_end'],
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
