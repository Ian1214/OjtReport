<?php

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Http\Requests\Settings\UpdateOrganizationSettingsRequest;
use App\Models\Company;
use App\Models\School;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;

class OrganizationSettingsController extends Controller
{
    /** @var list<string> */
    private const COMPANY_SETTING_KEYS = [
        'break_start_time', 'break_end_time', 'break_minutes', 'earliest_time_in',
        'latest_time_out', 'overtime_requires_approval', 'holiday_attendance_allowed',
        'digest_time', 'quiet_hours_start', 'quiet_hours_end', 'email_notifications',
        'escalation_email', 'message_retention_days', 'location_retention_days',
        'audit_retention_days', 'archive_grace_days', 'default_required_hours',
        'default_program', 'default_year_level', 'certificate_number_prefix',
        'session_timeout_minutes', 'allowed_email_domains',
        'require_admin_mfa', 'require_supervisor_mfa',
    ];

    /** @var list<string> */
    private const SCHOOL_SETTING_KEYS = [
        'email_progress_alerts', 'email_completion_alerts', 'digest_frequency',
        'required_document_labels', 'evaluation_template_name',
    ];

    public function edit(Request $request): Response
    {
        /** @var User $user */
        $user = $request->user();
        abort_unless($user->isCompanyAdmin() || $user->isSchoolCoordinator(), 403);

        if ($user->isSchoolCoordinator()) {
            $school = $user->school;
            abort_unless($school instanceof School, 403);

            return Inertia::render('settings/organization', [
                'organizationType' => 'school',
                'organization' => [
                    'name' => $school->name,
                    'logoUrl' => $school->logo_path ? Storage::disk('public')->url($school->logo_path) : null,
                    'address' => $school->address,
                    'contactEmail' => $school->contact_email,
                    'contactPhone' => $school->contact_phone,
                    'settings' => $school->resolvedSettings(),
                ],
            ]);
        }

        $company = $user->companyRecord;
        abort_unless($company instanceof Company, 403);

        return Inertia::render('settings/organization', [
            'organizationType' => 'company',
            'organization' => [
                'name' => $company->name,
                'legalName' => $company->legal_name,
                'logoUrl' => $company->logo_path ? Storage::disk('public')->url($company->logo_path) : null,
                'address' => $company->address,
                'contactEmail' => $company->contact_email,
                'contactPhone' => $company->contact_phone,
                'authorizedSignatoryName' => $company->authorized_signatory_name,
                'authorizedSignatoryTitle' => $company->authorized_signatory_title,
                'settings' => $company->resolvedSettings(),
            ],
        ]);
    }

    public function update(UpdateOrganizationSettingsRequest $request): RedirectResponse
    {
        /** @var User $user */
        $user = $request->user();
        $validated = $request->validated();

        if ($user->isSchoolCoordinator()) {
            $organization = $user->school;
            abort_unless($organization instanceof School, 403);
            $profileKeys = ['name', 'address', 'contact_email', 'contact_phone'];
            $settingKeys = self::SCHOOL_SETTING_KEYS;
        } else {
            $organization = $user->companyRecord;
            abort_unless($organization instanceof Company, 403);
            $profileKeys = [
                'name', 'legal_name', 'address', 'contact_email', 'contact_phone',
                'authorized_signatory_name', 'authorized_signatory_title',
            ];
            $settingKeys = self::COMPANY_SETTING_KEYS;
        }

        $profile = Arr::only($validated, $profileKeys);
        if ($request->hasFile('logo')) {
            if ($organization->logo_path !== null) {
                Storage::disk('public')->delete($organization->logo_path);
            }

            $profile['logo_path'] = $request->file('logo')->store(
                'organization-logos/'.class_basename($organization).'-'.$organization->id,
                'public',
            );
        }

        $organization->update([
            ...$profile,
            'settings' => array_replace(
                $organization->resolvedSettings(),
                Arr::only($validated, $settingKeys),
            ),
        ]);

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Organization settings updated.']);

        return to_route('organization-settings.edit');
    }
}
