<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOjtSchoolRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var User|null $ojt */
        $ojt = $this->route('ojt');
        $administrator = $this->user();

        return $administrator?->isCompanyAdmin() === true
            && $ojt instanceof User
            && $ojt->role === 'ojt'
            && $ojt->company_id === $administrator->company_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'school_id' => ['nullable', 'integer', Rule::exists('schools', 'id')],
        ];
    }
}
