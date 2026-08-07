<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Company extends Model
{
    /** @use HasFactory<\Database\Factories\CompanyFactory> */
    use HasFactory;

    protected $fillable = [
        'name',
        'work_start_time',
        'late_grace_minutes',
    ];

    protected function casts(): array
    {
        return [
            'late_grace_minutes' => 'integer',
        ];
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function ojts(): HasMany
    {
        return $this->users()->where('role', 'ojt');
    }

    public function activityLogs(): HasMany
    {
        return $this->hasMany(ActivityLog::class);
    }

    public function accountSetupDeliveries(): HasMany
    {
        return $this->hasMany(AccountSetupDelivery::class);
    }
}
