<?php

return [
    'backup' => [
        'disk' => env('BACKUP_DISK', 'local'),
        'path' => env('BACKUP_PATH', 'backups'),
        'retention_days' => (int) env('BACKUP_RETENTION_DAYS', 30),
    ],
    'restore_test' => [
        'username' => env('RESTORE_TEST_DB_USERNAME', env('DB_USERNAME')),
        'password' => env('RESTORE_TEST_DB_PASSWORD', env('DB_PASSWORD')),
    ],
    'privacy' => [
        'archive_retention_days' => (int) env('ARCHIVE_RETENTION_DAYS', 365),
        'automatic_pruning' => (bool) env('ARCHIVE_AUTOMATIC_PRUNING', false),
    ],
    'security' => [
        'require_privileged_mfa' => (bool) env('REQUIRE_PRIVILEGED_MFA', false),
    ],
];
