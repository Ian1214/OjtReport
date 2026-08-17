<?php

namespace App\Models;

use Database\Factories\DocumentFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class Document extends Model
{
    /** @use HasFactory<DocumentFactory> */
    use HasFactory, SoftDeletes;

    public const CATEGORY_MOA = 'moa';

    public const CATEGORY_ENDORSEMENT = 'endorsement';

    public const CATEGORY_EVALUATION = 'evaluation';

    public const CATEGORY_SIGNED_FORM = 'signed_form';

    public const CATEGORY_OTHER = 'other';

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    /** @var list<string> */
    public const CATEGORIES = [
        self::CATEGORY_MOA,
        self::CATEGORY_ENDORSEMENT,
        self::CATEGORY_EVALUATION,
        self::CATEGORY_SIGNED_FORM,
        self::CATEGORY_OTHER,
    ];

    protected $fillable = [
        'company_id',
        'ojt_id',
        'uploaded_by',
        'title',
        'category',
        'disk',
        'path',
        'original_name',
        'mime_type',
        'size',
        'shared_with_school',
        'status',
        'reviewed_by',
        'reviewed_at',
        'rejection_reason',
        'deletion_reason',
        'deleted_by',
    ];

    protected function casts(): array
    {
        return [
            'shared_with_school' => 'boolean',
            'size' => 'integer',
            'reviewed_at' => 'datetime',
        ];
    }

    public function company(): BelongsTo
    {
        return $this->belongsTo(Company::class);
    }

    public function ojt(): BelongsTo
    {
        return $this->belongsTo(User::class, 'ojt_id');
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
