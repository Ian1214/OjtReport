<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreCurriculumOutcomeRequest;
use App\Models\CurriculumOutcome;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CurriculumOutcomeController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $coordinator */
        $coordinator = $request->user();
        abort_unless($coordinator->isSchoolCoordinator() && $coordinator->school_id !== null, 403);
        $coordinator->loadMissing('school:id,name');

        return Inertia::render('school/curriculum-outcomes', [
            'schoolName' => $coordinator->school?->name ?? 'School',
            'outcomes' => CurriculumOutcome::query()
                ->where('school_id', $coordinator->school_id)
                ->withCount([
                    'tasks',
                    'tasks as completed_tasks_count' => fn ($query) => $query->where('status', 'finished'),
                ])
                ->orderByDesc('is_active')
                ->orderBy('code')
                ->get()
                ->map(fn (CurriculumOutcome $outcome): array => [
                    'id' => $outcome->id,
                    'code' => $outcome->code,
                    'title' => $outcome->title,
                    'description' => $outcome->description,
                    'isActive' => $outcome->is_active,
                    'taskCount' => (int) $outcome->tasks_count,
                    'completedTaskCount' => (int) $outcome->completed_tasks_count,
                ]),
        ]);
    }

    public function store(StoreCurriculumOutcomeRequest $request): RedirectResponse
    {
        /** @var User $coordinator */
        $coordinator = $request->user();
        $coordinator->school->curriculumOutcomes()->create([
            ...$request->validated(),
            'code' => strtoupper($request->string('code')->trim()->value()),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Curriculum outcome created.']);

        return back();
    }

    public function update(Request $request, CurriculumOutcome $curriculumOutcome): RedirectResponse
    {
        /** @var User $coordinator */
        $coordinator = $request->user();
        abort_unless($coordinator->isSchoolCoordinator() && $coordinator->school_id === $curriculumOutcome->school_id, 404);

        $curriculumOutcome->update(['is_active' => ! $curriculumOutcome->is_active]);
        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $curriculumOutcome->is_active ? 'Outcome activated.' : 'Outcome archived.',
        ]);

        return back();
    }
}
