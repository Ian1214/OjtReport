import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    Clock3,
    FileText,
    UserRound,
    XCircle,
} from 'lucide-react';
import {
    approve,
    reject,
} from '@/actions/App/Http/Controllers/Company/DailyReportReviewController';
import { DashboardHero, MetricCard } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { index as managedOjtsIndex } from '@/routes/company/ojts';
import { dashboard as supervisorDashboard } from '@/routes/supervisor';

type Ojt = {
    id: number;
    name: string;
    studentId: string;
    program: string;
    year: number;
    department: string;
    position: string;
    requiredHours: number;
    completedHours: number;
    hoursLeft: number;
};

type DailyReport = {
    id: number;
    report_date: string;
    time_in: string;
    time_out: string;
    total_hours: string;
    summary: string;
    approval_status: 'pending' | 'approved' | 'rejected';
    reviewed_at: string | null;
    rejection_reason: string | null;
    attendance_status: 'on_time' | 'late' | null;
    late_minutes: number | null;
};

type Props = {
    companyName: string;
    ojt: Ojt;
    reports: DailyReport[];
    viewer: 'company' | 'supervisor';
};

export default function OjtReports({
    companyName,
    ojt,
    reports,
    viewer,
}: Props) {
    const isCompanyAdmin = viewer === 'company';

    return (
        <>
            <Head title={`${ojt.name} reports`} />

            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <Button variant="ghost" asChild className="w-fit">
                    <Link
                        href={
                            isCompanyAdmin
                                ? managedOjtsIndex()
                                : supervisorDashboard()
                        }
                    >
                        <ArrowLeft />
                        {isCompanyAdmin
                            ? 'Back to Managed OJTs'
                            : 'Back to dashboard'}
                    </Link>
                </Button>

                <DashboardHero
                    eyebrow={`${companyName} · ${isCompanyAdmin ? 'Attendance review' : 'Supervisor view'}`}
                    title={`${ojt.name}'s daily reports`}
                    description={`${ojt.studentId} · ${ojt.position} / ${ojt.department}. ${isCompanyAdmin ? 'Approve verified attendance or return a report for correction.' : 'You can monitor the reports of OJTs assigned to you.'}`}
                    actions={
                        <Badge variant="secondary">
                            {isCompanyAdmin ? 'Final reviewer' : 'View only'}
                        </Badge>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                        icon={Clock3}
                        label="Completed hours"
                        value={ojt.completedHours.toFixed(2)}
                    />
                    <MetricCard
                        icon={CalendarDays}
                        label="Hours left"
                        value={ojt.hoursLeft.toFixed(2)}
                    />
                    <MetricCard
                        icon={UserRound}
                        label="Required hours"
                        value={ojt.requiredHours}
                    />
                </div>

                <section className="rounded-2xl border bg-card/80 p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-1 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold">
                                Submitted daily reports
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {ojt.program} · Year {ojt.year}
                            </p>
                        </div>
                        <Badge variant="secondary">
                            {reports.length} reports
                        </Badge>
                    </div>

                    {reports.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-dashed bg-muted/20 p-10 text-center">
                            <FileText className="mx-auto size-7 text-muted-foreground" />
                            <p className="mt-3 font-medium">
                                No submitted reports yet
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Completed daily reports will appear here when
                                the OJT submits them.
                            </p>
                        </div>
                    ) : (
                        <div className="mt-5 grid gap-4">
                            {reports.map((report) => (
                                <article
                                    key={report.id}
                                    className="rounded-xl border bg-muted/15 p-4 sm:p-5"
                                >
                                    <div className="flex flex-col gap-1 border-b pb-4 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <p className="font-semibold">
                                                {formatDate(report.report_date)}
                                            </p>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {formatTime(report.time_in)} –{' '}
                                                {formatTime(report.time_out)}
                                            </p>
                                        </div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <ReportStatusBadge
                                                status={report.approval_status}
                                            />
                                            <Badge
                                                variant="outline"
                                                className={report.attendance_status === 'late' ? 'border-amber-500/30 text-amber-700 dark:text-amber-300' : report.attendance_status === 'on_time' ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300' : ''}
                                            >
                                                {report.attendance_status === 'late'
                                                    ? `Late · ${report.late_minutes ?? 0} min`
                                                    : report.attendance_status === 'on_time'
                                                      ? 'On time'
                                                      : 'Not classified'}
                                            </Badge>
                                            <Badge variant="outline">
                                                {report.total_hours} hours
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                                        {report.approval_status ===
                                            'rejected' && (
                                            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:col-span-2">
                                                <p className="font-medium text-destructive">
                                                    Rejection reason
                                                </p>
                                                <p className="mt-1 text-muted-foreground">
                                                    {report.rejection_reason}
                                                </p>
                                            </div>
                                        )}
                                        <ReportDetail
                                            label="Name"
                                            value={ojt.name}
                                        />
                                        <ReportDetail
                                            label="OJT Position / Department"
                                            value={`${ojt.position} / ${ojt.department}`}
                                        />
                                        <ReportDetail
                                            label="Date"
                                            value={formatDate(
                                                report.report_date,
                                            )}
                                        />
                                        <ReportDetail
                                            label="Time In"
                                            value={formatTime(report.time_in)}
                                        />
                                        <ReportDetail
                                            label="Time Out"
                                            value={formatTime(report.time_out)}
                                        />
                                        <ReportDetail
                                            label="Arrival Status"
                                            value={report.attendance_status === 'late' ? `Late (${report.late_minutes ?? 0} minutes)` : report.attendance_status === 'on_time' ? 'On time' : 'Not classified'}
                                        />
                                        <ReportDetail
                                            label="Total Hours"
                                            value={`${report.total_hours} hours`}
                                        />
                                        <ReportDetail
                                            label="Summary of the Day's Work"
                                            value={report.summary}
                                            className="sm:col-span-2"
                                        />
                                    </div>
                                    {isCompanyAdmin &&
                                        report.approval_status ===
                                            'pending' && (
                                            <div className="mt-5 flex flex-col justify-end gap-2 border-t pt-4 sm:flex-row">
                                                <RejectReportDialog
                                                    report={report}
                                                />
                                                <Form
                                                    {...approve.form(report.id)}
                                                >
                                                    {({
                                                        errors,
                                                        processing,
                                                    }) => (
                                                        <div>
                                                            <InputError
                                                                message={
                                                                    errors.approval
                                                                }
                                                            />
                                                            <Button
                                                                type="submit"
                                                                disabled={
                                                                    processing
                                                                }
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
                                            </div>
                                        )}
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function ReportStatusBadge({
    status,
}: {
    status: DailyReport['approval_status'];
}) {
    const variant = status === 'approved' ? 'default' : 'secondary';

    return <Badge variant={variant}>{formatStatus(status)}</Badge>;
}

function RejectReportDialog({ report }: { report: DailyReport }) {
    const reasonId = `rejection-reason-${report.id}`;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="outline">
                    <XCircle />
                    Return for correction
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Return this report?</DialogTitle>
                <DialogDescription>
                    Explain what the OJT must correct. The hours will remain
                    excluded until the corrected report is approved.
                </DialogDescription>
                <Form {...reject.form(report.id)} resetOnSuccess>
                    {({ errors, processing }) => (
                        <div className="mt-5 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={reasonId}>
                                    Reason for correction
                                </Label>
                                <textarea
                                    id={reasonId}
                                    name="rejection_reason"
                                    rows={5}
                                    required
                                    minLength={5}
                                    placeholder="Describe the missing or incorrect information."
                                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
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
                                    <Button type="button" variant="secondary">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant="destructive"
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

function ReportDetail({
    label,
    value,
    className = '',
}: {
    label: string;
    value: string;
    className?: string;
}) {
    return (
        <div className={className}>
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-2 text-sm font-medium whitespace-pre-wrap">
                {value}
            </p>
        </div>
    );
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en', { dateStyle: 'long' }).format(
        new Date(`${date.slice(0, 10)}T00:00:00`),
    );
}

function formatTime(time: string): string {
    const [hours = 0, minutes = 0] = time.split(':').map(Number);

    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(2000, 0, 1, hours, minutes));
}

function formatStatus(status: DailyReport['approval_status']): string {
    return status === 'approved'
        ? 'Approved'
        : status === 'pending'
          ? 'Pending approval'
          : 'Needs correction';
}
