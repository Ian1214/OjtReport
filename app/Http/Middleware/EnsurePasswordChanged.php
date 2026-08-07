<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsurePasswordChanged
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        if ($request->user()?->must_change_password
            && ! $request->routeIs('security.edit', 'user-password.update', 'logout')) {
            return to_route('security.edit')->with(
                'status',
                'Please create a new password before continuing.',
            );
        }

        return $next($request);
    }
}
