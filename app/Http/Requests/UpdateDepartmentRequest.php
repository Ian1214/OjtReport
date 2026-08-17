<?php

namespace App\Http\Requests;

use App\Models\Department;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateDepartmentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->can('update', $this->route('department')) ?? false;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => Str::squish((string) $this->input('name')),
            'description' => filled($this->input('description')) ? Str::squish((string) $this->input('description')) : null,
            'is_active' => $this->boolean('is_active'),
        ]);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('departments', 'name')->where('company_id', $this->user()->company_id)->ignore($this->route('department'))],
            'description' => ['nullable', 'string', 'max:500'],
            'head_supervisor_id' => ['nullable', 'integer', Rule::exists('users', 'id')->where(fn ($query) => $query->where('company_id', $this->user()->company_id)->where('role', 'supervisor'))],
            'capacity' => ['nullable', 'integer', 'min:1', 'max:10000'],
            'work_start_time' => ['nullable', 'date_format:H:i'],
            'work_end_time' => ['nullable', 'date_format:H:i', 'after:work_start_time'],
            'late_grace_minutes' => ['nullable', 'integer', 'min:0', 'max:180'],
            'work_days' => ['nullable', 'array', 'min:1'],
            'work_days.*' => ['integer', 'between:1,7', 'distinct'],
            'is_active' => ['required', 'boolean'],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            /** @var Department $department */
            $department = $this->route('department');
            $capacity = $this->integer('capacity');
            if ($capacity > 0 && $department->ojts()->count() > $capacity) {
                $validator->errors()->add('capacity', 'Capacity cannot be lower than the number of assigned OJTs.');
            }
        }];
    }
}
