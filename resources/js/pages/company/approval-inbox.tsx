import { Form, Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    FileCheck2,
    Inbox,
    RotateCcw,
    Search,
    UserRound,
    XCircle,
} from 'lucide-react';
import { useState } from 'react';
import {
    approve,
    reject,
} from '@/actions/App/Http/Controllers/Company/DailyReportReviewController';
import { DashboardHero, MetricCard } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
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
import { index as approvalInbox } from '@/routes/company/approvals';
import { show as showOjt } from '@/routes/company/ojts';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

type Report = {
    id: number;
    reportDate: string;
    timeIn: string;
    timeOut: string;
    totalHours: number;
    summary: string;
    status: ApprovalStatus;
    rejectionReason: string | null;
    reviewedAt: string | null;
    reviewerName: string | null;
    scheduledTimeIn: string | null;
    attendanceStatus: 'on_time' | 'late' | null;
    lateMinutes: number | null;
    ojt: {
        id: number;
        name: string;
        studentId: string;
        position: string;
        department: string;
        supervisorName: string | null;
    };
};

type Props = {
    companyName: string;
    reports: {
        data: Report[];
        current_page: number;
        last_page: number;
        total: number;
        from: number | null;
        to: number | null;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    filters: {
        search: string;
        status: 'all' | ApprovalStatus;
        supervisorId: string;
        dateFrom: string;
        dateTo: string;
    };
    stats: { pending: number; approved: number; rejected: number };
    supervisors: Array<{ id: number; name: string }>;
};

export default function ApprovalInbox({
    companyName,
    reports,
    filters,
    stats,
    supervisors,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [supervisorId, setSupervisorId] = useState(filters.supervisorId);
    const [dateFrom, setDateFrom] = useState(filters.dateFrom);
    const [dateTo, setDateTo] = useState(filters.dateTo);

    function submitFilters(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            approvalInbox.url(),
            {
                search: search || undefined,
                status,
                supervisor_id: supervisorId || undefined,
                date_from: dateFrom || undefined,
                date_to: dateTo || undefined,
            },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Approval Inbox" />

            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow={`${companyName} · Attendance control`}
                    title="Approval Inbox"
                    description="Review daily attendance from every OJT in one place. Pending hours remain excluded until you approve them."
                    actions={
                        <Badge className="gap-1.5" variant="secondary">
                            <Inbox className="size-3.5" />
                            {stats.pending} awaiting review
                        </Badge>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                        icon={Clock3}
                        label="Pending review"
                        value={stats.pending}
                    />
                    <MetricCard
                        icon={CheckCircle2}
                        label="Approved"
                        value={stats.approved}
                        accent="success"
                    />
                    <MetricCard
                        icon={RotateCcw}
                        label="Returned"
                        value={stats.rejected}
                    />
                </div>

                <Card className="rounded-2xl">
                    <CardHeader>
                        <CardTitle>Find reports</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={submitFilters}
                            className="grid gap-4 lg:grid-cols-6"
                        >
                            <div className="grid gap-2 lg:col-span-2">
                                <Label htmlFor="search">OJT name or ID</Label>
                                <Input
                                    id="search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search OJTs"
                                />
                            </div>
                            <FilterSelect
                                id="status"
                                label="Status"
                                value={status}
                                onChange={(value) =>
                                    setStatus(
                                        value as Props['filters']['status'],
                                    )
                                }
                                options={[
                                    ['pending', 'Pending'],
                                    ['approved', 'Approved'],
                                    ['rejected', 'Returned'],
                                    ['all', 'All statuses'],
                                ]}
                            />
                            <FilterSelect
                                id="supervisor"
                                label="Supervisor"
                                value={supervisorId}
                                onChange={setSupervisorId}
                                options={[
                                    ['', 'All supervisors'],
                                    ...supervisors.map(
                                        (supervisor) =>
                                            [
                                                String(supervisor.id),
                                                supervisor.name,
                                            ] as [string, string],
                                    ),
                                ]}
                            />
                            <DateFilter
                                id="date-from"
                                label="From"
                                value={dateFrom}
                                onChange={setDateFrom}
                            />
                            <DateFilter
                                id="date-to"
                                label="To"
                                value={dateTo}
                                min={dateFrom}
                                onChange={setDateTo}
                            />
                            <div className="flex flex-wrap gap-2 lg:col-span-6 lg:justify-end">
                                <Button variant="outline" asChild>
                                    <Link href={approvalInbox()}>
                                        <RotateCcw />
                                        Reset
                                    </Link>
                                </Button>
                                <Button type="submit">
                                    <Search />
                                    Apply filters
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <section className="grid gap-4">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Attendance reports
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Showing {reports.from ?? 0}–{reports.to ?? 0} of{' '}
                                {reports.total} reports
                            </p>
                        </div>
                    </div>

                    {reports.data.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                                <FileCheck2 className="size-8 text-muted-foreground" />
                                <p className="font-medium">
                                    No matching reports
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    There are no reports matching the current
                                    filters.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        reports.data.map((report) => (
                            <ReportCard key={report.id} report={report} />
                        ))
                    )}

                    {(reports.prev_page_url || reports.next_page_url) && (
                        <div className="flex items-center justify-between gap-3">
                            <Button
                                variant="outline"
                                disabled={!reports.prev_page_url}
                                asChild={Boolean(reports.prev_page_url)}
                            >
                                {reports.prev_page_url ? (
                                    <Link href={reports.prev_page_url}>
                                        Previous
                                    </Link>
                                ) : (
                                    <span>Previous</span>
                                )}
                            </Button>
                            <span className="text-sm text-muted-foreground">
                                Page {reports.current_page} of{' '}
                                {reports.last_page}
                            </span>
                            <Button
                                variant="outline"
                                disabled={!reports.next_page_url}
                                asChild={Boolean(reports.next_page_url)}
                            >
                                {reports.next_page_url ? (
                                    <Link href={reports.next_page_url}>
                                        Next
                                    </Link>
                                ) : (
                                    <span>Next</span>
                                )}
                            </Button>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function ReportCard({ report }: { report: Report }) {
    return (
        <Card className="overflow-hidden rounded-2xl">
            <CardHeader className="gap-4 border-b bg-muted/20 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <UserRound className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <CardTitle className="truncate">
                            {report.ojt.name}
                        </CardTitle>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {report.ojt.studentId} · {report.ojt.position} /{' '}
                            {report.ojt.department}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Supervisor:{' '}
                            {report.ojt.supervisorName ?? 'Not assigned'}
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={report.status} />
                    <Badge
                        variant="outline"
                        className={
                            report.attendanceStatus === 'late'
                                ? 'border-amber-500/30 text-amber-700 dark:text-amber-300'
                                : report.attendanceStatus === 'on_time'
                                  ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                  : ''
                        }
                    >
                        {report.attendanceStatus === 'late'
                            ? `Late · ${report.lateMinutes ?? 0} min`
                            : report.attendanceStatus === 'on_time'
                              ? 'On time'
                              : 'Not classified'}
                    </Badge>
                    <Badge variant="outline">
                        {report.totalHours.toFixed(2)} hours
                    </Badge>
                </div>
            </CardHeader>
            <CardContent className="grid gap-5 p-5 sm:p-6">
                <div className="grid gap-4 text-sm sm:grid-cols-4">
                    <Detail
                        label="Date"
                        value={formatDate(report.reportDate)}
                    />
                    <Detail label="Time in" value={formatTime(report.timeIn)} />
                    <Detail
                        label="Time out"
                        value={formatTime(report.timeOut)}
                    />
                    <Detail
                        label="Total hours"
                        value={report.totalHours.toFixed(2)}
                    />
                    <Detail
                        label="Arrival status"
                        value={
                            report.attendanceStatus === 'late'
                                ? `Late (${report.lateMinutes ?? 0} minutes)`
                                : report.attendanceStatus === 'on_time'
                                  ? 'On time'
                                  : 'Not classified'
                        }
                    />
                </div>
                <div className="rounded-xl border bg-muted/15 p-4">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Summary of the Day&apos;s Work
                    </p>
                    <p className="mt-2 text-sm whitespace-pre-wrap">
                        {report.summary}
                    </p>
                </div>
                {report.rejectionReason && (
                    <div className="rounded-xl border border-destructive/25 bg-destructive/5 p-4">
                        <p className="text-sm font-semibold text-destructive">
                            Returned for correction
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {report.rejectionReason}
                        </p>
                    </div>
                )}
                <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-xs text-muted-foreground">
                        {report.reviewedAt && report.reviewerName
                            ? `Reviewed by ${report.reviewerName} · ${formatDateTime(report.reviewedAt)}`
                            : 'Awaiting final company review'}
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href={showOjt(report.ojt.id)}>
                                View OJT history
                            </Link>
                        </Button>
                        {report.status === 'pending' && (
                            <>
                                <RejectDialog report={report} />
                                <Form {...approve.form(report.id)}>
                                    {({ errors, processing }) => (
                                        <div>
                                            <InputError
                                                message={errors.approval}
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
                                                Approve hours
                                            </Button>
                                        </div>
                                    )}
                                </Form>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RejectDialog({ report }: { report: Report }) {
    const reasonId = `inbox-rejection-${report.id}`;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <XCircle />
                    Return
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Return this report for correction?</DialogTitle>
                <DialogDescription>
                    Give the OJT a clear reason. These hours will remain
                    excluded until a corrected report is approved.
                </DialogDescription>
                <Form {...reject.form(report.id)} resetOnSuccess>
                    {({ errors, processing }) => (
                        <div className="mt-5 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={reasonId}>
                                    Correction reason
                                </Label>
                                <textarea
                                    id={reasonId}
                                    name="rejection_reason"
                                    rows={5}
                                    minLength={5}
                                    maxLength={2000}
                                    required
                                    placeholder="Explain exactly what must be corrected."
                                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <InputError
                                    message={
                                        errors.rejection_reason ??
                                        errors.approval
                                    }
                                />
                            </div>
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button variant="secondary" type="button">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    variant="destructive"
                                    type="submit"
                                    disabled={processing}
                                >
                                    {processing && <Spinner />}
                                    Return report
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function FilterSelect({
    id,
    label,
    value,
    options,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    options: Array<[string, string]>;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <select
                id={id}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
            >
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
        </div>
    );
}

function DateFilter({
    id,
    label,
    value,
    min,
    onChange,
}: {
    id: string;
    label: string;
    value: string;
    min?: string;
    onChange: (value: string) => void;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <Input
                id={id}
                type="date"
                value={value}
                min={min}
                onChange={(event) => onChange(event.target.value)}
            />
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-1 font-medium">{value}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: ApprovalStatus }) {
    return (
        <Badge variant={status === 'approved' ? 'default' : 'secondary'}>
            {status === 'pending'
                ? 'Pending approval'
                : status === 'rejected'
                  ? 'Needs correction'
                  : 'Approved'}
        </Badge>
    );
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

ApprovalInbox.layout = {
    breadcrumbs: [{ title: 'Approval Inbox', href: approvalInbox() }],
};
