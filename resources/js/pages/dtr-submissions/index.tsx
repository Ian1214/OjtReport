import { Form, Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    FileCheck2,
    FileSignature,
    LockKeyhole,
    Printer,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
    destroy,
    destroyFinalized,
    review,
    showPrintable,
    store,
} from '@/actions/App/Http/Controllers/DtrSubmissionController';
import { DashboardHero } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import SignaturePad, { isSignatureComplete } from '@/components/signature-pad';
import type { SignatureValue } from '@/components/signature-pad';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { index } from '@/routes/dtr-submissions';
import { dtr } from '@/routes/reports';

type Submission = {
    id: number;
    ojtName: string;
    studentId: string | null;
    periodStart: string;
    periodEnd: string;
    totalHours: string;
    reportCount: number;
    status: string;
    lockedAt: string | null;
    rejectionReason: string | null;
    studentSignatureName: string | null;
    studentSignedAt: string | null;
    supervisorSignatureName: string | null;
    supervisorSignedAt: string | null;
};

type Props = {
    role: 'company_admin' | 'supervisor' | 'ojt';
    signerName: string;
    submissions: { data: Submission[] };
};

export default function DtrSubmissions({
    role,
    signerName,
    submissions,
}: Props) {
    const [studentSignature, setStudentSignature] =
        useState<SignatureValue>(emptySignature);

    return (
        <>
            <Head title="DTR sign-off" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Verified attendance"
                    title="DTR sign-off"
                    description={
                        role === 'ojt'
                            ? 'Submit approved attendance periods for supervisor and administrator verification.'
                            : 'Review complete attendance periods before they become locked records.'
                    }
                />
                {role === 'ojt' && (
                    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div>
                                <h2 className="font-semibold">
                                    Submit an approved period
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Only daily reports already approved by your
                                    company will be included. Confirm your name,
                                    then sign with your finger, mouse, or
                                    stylus.
                                </p>
                            </div>
                            <Button variant="outline" asChild>
                                <Link href={dtr()}>
                                    <Printer /> Preview printable DTR
                                </Link>
                            </Button>
                        </div>
                        <Form
                            {...store.form()}
                            className="mt-5 grid gap-5"
                            onSuccess={() =>
                                setStudentSignature(emptySignature())
                            }
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-4 lg:grid-cols-3">
                                        <div className="grid gap-2">
                                            <Label htmlFor="period_start">
                                                Period starts
                                            </Label>
                                            <Input
                                                id="period_start"
                                                name="period_start"
                                                type="date"
                                                required
                                            />
                                            <InputError
                                                message={errors.period_start}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="period_end">
                                                Period ends
                                            </Label>
                                            <Input
                                                id="period_end"
                                                name="period_end"
                                                type="date"
                                                required
                                            />
                                            <InputError
                                                message={errors.period_end}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="signature">
                                                Confirm your full name
                                            </Label>
                                            <Input
                                                id="signature"
                                                name="signature"
                                                placeholder={`Type ${signerName}`}
                                                autoComplete="name"
                                                required
                                            />
                                            <InputError
                                                message={errors.signature}
                                            />
                                        </div>
                                    </div>
                                    <SignaturePad
                                        id="student-signature"
                                        value={studentSignature}
                                        onChange={setStudentSignature}
                                        error={errors.signature_data}
                                        required
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            disabled={
                                                processing ||
                                                !isSignatureComplete(
                                                    studentSignature,
                                                )
                                            }
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <FileSignature />
                                            )}{' '}
                                            Sign and submit
                                        </Button>
                                    </div>
                                </>
                            )}
                        </Form>
                    </section>
                )}
                <section className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
                    <div className="flex items-center gap-3">
                        <FileCheck2 className="size-5 text-primary" />
                        <div>
                            <h2 className="font-semibold">DTR periods</h2>
                            <p className="text-sm text-muted-foreground">
                                Final approval locks every included attendance
                                record.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-3">
                        {submissions.data.length === 0 && (
                            <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                                No DTR periods have been submitted.
                            </p>
                        )}
                        {submissions.data.map((submission) => (
                            <SubmissionCard
                                key={submission.id}
                                role={role}
                                signerName={signerName}
                                submission={submission}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

function SubmissionCard({
    role,
    signerName,
    submission,
}: {
    role: Props['role'];
    signerName: string;
    submission: Submission;
}) {
    const [supervisorSignature, setSupervisorSignature] =
        useState<SignatureValue>(emptySignature);
    const canReview =
        (role === 'supervisor' && submission.status === 'pending_supervisor') ||
        (role === 'company_admin' && submission.status === 'pending_admin');
    const deletionIsLocked =
        submission.lockedAt !== null || submission.status === 'approved';

    return (
        <article className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="font-medium">
                        {role === 'ojt'
                            ? `${formatDate(submission.periodStart)} – ${formatDate(submission.periodEnd)}`
                            : submission.ojtName}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {submission.reportCount} reports ·{' '}
                        {submission.totalHours} hours
                        {role !== 'ojt' &&
                            ` · ${formatDate(submission.periodStart)} – ${formatDate(submission.periodEnd)}`}
                    </p>
                </div>
                <Badge variant="outline">
                    {submission.lockedAt && (
                        <LockKeyhole className="mr-1 size-3" />
                    )}
                    {statusLabel(submission.status)}
                </Badge>
            </div>
            {submission.rejectionReason && (
                <p className="mt-3 rounded-lg bg-destructive/8 p-3 text-sm text-destructive">
                    {submission.rejectionReason}
                </p>
            )}
            <div className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <SignatureStatus
                    label="OJT signature"
                    name={submission.studentSignatureName}
                    signedAt={submission.studentSignedAt}
                />
                <SignatureStatus
                    label="Supervisor signature"
                    name={submission.supervisorSignatureName}
                    signedAt={submission.supervisorSignedAt}
                />
            </div>
            {canReview && (
                <Form
                    {...review.form(submission.id)}
                    className="mt-4 grid gap-4"
                    onSuccess={() => setSupervisorSignature(emptySignature())}
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-3 lg:grid-cols-2">
                                <div>
                                    <Input
                                        name="rejection_reason"
                                        placeholder="Reason (required when rejecting)"
                                    />
                                    <InputError
                                        message={errors.rejection_reason}
                                    />
                                </div>
                                {role === 'supervisor' && (
                                    <div className="grid content-start gap-2">
                                        <Label
                                            htmlFor={`signature-${submission.id}`}
                                        >
                                            Confirm your full name
                                        </Label>
                                        <Input
                                            id={`signature-${submission.id}`}
                                            name="signature"
                                            placeholder={`Type ${signerName} to approve`}
                                            autoComplete="name"
                                        />
                                        <InputError
                                            message={errors.signature}
                                        />
                                    </div>
                                )}
                            </div>
                            {role === 'supervisor' && (
                                <SignaturePad
                                    id={`supervisor-signature-${submission.id}`}
                                    value={supervisorSignature}
                                    onChange={setSupervisorSignature}
                                    error={errors.signature_data}
                                    label="Draw your supervisor signature"
                                    required
                                />
                            )}
                            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <Button
                                    name="decision"
                                    value="reject"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    Reject
                                </Button>
                                <Button
                                    name="decision"
                                    value="approve"
                                    disabled={
                                        processing ||
                                        (role === 'supervisor' &&
                                            !isSignatureComplete(
                                                supervisorSignature,
                                            ))
                                    }
                                >
                                    {role === 'supervisor'
                                        ? 'Sign and approve'
                                        : 'Finalize DTR'}
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            )}
            {(role === 'ojt' || submission.lockedAt) && (
                <div className="mt-4 flex flex-wrap justify-end gap-2">
                    {role === 'ojt' && (
                        <DeleteDtrPeriodDialog
                            submission={submission}
                            disabled={deletionIsLocked}
                        />
                    )}
                    {role === 'company_admin' &&
                        submission.status === 'approved' &&
                        submission.lockedAt !== null && (
                            <DeleteDtrPeriodDialog
                                submission={submission}
                                disabled={false}
                                adminFinalized
                            />
                        )}
                    {submission.lockedAt && (
                        <Button variant="outline" asChild>
                            <Link href={showPrintable(submission.id)}>
                                <Printer /> Print signed DTR
                            </Link>
                        </Button>
                    )}
                </div>
            )}
        </article>
    );
}

function DeleteDtrPeriodDialog({
    submission,
    disabled,
    adminFinalized = false,
}: {
    submission: Submission;
    disabled: boolean;
    adminFinalized?: boolean;
}) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    disabled={disabled}
                    title={
                        disabled
                            ? 'Finalized DTR periods are protected and cannot be deleted.'
                            : 'Delete this DTR period'
                    }
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                    <Trash2 />
                    {adminFinalized ? 'Delete finalized' : 'Delete'}
                </Button>
            </DialogTrigger>
            <DialogContent className="overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="gap-3 p-6 pb-0 text-left">
                    <span className="grid size-11 place-items-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive shadow-sm">
                        <Trash2 className="size-5" aria-hidden="true" />
                    </span>
                    <div className="grid gap-2">
                        <DialogTitle>
                            {adminFinalized
                                ? 'Delete this finalized DTR?'
                                : 'Delete this DTR period?'}
                        </DialogTitle>
                        <DialogDescription>
                            {adminFinalized
                                ? 'This permanently removes the finalized sign-off and both signatures. The approved daily reports are preserved and unlocked for a new sign-off.'
                                : 'The sign-off period and its signatures will be removed. Your daily reports will not be deleted and can be submitted again.'}
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="mx-6 rounded-xl border bg-muted/35 p-4 text-sm">
                    <p className="font-medium text-foreground">
                        {formatDate(submission.periodStart)} –{' '}
                        {formatDate(submission.periodEnd)}
                    </p>
                    <p className="mt-1 text-muted-foreground">
                        {submission.reportCount} reports ·{' '}
                        {submission.totalHours} hours
                    </p>
                </div>

                <Form
                    {...(adminFinalized
                        ? destroyFinalized.form(submission.id)
                        : destroy.form(submission.id))}
                    onSuccess={() => setOpen(false)}
                >
                    {({ errors, processing }) => (
                        <>
                            <InputError
                                className="px-6"
                                message={errors.dtr_submission}
                            />
                            <DialogFooter className="border-t bg-muted/25 p-4 sm:px-6">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        Keep period
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}
                                    {adminFinalized
                                        ? 'Delete finalized DTR'
                                        : 'Delete period'}
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function SignatureStatus({
    label,
    name,
    signedAt,
}: {
    label: string;
    name: string | null;
    signedAt: string | null;
}) {
    return (
        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3">
            {signedAt ? (
                <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" />
            ) : (
                <FileSignature className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
            )}
            <div>
                <p className="font-medium">{label}</p>
                <p className="text-muted-foreground">
                    {signedAt && name
                        ? `${name} · ${formatDateTime(signedAt)}`
                        : 'Awaiting signature'}
                </p>
            </div>
        </div>
    );
}

const formatDate = (date: string) =>
    new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeZone: 'Asia/Manila',
    }).format(new Date(`${date}T00:00:00+08:00`));
const statusLabel = (status: string) =>
    ({
        pending_supervisor: 'Supervisor review',
        pending_admin: 'Final review',
        approved: 'Finalized',
        rejected: 'Returned',
    })[status] ?? status;
const formatDateTime = (date: string) =>
    new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Manila',
    }).format(new Date(date));

const emptySignature = (): SignatureValue => ({
    version: 1,
    strokes: [],
});

DtrSubmissions.layout = {
    breadcrumbs: [{ title: 'DTR sign-off', href: index() }],
};
