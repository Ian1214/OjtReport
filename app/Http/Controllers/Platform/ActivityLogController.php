<?php

namespace App\Http\Controllers\Platform;

use App\Http\Controllers\Controller;
use App\Models\PlatformActivityLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): Response
    {
        abort_unless($request->user()?->isPlatformAdmin(), 403);

        return Inertia::render('platform/activity-logs', [
            'logs' => PlatformActivityLog::query()
                ->with('actor:id,name,email')
                ->latest()
                ->paginate(30)
                ->through(fn (PlatformActivityLog $log): array => [
                    'id' => $log->id,
                    'event' => $log->event,
                    'description' => $log->description,
                    'actor' => $log->actor === null ? null : [
                        'name' => $log->actor->name,
                        'email' => $log->actor->email,
                    ],
                    'ipAddress' => $log->ip_address,
                    'createdAt' => $log->created_at?->toIso8601String(),
                ]),
        ]);
    }
}
