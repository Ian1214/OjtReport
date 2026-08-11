<?php

namespace App\Models;

use Database\Factories\CompletionCertificateFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property string $certificate_number
 * @property int $company_id
 * @property int $user_id
 * @property int $supervisor_id
 * @property string $allocated_hours
 * @property string $approved_hours_snapshot
 * @property string $status
 * @property string $ojt_name
 * @property string|null $student_id
 * @property string $company_name
 * @property string|null $program
 * @property string|null $position
 * @property string|null $department
 * @property int $admin_signed_by
 * @property string $admin_signature_name
 * @property array<string, mixed> $admin_signature_strokes
 * @property Carbon $admin_signed_at
 * @property string|null $supervisor_signature_name
 * @property array<string, mixed>|null $supervisor_signature_strokes
 * @property Carbon|null $supervisor_signed_at
 * @property Carbon|null $finalized_at
 * @property string|null $snapshot_hash
 * @property int|null $revoked_by
 * @property Carbon|null $revoked_at
 * @property string|null $revocation_reason
 * @property-read User $ojt
 * @property-read User $supervisor
 * @property-read User $adminSigner
 */
class CompletionCertificate extends Model
{
    /** @use HasFactory<CompletionCertificateFactory> */
    use HasFactory, SoftDeletes;

    public const STATUS_FINALIZED = 'finalized';

    public const STATUS_PENDING_SUPERVISOR = 'pending_supervisor';

    protected $fillable = [
        'certificate_number', 'company_id', 'user_id', 'supervisor_id',
        'allocated_hours', 'approved_hours_snapshot', 'status', 'ojt_name',
        'student_id', 'company_name', 'program', 'position', 'department',
        'admin_signed_by', 'admin_signature_name', 'admin_signature_strokes',
        'admin_signed_at', 'supervisor_signature_name', 'supervisor_signature_strokes',
        'supervisor_signed_at', 'finalized_at', 'snapshot_hash',
        'revoked_by', 'revoked_at', 'revocation_reason',
    ];

    protected $hidden = ['admin_signature_strokes', 'supervisor_signature_strokes'];

    protected function casts(): array
    {
        return [
            'allocated_hours' => 'decimal:2',
            'approved_hours_snapshot' => 'decimal:2',
            'admin_signature_strokes' => 'array',
            'admin_signed_at' => 'datetime',
            'supervisor_signature_strokes' => 'array',
            'supervisor_signed_at' => 'datetime',
            'finalized_at' => 'datetime',
            'revoked_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function ojt(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function supervisor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'supervisor_id');
    }

    public function adminSigner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_signed_by');
    }

    public function revoker(): BelongsTo
    {
        return $this->belongsTo(User::class, 'revoked_by');
    }
}
