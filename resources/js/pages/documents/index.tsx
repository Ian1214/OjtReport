import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    Download,
    Eye,
    FileLock2,
    FolderLock,
    Trash2,
    Upload,
    XCircle,
} from 'lucide-react';
import {
    destroy,
    download,
    index,
    preview,
    review,
    store,
} from '@/actions/App/Http/Controllers/DocumentController';
import { DashboardHero } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type DocumentItem = {
    id: number;
    title: string;
    category: string;
    originalName: string;
    mimeType: string;
    canPreview: boolean;
    size: number;
    sharedWithSchool: boolean;
    status: 'pending' | 'approved' | 'rejected';
    rejectionReason: string | null;
    canDelete: boolean;
    ojt: { name: string; studentId: string | null } | null;
    uploadedBy: string;
    createdAt: string;
};

type Props = {
    canUpload: boolean;
    canReview: boolean;
    isOjt: boolean;
    ojts: { id: number; name: string; student_id: string | null }[];
    studentFolders: {
        id: number;
        name: string;
        studentId: string | null;
        companyName: string | null;
        documentsCount: number;
    }[];
    selectedStudent: {
        id: number;
        name: string;
        studentId: string | null;
    } | null;
    documents: { data: DocumentItem[] };
};

export default function DocumentsIndex({
    canUpload,
    canReview,
    isOjt,
    ojts,
    studentFolders,
    selectedStudent,
    documents,
}: Props) {
    return (
        <>
            <Head title="Document vault" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Secure records"
                    title="Document vault"
                    description="Keep MOAs, endorsement letters, evaluations, and signed forms in private, role-controlled storage."
                />

                {studentFolders.length > 0 && (
                    <Card className="border-primary/20">
                        <CardHeader className="gap-1">
                            <CardTitle className="flex items-center gap-2">
                                <FolderLock className="size-5 text-primary" />
                                Student document folders
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                Open a student folder to view only the documents
                                you are authorized to access.
                            </p>
                        </CardHeader>
                        <CardContent className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                            {studentFolders.map((student) => {
                                const isSelected =
                                    selectedStudent?.id === student.id;

                                return (
                                    <Link
                                        key={student.id}
                                        href={index({
                                            query: { ojt: student.id },
                                        })}
                                        preserveScroll
                                        className={`group rounded-2xl border p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:shadow-md ${
                                            isSelected
                                                ? 'border-primary/50 bg-primary/10 ring-1 ring-primary/20'
                                                : 'bg-card'
                                        }`}
                                    >
                                        <div className="flex items-start gap-3">
                                            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-primary/15">
                                                <FolderLock className="size-5" />
                                            </span>
                                            <div className="min-w-0">
                                                <p className="font-semibold">
                                                    View {student.name}'s
                                                    documents
                                                </p>
                                                <p className="mt-1 truncate text-sm text-muted-foreground">
                                                    {student.studentId ??
                                                        'No student ID'}
                                                    {student.companyName
                                                        ? ` · ${student.companyName}`
                                                        : ''}
                                                </p>
                                                <p className="mt-3 text-xs font-medium text-primary">
                                                    {student.documentsCount}{' '}
                                                    {student.documentsCount ===
                                                    1
                                                        ? 'document'
                                                        : 'documents'}
                                                </p>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </CardContent>
                    </Card>
                )}

                {canUpload && (
                    <Card className="border-primary/20">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Upload className="size-5 text-primary" />{' '}
                                {isOjt
                                    ? 'Submit a document'
                                    : 'Upload a document'}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...store.form()}
                                resetOnSuccess
                                className="grid gap-4 lg:grid-cols-2"
                            >
                                {({ errors, processing, progress }) => (
                                    <>
                                        <Field
                                            label="Document title"
                                            error={errors.title}
                                        >
                                            <Input
                                                name="title"
                                                required
                                                maxLength={160}
                                                placeholder={
                                                    isOjt
                                                        ? 'My endorsement letter'
                                                        : 'OJT memorandum of agreement'
                                                }
                                            />
                                        </Field>
                                        <Field
                                            label="Category"
                                            error={errors.category}
                                        >
                                            <select
                                                name="category"
                                                required
                                                className="h-10 rounded-md border bg-background px-3 text-sm"
                                            >
                                                <option value="moa">MOA</option>
                                                <option value="endorsement">
                                                    Endorsement letter
                                                </option>
                                                <option value="evaluation">
                                                    Evaluation
                                                </option>
                                                <option value="signed_form">
                                                    Signed form
                                                </option>
                                                <option value="other">
                                                    Other
                                                </option>
                                            </select>
                                        </Field>
                                        {!isOjt && (
                                            <Field
                                                label="Assigned OJT"
                                                error={errors.ojt_id}
                                            >
                                                <select
                                                    name="ojt_id"
                                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                                >
                                                    <option value="">
                                                        Company-wide document
                                                    </option>
                                                    {ojts.map((ojt) => (
                                                        <option
                                                            key={ojt.id}
                                                            value={ojt.id}
                                                        >
                                                            {ojt.name}{' '}
                                                            {ojt.student_id
                                                                ? `· ${ojt.student_id}`
                                                                : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </Field>
                                        )}
                                        <Field
                                            label="File (PDF, Word, JPG or PNG; max 10 MB)"
                                            error={errors.document}
                                        >
                                            <Input
                                                name="document"
                                                type="file"
                                                required
                                                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                                            />
                                        </Field>
                                        {!isOjt && (
                                            <label className="flex items-start gap-3 rounded-xl border p-4 text-sm lg:col-span-2">
                                                <input
                                                    type="checkbox"
                                                    name="shared_with_school"
                                                    value="1"
                                                    className="mt-1"
                                                />
                                                <span>
                                                    <strong>
                                                        Share with assigned
                                                        school coordinator
                                                    </strong>
                                                    <span className="block text-muted-foreground">
                                                        Available only when this
                                                        file is assigned to an
                                                        OJT. The coordinator
                                                        remains read-only.
                                                    </span>
                                                </span>
                                            </label>
                                        )}
                                        {isOjt && (
                                            <div className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4 text-sm text-muted-foreground lg:col-span-2">
                                                <strong className="text-foreground">
                                                    Company review required.
                                                </strong>{' '}
                                                Your submission stays private
                                                between you and the company
                                                until an administrator approves
                                                it.
                                            </div>
                                        )}
                                        {progress && (
                                            <progress
                                                className="w-full lg:col-span-2"
                                                value={progress.percentage}
                                                max="100"
                                            />
                                        )}
                                        <Button
                                            className="w-full sm:w-fit"
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <Upload />
                                            )}{' '}
                                            {isOjt
                                                ? 'Submit for review'
                                                : 'Upload securely'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}

                <section className="grid gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {selectedStudent
                                ? `${selectedStudent.name}'s documents`
                                : 'Available documents'}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Downloads are authorized on every request and files
                            are never publicly exposed.
                        </p>
                        {selectedStudent && (
                            <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="mt-2 -ml-3"
                            >
                                <Link href={index()} preserveScroll>
                                    <ArrowLeft /> View all documents
                                </Link>
                            </Button>
                        )}
                    </div>
                    {documents.data.length === 0 ? (
                        <Card>
                            <CardContent className="grid place-items-center gap-2 py-12 text-center">
                                <FolderLock className="size-9 text-muted-foreground" />
                                <p className="font-medium">
                                    No documents available
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        documents.data.map((document) => (
                            <Card key={document.id}>
                                <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="flex min-w-0 gap-3">
                                        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                            <FileLock2 className="size-5" />
                                        </span>
                                        <div className="min-w-0">
                                            <p className="font-semibold">
                                                {document.title}
                                            </p>
                                            <p className="truncate text-sm text-muted-foreground">
                                                {document.originalName} ·{' '}
                                                {formatBytes(document.size)}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground">
                                                {label(document.category)} ·{' '}
                                                {document.ojt?.name ??
                                                    'Company-wide'}{' '}
                                                · Uploaded by{' '}
                                                {document.uploadedBy}
                                            </p>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <StatusBadge
                                                    status={document.status}
                                                />
                                                {document.rejectionReason && (
                                                    <span className="text-xs text-destructive">
                                                        Feedback:{' '}
                                                        {
                                                            document.rejectionReason
                                                        }
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        {document.canPreview && (
                                            <Button variant="outline" asChild>
                                                <a
                                                    href={preview.url(
                                                        document.id,
                                                    )}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                >
                                                    <Eye /> View
                                                </a>
                                            </Button>
                                        )}
                                        <Button variant="outline" asChild>
                                            <a href={download.url(document.id)}>
                                                <Download /> Download
                                            </a>
                                        </Button>
                                        {canReview &&
                                            document.status === 'pending' && (
                                                <>
                                                    <Form
                                                        {...review.form(
                                                            document.id,
                                                        )}
                                                    >
                                                        <input
                                                            type="hidden"
                                                            name="status"
                                                            value="approved"
                                                        />
                                                        <Button type="submit">
                                                            <Check /> Approve
                                                        </Button>
                                                    </Form>
                                                    <RejectDocumentDialog
                                                        document={document}
                                                    />
                                                </>
                                            )}
                                        {document.canDelete && (
                                            <Form
                                                {...destroy.form(document.id)}
                                            >
                                                <Button
                                                    type="submit"
                                                    variant="outline"
                                                    className="text-destructive"
                                                >
                                                    <Trash2 /> Delete
                                                </Button>
                                            </Form>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </section>
            </div>
        </>
    );
}

function StatusBadge({ status }: { status: DocumentItem['status'] }) {
    const styles =
        status === 'approved'
            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-600'
            : status === 'rejected'
              ? 'border-destructive/30 bg-destructive/10 text-destructive'
              : 'border-amber-500/30 bg-amber-500/10 text-amber-600';

    return (
        <span
            className={`rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles}`}
        >
            {status}
        </span>
    );
}

function RejectDocumentDialog({ document }: { document: DocumentItem }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="text-destructive">
                    <XCircle /> Return
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Return this document?</DialogTitle>
                <DialogDescription>
                    Explain what the OJT must correct before uploading a
                    replacement.
                </DialogDescription>
                <Form {...review.form(document.id)}>
                    <input type="hidden" name="status" value="rejected" />
                    <div className="mt-4 grid gap-2">
                        <Label htmlFor={`reason-${document.id}`}>
                            Feedback
                        </Label>
                        <textarea
                            id={`reason-${document.id}`}
                            name="rejection_reason"
                            required
                            maxLength={1000}
                            rows={5}
                            className="w-full resize-y rounded-md border bg-background px-3 py-2 text-sm"
                        />
                    </div>
                    <DialogFooter className="mt-5 gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" variant="destructive">
                            Return document
                        </Button>
                    </DialogFooter>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function Field({
    label: text,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-2">
            <Label>{text}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}
function label(value: string) {
    return (
        {
            moa: 'MOA',
            endorsement: 'Endorsement letter',
            evaluation: 'Evaluation',
            signed_form: 'Signed form',
            other: 'Other',
        }[value] ?? value
    );
}
function formatBytes(value: number) {
    return value < 1024 * 1024
        ? `${Math.ceil(value / 1024)} KB`
        : `${(value / 1024 / 1024).toFixed(1)} MB`;
}

DocumentsIndex.layout = {
    breadcrumbs: [{ title: 'Document vault', href: index() }],
};
