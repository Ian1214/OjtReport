<?php

namespace App\Models;

use Database\Factories\PlatformSettingFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    /** @use HasFactory<PlatformSettingFactory> */
    use HasFactory;

    public const POLICY_KEY = 'platform_policy';

    /** @var array<string, bool|int|string> */
    public const DEFAULT_POLICY = [
        'company_registration_enabled' => true,
        'default_storage_limit_mb' => 2048,
        'default_user_limit' => 500,
        'invitation_expiry_days' => 7,
        'backup_retention_days' => 30,
        'health_alert_email' => '',
        'support_email' => '',
        'maintenance_contact' => '',
        'require_company_admin_mfa' => false,
    ];

    protected $fillable = ['key', 'value'];

    protected function casts(): array
    {
        return ['value' => 'array'];
    }

    /** @return array<string, mixed> */
    public static function resolvedPolicy(): array
    {
        $storedPolicy = self::query()->where('key', self::POLICY_KEY)->value('value');

        return array_replace(self::DEFAULT_POLICY, is_array($storedPolicy) ? $storedPolicy : []);
    }
}
