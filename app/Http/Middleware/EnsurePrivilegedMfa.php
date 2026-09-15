<?php

namespace App\Http\Middleware;

use App\Models\PlatformSetting;
use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePrivilegedMfa
{
    public function handle(Request $request, Closure $next): Response
    {
        /** @var User|null $user */
        $user = $request->user();
        $isExempt = $request->routeIs('security.*', 'password.*', 'logout', 'two-factor.*', 'passkey.*');

        if ($user === null || $isExempt) {
            return $next($request);
        }

        $isPrivileged = $user->isPlatformAdmin()
            || $user->isCompanyAdmin()
            || $user->isCompanyStaff()
            || $user->isSupervisor();

        if (! $isPrivileged) {
            return $next($request);
        }

        $platformPolicy = PlatformSetting::resolvedPolicy();
        $companySettings = $user->companyRecord?->resolvedSettings();
        $roleRequiresMfa = ($user->isCompanyAdmin() && (bool) ($platformPolicy['require_company_admin_mfa'] || ($companySettings['require_admin_mfa'] ?? false)))
            || ($user->isSupervisor() && (bool) ($companySettings['require_supervisor_mfa'] ?? false));

        if ((config('operations.security.require_privileged_mfa') || $roleRequiresMfa)
            && $user->two_factor_confirmed_at === null
            && ! $user->passkeys()->exists()
        ) {
            return to_route('security.edit')->with('status', 'Secure this privileged account with two-factor authentication or a passkey before continuing.');
        }

        return $next($request);
    }
}
