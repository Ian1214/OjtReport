<?php

namespace App\Actions;

use App\Models\Company;
use App\Models\PlatformSetting;
use Illuminate\Validation\ValidationException;

class EnsureCompanyUserCapacity
{
    public function handle(Company $company): void
    {
        $lockedCompany = Company::query()->lockForUpdate()->findOrFail($company->id);
        $maximumUsers = (int) PlatformSetting::resolvedPolicy()['default_user_limit'];

        if ($lockedCompany->users()->count() >= $maximumUsers) {
            throw ValidationException::withMessages([
                'email' => "This company has reached its {$maximumUsers}-user workspace limit. Contact the platform administrator to increase the limit.",
            ]);
        }
    }
}
