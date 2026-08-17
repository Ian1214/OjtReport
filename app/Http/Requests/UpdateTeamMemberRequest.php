<?php

namespace App\Http\Requests;

use App\Models\User;
use App\Support\CompanyPermissions;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeamMemberRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var User|null $member */
        $member = $this->route('teamMember');

        return $member !== null
            && $this->user()?->canCompany(CompanyPermissions::PEOPLE_MANAGE) === true
            && $member->company_id === $this->user()?->company_id
            && $member->isCompanyStaff();
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
            'permissions' => ['required', 'array', 'max:8'],
            'permissions.*' => ['string', Rule::in(CompanyPermissions::all())],
            'account_active' => ['required', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge(['account_active' => $this->boolean('account_active')]);
    }
}
