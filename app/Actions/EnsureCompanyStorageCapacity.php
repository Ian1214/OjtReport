<?php

namespace App\Actions;

use App\Models\Company;
use App\Models\DirectMessage;
use App\Models\Document;
use App\Models\PlatformSetting;
use Illuminate\Validation\ValidationException;

class EnsureCompanyStorageCapacity
{
    public function handle(Company $company, int $incomingBytes, string $field): void
    {
        $lockedCompany = Company::query()->lockForUpdate()->findOrFail($company->id);
        $limitBytes = (int) data_get(
            PlatformSetting::resolvedPolicy(),
            'default_storage_limit_mb',
        ) * 1024 * 1024;

        $documentBytes = (int) Document::withTrashed()
            ->where('company_id', $lockedCompany->id)
            ->sum('size');
        $messageImageBytes = (int) DirectMessage::query()
            ->whereHas('sender', fn ($query) => $query->where('company_id', $lockedCompany->id))
            ->sum('image_size');

        if ($documentBytes + $messageImageBytes + $incomingBytes > $limitBytes) {
            throw ValidationException::withMessages([
                $field => 'Your company upload storage is full. Remove unneeded files or contact the platform administrator.',
            ]);
        }
    }
}
