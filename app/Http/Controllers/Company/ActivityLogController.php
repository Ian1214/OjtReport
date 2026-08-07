<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Http\Requests\ActivityLogIndexRequest;
use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Inertia\Inertia;
use Inertia\Response;

class ActivityLogController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(ActivityLogIndexRequest $request): Response
    {
        /** @var User $admin */
        $admin = $request->user();
        $filters = $request->validated();

        $companyLogs = ActivityLog::query()->where('company_id', $admin->company_id);

        $logs = (clone $companyLogs)
            ->select([
                'id', 'actor_id', 'event', 'description', 'properties',
                'ip_address', 'user_agent', 'created_at',
            ])
            ->with('actor:id,name,role')
            ->when($filters['event'] ?? null, fn (Builder $query, string $event): Builder => $query->where('event', $event))
            ->when($filters['search'] ?? null, function (Builder $query, string $search): void {
                $query->where(function (Builder $matching) use ($search): void {
                    $matching->where('description', 'like', "%{$search}%")
                        ->orWhereHas('actor', fn (Builder $actor): Builder => $actor->where('name', 'like', "%{$search}%"));
                });
            })
            ->latest()
            ->paginate(25)
            ->withQueryString();

        return Inertia::render('company/activity-logs', [
            'logs' => $logs->through(fn (ActivityLog $log): array => [
                'id' => $log->id,
                'event' => $log->event,
                'description' => $log->description,
                'properties' => $log->properties ?? [],
                'ipAddress' => $log->ip_address,
                'userAgent' => $log->user_agent,
                'createdAt' => $log->created_at?->toIso8601String(),
                'actor' => $log->actor === null ? null : [
                    'name' => $log->actor->name,
                    'role' => $log->actor->role,
                ],
            ]),
            'events' => (clone $companyLogs)
                ->distinct()
                ->orderBy('event')
                ->pluck('event'),
            'filters' => [
                'search' => $filters['search'] ?? '',
                'event' => $filters['event'] ?? '',
            ],
        ]);
    }
}
