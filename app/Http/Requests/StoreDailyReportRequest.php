<?php

namespace App\Http\Requests;

use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreDailyReportRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'report_date' => [
                'required',
                'date',
                Rule::unique('daily_reports', 'report_date')
                    ->where('user_id', $this->user()?->id),
            ],
            'time_in' => ['required', 'date_format:H:i'],
            'time_out' => ['required', 'date_format:H:i'],
            'summary' => ['required', 'string', 'max:5000'],
        ];
    }

    /**
     * @return array<int, callable(Validator): void>
     */
    public function after(): array
    {
        return [
            function (Validator $validator): void {
                if ($validator->errors()->hasAny(['time_in', 'time_out'])) {
                    return;
                }

                $timeIn = Carbon::createFromFormat('H:i', $this->string('time_in')->value());
                $timeOut = Carbon::createFromFormat('H:i', $this->string('time_out')->value());

                if ($timeOut->lessThanOrEqualTo($timeIn)) {
                    $validator->errors()->add('time_out', 'Time out must be later than time in.');
                }
            },
        ];
    }
}
