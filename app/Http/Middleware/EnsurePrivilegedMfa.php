<?php

namespace App\Http\Middleware;

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

        if (config('operations.security.require_privileged_mfa')
            && $user !== null
            && ($user->isPlatformAdmin() || $user->isCompanyAdmin() || $user->isCompanyStaff() || $user->isSupervisor())
            && $user->two_factor_confirmed_at === null
            && ! $user->passkeys()->exists()
            && ! $isExempt) {
            return to_route('security.edit')->with('status', 'Secure this privileged account with two-factor authentication or a passkey before continuing.');
        }

        return $next($request);
    }
}
