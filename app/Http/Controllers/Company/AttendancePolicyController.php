<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Http\Requests\UpdateAttendancePolicyRequest;
use App\Models\Company;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendancePolicyController extends Controller
{
    public function edit(Request $request): Response
    {
        /** @var User $admin */
        $admin = $request->user();
        abort_unless($admin->isCompanyAdmin(), 403);

        /** @var Company $company */
        $company = $admin->companyRecord;

        return Inertia::render('company/attendance-policy', [
            'company' => [
                'name' => $company->name,
                'workStartTime' => substr($company->work_start_time, 0, 5),
                'lateGraceMinutes' => $company->late_grace_minutes,
                'timezone' => $company->timezone,
                'workDays' => $company->work_days ?? [1, 2, 3, 4, 5],
            ],
        ]);
    }

    public function update(UpdateAttendancePolicyRequest $request): RedirectResponse
    {
        /** @var User $admin */
        $admin = $request->user();
        /** @var Company $company */
        $company = $admin->companyRecord;

        $company->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Attendance policy updated. New time-ins will use this schedule.',
        ]);

        return back();
    }
}
