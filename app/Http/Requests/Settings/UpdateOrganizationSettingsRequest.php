<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOrganizationSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        /** @var User|null $user */
        $user = $this->user();

        return $user?->isCompanyAdmin() === true || $user?->isSchoolCoordinator() === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->user();
        $profileRules = [
            'name' => ['required', 'string', 'max:255'],
            'logo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:2048'],
            'address' => ['nullable', 'string', 'max:1000'],
            'contact_email' => ['nullable', 'email:rfc', 'max:255'],
            'contact_phone' => ['nullable', 'string', 'max:40'],
        ];

        if ($user->isSchoolCoordinator()) {
            return [
                ...$profileRules,
                'email_progress_alerts' => ['required', 'boolean'],
                'email_completion_alerts' => ['required', 'boolean'],
                'digest_frequency' => ['required', Rule::in(['disabled', 'daily', 'weekly'])],
                'required_document_labels' => ['nullable', 'string', 'max:2000'],
                'evaluation_template_name' => ['required', 'string', 'max:255'],
            ];
        }

        return [
            ...$profileRules,
            'legal_name' => ['nullable', 'string', 'max:255'],
            'authorized_signatory_name' => ['nullable', 'string', 'max:255'],
            'authorized_signatory_title' => ['nullable', 'string', 'max:255'],
            'break_start_time' => ['required', 'date_format:H:i'],
            'break_end_time' => ['required', 'date_format:H:i', 'after:break_start_time'],
            'break_minutes' => ['required', 'integer', 'min:0', 'max:180'],
            'earliest_time_in' => ['required', 'date_format:H:i'],
            'latest_time_out' => ['required', 'date_format:H:i', 'after:earliest_time_in'],
            'overtime_requires_approval' => ['required', 'boolean'],
            'holiday_attendance_allowed' => ['required', 'boolean'],
            'digest_time' => ['required', 'date_format:H:i'],
            'quiet_hours_start' => ['required', 'date_format:H:i'],
            'quiet_hours_end' => ['required', 'date_format:H:i'],
            'email_notifications' => ['required', 'boolean'],
            'escalation_email' => ['nullable', 'email:rfc', 'max:255'],
            'message_retention_days' => ['required', 'integer', 'min:30', 'max:3650'],
            'location_retention_days' => ['required', 'integer', 'min:1', 'max:730'],
            'audit_retention_days' => ['required', 'integer', 'min:90', 'max:3650'],
            'archive_grace_days' => ['required', 'integer', 'min:30', 'max:3650'],
            'default_required_hours' => ['required', 'integer', 'min:1', 'max:5000'],
            'default_program' => ['nullable', 'string', 'max:255'],
            'default_year_level' => ['required', 'integer', 'min:1', 'max:10'],
            'certificate_number_prefix' => ['required', 'alpha_dash:ascii', 'max:20'],
            'session_timeout_minutes' => ['required', 'integer', 'min:15', 'max:1440'],
            'allowed_email_domains' => ['nullable', 'string', 'max:1000'],
            'require_admin_mfa' => ['required', 'boolean'],
            'require_supervisor_mfa' => ['required', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $fields = $this->user()?->isSchoolCoordinator() === true
            ? ['email_progress_alerts', 'email_completion_alerts']
            : [
                'overtime_requires_approval', 'holiday_attendance_allowed',
                'email_notifications',
                'require_admin_mfa', 'require_supervisor_mfa',
            ];

        $this->merge(collect($fields)
            ->mapWithKeys(fn (string $field): array => [$field => $this->boolean($field)])
            ->all());
    }
}
