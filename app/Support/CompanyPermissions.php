<?php

namespace App\Support;

class CompanyPermissions
{
    public const PEOPLE_MANAGE = 'people.manage';

    public const REPORTS_REVIEW = 'reports.review';

    public const ATTENDANCE_MANAGE = 'attendance.manage';

    public const DOCUMENTS_REVIEW = 'documents.review';

    public const RECORDS_SIGN_OFF = 'records.sign_off';

    public const ANALYTICS_VIEW = 'analytics.view';

    public const AUDIT_VIEW = 'audit.view';

    public const OPERATIONS_MANAGE = 'operations.manage';

    /** @var array<string, string> */
    public const LABELS = [
        self::PEOPLE_MANAGE => 'Manage people and invitations',
        self::REPORTS_REVIEW => 'Review daily reports',
        self::ATTENDANCE_MANAGE => 'Manage attendance and leave',
        self::DOCUMENTS_REVIEW => 'Review document vault uploads',
        self::RECORDS_SIGN_OFF => 'Approve DTRs and certificates',
        self::ANALYTICS_VIEW => 'View analytics and exports',
        self::AUDIT_VIEW => 'View audit trail and recovery center',
        self::OPERATIONS_MANAGE => 'Manage backups and operations',
    ];

    /** @return list<string> */
    public static function all(): array
    {
        return array_keys(self::LABELS);
    }

    /** @return list<string> */
    public static function forPreset(string $preset): array
    {
        return match ($preset) {
            'hr_admin' => [
                self::PEOPLE_MANAGE,
                self::REPORTS_REVIEW,
                self::ATTENDANCE_MANAGE,
                self::DOCUMENTS_REVIEW,
                self::RECORDS_SIGN_OFF,
                self::ANALYTICS_VIEW,
            ],
            'attendance_reviewer' => [self::REPORTS_REVIEW, self::ATTENDANCE_MANAGE],
            'document_reviewer' => [self::DOCUMENTS_REVIEW],
            'auditor' => [self::ANALYTICS_VIEW, self::AUDIT_VIEW],
            default => [],
        };
    }
}
