<?php

namespace App\Http\Requests;

use App\Models\Department;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateOjtProfileRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var User|null $user */
        $user = $this->user();
        /** @var User|null $ojt */
        $ojt = $this->route('ojt');

        return $user?->isCompanyAdmin() && $ojt?->role === 'ojt' && $ojt->company_id === $user->company_id;
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => Str::squish((string) $this->input('name')),
            'position' => Str::squish((string) $this->input('position')),
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
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->route('ojt'))],
            'program' => ['required', 'string', 'max:100'],
            'year' => ['required', 'integer', 'min:1', 'max:6'],
            'department_id' => ['required', 'integer', Rule::exists('departments', 'id')->where('company_id', $this->user()->company_id)],
            'position' => ['required', 'string', 'max:255'],
            'required_hours' => ['required', 'integer', 'min:1', 'max:2000'],
            'start_date' => ['required', 'date'],
            'ojt_status' => ['required', Rule::in(User::OJT_STATUSES)],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            /** @var User $ojt */
            $ojt = $this->route('ojt');
            $department = Department::query()->find($this->integer('department_id'));
            if ($department === null || $department->company_id !== $this->user()->company_id) {
                return;
            }
            $assignedCount = $department->ojts()->whereKeyNot($ojt->id)->count();
            if ($department->capacity !== null && $assignedCount >= $department->capacity) {
                $validator->errors()->add('department_id', 'This department has reached its OJT capacity.');
            }
            if (! $department->is_active && $ojt->department_id !== $department->id) {
                $validator->errors()->add('department_id', 'New assignments cannot be made to an archived department.');
            }
        }];
    }
}
