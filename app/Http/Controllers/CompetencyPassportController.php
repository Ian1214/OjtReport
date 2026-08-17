<?php

namespace App\Http\Controllers;

use App\Actions\RecordActivity;
use App\Http\Requests\StorePassportShareRequest;
use App\Models\CompletionCertificate;
use App\Models\PassportShare;
use App\Models\PerformanceEvaluation;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Inertia\Response;

class CompetencyPassportController extends Controller
{
    public function index(Request $request): Response|RedirectResponse
    {
        /** @var User $viewer */
        $viewer = $request->user();

        if ($viewer->role === 'ojt') {
            return to_route('passports.show', $viewer);
        }

        abort_unless(in_array($viewer->role, ['company_admin', 'supervisor', 'school_coordinator'], true), 403);

        $students = User::query()
            ->where('role', 'ojt')
            ->when($viewer->isCompanyAdmin(), fn (Builder $query): Builder => $query->where('company_id', $viewer->company_id))
            ->when($viewer->isSupervisor(), fn (Builder $query): Builder => $query->where('supervisor_id', $viewer->id))
            ->when($viewer->isSchoolCoordinator(), fn (Builder $query): Builder => $query->where('school_id', $viewer->school_id))
            ->with(['companyRecord:id,name', 'assignedSupervisor:id,name'])
            ->withSum('approvedDailyReports as approved_hours', 'total_hours')
            ->withCount([
                'assignedTasks as completed_tasks_count' => fn (Builder $query): Builder => $query->where('status', 'finished'),
                'performanceEvaluations as submitted_evaluations_count' => fn (Builder $query): Builder => $query
                    ->where('status', PerformanceEvaluation::STATUS_SUBMITTED),
            ])
            ->orderBy('name')
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('passports/index', [
            'students' => $students->through(fn (User $ojt): array => [
                'id' => $ojt->id,
                'name' => $ojt->name,
                'studentId' => $ojt->student_id,
                'program' => $ojt->program,
                'companyName' => $ojt->companyRecord?->name ?? $ojt->company ?? 'Not assigned',
                'supervisorName' => $ojt->assignedSupervisor?->name ?? 'Not assigned',
                'approvedHours' => (float) ($ojt->getAttribute('approved_hours') ?? 0),
                'requiredHours' => (float) ($ojt->required_hours ?? 0),
                'completedTasks' => (int) $ojt->getAttribute('completed_tasks_count'),
                'evaluations' => (int) $ojt->getAttribute('submitted_evaluations_count'),
            ]),
        ]);
    }

    public function show(Request $request, User $ojt): Response
    {
        /** @var User $viewer */
        $viewer = $request->user();
        $this->authorizeViewer($viewer, $ojt);

        return Inertia::render('passports/show', [
            'passport' => $this->passportData($ojt, includePrivateEvidence: true),
            'canManageSharing' => $viewer->id === $ojt->id,
            'activeShare' => $viewer->id === $ojt->id ? $this->activeShareData($ojt) : null,
            'newShareUrl' => $request->session()->get('passportShareUrl'),
        ]);
    }

    public function storeShare(StorePassportShareRequest $request, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $ojt */
        $ojt = $request->user();
        Gate::authorize('create', PassportShare::class);
        $token = Str::random(64);

        $share = DB::transaction(function () use ($ojt, $request, $token): PassportShare {
            $ojt->passportShares()->whereNull('revoked_at')->update(['revoked_at' => now()]);

            return $ojt->passportShares()->create([
                'created_by' => $ojt->id,
                'token_hash' => hash('sha256', $token),
                'token' => $token,
                'expires_at' => now()->addDays($request->integer('expires_days')),
            ]);
        }, attempts: 3);

        $recordActivity->handle(
            $ojt,
            'passport.share_created',
            "{$ojt->name} created a privacy-controlled competency passport link.",
            $share,
            ['expires_at' => $share->expires_at->toIso8601String()],
        );
        Inertia::flash('toast', ['type' => 'success', 'message' => 'A new verification link was created.']);

        return back()->with('passportShareUrl', route('passports.verify', ['token' => $token]));
    }

    public function destroyShare(Request $request, PassportShare $passportShare, RecordActivity $recordActivity): RedirectResponse
    {
        Gate::authorize('delete', $passportShare);
        $passportShare->update(['revoked_at' => now()]);

        /** @var User $ojt */
        $ojt = $request->user();
        $recordActivity->handle($ojt, 'passport.share_revoked', "{$ojt->name} revoked a competency passport link.", $passportShare);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'The public verification link was revoked.']);

        return back();
    }

    public function verify(string $token): Response
    {
        $share = PassportShare::query()
            ->with('ojt')
            ->where('token_hash', hash('sha256', $token))
            ->firstOrFail();

        abort_unless($share->isAvailable(), 410, 'This competency passport link has expired or was revoked.');

        $share->increment('access_count');
        $share->forceFill(['last_accessed_at' => now()])->save();

        return Inertia::render('passports/verify', [
            'passport' => $this->passportData($share->ojt, includePrivateEvidence: false),
            'expiresAt' => $share->expires_at->toIso8601String(),
        ]);
    }

    private function authorizeViewer(User $viewer, User $ojt): void
    {
        abort_unless($ojt->role === 'ojt', 404);

        $authorized = match ($viewer->role) {
            'ojt' => $viewer->id === $ojt->id,
            'company_admin' => $viewer->company_id !== null && $viewer->company_id === $ojt->company_id,
            'supervisor' => $ojt->supervisor_id === $viewer->id,
            'school_coordinator' => $viewer->school_id !== null && $viewer->school_id === $ojt->school_id,
            default => false,
        };

        abort_unless($authorized, 404);
    }

    /** @return array<string, mixed> */
    private function passportData(User $ojt, bool $includePrivateEvidence): array
    {
        $ojt->loadMissing(['companyRecord:id,name', 'assignedSupervisor:id,name', 'school:id,name']);
        $approvedHours = (float) $ojt->approvedDailyReports()->sum('total_hours');
        $approvedReports = $ojt->approvedDailyReports()->count();
        $completedTasks = $ojt->assignedTasks()->with('curriculumOutcomes:id,code,title')->where('status', 'finished')->latest('updated_at')->limit(12)
            ->get(['id', 'title', 'description', 'updated_at']);
        $evaluations = $ojt->performanceEvaluations()
            ->where('status', PerformanceEvaluation::STATUS_SUBMITTED)
            ->latest('period_end')
            ->get();
        $certificates = $ojt->completionCertificates()
            ->where('status', CompletionCertificate::STATUS_FINALIZED)
            ->whereNull('revoked_at')
            ->latest('finalized_at')
            ->get(['certificate_number', 'allocated_hours', 'finalized_at', 'snapshot_hash']);
        $skillFields = [
            'technical_score' => 'Technical skills',
            'work_quality_score' => 'Work quality',
            'communication_score' => 'Communication',
            'professionalism_score' => 'Professionalism',
            'attendance_score' => 'Attendance reliability',
        ];
        $skills = collect($skillFields)->map(function (string $label, string $field) use ($evaluations): array {
            $scores = $evaluations->pluck($field)->filter(fn ($score): bool => $score !== null);

            return [
                'key' => $field,
                'label' => $label,
                'score' => $scores->isEmpty() ? null : round((float) $scores->average(), 2),
                'evidenceCount' => $scores->count(),
            ];
        })->values();
        $fingerprintPayload = [
            'ojt_id' => $ojt->id,
            'approved_hours' => number_format($approvedHours, 2, '.', ''),
            'approved_reports' => $approvedReports,
            'task_ids' => $completedTasks->pluck('id')->all(),
            'outcome_ids' => $completedTasks->flatMap->curriculumOutcomes->pluck('id')->unique()->sort()->values()->all(),
            'evaluation_ids' => $evaluations->pluck('id')->all(),
            'certificates' => $certificates->pluck('snapshot_hash', 'certificate_number')->all(),
            'school_acknowledged_at' => $ojt->school_acknowledged_at?->toIso8601String(),
        ];

        return [
            'name' => $ojt->name,
            'studentId' => $ojt->student_id,
            'program' => $ojt->program,
            'position' => $ojt->position,
            'department' => $ojt->department,
            'companyName' => $ojt->companyRecord?->name ?? $ojt->company ?? 'Not assigned',
            'supervisorName' => $ojt->assignedSupervisor?->name ?? 'Not assigned',
            'schoolName' => $ojt->school?->name,
            'startDate' => $ojt->start_date?->toDateString(),
            'completionDate' => $ojt->end_date?->toDateString(),
            'approvedHours' => $approvedHours,
            'requiredHours' => (float) ($ojt->required_hours ?? 0),
            'approvedReports' => $approvedReports,
            'completedTasks' => $completedTasks->map(fn ($task): array => [
                'title' => $task->title,
                'description' => $includePrivateEvidence ? $task->description : null,
                'completedAt' => $task->updated_at?->toIso8601String(),
                'outcomes' => $task->curriculumOutcomes->map(fn ($outcome): array => [
                    'code' => $outcome->code,
                    'title' => $outcome->title,
                ]),
            ]),
            'skills' => $skills,
            'evaluationCount' => $evaluations->count(),
            'certificates' => $certificates->map(fn (CompletionCertificate $certificate): array => [
                'number' => $certificate->certificate_number,
                'hours' => (float) $certificate->allocated_hours,
                'finalizedAt' => $certificate->finalized_at?->toIso8601String(),
            ]),
            'schoolAcknowledgedAt' => $ojt->school_acknowledged_at?->toIso8601String(),
            'fingerprint' => hash('sha256', json_encode($fingerprintPayload, JSON_THROW_ON_ERROR)),
            'verifiedAt' => now()->toIso8601String(),
        ];
    }

    /** @return array<string, mixed>|null */
    private function activeShareData(User $ojt): ?array
    {
        $share = $ojt->passportShares()
            ->whereNull('revoked_at')
            ->where('expires_at', '>', now())
            ->latest()
            ->first();

        if ($share === null) {
            return null;
        }

        return [
            'id' => $share->id,
            'url' => route('passports.verify', ['token' => $share->token]),
            'expiresAt' => $share->expires_at->toIso8601String(),
            'accessCount' => $share->access_count,
            'lastAccessedAt' => $share->last_accessed_at?->toIso8601String(),
        ];
    }
}
