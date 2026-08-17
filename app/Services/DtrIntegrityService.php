<?php

namespace App\Services;

use App\Models\DailyReport;
use App\Models\DtrSubmission;
use Illuminate\Support\Str;

class DtrIntegrityService
{
    public function hash(DtrSubmission $submission): string
    {
        $submission->loadMissing('reports');
        $snapshot = $submission->reports->sortBy('id')->map(fn (DailyReport $report): array => [
            $report->id,
            $report->report_date->toDateString(),
            $report->time_in,
            $report->time_out,
            $report->total_hours,
        ])->values()->toJson();

        return hash('sha256', Str::of($snapshot)->append(
            '|',
            (string) $submission->user_id,
            '|',
            $submission->period_start->toDateString(),
            '|',
            $submission->period_end->toDateString(),
            '|',
            (string) $submission->student_signature_name,
            '|',
            $this->signatureSnapshot($submission->student_signature_strokes),
            '|',
            (string) $submission->student_signed_at?->toIso8601String(),
            '|',
            (string) $submission->supervisor_signature_name,
            '|',
            $this->signatureSnapshot($submission->supervisor_signature_strokes),
            '|',
            (string) $submission->supervisor_signed_at?->toIso8601String(),
        )->toString());
    }

    public function isValid(DtrSubmission $submission): bool
    {
        return $submission->snapshot_hash !== null
            && hash_equals($submission->snapshot_hash, $this->hash($submission));
    }

    /** @param array{version?: mixed, strokes?: mixed}|null $signature */
    private function signatureSnapshot(?array $signature): string
    {
        if ($signature === null) {
            return 'null';
        }

        return json_encode([
            'version' => $signature['version'] ?? null,
            'strokes' => $signature['strokes'] ?? null,
        ], JSON_THROW_ON_ERROR);
    }
}
