<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyOjtRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isCompanyAdmin() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'program' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:1', 'max:6'],
            'department' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            'supervisor_id' => ['nullable', 'integer', 'exists:users,id'],
            'supervisor_name' => ['nullable', 'string', 'max:255'],
            'required_hours' => ['required', 'integer', 'min:1', 'max:2000'],
            'start_date' => ['required', 'date'],
        ];
    }
}
