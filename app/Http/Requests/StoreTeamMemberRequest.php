<?php

namespace App\Http\Requests;

use App\Support\CompanyPermissions;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreTeamMemberRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->canCompany(CompanyPermissions::PEOPLE_MANAGE) ?? false;
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
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')],
            'preset' => ['required', 'string', Rule::in(['hr_admin', 'attendance_reviewer', 'document_reviewer', 'auditor', 'custom'])],
            'permissions' => ['nullable', 'array', 'max:8'],
            'permissions.*' => ['string', Rule::in(CompanyPermissions::all())],
        ];
    }

    /** @return array<int, callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->has('email')) {
                return;
            }

            $company = $this->user()?->companyRecord;
            if ($company !== null && ! $company->allowsStaffEmail((string) $this->input('email'))) {
                $validator->errors()->add('email', 'Use an email address from one of the company’s allowed staff domains.');
            }
        }];
    }
}
