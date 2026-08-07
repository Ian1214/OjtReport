import { Form, Head, Link } from '@inertiajs/react';
import { FileCheck2, LockKeyhole, Printer, Send } from 'lucide-react';
import {
    review,
    store,
} from '@/actions/App/Http/Controllers/DtrSubmissionController';
import { DashboardHero } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
};

type Props = {
    role: 'company_admin' | 'supervisor' | 'ojt';
    submissions: { data: Submission[] };
};

export default function DtrSubmissions({ role, submissions }: Props) {
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
                                    company will be included.
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
                            className="mt-5 grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
                        >
                            {({ errors, processing }) => (
                                <>
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
                                    <Button disabled={processing}>
                                        {processing ? <Spinner /> : <Send />}{' '}
                                        Submit period
                                    </Button>
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
    submission,
}: {
    role: Props['role'];
    submission: Submission;
}) {
    const canReview =
        (role === 'supervisor' && submission.status === 'pending_supervisor') ||
        (role === 'company_admin' && submission.status === 'pending_admin');

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
            {canReview && (
                <Form
                    {...review.form(submission.id)}
                    className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
                >
                    {({ errors, processing }) => (
                        <>
                            <div>
                                <Input
                                    name="rejection_reason"
                                    placeholder="Reason (required when rejecting)"
                                />
                                <InputError message={errors.rejection_reason} />
                            </div>
                            <Button
                                name="decision"
                                value="approve"
                                disabled={processing}
                            >
                                Approve
                            </Button>
                            <Button
                                name="decision"
                                value="reject"
                                variant="destructive"
                                disabled={processing}
                            >
                                Reject
                            </Button>
                        </>
                    )}
                </Form>
            )}
        </article>
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

DtrSubmissions.layout = {
    breadcrumbs: [{ title: 'DTR sign-off', href: index() }],
};
