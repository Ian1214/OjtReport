<?php

namespace App\Services;

use App\Models\PlatformActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class PlatformAuditLogger
{
    /** @param array<string, mixed> $properties */
    public function record(User $actor, string $event, string $description, Request $request, ?Model $target = null, array $properties = []): PlatformActivityLog
    {
        return PlatformActivityLog::query()->create([
            'actor_id' => $actor->id,
            'event' => $event,
            'description' => $description,
            'target_type' => $target?->getMorphClass(),
            'target_id' => $target?->getKey(),
            'properties' => $properties,
            'ip_address' => $request->ip(),
            'user_agent' => str($request->userAgent())->limit(1000)->toString(),
        ]);
    }
}
