<?php

namespace App\Policies;

use App\Models\CompletionCertificate;
use App\Models\User;

class CompletionCertificatePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, ['company_admin', 'supervisor', 'ojt'], true);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, CompletionCertificate $completionCertificate): bool
    {
        return match ($user->role) {
            'company_admin' => $completionCertificate->company_id === $user->company_id,
            'supervisor' => $completionCertificate->supervisor_id === $user->id,
            'ojt' => $completionCertificate->user_id === $user->id,
            default => false,
        };
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->isCompanyAdmin();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, CompletionCertificate $completionCertificate): bool
    {
        return $user->isSupervisor()
            && $completionCertificate->supervisor_id === $user->id
            && $completionCertificate->status === CompletionCertificate::STATUS_PENDING_SUPERVISOR;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, CompletionCertificate $completionCertificate): bool
    {
        return $user->isCompanyAdmin()
            && $completionCertificate->company_id === $user->company_id;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, CompletionCertificate $completionCertificate): bool
    {
        return false;
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, CompletionCertificate $completionCertificate): bool
    {
        return false;
    }
}
