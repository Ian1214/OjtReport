<?php

namespace App\Http\Requests;

use App\Rules\SignatureStrokes;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class StoreCompletionCertificateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isCompanyAdmin() === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'ojt_id' => ['required', 'integer', 'exists:users,id'],
            'allocated_hours' => ['required', 'numeric', 'decimal:0,2', 'min:0.01', 'max:999999.99'],
            'signature' => ['required', 'string', 'max:255'],
            'signature_data' => ['required', 'string', new SignatureStrokes],
        ];
    }

    /** @return array<callable(Validator): void> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            $signature = Str::lower(Str::squish((string) $this->input('signature')));
            $name = Str::lower(Str::squish((string) $this->user()?->name));

            if ($signature !== $name) {
                $validator->errors()->add('signature', 'Type your full account name exactly as shown to sign this certificate.');
            }
        }];
    }
}
