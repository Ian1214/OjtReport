<?php

namespace App\Http\Requests;

use App\Models\CompletionCertificate;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RevokeCompletionCertificateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $certificate = $this->route('completionCertificate');

        if ($certificate instanceof CompletionCertificate
            && $certificate->company_id !== $this->user()?->company_id) {
            abort(404);
        }

        return $certificate instanceof CompletionCertificate
            && $this->user()?->can('delete', $certificate) === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var CompletionCertificate $certificate */
        $certificate = $this->route('completionCertificate');

        return [
            'revocation_reason' => [
                Rule::requiredIf($certificate->status === CompletionCertificate::STATUS_FINALIZED),
                'nullable',
                'string',
                'min:10',
                'max:1000',
            ],
        ];
    }
}
