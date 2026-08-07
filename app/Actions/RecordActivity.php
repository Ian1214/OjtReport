<?php

namespace App\Actions;

use App\Models\ActivityLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class RecordActivity
{
    public function __construct(private readonly Request $request) {}

    /**
     * @param  array<string, mixed>  $properties
     */
    public function handle(
        User $actor,
        string $event,
        string $description,
        ?Model $subject = null,
        array $properties = [],
    ): ?ActivityLog {
        if ($actor->company_id === null) {
            return null;
        }

        return ActivityLog::query()->create([
            'company_id' => $actor->company_id,
            'actor_id' => $actor->id,
            'event' => $event,
            'description' => $description,
            'subject_type' => $subject?->getMorphClass(),
            'subject_id' => $subject?->getKey(),
            'properties' => $properties,
            'ip_address' => $this->request->ip(),
            'user_agent' => Str::limit((string) $this->request->userAgent(), 500, ''),
        ]);
    }
}
