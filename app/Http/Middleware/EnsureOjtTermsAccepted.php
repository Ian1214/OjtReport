<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureOjtTermsAccepted
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user?->role === 'ojt'
            && $user->terms_accepted_at === null
            && ! $request->routeIs('ojt-terms.*', 'terms', 'logout')) {
            return to_route('ojt-terms.show');
        }

        return $next($request);
    }
}
