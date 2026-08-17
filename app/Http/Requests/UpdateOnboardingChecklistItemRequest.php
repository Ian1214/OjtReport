<?php

namespace App\Http\Requests;

use App\Models\OnboardingChecklistItem;
use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateOnboardingChecklistItemRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $user = $this->user();
        $item = $this->route('onboardingChecklistItem');

        return $user instanceof User
            && $item instanceof OnboardingChecklistItem
            && $user->isCompanyAdmin()
            && $user->company_id === $item->company_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'completed' => ['required', 'boolean'],
        ];
    }
}
