import { Form, Head, Link } from '@inertiajs/react';
import {
    CalendarSync,
    CheckCircle2,
    Clock3,
    Send,
    XCircle,
} from 'lucide-react';
import {
    approve,
    reject,
    supervisorReview,
} from '@/actions/App/Http/Controllers/AttendanceCorrectionController';
import { DashboardHero } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { index as correctionsIndex } from '@/routes/attendance-corrections';
import { index as reportsIndex } from '@/routes/reports';

type Status = 'pending_supervisor' | 'pending_admin' | 'approved' | 'rejected';
type Correction = {
    id: number;
    reportDate: string;
    originalTimeIn: string;
    originalTimeOut: string;
    proposedTimeIn: string | null;
    proposedTimeOut: string | null;
    reason: string;
    status: Status;
    supervisorComment: string | null;
    supervisorName: string | null;
    supervisorReviewedAt: string | null;
    adminComment: string | null;
    reviewerName: string | null;
    reviewedAt: string | null;
    createdAt: string;
    ojt: { id: number; name: string; studentId: string };
};

type Props = {
    role: 'ojt' | 'supervisor' | 'company_admin';
    corrections: {
        data: Correction[];
        current_page: number;
        last_page: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
};

export default function AttendanceCorrections({ role, corrections }: Props) {
    return (
        <>
            <Head title="Time Corrections" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Attendance integrity"
                    title="Time Corrections"
                    description={descriptionForRole(role)}
                    actions={
                        role === 'ojt' ? (
                            <Button variant="outline" asChild>
                                <Link href={reportsIndex()}>
                                    <CalendarSync />
                                    Request from reports
                                </Link>
                            </Button>
                        ) : undefined
                    }
                />

                {corrections.data.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                            <Clock3 className="size-8 text-muted-foreground" />
                            <p className="font-medium">
                                No correction requests
                            </p>
                            <p className="max-w-lg text-sm text-muted-foreground">
                                {role === 'ojt'
                                    ? 'Approved reports can be submitted for correction from Daily Reports.'
                                    : 'Requests assigned to your role will appear here.'}
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {corrections.data.map((correction) => (
                            <CorrectionCard
                                key={correction.id}
                                correction={correction}
                                role={role}
                            />
                        ))}
                    </div>
                )}

                {(corrections.prev_page_url || corrections.next_page_url) && (
                    <div className="flex items-center justify-between gap-3">
                        <PaginationButton href={corrections.prev_page_url}>
                            Previous
                        </PaginationButton>
                        <span className="text-sm text-muted-foreground">
                            Page {corrections.current_page} of{' '}
                            {corrections.last_page}
                        </span>
                        <PaginationButton href={corrections.next_page_url}>
                            Next
                        </PaginationButton>
                    </div>
                )}
            </div>
        </>
    );
}

function CorrectionCard({
    correction,
    role,
}: {
    correction: Correction;
    role: Props['role'];
}) {
    return (
        <Dialog>
            <Card className="rounded-xl transition-colors hover:border-primary/30">
                <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                            <CalendarSync className="size-5" />
                        </div>
                        <div className="min-w-0">
                            <p className="font-semibold">
                                {role === 'ojt'
                                    ? `You requested a time correction`
                                    : `${correction.ojt.name} requested a time correction`}
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {formatDate(correction.reportDate)} · Requested{' '}
                                {formatDateTime(correction.createdAt)}
                            </p>
                        </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                        <StatusBadge status={correction.status} />
                        <DialogTrigger asChild>
                            <Button variant="outline">View request</Button>
                        </DialogTrigger>
                    </div>
                </CardContent>
            </Card>

            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogTitle>Time correction request</DialogTitle>
                <DialogDescription>
                    {correction.ojt.name} · {correction.ojt.studentId} ·{' '}
                    {formatDate(correction.reportDate)}
                </DialogDescription>
                <div className="mt-5 grid gap-5">
                    <div className="flex items-center justify-between gap-3 rounded-xl border bg-muted/20 p-4">
                        <div>
                            <p className="text-xs text-muted-foreground">
                                Request status
                            </p>
                            <p className="mt-1 text-sm font-medium">
                                Submitted {formatDateTime(correction.createdAt)}
                            </p>
                        </div>
                        <StatusBadge status={correction.status} />
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <TimeChange
                            label="Time in"
                            original={correction.originalTimeIn}
                            proposed={correction.proposedTimeIn}
                        />
                        <TimeChange
                            label="Time out"
                            original={correction.originalTimeOut}
                            proposed={correction.proposedTimeOut}
                        />
                    </div>
                    <Note label="OJT reason" value={correction.reason} />
                    {correction.supervisorComment && (
                        <Note
                            label={`Supervisor review · ${correction.supervisorName ?? 'Supervisor'}`}
                            value={correction.supervisorComment}
                        />
                    )}
                    {correction.adminComment && (
                        <Note
                            label={`Administrator decision · ${correction.reviewerName ?? 'Administrator'}`}
                            value={correction.adminComment}
                            destructive={correction.status === 'rejected'}
                        />
                    )}
                    <div className="flex flex-col-reverse gap-2 border-t pt-4 sm:flex-row sm:justify-end">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Close
                            </Button>
                        </DialogClose>
                        {role === 'supervisor' &&
                            correction.status === 'pending_supervisor' && (
                                <SupervisorReviewDialog
                                    correction={correction}
                                />
                            )}
                        {role === 'company_admin' &&
                            correction.status === 'pending_admin' && (
                                <>
                                    <AdminRejectDialog
                                        correction={correction}
                                    />
                                    <Form {...approve.form(correction.id)}>
                                        {({ errors, processing }) => (
                                            <div>
                                                <InputError
                                                    message={errors.correction}
                                                />
                                                <Button
                                                    type="submit"
                                                    disabled={processing}
                                                >
                                                    {processing ? (
                                                        <Spinner />
                                                    ) : (
                                                        <CheckCircle2 />
                                                    )}
                                                    Approve correction
                                                </Button>
                                            </div>
                                        )}
                                    </Form>
                                </>
                            )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function SupervisorReviewDialog({ correction }: { correction: Correction }) {
    return (
        <ReviewDialog
            title="Forward for final approval"
            description="Add your review notes for the company administrator. The attendance record is not changed yet."
            field="supervisor_comment"
            label="Supervisor review"
            submitLabel="Forward to admin"
            form={supervisorReview.form(correction.id)}
        />
    );
}

function AdminRejectDialog({ correction }: { correction: Correction }) {
    return (
        <ReviewDialog
            title="Reject correction request"
            description="Explain why the correction was rejected. The original attendance times will be preserved."
            field="admin_comment"
            label="Rejection reason"
            submitLabel="Reject request"
            form={reject.form(correction.id)}
            destructive
        />
    );
}

function ReviewDialog({
    title,
    description,
    field,
    label,
    submitLabel,
    form,
    destructive = false,
}: {
    title: string;
    description: string;
    field: string;
    label: string;
    submitLabel: string;
    form: { action: string; method: 'post' };
    destructive?: boolean;
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant={destructive ? 'outline' : 'default'}>
                    {destructive ? <XCircle /> : <Send />}
                    {submitLabel}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>{title}</DialogTitle>
                <DialogDescription>{description}</DialogDescription>
                <Form {...form} resetOnSuccess>
                    {({ errors, processing }) => (
                        <div className="mt-5 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={`${field}-${form.action}`}>
                                    {label}
                                </Label>
                                <textarea
                                    id={`${field}-${form.action}`}
                                    name={field}
                                    rows={5}
                                    required
                                    minLength={3}
                                    maxLength={2000}
                                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <InputError
                                    message={errors[field] ?? errors.correction}
                                />
                            </div>
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant={
                                        destructive ? 'destructive' : 'default'
                                    }
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}
                                    {submitLabel}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function TimeChange({
    label,
    original,
    proposed,
}: {
    label: string;
    original: string;
    proposed: string | null;
}) {
    return (
        <div className="rounded-xl border bg-muted/15 p-4">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <div className="mt-2 flex items-center gap-3">
                <span
                    className={
                        proposed
                            ? 'text-muted-foreground line-through'
                            : 'font-semibold'
                    }
                >
                    {formatTime(original)}
                </span>
                {proposed && (
                    <>
                        <span>→</span>
                        <span className="font-semibold text-primary">
                            {formatTime(proposed)}
                        </span>
                    </>
                )}
            </div>
        </div>
    );
}

function Note({
    label,
    value,
    destructive = false,
}: {
    label: string;
    value: string;
    destructive?: boolean;
}) {
    return (
        <div
            className={`rounded-xl border p-4 ${destructive ? 'border-destructive/25 bg-destructive/5' : 'bg-muted/15'}`}
        >
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-2 text-sm whitespace-pre-wrap">{value}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: Status }) {
    const labels: Record<Status, string> = {
        pending_supervisor: 'Supervisor review',
        pending_admin: 'Admin review',
        approved: 'Approved',
        rejected: 'Rejected',
    };

    return (
        <Badge variant={status === 'approved' ? 'default' : 'secondary'}>
            {labels[status]}
        </Badge>
    );
}

function PaginationButton({
    href,
    children,
}: {
    href: string | null;
    children: React.ReactNode;
}) {
    return (
        <Button variant="outline" disabled={!href} asChild={Boolean(href)}>
            {href ? (
                <Link href={href}>{children}</Link>
            ) : (
                <span>{children}</span>
            )}
        </Button>
    );
}

function descriptionForRole(role: Props['role']): string {
    if (role === 'ojt') {
        return 'Request corrections without changing the original attendance record. Every decision remains auditable.';
    }

    if (role === 'supervisor') {
        return 'Review correction evidence from your assigned OJTs and forward clear notes for final approval.';
    }

    return 'Give final approval to reviewed attendance corrections and automatically recalculate approved hours.';
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-PH', { dateStyle: 'long' }).format(
        new Date(`${value.slice(0, 10)}T00:00:00`),
    );
}

function formatTime(value: string): string {
    const [hours = 0, minutes = 0] = value.split(':').map(Number);

    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(2000, 0, 1, hours, minutes));
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

AttendanceCorrections.layout = {
    breadcrumbs: [{ title: 'Time Corrections', href: correctionsIndex() }],
};
