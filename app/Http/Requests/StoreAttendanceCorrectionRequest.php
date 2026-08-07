<?php

namespace App\Http\Requests;

use App\Models\DailyReport;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreAttendanceCorrectionRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $report = $this->route('dailyReport');

        return $report instanceof DailyReport
            && $this->user()?->role === 'ojt'
            && $report->user_id === $this->user()?->id
            && $report->approval_status === DailyReport::STATUS_APPROVED;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'proposed_time_in' => ['nullable', 'date_format:H:i'],
            'proposed_time_out' => ['nullable', 'date_format:H:i'],
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
        ];
    }

    /** @return array<int, callable> */
    public function after(): array
    {
        return [function (Validator $validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            /** @var DailyReport $report */
            $report = $this->route('dailyReport');
            $proposedTimeIn = $this->string('proposed_time_in')->toString();
            $proposedTimeOut = $this->string('proposed_time_out')->toString();

            if ($proposedTimeIn === '' && $proposedTimeOut === '') {
                $validator->errors()->add('attendance', 'Provide a corrected time in, time out, or both.');

                return;
            }

            $timeIn = Carbon::createFromFormat('H:i', $proposedTimeIn ?: substr($report->time_in, 0, 5));
            $timeOut = Carbon::createFromFormat('H:i', $proposedTimeOut ?: substr($report->time_out, 0, 5));

            if ($timeOut->lessThanOrEqualTo($timeIn)) {
                $validator->errors()->add('attendance', 'The corrected time out must be later than time in.');
            }

            if ($timeIn->format('H:i:s') === $report->time_in
                && $timeOut->format('H:i:s') === $report->time_out) {
                $validator->errors()->add('attendance', 'The corrected times must differ from the recorded attendance.');
            }
        }];
    }
}
