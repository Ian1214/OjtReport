<?php

namespace App\Http\Requests;

use App\Models\DirectMessage;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateDirectMessageRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $message = $this->route('directMessage');

        return $message instanceof DirectMessage
            && $message->sender_id === $this->user()?->id
            && $message->created_at?->greaterThanOrEqualTo(now()->subMinutes(10));
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var DirectMessage $message */
        $message = $this->route('directMessage');

        return [
            'body' => [
                $message->image_path === null ? 'required' : 'nullable',
                'string',
                'max:4000',
            ],
        ];
    }
}
