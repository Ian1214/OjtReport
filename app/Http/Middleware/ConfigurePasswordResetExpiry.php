<?php

namespace App\Http\Middleware;

use App\Models\PlatformSetting;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ConfigurePasswordResetExpiry
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $expiryDays = (int) PlatformSetting::resolvedPolicy()['invitation_expiry_days'];

        config([
            'auth.passwords.users.expire' => $expiryDays * 24 * 60,
        ]);

        return $next($request);
    }
}
