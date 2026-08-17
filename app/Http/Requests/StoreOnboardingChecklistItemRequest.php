<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreOnboardingChecklistItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $ojt = $this->route('ojt');

        return $user instanceof User
            && $ojt instanceof User
            && $user->isCompanyAdmin()
            && $ojt->role === 'ojt'
            && $user->company_id === $ojt->company_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:120'],
            'description' => ['nullable', 'string', 'max:1000'],
            'due_date' => ['nullable', 'date'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'title' => str($this->input('title', ''))->squish()->toString(),
            'description' => filled($this->input('description'))
                ? str($this->input('description'))->squish()->toString()
                : null,
        ]);
    }
}
