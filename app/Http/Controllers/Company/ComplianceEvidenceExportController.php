<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\DailyReport;
use App\Models\PerformanceEvaluation;
use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ComplianceEvidenceExportController extends Controller
{
    /**
     * Handle the incoming request.
     */
    public function __invoke(Request $request): StreamedResponse
    {
        /** @var User $administrator */
        $administrator = $request->user();
        abort_unless($administrator->isCompanyAdmin() && $administrator->company_id !== null, 403);

        $filename = 'ojt-compliance-evidence-'.now()->format('Y-m-d-His').'.json';

        return response()->streamDownload(function () use ($administrator): void {
            echo json_encode([
                'schemaVersion' => 1,
                'generatedAt' => now()->toIso8601String(),
                'companyId' => $administrator->company_id,
            ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
            echo "\n";

            User::query()
                ->where('company_id', $administrator->company_id)
                ->where('role', 'ojt')
                ->with(['assignedSupervisor:id,name', 'school:id,name'])
                ->orderBy('id')
                ->chunkById(100, function ($students): void {
                    foreach ($students as $ojt) {
                        $approvedReports = $ojt->dailyReports()
                            ->where('approval_status', DailyReport::STATUS_APPROVED)
                            ->orderBy('report_date')
                            ->get(['report_date', 'time_in', 'time_out', 'total_hours', 'attendance_status', 'reviewed_at']);
                        $evaluations = $ojt->performanceEvaluations()
                            ->where('status', PerformanceEvaluation::STATUS_SUBMITTED)
                            ->orderBy('period_end')
                            ->get([
                                'period_start', 'period_end', 'technical_score', 'work_quality_score',
                                'communication_score', 'professionalism_score', 'attendance_score', 'submitted_at',
                            ]);
                        $certificates = $ojt->completionCertificates()
                            ->whereNull('revoked_at')
                            ->orderBy('finalized_at')
                            ->get(['certificate_number', 'allocated_hours', 'status', 'finalized_at', 'snapshot_hash']);

                        echo json_encode([
                            'student' => [
                                'studentId' => $ojt->student_id,
                                'name' => $ojt->name,
                                'program' => $ojt->program,
                                'department' => $ojt->department,
                                'position' => $ojt->position,
                                'requiredHours' => $ojt->required_hours,
                                'startDate' => $ojt->start_date?->toDateString(),
                                'completionDate' => $ojt->end_date?->toDateString(),
                                'supervisor' => $ojt->assignedSupervisor?->name,
                                'school' => $ojt->school?->name,
                                'schoolAcknowledgedAt' => $ojt->school_acknowledged_at?->toIso8601String(),
                            ],
                            'approvedReports' => $approvedReports,
                            'submittedEvaluations' => $evaluations,
                            'validCertificates' => $certificates,
                        ], JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES);
                        echo "\n";
                    }
                });
        }, $filename, ['Content-Type' => 'application/x-ndjson']);
    }
}
