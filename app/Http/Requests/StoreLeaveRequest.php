<?php

namespace App\Http\Requests;

use App\Models\LeaveRequest;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreLeaveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'ojt';
    }

    /** @return array<string, ValidationRule|array<mixed>|string> */
    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['leave', 'sick', 'official_business'])],
            'start_date' => ['required', 'date', 'after_or_equal:today'],
            'end_date' => ['required', 'date', 'after_or_equal:start_date'],
            'reason' => ['required', 'string', 'min:10', 'max:2000'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ($validator->errors()->isNotEmpty()) {
                return;
            }

            $overlaps = LeaveRequest::query()
                ->where('user_id', $this->user()->id)
                ->whereNot('status', LeaveRequest::STATUS_REJECTED)
                ->whereDate('start_date', '<=', $this->date('end_date'))
                ->whereDate('end_date', '>=', $this->date('start_date'))
                ->exists();

            if ($overlaps) {
                $validator->errors()->add('start_date', 'These dates overlap an existing request.');
            }
        }];
    }
}
