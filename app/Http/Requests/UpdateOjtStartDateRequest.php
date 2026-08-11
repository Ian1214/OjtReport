<?php

namespace App\Http\Requests;

use App\Models\User;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateOjtStartDateRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        /** @var User|null $companyAdmin */
        $companyAdmin = $this->user();
        /** @var User|null $ojt */
        $ojt = $this->route('ojt');

        return $companyAdmin?->isCompanyAdmin() === true
            && $ojt instanceof User
            && $ojt->role === 'ojt'
            && $ojt->company_id === $companyAdmin->company_id;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'start_date' => [
                'bail',
                'required',
                Rule::date()->format('Y-m-d')->beforeOrEqual(today()),
                function (string $attribute, mixed $value, Closure $fail): void {
                    /** @var User|null $ojt */
                    $ojt = $this->route('ojt');

                    if (! $ojt instanceof User) {
                        return;
                    }

                    $hasEarlierAttendance = $ojt->dailyReports()
                        ->whereDate('report_date', '<', $value)
                        ->exists();

                    if ($hasEarlierAttendance) {
                        $fail('The start date cannot be later than an existing attendance record.');
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'start_date.before_or_equal' => 'The start date cannot be in the future.',
        ];
    }
}
