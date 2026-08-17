<?php

namespace App\Http\Controllers\Company;

use App\Http\Controllers\Controller;
use App\Models\Company;
use App\Models\User;
use App\Support\AttendanceQrCode;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceVerificationController extends Controller
{
    public function update(Request $request): RedirectResponse
    {
        /** @var User $admin */
        $admin = $request->user();
        abort_unless($admin->isCompanyAdmin(), 403);

        $validated = $request->validate([
            'attendance_verification_mode' => ['required', Rule::in(['disabled', 'qr', 'geolocation', 'qr_and_geolocation'])],
            'attendance_latitude' => ['nullable', 'required_if:attendance_verification_mode,geolocation,qr_and_geolocation', 'numeric', 'between:-90,90'],
            'attendance_longitude' => ['nullable', 'required_if:attendance_verification_mode,geolocation,qr_and_geolocation', 'numeric', 'between:-180,180'],
            'attendance_radius_meters' => ['required', 'integer', 'between:25,5000'],
        ]);

        /** @var Company $company */
        $company = $admin->companyRecord;
        $company->update($validated);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Attendance verification settings updated.']);

        return back();
    }

    public function qr(Request $request, AttendanceQrCode $attendanceQrCode): Response
    {
        /** @var User $admin */
        $admin = $request->user();
        abort_unless($admin->isCompanyAdmin(), 403);

        /** @var Company $company */
        $company = $admin->companyRecord;
        abort_unless(in_array($company->attendance_verification_mode, ['qr', 'qr_and_geolocation'], true), 404);

        $qrCode = $attendanceQrCode->forCompany($company);

        Inertia::encryptHistory();

        return Inertia::render('company/attendance-verification-qr', [
            'company' => [
                'name' => $company->name,
                'verificationMode' => $company->attendance_verification_mode,
            ],
            ...$qrCode,
        ]);
    }
}
