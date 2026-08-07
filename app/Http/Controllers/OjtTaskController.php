<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OjtTaskController extends Controller
{
    public function __invoke(Request $request): Response
    {
        /** @var User $ojt */
        $ojt = $request->user();

        abort_unless($ojt->role === 'ojt', 403);

        $ojt->loadMissing('assignedSupervisor:id,name');

        return Inertia::render('tasks/index', [
            'supervisorName' => $ojt->assignedSupervisor?->name,
            'tasks' => $ojt->assignedTasks()
                ->latest()
                ->get(['id', 'title', 'description', 'status', 'due_date'])
                ->map(fn ($task): array => [
                    'id' => $task->id,
                    'title' => $task->title,
                    'description' => $task->description,
                    'status' => $task->status,
                    'dueDate' => $task->due_date?->toDateString(),
                ]),
        ]);
    }
}
