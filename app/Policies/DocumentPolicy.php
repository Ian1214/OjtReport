<?php

namespace App\Policies;

use App\Models\Document;
use App\Models\User;

class DocumentPolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['company_admin', 'supervisor', 'ojt', 'school_coordinator'], true);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Document $document): bool
    {
        if ($user->isSchoolCoordinator()) {
            return $document->status === Document::STATUS_APPROVED
                && $document->shared_with_school
                && $user->school_id !== null
                && $document->ojt?->school_id === $user->school_id;
        }

        if ($user->role === 'ojt') {
            return $document->ojt_id === $user->id;
        }

        if ($user->isSupervisor()) {
            return $document->status === Document::STATUS_APPROVED
                && $user->company_id !== null
                && $document->company_id === $user->company_id;
        }

        return $user->company_id !== null && $document->company_id === $user->company_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isCompanyAdmin() || $user->role === 'ojt';
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Document $document): bool
    {
        return $user->isCompanyAdmin() && $document->company_id === $user->company_id;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Document $document): bool
    {
        if ($this->update($user, $document)) {
            return true;
        }

        return $user->role === 'ojt'
            && $document->ojt_id === $user->id
            && $document->uploaded_by === $user->id
            && in_array($document->status, [Document::STATUS_PENDING, Document::STATUS_REJECTED], true);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Document $document): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Document $document): bool
    {
        return false;
    }
}
