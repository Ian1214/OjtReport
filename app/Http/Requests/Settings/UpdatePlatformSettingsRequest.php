<?php

namespace App\Http\Requests\Settings;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePlatformSettingsRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isPlatformAdmin() === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'company_registration_enabled' => ['required', 'boolean'],
            'default_storage_limit_mb' => ['required', 'integer', 'min:100', 'max:102400'],
            'default_user_limit' => ['required', 'integer', 'min:1', 'max:100000'],
            'invitation_expiry_days' => ['required', 'integer', 'min:1', 'max:90'],
            'backup_retention_days' => ['required', 'integer', 'min:7', 'max:3650'],
            'health_alert_email' => ['nullable', 'email:rfc', 'max:255'],
            'support_email' => ['nullable', 'email:rfc', 'max:255'],
            'maintenance_contact' => ['nullable', 'string', 'max:255'],
            'require_company_admin_mfa' => ['required', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'company_registration_enabled' => $this->boolean('company_registration_enabled'),
            'require_company_admin_mfa' => $this->boolean('require_company_admin_mfa'),
        ]);
    }
}
