<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SystemBackup extends Model
{
    public const STATUS_RUNNING = 'running';

    public const STATUS_COMPLETED = 'completed';

    public const STATUS_FAILED = 'failed';

    protected $fillable = [
        'disk', 'path', 'size', 'checksum', 'status', 'failure_message', 'completed_at', 'verified_at',
    ];

    protected function casts(): array
    {
        return ['completed_at' => 'datetime', 'verified_at' => 'datetime', 'size' => 'integer'];
    }
}
