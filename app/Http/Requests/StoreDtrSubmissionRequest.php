<?php

namespace App\Http\Requests;

use App\Rules\SignatureStrokes;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Validator;

class StoreDtrSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'ojt';
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'period_start' => ['required', 'date', 'before_or_equal:period_end'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start', 'before_or_equal:today'],
            'signature' => ['required', 'string', 'max:255'],
            'signature_data' => ['required', 'string', new SignatureStrokes],
        ];
    }

    /** @return array<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($this->user()?->supervisor_id === null) {
                    $validator->errors()->add('period_start', 'Your company must assign a supervisor before you can sign and submit a DTR.');
                }

                if ($this->normalizedSignature() !== $this->normalizedUserName()) {
                    $validator->errors()->add('signature', 'Type your full account name exactly as shown to sign this DTR.');
                }
            },
        ];
    }

    private function normalizedSignature(): string
    {
        return Str::lower(Str::squish((string) $this->input('signature')));
    }

    private function normalizedUserName(): string
    {
        return Str::lower(Str::squish((string) $this->user()?->name));
    }
}
