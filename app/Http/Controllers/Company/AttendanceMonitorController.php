<?php

namespace App\Http\Controllers\Company;

use App\Actions\BuildAttendanceMonitor;
use App\Http\Controllers\Controller;
use App\Http\Requests\AttendanceMonitorRequest;
use App\Models\Company;
use App\Models\User;
use Carbon\CarbonImmutable;
use Illuminate\Http\Response as HttpResponse;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AttendanceMonitorController extends Controller
{
    public function index(AttendanceMonitorRequest $request, BuildAttendanceMonitor $monitor): Response
    {
        /** @var User $administrator */
        $administrator = $request->user();
        /** @var Company $company */
        $company = $administrator->companyRecord;
        $filters = $request->validated();
        $date = CarbonImmutable::parse(
            $filters['date'] ?? now($company->timezone)->toDateString(),
            $company->timezone,
        );
        $paginator = $monitor->query($company, $filters, $date)
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('company/attendance-monitor', [
            'companyName' => $company->name,
            'date' => $date->toDateString(),
            'timezone' => $company->timezone,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'status' => $filters['status'] ?? 'all',
                'supervisorId' => isset($filters['supervisor_id']) ? (string) $filters['supervisor_id'] : '',
            ],
            'stats' => $monitor->stats($company, $date),
            'ojts' => $paginator->through(fn (User $ojt): array => $monitor->row($ojt)),
            'supervisors' => $company->users()
                ->where('role', 'supervisor')
                ->orderBy('name')
                ->get(['id', 'name']),
        ]);
    }

    public function export(AttendanceMonitorRequest $request, BuildAttendanceMonitor $monitor): StreamedResponse
    {
        /** @var User $administrator */
        $administrator = $request->user();
        /** @var Company $company */
        $company = $administrator->companyRecord;
        $filters = $request->validated();
        $date = CarbonImmutable::parse(
            $filters['date'] ?? now($company->timezone)->toDateString(),
            $company->timezone,
        );

        return response()->streamDownload(function () use ($company, $filters, $date, $monitor): void {
            $output = fopen('php://output', 'w');

            if ($output === false) {
                abort(HttpResponse::HTTP_INTERNAL_SERVER_ERROR);
            }

            fputcsv($output, ['Date', 'OJT', 'Student ID', 'Supervisor', 'Status', 'Punctuality', 'Time In', 'Time Out', 'Hours', 'Approved Hours', 'Remaining Hours', 'Missing Time-outs'], ',', '"', '');

            $monitor->query($company, $filters, $date)->chunkById(200, function ($ojts) use ($output, $monitor, $date): void {
                foreach ($ojts as $ojt) {
                    $row = $monitor->row($ojt);
                    fputcsv($output, [
                        $date->toDateString(),
                        $this->csvValue($row['name']),
                        $this->csvValue($row['studentId']),
                        $this->csvValue($row['supervisorName']),
                        $row['state'],
                        $row['punctuality'],
                        $row['timeIn'],
                        $row['timeOut'],
                        $row['totalHours'],
                        $row['approvedHours'],
                        $row['remainingHours'],
                        $row['missingTimeOutCount'],
                    ], ',', '"', '');
                }
            });

            fclose($output);
        }, 'attendance-'.$date->format('Y-m-d').'.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    private function csvValue(?string $value): string
    {
        if ($value === null) {
            return '';
        }

        return preg_match('/^[=+\-@]/', $value) === 1 ? "'{$value}" : $value;
    }
}
