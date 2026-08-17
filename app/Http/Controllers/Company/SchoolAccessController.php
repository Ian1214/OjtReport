<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateOjtSchoolRequest;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class SchoolAccessController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $administrator */
        $administrator = $request->user();
        abort_unless($administrator->isCompanyAdmin(), 403);
        Gate::authorize('view', $administrator->companyRecord);

        return Inertia::render('company/school-access', [
            'schools' => School::query()
                ->whereHas('coordinators')
                ->with('coordinators:id,school_id,name,email')
                ->withCount([
                    'ojts as company_ojts_count' => fn ($query) => $query
                        ->where('company_id', $administrator->company_id),
                ])
                ->orderBy('name')
                ->get(['id', 'name'])
                ->map(function (School $school): array {
                    $coordinator = (int) $school->getAttribute('company_ojts_count') > 0
                        ? $school->coordinators->first()
                        : null;

                    return [
                        'id' => $school->id,
                        'name' => $school->name,
                        'coordinator' => $coordinator === null ? null : [
                            'id' => $coordinator->id,
                            'name' => $coordinator->name,
                            'email' => $coordinator->email,
                        ],
                    ];
                }),
            'ojts' => $administrator->companyRecord->ojts()
                ->with('school:id,name')
                ->orderBy('name')
                ->get(['id', 'school_id', 'name', 'student_id'])
                ->map(fn (User $ojt): array => [
                    'id' => $ojt->id,
                    'name' => $ojt->name,
                    'studentId' => $ojt->student_id,
                    'schoolId' => $ojt->school_id,
                    'schoolName' => $ojt->school?->name,
                ]),
        ]);
    }

    public function update(UpdateOjtSchoolRequest $request, User $ojt): RedirectResponse
    {
        $ojt->update(['school_id' => $request->validated('school_id')]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $ojt->school_id === null
                ? "School access removed for {$ojt->name}."
                : "School access updated for {$ojt->name}.",
        ]);

        return back();
    }
}
