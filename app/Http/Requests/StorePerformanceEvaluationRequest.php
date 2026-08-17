<?php

namespace App\Http\Requests;

use App\Models\PerformanceEvaluation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePerformanceEvaluationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user()?->isSupervisor() === true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $scoreRules = ['nullable', 'required_if:action,submitted', 'integer', 'between:1,5'];

        return [
            'ojt_id' => [
                'required',
                'integer',
                Rule::exists('users', 'id')->where(fn ($query) => $query
                    ->where('role', 'ojt')
                    ->where('supervisor_id', $this->user()?->id)),
            ],
            'period_start' => [
                'required',
                'date',
                'before_or_equal:today',
                Rule::unique('performance_evaluations')->where(fn ($query) => $query
                    ->where('ojt_id', $this->integer('ojt_id'))
                    ->where('period_end', $this->input('period_end'))),
            ],
            'period_end' => ['required', 'date', 'after_or_equal:period_start', 'before_or_equal:today'],
            'action' => ['required', Rule::in([PerformanceEvaluation::STATUS_DRAFT, PerformanceEvaluation::STATUS_SUBMITTED])],
            'technical_score' => $scoreRules,
            'work_quality_score' => $scoreRules,
            'communication_score' => $scoreRules,
            'professionalism_score' => $scoreRules,
            'attendance_score' => $scoreRules,
            'strengths' => ['nullable', 'required_if:action,submitted', 'string', 'max:5000'],
            'improvements' => ['nullable', 'required_if:action,submitted', 'string', 'max:5000'],
            'comments' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
