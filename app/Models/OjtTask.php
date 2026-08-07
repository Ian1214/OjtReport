<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OjtTask extends Model
{
    /** @use HasFactory<\Database\Factories\OjtTaskFactory> */
    use HasFactory;

    protected $fillable = ['ojt_id', 'supervisor_id', 'title', 'description', 'status', 'due_date'];

    protected function casts(): array
    {
        return ['due_date' => 'date'];
    }

    public function ojt(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ojt_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }
}
