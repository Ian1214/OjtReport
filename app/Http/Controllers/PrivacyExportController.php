<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class PrivacyExportController extends Controller
{
    public function __invoke(Request $request, ?int $user = null): StreamedResponse
    {
        /** @var User $actor */
        $actor = $request->user();
        $subject = $user === null ? $actor : User::withTrashed()->findOrFail($user);
        abort_unless($actor->is($subject) || ($actor->isCompanyAdmin() && $actor->company_id === $subject->company_id), 403);

        $subject->load(['dailyReports.correctionRequests', 'leaveRequests', 'dtrSubmissions', 'assignedTasks']);
        $payload = [
            'exported_at' => now()->toIso8601String(),
            'profile' => $subject->only(['name', 'student_id', 'program', 'year', 'company', 'department', 'position', 'required_hours', 'start_date', 'end_date', 'email']),
            'daily_reports' => $subject->dailyReports,
            'leave_requests' => $subject->leaveRequests,
            'dtr_submissions' => $subject->dtrSubmissions,
            'tasks' => $subject->assignedTasks,
        ];

        return response()->streamDownload(
            fn () => print json_encode($payload, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR),
            'ojt-data-'.$subject->id.'-'.now()->format('Ymd').'.json',
            ['Content-Type' => 'application/json'],
        );
    }
}
