<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdatePlatformSettingsRequest;
use App\Models\PlatformSetting;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PlatformSettingsController extends Controller
{
    public function edit(Request $request): Response
    {
        abort_unless($request->user()?->isPlatformAdmin(), 403);

        return Inertia::render('settings/platform', [
            'policy' => PlatformSetting::resolvedPolicy(),
        ]);
    }

    public function update(UpdatePlatformSettingsRequest $request): RedirectResponse
    {
        PlatformSetting::query()->updateOrCreate(
            ['key' => PlatformSetting::POLICY_KEY],
            ['value' => array_replace(PlatformSetting::DEFAULT_POLICY, $request->validated())],
        );

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Platform policy updated.']);

        return to_route('platform-settings.edit');
    }
}
