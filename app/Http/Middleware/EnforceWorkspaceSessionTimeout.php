<?php

namespace App\Http\Middleware;

use App\Models\Company;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class EnforceWorkspaceSessionTimeout
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();

        if ($user !== null && $user->company_id !== null) {
            $lastActivity = (int) $request->session()->get('workspace_last_activity', time());
            $timeoutMinutes = (int) ($user->companyRecord?->resolvedSettings()['session_timeout_minutes']
                ?? Company::DEFAULT_SETTINGS['session_timeout_minutes']);

            if (time() - $lastActivity > $timeoutMinutes * 60) {
                Auth::guard('web')->logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return to_route('login')->withErrors([
                    'email' => 'Your workspace session expired after a period of inactivity. Please sign in again.',
                ]);
            }

            $request->session()->put('workspace_last_activity', time());
        }

        return $next($request);
    }
}
