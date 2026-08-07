<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateAttendancePolicyRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isCompanyAdmin() === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'work_start_time' => ['required', 'date_format:H:i'],
            'late_grace_minutes' => ['required', 'integer', 'min:0', 'max:120'],
        ];
    }

    public function messages(): array
    {
        return [
            'work_start_time.date_format' => 'Enter the official time in using a valid hour and minute.',
            'late_grace_minutes.max' => 'The grace period may not exceed 120 minutes.',
        ];
    }
}
