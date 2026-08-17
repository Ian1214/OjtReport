<?php

namespace App\Http\Controllers;

use App\Actions\RecordActivity;
use App\Http\Requests\StorePerformanceEvaluationRequest;
use App\Http\Requests\UpdatePerformanceEvaluationRequest;
use App\Models\PerformanceEvaluation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PerformanceEvaluationController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $viewer */
        $viewer = $request->user();
        abort_unless(in_array($viewer->role, ['company_admin', 'supervisor', 'ojt', 'school_coordinator'], true), 403);
        abort_if($viewer->isSchoolCoordinator() && $viewer->school_id === null, 403);

        $query = PerformanceEvaluation::query()
            ->with(['ojt:id,name,student_id,school_id', 'supervisor:id,name']);

        match ($viewer->role) {
            'supervisor' => $query->where('supervisor_id', $viewer->id),
            'company_admin' => $query
                ->where('company_id', $viewer->company_id)
                ->where('status', PerformanceEvaluation::STATUS_SUBMITTED),
            'ojt' => $query
                ->where('ojt_id', $viewer->id)
                ->where('status', PerformanceEvaluation::STATUS_SUBMITTED),
            'school_coordinator' => $query
                ->where('status', PerformanceEvaluation::STATUS_SUBMITTED)
                ->whereHas('ojt', fn (Builder $builder): Builder => $builder
                    ->where('school_id', $viewer->school_id)),
            default => abort(403),
        };

        $ojts = $viewer->isSupervisor()
            ? $viewer->assignedOjts()
                ->orderBy('name')
                ->get(['id', 'name', 'student_id'])
                ->map(fn (User $ojt): array => [
                    'id' => $ojt->id,
                    'name' => $ojt->name,
                    'studentId' => $ojt->student_id,
                ])
            : [];

        return Inertia::render('evaluations/index', [
            'role' => $viewer->role,
            'ojts' => $ojts,
            'evaluations' => $query
                ->latest('period_end')
                ->paginate(15)
                ->withQueryString()
                ->through(fn (PerformanceEvaluation $evaluation): array => $this->evaluationData($evaluation)),
        ]);
    }

    public function store(
        StorePerformanceEvaluationRequest $request,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $supervisor */
        $supervisor = $request->user();
        $ojt = $supervisor->assignedOjts()->findOrFail($request->integer('ojt_id'));
        $status = $request->validated('action');

        $evaluation = PerformanceEvaluation::query()->create([
            ...$request->safe()->except(['ojt_id', 'action']),
            'company_id' => $ojt->company_id,
            'ojt_id' => $ojt->id,
            'supervisor_id' => $supervisor->id,
            'status' => $status,
            'submitted_at' => $status === PerformanceEvaluation::STATUS_SUBMITTED ? now() : null,
        ]);

        $recordActivity->handle(
            $supervisor,
            $status === PerformanceEvaluation::STATUS_SUBMITTED ? 'evaluation.submitted' : 'evaluation.draft_saved',
            "{$supervisor->name} {$status} a performance evaluation for {$ojt->name}.",
            $evaluation,
        );
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $status === PerformanceEvaluation::STATUS_SUBMITTED
                ? 'Performance evaluation submitted.'
                : 'Evaluation draft saved.',
        ]);

        return back();
    }

    public function update(
        UpdatePerformanceEvaluationRequest $request,
        PerformanceEvaluation $performanceEvaluation,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $supervisor */
        $supervisor = $request->user();
        $status = $request->validated('action');

        $performanceEvaluation->update([
            ...$request->safe()->except('action'),
            'status' => $status,
            'submitted_at' => $status === PerformanceEvaluation::STATUS_SUBMITTED ? now() : null,
        ]);

        $recordActivity->handle(
            $supervisor,
            $status === PerformanceEvaluation::STATUS_SUBMITTED ? 'evaluation.submitted' : 'evaluation.draft_updated',
            "{$supervisor->name} updated a performance evaluation for {$performanceEvaluation->ojt->name}.",
            $performanceEvaluation,
        );
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $status === PerformanceEvaluation::STATUS_SUBMITTED
                ? 'Performance evaluation submitted and locked.'
                : 'Evaluation draft updated.',
        ]);

        return back();
    }

    public function destroy(
        Request $request,
        PerformanceEvaluation $performanceEvaluation,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $administrator */
        $administrator = $request->user();
        abort_unless($administrator->isCompanyAdmin(), 403);
        abort_unless($performanceEvaluation->company_id === $administrator->company_id, 404);

        $performanceEvaluation->loadMissing('ojt:id,name');
        $ojtName = $performanceEvaluation->ojt->name;

        $recordActivity->handle(
            $administrator,
            'evaluation.deleted',
            "{$administrator->name} deleted a performance evaluation for {$ojtName}.",
            $performanceEvaluation,
            [
                'ojt_id' => $performanceEvaluation->ojt_id,
                'ojt_name' => $ojtName,
                'period_start' => $performanceEvaluation->period_start->toDateString(),
                'period_end' => $performanceEvaluation->period_end->toDateString(),
                'status' => $performanceEvaluation->status,
            ],
        );

        $performanceEvaluation->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => "The performance evaluation for {$ojtName} was deleted.",
        ]);

        return to_route('evaluations.index');
    }

    /** @return array<string, mixed> */
    private function evaluationData(PerformanceEvaluation $evaluation): array
    {
        return [
            'id' => $evaluation->id,
            'ojtId' => $evaluation->ojt_id,
            'ojtName' => $evaluation->ojt->name,
            'studentId' => $evaluation->ojt->student_id,
            'supervisorName' => $evaluation->supervisor->name,
            'periodStart' => $evaluation->period_start->toDateString(),
            'periodEnd' => $evaluation->period_end->toDateString(),
            'technicalScore' => $evaluation->technical_score,
            'workQualityScore' => $evaluation->work_quality_score,
            'communicationScore' => $evaluation->communication_score,
            'professionalismScore' => $evaluation->professionalism_score,
            'attendanceScore' => $evaluation->attendance_score,
            'averageScore' => $evaluation->averageScore(),
            'strengths' => $evaluation->strengths,
            'improvements' => $evaluation->improvements,
            'comments' => $evaluation->comments,
            'status' => $evaluation->status,
            'submittedAt' => $evaluation->submitted_at?->toIso8601String(),
        ];
    }
}
