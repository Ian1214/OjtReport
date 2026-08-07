<?php

use App\Http\Controllers\AttendanceCorrectionController;
use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\Company\ActivityLogController;
use App\Http\Controllers\Company\AttendancePolicyController;
use App\Http\Controllers\Company\CompanyHolidayController;
use App\Http\Controllers\Company\DailyReportReviewController;
use App\Http\Controllers\Company\ManagedOjtController;
use App\Http\Controllers\Company\OjtController;
use App\Http\Controllers\Company\OperationsController;
use App\Http\Controllers\Company\ReportApprovalInboxController;
use App\Http\Controllers\Company\SupervisorController;
use App\Http\Controllers\CompanyDashboardController;
use App\Http\Controllers\DailyReportController;
use App\Http\Controllers\DirectMessageController;
use App\Http\Controllers\DtrSubmissionController;
use App\Http\Controllers\LeaveRequestController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\OjtTaskController;
use App\Http\Controllers\OjtTermsController;
use App\Http\Controllers\PrivacyExportController;
use App\Http\Controllers\SupervisorDashboardController;
use App\Http\Controllers\SupervisorTaskController;
use App\Http\Middleware\EnsurePasswordChanged;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::inertia('/terms', 'terms')->name('terms');

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

    Route::get('reports/dtr', [DailyReportController::class, 'dtr'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('reports.dtr');

    Route::get('dtr-submissions', [DtrSubmissionController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('dtr-submissions.index');

    Route::post('dtr-submissions', [DtrSubmissionController::class, 'store'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('dtr-submissions.store');

    Route::patch('dtr-submissions/{dtrSubmission}/review', [DtrSubmissionController::class, 'review'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('dtr-submissions.review');

    Route::post('reports/time-in', [DailyReportController::class, 'timeIn'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('reports.time-in');

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

    Route::get('managed-ojts', [ManagedOjtController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.index');

    Route::get('managed-ojts/{ojt}', [ManagedOjtController::class, 'show'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.show');

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

    Route::get('company/activity-logs', ActivityLogController::class)
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.activity-logs.index');

    Route::get('company/operations', [OperationsController::class, 'index'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.operations.index');

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

    Route::post('company/supervisors', [SupervisorController::class, 'store'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.supervisors.store');

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

    Route::delete('company/ojts/{ojt}', [OjtController::class, 'destroy'])
        ->middleware(EnsurePasswordChanged::class)
        ->name('company.ojts.destroy');

    Route::post('company/ojts/{ojt}/restore', [OjtController::class, 'restore'])
        ->middleware(['password.confirm', EnsurePasswordChanged::class])
        ->whereNumber('ojt')
        ->name('company.ojts.restore');
});

require __DIR__.'/settings.php';
