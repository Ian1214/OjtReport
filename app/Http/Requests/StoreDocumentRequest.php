<?php

namespace App\Http\Requests;

use App\Models\Document;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreDocumentRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['company_admin', 'ojt'], true);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:160'],
            'category' => ['required', Rule::in(Document::CATEGORIES)],
            'ojt_id' => [
                'nullable',
                'integer',
                Rule::prohibitedIf($this->user()?->role === 'ojt'),
                Rule::exists('users', 'id')->where(fn ($query) => $query
                    ->where('company_id', $this->user()?->company_id)
                    ->where('role', 'ojt')),
            ],
            'document' => [
                'required',
                'file',
                'mimes:pdf,jpg,jpeg,png,doc,docx',
                'mimetypes:application/pdf,image/jpeg,image/png,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'max:10240',
            ],
            'shared_with_school' => [
                'sometimes',
                'boolean',
                Rule::prohibitedIf($this->user()?->role === 'ojt'),
            ],
        ];
    }
}
