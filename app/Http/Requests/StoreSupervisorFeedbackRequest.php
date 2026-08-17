<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSupervisorFeedbackRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $supervisor = $this->user();
        $ojt = $this->route('ojt');

        return $supervisor instanceof User
            && $ojt instanceof User
            && $supervisor->isSupervisor()
            && $ojt->role === 'ojt'
            && $ojt->supervisor_id === $supervisor->id
            && $ojt->company_id === $supervisor->company_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'category' => ['required', Rule::in(['progress', 'attendance', 'professionalism', 'communication', 'technical_skills'])],
            'rating' => ['required', 'integer', 'between:1,5'],
            'comments' => ['required', 'string', 'max:2000'],
            'shared_with_school' => ['required', 'boolean'],
        ];
    }

    protected function prepareForValidation(): void
    {
        $this->merge([
            'comments' => str($this->input('comments', ''))->trim()->toString(),
            'shared_with_school' => $this->boolean('shared_with_school'),
        ]);
    }
}
