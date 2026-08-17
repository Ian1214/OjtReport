<?php

namespace App\Models;

use Database\Factories\PassportShareFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PassportShare extends Model
{
    /** @use HasFactory<PassportShareFactory> */
    use HasFactory;

    protected $fillable = [
        'ojt_id',
        'created_by',
        'token_hash',
        'token',
        'expires_at',
        'revoked_at',
        'last_accessed_at',
        'access_count',
    ];

    protected $hidden = ['token', 'token_hash'];

    protected function casts(): array
    {
        return [
            'token' => 'encrypted',
            'expires_at' => 'datetime',
            'revoked_at' => 'datetime',
            'last_accessed_at' => 'datetime',
            'access_count' => 'integer',
        ];
    }

    public function ojt(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ojt_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function isAvailable(): bool
    {
        return $this->revoked_at === null && $this->expires_at->isFuture();
    }
}
