<?php

namespace App\Http\Requests;

use App\Rules\SignatureStrokes;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ReviewDtrSubmissionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->role, ['supervisor', 'company_admin'], true);
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        $isSupervisorApproval = $this->user()?->isSupervisor() && $this->input('decision') === 'approve';

        return [
            'decision' => ['required', Rule::in(['approve', 'reject'])],
            'rejection_reason' => ['nullable', 'string', 'max:2000', Rule::requiredIf($this->input('decision') === 'reject')],
            'signature' => [Rule::excludeIf(! $isSupervisorApproval), 'required', 'string', 'max:255'],
            'signature_data' => [Rule::excludeIf(! $isSupervisorApproval), 'required', 'string', new SignatureStrokes],
        ];
    }

    /** @return array<callable(Validator): void> */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if (! $this->user()?->isSupervisor() || $this->input('decision') !== 'approve') {
                    return;
                }

                $signature = Str::lower(Str::squish((string) $this->input('signature')));
                $userName = Str::lower(Str::squish((string) $this->user()?->name));

                if ($signature !== $userName) {
                    $validator->errors()->add('signature', 'Type your full account name exactly as shown to sign this DTR.');
                }
            },
        ];
    }
}
