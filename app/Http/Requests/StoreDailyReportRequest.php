<?php

namespace App\Http\Requests;

use App\Models\DailyReport;
use App\Models\DtrSubmission;
use App\Models\LeaveRequest;
use App\Models\User;
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
        return $this->user()?->can('create', DailyReport::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        /** @var User $user */
        $user = $this->user();
        $earliestDate = $user->start_date?->toDateString() ?? today()->toDateString();

        return [
            'report_date' => [
                'required',
                Rule::date()
                    ->format('Y-m-d')
                    ->afterOrEqual($earliestDate)
                    ->beforeToday(),
                Rule::unique((new DailyReport)->getTable(), 'report_date')
                    ->where('user_id', $user->id),
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
                if ($validator->errors()->hasAny(['report_date', 'time_in', 'time_out'])) {
                    return;
                }

                /** @var User $user */
                $user = $this->user();
                $reportDate = $this->date('report_date');

                if ($reportDate === null) {
                    return;
                }

                if ($user->dailyReports()->whereDate('report_date', $reportDate)->exists()) {
                    $validator->errors()->add(
                        'report_date',
                        'A daily report already exists for this date.',
                    );
                }

                $timeIn = Carbon::createFromFormat('H:i', $this->string('time_in')->value());
                $timeOut = Carbon::createFromFormat('H:i', $this->string('time_out')->value());

                if ($timeOut->lessThanOrEqualTo($timeIn)) {
                    $validator->errors()->add('time_out', 'Time out must be later than time in.');
                }

                if ($user->companyRecord !== null && ! $user->companyRecord->isWorkDay($reportDate)) {
                    $validator->errors()->add(
                        'report_date',
                        'This date is not a scheduled company work day.',
                    );
                }

                if ($user->leaveRequests()
                    ->where('status', LeaveRequest::STATUS_APPROVED)
                    ->whereDate('start_date', '<=', $reportDate)
                    ->whereDate('end_date', '>=', $reportDate)
                    ->exists()) {
                    $validator->errors()->add(
                        'report_date',
                        'You have approved leave on this date.',
                    );
                }

                if ($user->dtrSubmissions()
                    ->whereNot('status', DtrSubmission::STATUS_REJECTED)
                    ->whereDate('period_start', '<=', $reportDate)
                    ->whereDate('period_end', '>=', $reportDate)
                    ->exists()) {
                    $validator->errors()->add(
                        'report_date',
                        'This date is already covered by a submitted DTR period.',
                    );
                }
            },
        ];
    }

    /** @return array<string, string> */
    public function messages(): array
    {
        return [
            'report_date.after_or_equal' => 'The work date cannot be before your official OJT start date.',
            'report_date.before' => 'Historical entries must use a date before today.',
            'report_date.unique' => 'A daily report already exists for this date.',
        ];
    }
}
