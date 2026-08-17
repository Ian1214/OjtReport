<?php

namespace App\Models;

use Database\Factories\PerformanceEvaluationFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PerformanceEvaluation extends Model
{
    /** @use HasFactory<PerformanceEvaluationFactory> */
    use HasFactory;

    public const STATUS_DRAFT = 'draft';

    public const STATUS_SUBMITTED = 'submitted';

    protected $fillable = [
        'company_id', 'ojt_id', 'supervisor_id', 'period_start', 'period_end',
        'technical_score', 'work_quality_score', 'communication_score',
        'professionalism_score', 'attendance_score', 'strengths',
        'improvements', 'comments', 'status', 'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'submitted_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function ojt(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ojt_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function averageScore(): ?float
    {
        $scores = [
            $this->technical_score,
            $this->work_quality_score,
            $this->communication_score,
            $this->professionalism_score,
            $this->attendance_score,
        ];

        if (in_array(null, $scores, true)) {
            return null;
        }

        return round(array_sum($scores) / count($scores), 2);
    }
}
