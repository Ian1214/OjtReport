<?php

use App\Http\Controllers\AttendanceCalendarController;
use App\Http\Controllers\AttendanceCorrectionController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\CertificateVerificationController;
use App\Http\Controllers\Company\ActivityLogController;
use App\Http\Controllers\Company\AttendanceMonitorController;
use App\Http\Controllers\Company\AttendancePolicyController;
use App\Http\Controllers\Company\AttendanceVerificationController;
use App\Http\Controllers\Company\CompanyHolidayController;
use App\Http\Controllers\Company\ComplianceEvidenceExportController;
use App\Http\Controllers\Company\DailyReportReviewController;
use App\Http\Controllers\Company\DepartmentController;
use App\Http\Controllers\Company\ManagedOjtController;
use App\Http\Controllers\Company\OjtAnalyticsController;
use App\Http\Controllers\Company\OjtBulkImportController;
use App\Http\Controllers\Company\OjtController;
use App\Http\Controllers\Company\OjtProfileController;
use App\Http\Controllers\Company\OperationsController;
use App\Http\Controllers\Company\ReportApprovalInboxController;
use App\Http\Controllers\Company\SchoolAccessController;
use App\Http\Controllers\Company\SchoolCoordinatorController;
use App\Http\Controllers\Company\SupervisorController;
use App\Http\Controllers\CompanyDashboardController;
use App\Http\Controllers\CompetencyPassportController;
use App\Http\Controllers\CompletionCertificateController;
use App\Http\Controllers\CurriculumOutcomeController;
use App\Http\Controllers\DailyReportController;
use App\Http\Controllers\DirectMessageController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\DtrSubmissionController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OjtTaskController;
use App\Http\Controllers\OjtTermsController;
use App\Http\Controllers\OnboardingChecklistController;
use App\Http\Controllers\PerformanceEvaluationController;
use App\Http\Controllers\PrivacyExportController;
use App\Http\Controllers\SchoolCoordinatorDashboardController;
use App\Http\Controllers\SupervisorDashboardController;
use App\Http\Controllers\SupervisorFeedbackController;
use App\Http\Controllers\SupervisorTaskController;
use App\Http\Middleware\EnsurePasswordChanged;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/terms', 'terms')->name('terms');
Route::get('/verify/certificates/{certificateNumber}', CertificateVerificationController::class)
    ->middleware('throttle:60,1')
    ->name('certificates.verify');
Route::get('/verify/passports/{token}', [CompetencyPassportController::class, 'verify'])
    ->middleware('throttle:60,1')
    ->name('passports.verify');

/*
|--------------------------------------------------------------------------
| Guest Routes
|--------------------------------------------------------------------------
*/

Route::middleware('guest')->group(function () {
    Route::get('/register', [RegisterController::class, 'create'])
        ->name('register');

    Route::post('/register', [RegisterController::class, 'store'])
        ->name('register.store');
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('terms/accept', [OjtTermsController::class, 'show'])
        ->name('ojt-terms.show');

    Route::post('terms/accept', [OjtTermsController::class, 'update'])
        ->middleware('throttle:6,1')
        ->name('ojt-terms.update');

    Route::get('/dashboard', [CompanyDashboardController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('dashboard');

    Route::get('/supervisor/dashboard', [SupervisorDashboardController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('supervisor.dashboard');

    Route::get('/school/dashboard', [SchoolCoordinatorDashboardController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('school.dashboard');

    Route::get('/school/students/{ojt}', [SchoolCoordinatorDashboardController::class, 'show'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('school.students.show');

    Route::patch('/school/students/{ojt}/acknowledge', [SchoolCoordinatorDashboardController::class, 'acknowledge'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('school.students.acknowledge');

    Route::get('/school/curriculum-outcomes', [CurriculumOutcomeController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('school.curriculum-outcomes.index');

    Route::post('/school/curriculum-outcomes', [CurriculumOutcomeController::class, 'store'])
        ->middleware(['throttle:20,1', EnsurePasswordChanged::class])
        ->name('school.curriculum-outcomes.store');

    Route::patch('/school/curriculum-outcomes/{curriculumOutcome}', [CurriculumOutcomeController::class, 'update'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('school.curriculum-outcomes.update');

    Route::get('reports/dtr', [DailyReportController::class, 'dtr'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('reports.dtr');

    Route::get('dtr-submissions', [DtrSubmissionController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('dtr-submissions.index');

    Route::post('dtr-submissions', [DtrSubmissionController::class, 'store'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('dtr-submissions.store');

    Route::delete('dtr-submissions/{dtrSubmission}', [DtrSubmissionController::class, 'destroy'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('dtr-submissions.destroy');

    Route::delete('company/dtr-submissions/{dtrSubmission}/finalized', [DtrSubmissionController::class, 'destroyFinalized'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.dtr-submissions.destroy-finalized');

    Route::patch('dtr-submissions/{dtrSubmission}/review', [DtrSubmissionController::class, 'review'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('dtr-submissions.review');

    Route::get('dtr-submissions/{dtrSubmission}/print', [DtrSubmissionController::class, 'showPrintable'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('dtr-submissions.print');

    Route::get('certificates', [CompletionCertificateController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('certificates.index');

    Route::post('certificates', [CompletionCertificateController::class, 'store'])
        ->middleware(['throttle:10,1', EnsurePasswordChanged::class])
        ->name('certificates.store');

    Route::patch('certificates/{completionCertificate}/sign', [CompletionCertificateController::class, 'sign'])
        ->middleware(['throttle:10,1', EnsurePasswordChanged::class])
        ->name('certificates.sign');

    Route::get('certificates/{completionCertificate}/print', [CompletionCertificateController::class, 'print'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('certificates.print');

    Route::delete('certificates/{completionCertificate}', [CompletionCertificateController::class, 'destroy'])
        ->middleware(['throttle:10,1', EnsurePasswordChanged::class])
        ->name('certificates.destroy');

    Route::post('reports/time-in', [DailyReportController::class, 'timeIn'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('reports.time-in');

    Route::get('reports/verify-attendance/{company}', [DailyReportController::class, 'scanAttendance'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('reports.verify-attendance');

    Route::get('documents', [DocumentController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('documents.index');

    Route::post('documents', [DocumentController::class, 'store'])
        ->middleware(['throttle:10,1', EnsurePasswordChanged::class])
        ->name('documents.store');

    Route::get('documents/{document}/view', [DocumentController::class, 'preview'])
        ->middleware(['throttle:60,1', EnsurePasswordChanged::class])
        ->name('documents.preview');

    Route::get('documents/{document}/download', [DocumentController::class, 'download'])
        ->middleware(['throttle:30,1', EnsurePasswordChanged::class])
        ->name('documents.download');

    Route::patch('documents/{document}/review', [DocumentController::class, 'review'])
        ->middleware(['throttle:30,1', EnsurePasswordChanged::class])
        ->name('documents.review');

    Route::delete('documents/{document}', [DocumentController::class, 'destroy'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('documents.destroy');

    Route::post('reports/historical', [DailyReportController::class, 'storeHistorical'])
        ->middleware(['throttle:10,1', EnsurePasswordChanged::class])
        ->name('reports.historical.store');

    Route::post('reports/{dailyReport}/time-out', [DailyReportController::class, 'timeOut'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('reports.time-out');

    Route::patch('reports/{dailyReport}/complete', [DailyReportController::class, 'complete'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('reports.complete');

    Route::patch('reports/{dailyReport}', [DailyReportController::class, 'update'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('reports.update');

    Route::delete('reports/{dailyReport}', [DailyReportController::class, 'destroy'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('reports.destroy');

    Route::get('reports', [DailyReportController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('reports.index');

    Route::get('tasks', OjtTaskController::class)
        ->middleware(EnsurePasswordChanged::class)
        ->name('tasks.index');

    Route::get('evaluations', [PerformanceEvaluationController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('evaluations.index');

    Route::get('competency-passports', [CompetencyPassportController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('passports.index');

    Route::get('competency-passports/{ojt}', [CompetencyPassportController::class, 'show'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('passports.show');

    Route::post('competency-passport/shares', [CompetencyPassportController::class, 'storeShare'])
        ->middleware(['throttle:5,1', EnsurePasswordChanged::class])
        ->name('passport-shares.store');

    Route::delete('competency-passport/shares/{passportShare}', [CompetencyPassportController::class, 'destroyShare'])
        ->middleware(['throttle:10,1', EnsurePasswordChanged::class])
        ->name('passport-shares.destroy');

    Route::post('evaluations', [PerformanceEvaluationController::class, 'store'])
        ->middleware(['throttle:20,1', EnsurePasswordChanged::class])
        ->name('evaluations.store');

    Route::patch('evaluations/{performanceEvaluation}', [PerformanceEvaluationController::class, 'update'])
        ->middleware(['throttle:20,1', EnsurePasswordChanged::class])
        ->name('evaluations.update');

    Route::delete('evaluations/{performanceEvaluation}', [PerformanceEvaluationController::class, 'destroy'])
        ->middleware(['throttle:10,1', EnsurePasswordChanged::class])
        ->name('evaluations.destroy');

    Route::get('managed-ojts', [ManagedOjtController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.index');

    Route::get('managed-ojts/{ojt}', [ManagedOjtController::class, 'show'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.show');

    Route::get('company/departments', [DepartmentController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.departments.index');

    Route::post('company/departments', [DepartmentController::class, 'store'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.departments.store');

    Route::patch('company/departments/{department}', [DepartmentController::class, 'update'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.departments.update');

    Route::delete('company/departments/{department}', [DepartmentController::class, 'destroy'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.departments.destroy');

    Route::patch('company/ojts/{ojt}/profile', [OjtProfileController::class, 'update'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.update-profile');

    Route::patch('company/reports/{dailyReport}/approve', [DailyReportReviewController::class, 'approve'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.reports.approve');

    Route::patch('company/reports/{dailyReport}/reject', [DailyReportReviewController::class, 'reject'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.reports.reject');

    Route::get('company/approval-inbox', ReportApprovalInboxController::class)
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.approvals.index');

    Route::get('company/attendance-policy', [AttendancePolicyController::class, 'edit'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.attendance-policy.edit');

    Route::patch('company/attendance-policy', [AttendancePolicyController::class, 'update'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.attendance-policy.update');

    Route::patch('company/attendance-verification', [AttendanceVerificationController::class, 'update'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.attendance-verification.update');

    Route::get('company/attendance-verification/qr', [AttendanceVerificationController::class, 'qr'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.attendance-verification.qr');

    Route::get('company/attendance-monitor', [AttendanceMonitorController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.attendance-monitor.index');

    Route::get('company/attendance-monitor/export', [AttendanceMonitorController::class, 'export'])
        ->middleware(['throttle:10,1', EnsurePasswordChanged::class])
        ->name('company.attendance-monitor.export');

    Route::get('company/activity-logs', ActivityLogController::class)
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.activity-logs.index');

    Route::get('company/operations', [OperationsController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.operations.index');

    Route::get('company/analytics', OjtAnalyticsController::class)
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.analytics.index');

    Route::get('company/analytics/compliance-evidence', ComplianceEvidenceExportController::class)
        ->middleware(['throttle:5,1', EnsurePasswordChanged::class])
        ->name('company.analytics.compliance-evidence');

    Route::post('company/operations/backups', [OperationsController::class, 'backup'])
        ->middleware(['password.confirm', EnsurePasswordChanged::class])
        ->name('company.operations.backups.store');

    Route::post('company/operations/backups/{systemBackup}/verify', [OperationsController::class, 'verify'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.operations.backups.verify');

    Route::get('privacy/export/{user?}', PrivacyExportController::class)
        ->middleware(['password.confirm', EnsurePasswordChanged::class])
        ->name('privacy.export');

    Route::get('notifications', [NotificationController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('notifications.index');

    Route::patch('notifications/read-all', [NotificationController::class, 'markAllRead'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('notifications.read-all');

    Route::patch('notifications/{notification}/read', [NotificationController::class, 'markRead'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('notifications.read');

    Route::get('attendance-corrections', [AttendanceCorrectionController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('attendance-corrections.index');

    Route::get('leave', [LeaveRequestController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('leave.index');

    Route::post('leave', [LeaveRequestController::class, 'store'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('leave.store');

    Route::patch('leave/{leaveRequest}/review', [LeaveRequestController::class, 'review'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('leave.review');

    Route::get('attendance-calendar', AttendanceCalendarController::class)
        ->middleware(EnsurePasswordChanged::class)
        ->name('attendance-calendar.index');

    Route::post('company/holidays', [CompanyHolidayController::class, 'store'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.holidays.store');

    Route::delete('company/holidays/{companyHoliday}', [CompanyHolidayController::class, 'destroy'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.holidays.destroy');

    Route::post('reports/{dailyReport}/corrections', [AttendanceCorrectionController::class, 'store'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('attendance-corrections.store');

    Route::patch('attendance-corrections/{attendanceCorrection}/supervisor-review', [AttendanceCorrectionController::class, 'supervisorReview'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('attendance-corrections.supervisor-review');

    Route::patch('attendance-corrections/{attendanceCorrection}/approve', [AttendanceCorrectionController::class, 'approve'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('attendance-corrections.approve');

    Route::patch('attendance-corrections/{attendanceCorrection}/reject', [AttendanceCorrectionController::class, 'reject'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('attendance-corrections.reject');

    Route::get('supervisor/ojts/{ojt}/reports', [SupervisorDashboardController::class, 'showReports'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('supervisor.ojts.reports');

    Route::post('company/ojts', [OjtController::class, 'store'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.store');

    Route::post('company/ojts/import', OjtBulkImportController::class)
        ->middleware(['throttle:5,1', EnsurePasswordChanged::class])
        ->name('company.ojts.import');

    Route::post('company/ojts/{ojt}/onboarding', [OnboardingChecklistController::class, 'store'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.onboarding.store');

    Route::patch('company/onboarding/{onboardingChecklistItem}', [OnboardingChecklistController::class, 'update'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.onboarding.update');

    Route::delete('company/onboarding/{onboardingChecklistItem}', [OnboardingChecklistController::class, 'destroy'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.onboarding.destroy');

    Route::post('supervisor/ojts/{ojt}/feedback', [SupervisorFeedbackController::class, 'store'])
        ->middleware(['throttle:20,1', EnsurePasswordChanged::class])
        ->name('supervisor.feedback.store');

    Route::post('company/supervisors', [SupervisorController::class, 'store'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.supervisors.store');

    Route::get('company/school-access', [SchoolAccessController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.school-access.index');

    Route::post('company/school-coordinators', [SchoolCoordinatorController::class, 'store'])
        ->middleware(['throttle:10,1', EnsurePasswordChanged::class])
        ->name('company.school-coordinators.store');

    Route::post('company/school-coordinators/{schoolCoordinator}/resend', [SchoolCoordinatorController::class, 'resend'])
        ->middleware(['throttle:3,5', EnsurePasswordChanged::class])
        ->name('company.school-coordinators.resend');

    Route::patch('company/ojts/{ojt}/school', [SchoolAccessController::class, 'update'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.update-school');

    Route::post('supervisor/ojts/{ojt}/tasks', [SupervisorTaskController::class, 'store'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('supervisor.tasks.store');

    Route::patch('tasks/{ojtTask}/status', [SupervisorTaskController::class, 'updateStatus'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('tasks.update-status');

    Route::get('messages', [DirectMessageController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('messages.index');

    Route::get('messages/{participant}', [DirectMessageController::class, 'show'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('messages.show');

    Route::post('messages/{recipient}', [DirectMessageController::class, 'store'])
        ->middleware('throttle:60,1')
        ->middleware(EnsurePasswordChanged::class)
        ->name('messages.store');

    Route::patch('messages/{directMessage}', [DirectMessageController::class, 'update'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('messages.update');

    Route::delete('messages/{directMessage}', [DirectMessageController::class, 'destroy'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('messages.destroy');

    Route::get('messages/{directMessage}/image', [DirectMessageController::class, 'image'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('messages.image');

    Route::post('company/ojts/{ojt}/resend-setup-link', [OjtController::class, 'resendSetupLink'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.resend-setup-link');

    Route::patch('company/ojts/{ojt}/supervisor', [OjtController::class, 'updateSupervisor'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.update-supervisor');

    Route::patch('company/ojts/{ojt}/start-date', [OjtController::class, 'updateStartDate'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.update-start-date');

    Route::delete('company/ojts/{ojt}', [OjtController::class, 'destroy'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.destroy');

    Route::post('company/ojts/{ojt}/restore', [OjtController::class, 'restore'])
        ->middleware(['password.confirm', EnsurePasswordChanged::class])
        ->whereNumber('ojt')
        ->name('company.ojts.restore');
});

require __DIR__.'/settings.php';
