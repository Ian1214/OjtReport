<?php

namespace App\Policies;

use App\Models\DailyReport;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class DailyReportPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->role === 'ojt';
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, DailyReport $dailyReport): bool
    {
        return $user->is($dailyReport->user);
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->role === 'ojt';
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, DailyReport $dailyReport): bool
    {
        return $user->role === 'ojt' && $user->is($dailyReport->user);
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, DailyReport $dailyReport): bool
    {
        return $user->role === 'ojt' && $user->is($dailyReport->user);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, DailyReport $dailyReport): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, DailyReport $dailyReport): bool
    {
        return false;
    }
}
