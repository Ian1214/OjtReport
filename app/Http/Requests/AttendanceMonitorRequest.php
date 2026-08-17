<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Support\CompanyPermissions;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AttendanceMonitorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canCompany(CompanyPermissions::ATTENDANCE_MANAGE) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'search' => ['nullable', 'string', 'max:100'],
            'status' => ['nullable', Rule::in(['all', 'absent', 'timed_in', 'completed', 'on_time', 'late'])],
            'supervisor_id' => ['nullable', 'integer', Rule::exists(User::class, 'id')],
            'date' => ['nullable', Rule::date()->format('Y-m-d')->beforeOrEqual(today())],
        ];
    }
}
