<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\File;

class StoreDirectMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'body' => ['nullable', 'string', 'max:4000', 'required_without:image'],
            'image' => [
                'nullable',
                'required_without:body',
                File::image()
                    ->max(5 * 1024)
                    ->dimensions(Rule::dimensions()->maxWidth(6000)->maxHeight(6000)),
            ],
        ];
    }
}
