<?php

namespace App\Http\Controllers\Company;

use App\Actions\RecordActivity;
use App\Http\Controllers\Controller;
use App\Http\Requests\RestoreOperationalRecordRequest;
use App\Models\ActivityLog;
use App\Models\DailyReport;
use App\Models\Document;
use App\Models\DtrSubmission;
use App\Models\PerformanceEvaluation;
use App\Models\User;
use App\Support\CompanyPermissions;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class RecoveryCenterController extends Controller
{
    /** @var array<string, class-string<Model>> */
    private const MODELS = [
        'report' => DailyReport::class,
        'document' => Document::class,
        'evaluation' => PerformanceEvaluation::class,
        'dtr' => DtrSubmission::class,
    ];

    public function index(Request $request): Response
    {
        /** @var User $viewer */
        $viewer = $request->user();
        abort_unless($viewer->canCompany(CompanyPermissions::AUDIT_VIEW), 403);

        return Inertia::render('company/recovery', [
            'records' => collect()
                ->concat($this->documents($viewer))
                ->concat($this->evaluations($viewer))
                ->concat($this->reports($viewer))
                ->concat($this->dtrs($viewer))
                ->sortByDesc('deletedAt')
                ->values(),
        ]);
    }

    public function restore(
        RestoreOperationalRecordRequest $request,
        string $recordType,
        int $recordId,
        RecordActivity $recordActivity,
    ): RedirectResponse {
        /** @var User $actor */
        $actor = $request->user();
        $record = $this->trashedRecord($actor, $recordType, $recordId);

        DB::transaction(function () use ($record): void {
            $record->restore();
            $record->update(['deletion_reason' => null, 'deleted_by' => null]);

            if ($record instanceof DtrSubmission) {
                $this->restoreDtrReports($record);
            }
        }, attempts: 3);

        $recordActivity->handle($actor, "{$recordType}.restored", "{$actor->name} restored a {$recordType} from the recovery center.", $record);
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Record restored successfully.']);

        return back();
    }

    public function destroy(Request $request, string $recordType, int $recordId, RecordActivity $recordActivity): RedirectResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        abort_unless($actor->isCompanyAdmin(), 403);
        $record = $this->trashedRecord($actor, $recordType, $recordId);

        if ($record instanceof Document && Storage::disk($record->disk)->exists($record->path)) {
            Storage::disk($record->disk)->delete($record->path);
        }

        $recordActivity->handle($actor, "{$recordType}.permanently_deleted", "{$actor->name} permanently deleted a {$recordType} from the recovery center.", null, ['record_id' => $record->getKey()]);
        $record->forceDelete();
        Inertia::flash('toast', ['type' => 'success', 'message' => 'Record permanently deleted.']);

        return back();
    }

    /** @return Collection<int, array<string, mixed>> */
    private function documents(User $viewer)
    {
        return Document::onlyTrashed()->where('company_id', $viewer->company_id)->latest('deleted_at')->limit(100)->get()
            ->map(fn (Document $document): array => $this->recordData('document', $document, $document->title));
    }

    /** @return Collection<int, array<string, mixed>> */
    private function evaluations(User $viewer)
    {
        return PerformanceEvaluation::onlyTrashed()->where('company_id', $viewer->company_id)->with('ojt:id,name')->latest('deleted_at')->limit(100)->get()
            ->map(fn (PerformanceEvaluation $evaluation): array => $this->recordData('evaluation', $evaluation, 'Evaluation for '.($evaluation->ojt?->name ?? 'archived OJT')));
    }

    /** @return Collection<int, array<string, mixed>> */
    private function reports(User $viewer)
    {
        return DailyReport::onlyTrashed()->whereHas('user', fn ($query) => $query->where('company_id', $viewer->company_id))->with('user:id,name')->latest('deleted_at')->limit(100)->get()
            ->map(fn (DailyReport $report): array => $this->recordData('report', $report, ($report->user?->name ?? 'OJT').' · '.$report->report_date->toDateString()));
    }

    /** @return Collection<int, array<string, mixed>> */
    private function dtrs(User $viewer)
    {
        return DtrSubmission::onlyTrashed()->where('company_id', $viewer->company_id)->with('user:id,name')->latest('deleted_at')->limit(100)->get()
            ->map(fn (DtrSubmission $dtr): array => $this->recordData('dtr', $dtr, ($dtr->user?->name ?? 'OJT').' · '.$dtr->period_start->toDateString().' to '.$dtr->period_end->toDateString()));
    }

    /** @return array<string, mixed> */
    private function recordData(string $type, Model $record, string $label): array
    {
        return [
            'id' => $record->getKey(),
            'type' => $type,
            'label' => $label,
            'reason' => $record->getAttribute('deletion_reason'),
            'deletedAt' => $record->getAttribute('deleted_at')?->toIso8601String(),
        ];
    }

    private function trashedRecord(User $actor, string $recordType, int $recordId): Model
    {
        abort_unless(isset(self::MODELS[$recordType]), 404);
        $model = self::MODELS[$recordType];
        $record = $model::onlyTrashed()->findOrFail($recordId);

        $belongsToCompany = match (true) {
            $record instanceof DailyReport => $record->user()->where('company_id', $actor->company_id)->exists(),
            default => (int) $record->getAttribute('company_id') === $actor->company_id,
        };
        abort_unless($belongsToCompany, 404);

        return $record;
    }

    private function restoreDtrReports(DtrSubmission $submission): void
    {
        $activity = ActivityLog::query()
            ->where('subject_type', $submission->getMorphClass())
            ->where('subject_id', $submission->id)
            ->whereIn('event', ['dtr.deleted', 'dtr.finalized_deleted'])
            ->latest()
            ->first();
        $reportIds = array_filter((array) ($activity?->properties['report_ids'] ?? []), 'is_int');

        DailyReport::query()
            ->where('user_id', $submission->user_id)
            ->whereIn('id', $reportIds)
            ->whereNull('dtr_submission_id')
            ->update(['dtr_submission_id' => $submission->id]);
    }
}
