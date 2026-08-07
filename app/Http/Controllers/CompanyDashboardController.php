<?php

namespace App\Http\Controllers;

use App\Models\Company;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Inertia\Inertia;
use Inertia\Response;

class CompanyDashboardController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();

        if ($user->isSupervisor()) {
            return app(SupervisorDashboardController::class)->index($request);
        }

        if (! $user->isCompanyAdmin()) {
            $user->loadMissing('assignedSupervisor');

            return Inertia::render('dashboard', [
                'supervisor' => $user->assignedSupervisor === null ? null : [
                    'id' => $user->assignedSupervisor->id,
                    'name' => $user->assignedSupervisor->name,
                ],
                'tasks' => $user->assignedTasks()
                    ->latest()
                    ->get()
                    ->map(fn ($task): array => [
                        'id' => $task->id,
                        'title' => $task->title,
                        'description' => $task->description,
                        'status' => $task->status,
                        'dueDate' => $task->due_date?->toDateString(),
                    ]),
            ]);
        }

        /** @var Company $company */
        $company = $user->companyRecord;

        Gate::authorize('view', $company);

        $totalOjtCount = $company->ojts()->count();
        $completedOjtCount = $company->ojts()->whereNotNull('end_date')->count();

        return Inertia::render('company/overview', [
            'company' => [
                'name' => $company->name,
            ],
            'stats' => [
                'totalOjtCount' => $totalOjtCount,
                'activeOjtCount' => $totalOjtCount - $completedOjtCount,
                'completedOjtCount' => $completedOjtCount,
            ],
        ]);
    }
}
