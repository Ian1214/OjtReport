<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOjtTaskRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isSupervisor() ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User|null $ojt */
        $ojt = $this->route('ojt');

        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:5000'],
            'due_date' => ['nullable', 'date'],
            'outcome_ids' => ['sometimes', 'array', 'max:12'],
            'outcome_ids.*' => [
                'integer',
                'distinct',
                Rule::exists('curriculum_outcomes', 'id')
                    ->where(fn ($query) => $query
                        ->where('school_id', $ojt?->school_id)
                        ->where('is_active', true)),
            ],
        ];
    }
}
