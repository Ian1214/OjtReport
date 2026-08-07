<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreCompanyHolidayRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isCompanyAdmin() === true;
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'holiday_date' => ['required', 'date'],
            'name' => ['required', 'string', 'max:150'],
        ];
    }
}
