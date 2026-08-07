import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    Check,
    CalendarSync,
    Clock3,
    Copy,
    FileText,
    LogIn,
    LogOut,
    Pencil,
    Printer,
    Trash2,
    XCircle,
} from 'lucide-react';
import { store as storeCorrection } from '@/actions/App/Http/Controllers/AttendanceCorrectionController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
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
import { useClipboard } from '@/hooks/use-clipboard';
import {
    complete,
    destroy as destroyReport,
    dtr,
    index as reportsIndex,
    timeIn,
    timeOut,
    update as updateReport,
} from '@/routes/reports';
import type { User } from '@/types';

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
    latest_correction_status: string | null;
    scheduled_time_in: string | null;
    attendance_status: 'on_time' | 'late' | null;
    late_minutes: number | null;
};

type ActiveReport = {
    id: number;
    report_date: string;
    time_in: string;
    time_out: string | null;
    scheduled_time_in: string | null;
    attendance_status: 'on_time' | 'late' | null;
    late_minutes: number | null;
};

type Props = {
    reports: DailyReport[];
    activeReport: ActiveReport | null;
    attendancePolicy: {
        workStartTime: string;
        graceMinutes: number;
    };
};

export default function ReportsIndex({
    reports,
    activeReport,
    attendancePolicy,
}: Props) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const [copiedText, copy] = useClipboard();

    return (
        <>
            <Head title="Daily reports" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <section>
                    <p className="text-sm font-medium text-primary">
                        OJT reports
                    </p>
                    <h1 className="mt-1 text-2xl font-semibold tracking-tight">
                        Daily work report
                    </h1>
                    <p className="mt-2 text-sm text-muted-foreground">
                        Record your attendance first, then submit your daily
                        work summary.
                    </p>
                </section>

                <Card>
                    <CardHeader>
                        <CardTitle>Today&apos;s attendance</CardTitle>
                        <CardDescription>
                            Time in and time out use the system&apos;s current
                            time automatically. A one-hour lunch break is
                            deducted only when attendance spans 12:00 PM to 1:00
                            PM. Your official arrival time is{' '}
                            {formatTime(attendancePolicy.workStartTime)}
                            {attendancePolicy.graceMinutes > 0
                                ? ` with a ${attendancePolicy.graceMinutes}-minute grace period.`
                                : '.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-6">
                        <div className="grid gap-4 rounded-lg border bg-muted/30 p-4 text-sm sm:grid-cols-2">
                            <p>
                                <span className="font-medium">Name: </span>
                                {auth.user.name}
                            </p>
                            <p>
                                <span className="font-medium">
                                    OJT Position / Department:{' '}
                                </span>
                                {auth.user.position} / {auth.user.department}
                            </p>
                        </div>

                        {activeReport === null ? (
                            <TimeInForm />
                        ) : activeReport.time_out === null ? (
                            <TimeOutForm activeReport={activeReport} />
                        ) : (
                            <SummaryForm activeReport={activeReport} />
                        )}
                    </CardContent>
                </Card>

                <section className="grid gap-4">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Report history
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Your completed daily OJT reports.
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={dtr()}>
                                <Printer />
                                Print DTR
                            </Link>
                        </Button>
                    </div>

                    {reports.length === 0 ? (
                        <Card>
                            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
                                <FileText className="size-8 text-muted-foreground" />
                                <p className="font-medium">
                                    No completed reports yet
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Timed-out reports appear here after you
                                    submit your summary.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        reports.map((report) => {
                            const reportText = formatReportForClipboard(
                                report,
                                auth.user,
                            );
                            const isCopied = copiedText === reportText;

                            return (
                                <Card key={report.id}>
                                    <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <CardTitle>
                                                {formatDate(report.report_date)}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {formatTime(report.time_in)} –{' '}
                                                {formatTime(report.time_out)}
                                            </CardDescription>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            <ReportStatusBadge
                                                status={report.approval_status}
                                            />
                                            <PunctualityBadge report={report} />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => copy(reportText)}
                                            >
                                                {isCopied ? (
                                                    <Check />
                                                ) : (
                                                    <Copy />
                                                )}
                                                {isCopied
                                                    ? 'Copied'
                                                    : 'Copy report'}
                                            </Button>
                                            {report.approval_status ===
                                                'rejected' && (
                                                <>
                                                    <EditReportDialog
                                                        report={report}
                                                    />
                                                    <DeleteReportDialog
                                                        report={report}
                                                    />
                                                </>
                                            )}
                                            {report.approval_status ===
                                                'approved' &&
                                                ![
                                                    'pending_supervisor',
                                                    'pending_admin',
                                                ].includes(
                                                    report.latest_correction_status ??
                                                        '',
                                                ) && (
                                                    <CorrectionRequestDialog
                                                        report={report}
                                                    />
                                                )}
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 text-sm sm:grid-cols-2">
                                        {report.approval_status ===
                                            'rejected' && (
                                            <div className="flex gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4 sm:col-span-2">
                                                <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" />
                                                <div>
                                                    <p className="font-medium text-destructive">
                                                        Correction required
                                                    </p>
                                                    <p className="mt-1 text-muted-foreground">
                                                        {
                                                            report.rejection_reason
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                        <ReportDetail
                                            label="Name"
                                            value={auth.user.name}
                                        />
                                        <ReportDetail
                                            label="OJT Position / Department"
                                            value={`${auth.user.position} / ${auth.user.department}`}
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
                                            label="Arrival Status"
                                            value={formatPunctuality(report)}
                                        />
                                        <ReportDetail
                                            label="Time Out"
                                            value={formatTime(report.time_out)}
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
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </section>
            </div>
        </>
    );
}

function TimeInForm() {
    return (
        <Form {...timeIn.form()} className="grid gap-3">
            {({ errors, processing }) => (
                <>
                    <p className="text-sm text-muted-foreground">
                        Start your OJT day when you are ready. Your current date
                        and time will be recorded automatically.
                    </p>
                    <InputError message={errors.attendance} />
                    <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        disabled={processing}
                    >
                        {processing ? <Spinner /> : <LogIn />}
                        Time in now
                    </Button>
                </>
            )}
        </Form>
    );
}

function TimeOutForm({ activeReport }: { activeReport: ActiveReport }) {
    return (
        <Form {...timeOut.form(activeReport.id)} className="grid gap-4">
            {({ errors, processing }) => (
                <>
                    <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <Clock3 className="size-5 shrink-0 text-primary" />
                        <div>
                            <p className="font-medium">
                                You are currently timed in
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Time in:{' '}
                                {formatTimeWithSeconds(activeReport.time_in)} on{' '}
                                {formatDate(activeReport.report_date)}
                            </p>
                            <p className="mt-1 text-sm font-medium">
                                {formatPunctuality(activeReport)}
                            </p>
                        </div>
                    </div>
                    <InputError message={errors.attendance} />
                    <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        disabled={processing}
                    >
                        {processing ? <Spinner /> : <LogOut />}
                        Time out now
                    </Button>
                </>
            )}
        </Form>
    );
}

function SummaryForm({ activeReport }: { activeReport: ActiveReport }) {
    return (
        <Form {...complete.form(activeReport.id)} className="grid gap-5">
            {({ errors, processing }) => (
                <>
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 text-sm">
                        <p className="font-medium">Attendance recorded</p>
                        <p className="mt-1 text-muted-foreground">
                            {formatDate(activeReport.report_date)} ·{' '}
                            {formatTimeWithSeconds(activeReport.time_in)} –{' '}
                            {formatTimeWithSeconds(activeReport.time_out ?? '')}
                        </p>
                        <p className="mt-1 font-medium">
                            {formatPunctuality(activeReport)}
                        </p>
                    </div>

                    <div className="grid gap-2">
                        <Label htmlFor="summary">
                            Summary of the Day&apos;s Work
                        </Label>
                        <textarea
                            id="summary"
                            name="summary"
                            rows={7}
                            required
                            placeholder="Describe the tasks you completed, what you learned, and any issues you encountered."
                            className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                        <InputError
                            message={errors.summary ?? errors.attendance}
                        />
                    </div>

                    <Button
                        type="submit"
                        className="w-full sm:w-auto"
                        disabled={processing}
                    >
                        {processing && <Spinner />}
                        Submit completed report
                    </Button>
                </>
            )}
        </Form>
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
            <p className="font-medium">{label}:</p>
            <p className="mt-1 whitespace-pre-wrap text-muted-foreground">
                {value}
            </p>
        </div>
    );
}

function ReportStatusBadge({
    status,
}: {
    status: DailyReport['approval_status'];
}) {
    const styles = {
        approved:
            'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        pending:
            'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        rejected: 'border-destructive/30 bg-destructive/10 text-destructive',
    };

    return (
        <span
            className={`inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-semibold capitalize ${styles[status]}`}
        >
            {status}
        </span>
    );
}

function PunctualityBadge({
    report,
}: {
    report: Pick<DailyReport, 'attendance_status' | 'late_minutes'>;
}) {
    if (report.attendance_status === null) {
        return <span className="inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-semibold text-muted-foreground">Not classified</span>;
    }

    const isLate = report.attendance_status === 'late';

    return (
        <span className={`inline-flex h-8 items-center rounded-md border px-2.5 text-xs font-semibold ${isLate ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300' : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'}`}>
            {isLate ? `Late · ${report.late_minutes ?? 0} min` : 'On time'}
        </span>
    );
}

function formatPunctuality(
    report: Pick<DailyReport, 'attendance_status' | 'late_minutes'>,
): string {
    if (report.attendance_status === 'late') {
        return `Late (${report.late_minutes ?? 0} minutes after the official start time)`;
    }

    return report.attendance_status === 'on_time' ? 'On time' : 'Not classified';
}

function EditReportDialog({ report }: { report: DailyReport }) {
    const summaryId = `summary-${report.id}`;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <Pencil />
                    Edit
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Edit daily report</DialogTitle>
                <DialogDescription>
                    Correct the work summary and resubmit it for administrator
                    approval. Attendance times cannot be changed.
                </DialogDescription>
                <Form {...updateReport.form(report.id)}>
                    {({ errors, processing }) => (
                        <div className="mt-5 grid gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor={summaryId}>
                                    Summary of the Day&apos;s Work
                                </Label>
                                <textarea
                                    id={summaryId}
                                    name="summary"
                                    rows={7}
                                    required
                                    defaultValue={report.summary}
                                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-xs outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                />
                                <InputError message={errors.summary} />
                            </div>
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Resubmit report
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function DeleteReportDialog({ report }: { report: DailyReport }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                >
                    <Trash2 />
                    Delete
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Delete this daily report?</DialogTitle>
                <DialogDescription>
                    This permanently removes the report for{' '}
                    {formatDate(report.report_date)}. Only rejected reports can
                    be removed.
                </DialogDescription>
                <Form {...destroyReport.form(report.id)}>
                    {({ processing }) => (
                        <DialogFooter className="mt-6 gap-2">
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
                                Delete report
                            </Button>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function CorrectionRequestDialog({ report }: { report: DailyReport }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                    <CalendarSync />
                    Correct time
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Request an attendance correction</DialogTitle>
                <DialogDescription>
                    Enter only the time values that need correction. The
                    recorded attendance remains unchanged until final approval.
                </DialogDescription>
                <Form {...storeCorrection.form(report.id)} resetOnSuccess>
                    {({ errors, processing }) => (
                        <div className="mt-5 grid gap-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor={`correct-in-${report.id}`}>
                                        Corrected time in
                                    </Label>
                                    <input
                                        id={`correct-in-${report.id}`}
                                        name="proposed_time_in"
                                        type="time"
                                        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                                    />
                                    <InputError
                                        message={errors.proposed_time_in}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor={`correct-out-${report.id}`}>
                                        Corrected time out
                                    </Label>
                                    <input
                                        id={`correct-out-${report.id}`}
                                        name="proposed_time_out"
                                        type="time"
                                        className="h-9 rounded-md border border-input bg-background px-3 text-sm shadow-xs"
                                    />
                                    <InputError
                                        message={errors.proposed_time_out}
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label
                                    htmlFor={`correction-reason-${report.id}`}
                                >
                                    Why is this correction needed?
                                </Label>
                                <textarea
                                    id={`correction-reason-${report.id}`}
                                    name="reason"
                                    rows={5}
                                    required
                                    minLength={10}
                                    maxLength={2000}
                                    placeholder="Explain what happened and why the recorded time is incorrect."
                                    className="w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs"
                                />
                                <InputError
                                    message={errors.reason ?? errors.attendance}
                                />
                            </div>
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Submit request
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en', {
        dateStyle: 'long',
    }).format(new Date(`${date.slice(0, 10)}T00:00:00`));
}

function formatTime(time: string): string {
    return formatAttendanceTime(time);
}

function formatTimeWithSeconds(time: string): string {
    return formatAttendanceTime(time, true);
}

function formatAttendanceTime(time: string, showSeconds = false): string {
    const [hours = 0, minutes = 0, seconds = 0] = time.split(':').map(Number);

    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        ...(showSeconds ? { second: '2-digit' } : {}),
        hour12: true,
    }).format(new Date(2000, 0, 1, hours, minutes, seconds));
}

function formatReportForClipboard(report: DailyReport, user: User): string {
    return [
        `Name: ${user.name}`,
        `OJT Position / Department: ${user.position} / ${user.department}`,
        `Date: ${formatDate(report.report_date)}`,
        `Time In: ${formatTime(report.time_in)}`,
        `Arrival Status: ${formatPunctuality(report)}`,
        `Time Out: ${formatTime(report.time_out)}`,
        `Total Hours: ${report.total_hours} hours`,
        "Summary of the Day's Work:",
        report.summary,
    ].join('\n');
}

ReportsIndex.layout = {
    breadcrumbs: [
        {
            title: 'Daily reports',
            href: reportsIndex(),
        },
    ],
};
