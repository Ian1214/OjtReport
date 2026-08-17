<?php

namespace App\Http\Requests\Settings;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class PreferenceUpdateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'timezone' => ['required', 'string', Rule::in(User::SUPPORTED_TIMEZONES)],
            'date_format' => ['required', 'string', Rule::in(array_keys(User::SUPPORTED_DATE_FORMATS))],
            'interface_density' => ['required', 'string', Rule::in(array_keys(User::SUPPORTED_INTERFACE_DENSITIES))],
            'reduce_motion' => ['required', 'boolean'],
            'high_contrast' => ['required', 'boolean'],
            'report_updates' => ['required', 'boolean'],
            'attendance_updates' => ['required', 'boolean'],
            'email_workflow_updates' => ['required', 'boolean'],
            'daily_digest' => ['required', 'boolean'],
            'escalation_alerts' => ['required', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'reduce_motion' => $this->boolean('reduce_motion'),
            'high_contrast' => $this->boolean('high_contrast'),
            'report_updates' => $this->boolean('report_updates'),
            'attendance_updates' => $this->boolean('attendance_updates'),
            'email_workflow_updates' => $this->boolean('email_workflow_updates'),
            'daily_digest' => $this->boolean('daily_digest'),
            'escalation_alerts' => $this->boolean('escalation_alerts'),
        ]);
    }
}
