<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SettingsController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $user = $request->user();

        return Inertia::render('settings/index', [
            'security' => [
                'emailVerified' => $user->email_verified_at !== null,
                'twoFactorEnabled' => $user->hasEnabledTwoFactorAuthentication(),
                'passkeyCount' => $user->passkeys()->count(),
            ],
            'preferences' => $user->resolvedPreferences(),
        ]);
    }
}
