<?php

namespace App\Http\Controllers;

use App\Http\Requests\ReviewDocumentRequest;
use App\Http\Requests\StoreDocumentRequest;
use App\Models\Document;
use App\Models\User;
use App\Support\CompanyPermissions;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;
use Inertia\Response;
use Symfony\Component\HttpFoundation\StreamedResponse;

class DocumentController extends Controller
{
    public function index(Request $request): Response
    {
        /** @var User $viewer */
        $viewer = $request->user();
        Gate::authorize('viewAny', Document::class);

        $query = Document::query()->with(['ojt:id,name,student_id,school_id', 'uploader:id,name']);

        match ($viewer->role) {
            'school_coordinator' => $query
                ->where('status', Document::STATUS_APPROVED)
                ->where('shared_with_school', true)
                ->whereHas('ojt', fn (Builder $query): Builder => $query->where('school_id', $viewer->school_id)),
            'ojt' => $query->where('ojt_id', $viewer->id),
            'supervisor' => $query
                ->where('company_id', $viewer->company_id)
                ->where('status', Document::STATUS_APPROVED),
            default => $query->where('company_id', $viewer->company_id),
        };

        $studentFolderQuery = $this->accessibleStudentFolderQuery($viewer);
        $selectedStudent = null;

        if ($request->filled('ojt')) {
            abort_if($studentFolderQuery === null, 403);

            /** @var User $selectedOjt */
            $selectedOjt = (clone $studentFolderQuery)
                ->findOrFail($request->integer('ojt'));
            $query->where('ojt_id', $selectedOjt->id);
            $selectedStudent = [
                'id' => $selectedOjt->id,
                'name' => $selectedOjt->name,
                'studentId' => $selectedOjt->student_id,
            ];
        }

        $studentFolders = $studentFolderQuery === null
            ? []
            : (clone $studentFolderQuery)
                ->with('companyRecord:id,name')
                ->withCount(['documents as documents_count' => function (Builder $documents) use ($viewer): void {
                    if ($viewer->isSchoolCoordinator()) {
                        $documents
                            ->where('status', Document::STATUS_APPROVED)
                            ->where('shared_with_school', true);
                    }
                }])
                ->orderBy('name')
                ->get(['id', 'name', 'student_id', 'company_id'])
                ->map(fn (User $student): array => [
                    'id' => $student->id,
                    'name' => $student->name,
                    'studentId' => $student->student_id,
                    'companyName' => $student->companyRecord?->name,
                    'documentsCount' => $student->documents_count,
                ]);

        return Inertia::render('documents/index', [
            'canUpload' => in_array($viewer->role, ['company_admin', 'ojt'], true),
            'canReview' => $viewer->canCompany(CompanyPermissions::DOCUMENTS_REVIEW),
            'isOjt' => $viewer->role === 'ojt',
            'ojts' => $viewer->canCompany(CompanyPermissions::DOCUMENTS_REVIEW)
                ? User::query()->where('company_id', $viewer->company_id)->where('role', 'ojt')
                    ->orderBy('name')->get(['id', 'name', 'student_id'])
                : [],
            'studentFolders' => $studentFolders,
            'selectedStudent' => $selectedStudent,
            'documents' => $query->latest()->paginate(20)->withQueryString()->through(
                fn (Document $document): array => [
                    'id' => $document->id,
                    'title' => $document->title,
                    'category' => $document->category,
                    'originalName' => $document->original_name,
                    'mimeType' => $document->mime_type,
                    'canPreview' => in_array($document->mime_type, [
                        'application/pdf',
                        'image/jpeg',
                        'image/png',
                    ], true),
                    'size' => $document->size,
                    'sharedWithSchool' => $document->shared_with_school,
                    'status' => $document->status,
                    'rejectionReason' => $document->rejection_reason,
                    'canDelete' => $viewer->can('delete', $document),
                    'ojt' => $document->ojt === null ? null : [
                        'name' => $document->ojt->name,
                        'studentId' => $document->ojt->student_id,
                    ],
                    'uploadedBy' => $document->uploader->name,
                    'createdAt' => $document->created_at?->toIso8601String(),
                ],
            ),
        ]);
    }

    /**
     * @return Builder<User>|null
     */
    private function accessibleStudentFolderQuery(User $viewer): ?Builder
    {
        if ($viewer->canCompany(CompanyPermissions::DOCUMENTS_REVIEW)) {
            return User::query()
                ->where('role', 'ojt')
                ->where('company_id', $viewer->company_id);
        }

        if ($viewer->isSchoolCoordinator()) {
            return User::query()
                ->where('role', 'ojt')
                ->where('school_id', $viewer->school_id);
        }

        return null;
    }

    public function store(StoreDocumentRequest $request): RedirectResponse
    {
        /** @var User $uploader */
        $uploader = $request->user();
        Gate::authorize('create', Document::class);
        $file = $request->file('document');
        $path = $file->store("documents/{$uploader->company_id}", 'local');
        $isOjtUpload = $uploader->role === 'ojt';

        $uploader->uploadedDocuments()->create([
            'company_id' => $uploader->company_id,
            'ojt_id' => $isOjtUpload ? $uploader->id : $request->validated('ojt_id'),
            'title' => $request->validated('title'),
            'category' => $request->validated('category'),
            'disk' => 'local',
            'path' => $path,
            'original_name' => $file->getClientOriginalName(),
            'mime_type' => (string) $file->getMimeType(),
            'size' => $file->getSize(),
            'shared_with_school' => $isOjtUpload ? false : $request->boolean('shared_with_school'),
            'status' => $isOjtUpload ? Document::STATUS_PENDING : Document::STATUS_APPROVED,
            'reviewed_by' => $isOjtUpload ? null : $uploader->id,
            'reviewed_at' => $isOjtUpload ? null : now(),
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $isOjtUpload
                ? 'Document submitted securely for company review.'
                : 'Document uploaded securely.',
        ]);

        return to_route('documents.index');
    }

    public function download(Document $document): StreamedResponse
    {
        Gate::authorize('view', $document);
        abort_unless(Storage::disk($document->disk)->exists($document->path), 404);

        return Storage::disk($document->disk)->download($document->path, $document->original_name, [
            'Content-Type' => $document->mime_type,
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }

    public function preview(Document $document): StreamedResponse
    {
        Gate::authorize('view', $document);
        abort_unless(Storage::disk($document->disk)->exists($document->path), 404);
        abort_unless(in_array($document->mime_type, [
            'application/pdf',
            'image/jpeg',
            'image/png',
        ], true), 415);

        return Storage::disk($document->disk)->response(
            $document->path,
            $document->original_name,
            [
                'Content-Type' => $document->mime_type,
                'Content-Security-Policy' => "default-src 'none'; sandbox",
                'X-Content-Type-Options' => 'nosniff',
            ],
            'inline',
        );
    }

    public function destroy(Document $document): RedirectResponse
    {
        Gate::authorize('delete', $document);
        $document->update([
            'deletion_reason' => 'Removed from the document vault.',
            'deleted_by' => request()->user()?->id,
        ]);
        $document->delete();

        Inertia::flash('toast', ['type' => 'success', 'message' => 'Document moved to the recovery center.']);

        return to_route('documents.index');
    }

    public function review(ReviewDocumentRequest $request, Document $document): RedirectResponse
    {
        Gate::authorize('update', $document);
        $status = $request->validated('status');

        $document->update([
            'status' => $status,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'rejection_reason' => $status === Document::STATUS_REJECTED
                ? $request->validated('rejection_reason')
                : null,
        ]);

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => $status === Document::STATUS_APPROVED
                ? 'Student document approved.'
                : 'Student document returned with feedback.',
        ]);

        return to_route('documents.index');
    }
}
