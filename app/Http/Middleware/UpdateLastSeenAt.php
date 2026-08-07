<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class UpdateLastSeenAt
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

        if ($user !== null && ($user->last_seen_at === null || $user->last_seen_at->isBefore(now()->subMinute()))) {
            User::withoutTimestamps(function () use ($user): void {
                $user->forceFill(['last_seen_at' => now()])->saveQuietly();
            });
        }

        return $next($request);
    }
}
