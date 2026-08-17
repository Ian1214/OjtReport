<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AcknowledgeOjtCompletionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var User|null $ojt */
        $ojt = $this->route('ojt');
        $coordinator = $this->user();

        return $coordinator?->isSchoolCoordinator() === true
            && $coordinator->school_id !== null
            && $ojt instanceof User
            && $ojt->role === 'ojt'
            && $ojt->school_id === $coordinator->school_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [];
    }
}
