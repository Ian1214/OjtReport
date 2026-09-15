<?php

namespace App\Models;

use Database\Factories\PlatformActivityLogFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;

class PlatformActivityLog extends Model
{
    /** @use HasFactory<PlatformActivityLogFactory> */
    use HasFactory;

    protected $fillable = [
        'actor_id', 'event', 'description', 'target_type', 'target_id',
        'properties', 'ip_address', 'user_agent',
    ];

    protected function casts(): array
    {
        return ['properties' => 'array'];
    }

    public function actor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'actor_id');
    }

    public function target(): MorphTo
    {
        return $this->morphTo();
    }
}
