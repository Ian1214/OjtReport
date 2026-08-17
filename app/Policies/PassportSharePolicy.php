<?php

namespace App\Policies;

use App\Models\PassportShare;
use App\Models\User;

class PassportSharePolicy
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
    public function view(User $user, PassportShare $passportShare): bool
    {
        return $passportShare->ojt_id === $user->id;
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
    public function update(User $user, PassportShare $passportShare): bool
    {
        return $passportShare->ojt_id === $user->id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, PassportShare $passportShare): bool
    {
        return $passportShare->ojt_id === $user->id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, PassportShare $passportShare): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, PassportShare $passportShare): bool
    {
        return false;
    }
}
