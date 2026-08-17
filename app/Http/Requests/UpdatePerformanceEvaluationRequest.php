<?php

namespace App\Http\Requests;

use App\Models\PerformanceEvaluation;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdatePerformanceEvaluationRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        $evaluation = $this->route('performanceEvaluation');

        return $evaluation instanceof PerformanceEvaluation
            && $this->user()?->isSupervisor() === true
            && $evaluation->supervisor_id === $this->user()?->id
            && $evaluation->status === PerformanceEvaluation::STATUS_DRAFT;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'period_start' => [
                'required',
                'date',
                'before_or_equal:today',
                Rule::unique('performance_evaluations')
                    ->ignore($this->route('performanceEvaluation'))
                    ->where(fn ($query) => $query
                        ->where('ojt_id', $this->route('performanceEvaluation')?->ojt_id)
                        ->where('period_end', $this->input('period_end'))),
            ],
            'period_end' => ['required', 'date', 'after_or_equal:period_start', 'before_or_equal:today'],
            'action' => ['required', Rule::in([PerformanceEvaluation::STATUS_DRAFT, PerformanceEvaluation::STATUS_SUBMITTED])],
            'technical_score' => ['nullable', 'required_if:action,submitted', 'integer', 'between:1,5'],
            'work_quality_score' => ['nullable', 'required_if:action,submitted', 'integer', 'between:1,5'],
            'communication_score' => ['nullable', 'required_if:action,submitted', 'integer', 'between:1,5'],
            'professionalism_score' => ['nullable', 'required_if:action,submitted', 'integer', 'between:1,5'],
            'attendance_score' => ['nullable', 'required_if:action,submitted', 'integer', 'between:1,5'],
            'strengths' => ['nullable', 'required_if:action,submitted', 'string', 'max:5000'],
            'improvements' => ['nullable', 'required_if:action,submitted', 'string', 'max:5000'],
            'comments' => ['nullable', 'string', 'max:5000'],
        ];
    }
}
