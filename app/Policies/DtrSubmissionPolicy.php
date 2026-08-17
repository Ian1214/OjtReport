<?php

namespace App\Policies;

use App\Models\DtrSubmission;
use App\Models\User;

class DtrSubmissionPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->isSchoolCoordinator();
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, DtrSubmission $dtrSubmission): bool
    {
        return $user->isSchoolCoordinator()
            && $user->school_id !== null
            && $dtrSubmission->user()
                ->where('school_id', $user->school_id)
                ->exists();
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return false;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, DtrSubmission $dtrSubmission): bool
    {
        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, DtrSubmission $dtrSubmission): bool
    {
        return $user->role === 'ojt' && $dtrSubmission->user_id === $user->id;
    }

    public function deleteFinalized(User $user, DtrSubmission $dtrSubmission): bool
    {
        return $user->isCompanyAdmin()
            && $user->company_id === $dtrSubmission->company_id
            && $dtrSubmission->status === DtrSubmission::STATUS_APPROVED
            && $dtrSubmission->locked_at !== null;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, DtrSubmission $dtrSubmission): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, DtrSubmission $dtrSubmission): bool
    {
        return false;
    }
}
