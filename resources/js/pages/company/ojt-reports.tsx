import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    FileText,
    FolderLock,
    Plus,
    Star,
    Trash2,
    UserRound,
    XCircle,
} from 'lucide-react';
import {
    approve,
    reject,
} from '@/actions/App/Http/Controllers/Company/DailyReportReviewController';
import { index as documentsIndex } from '@/actions/App/Http/Controllers/DocumentController';
import {
    destroy as destroyOnboarding,
    store as storeOnboarding,
    update as updateOnboarding,
} from '@/actions/App/Http/Controllers/OnboardingChecklistController';
import { store as storeFeedback } from '@/actions/App/Http/Controllers/SupervisorFeedbackController';
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
    onboardingItems: OnboardingItem[];
    feedback: FeedbackItem[];
};

type OnboardingItem = {
    id: number;
    title: string;
    description: string | null;
    dueDate: string | null;
    completedAt: string | null;
    completedBy: string | null;
};

type FeedbackItem = {
    id: number;
    category: string;
    rating: number;
    comments: string;
    sharedWithSchool: boolean;
    supervisorName: string;
    createdAt: string;
};

export default function OjtReports({
    companyName,
    ojt,
    reports,
    viewer,
    onboardingItems,
    feedback,
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
                        <div className="flex flex-wrap items-center gap-2">
                            {isCompanyAdmin && (
                                <Button variant="outline" asChild>
                                    <Link
                                        href={documentsIndex({
                                            query: { ojt: ojt.id },
                                        })}
                                    >
                                        <FolderLock /> View {ojt.name}'s
                                        documents
                                    </Link>
                                </Button>
                            )}
                            <Badge variant="secondary">
                                {isCompanyAdmin
                                    ? 'Final reviewer'
                                    : 'View only'}
                            </Badge>
                        </div>
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

                <div className="grid gap-6 xl:grid-cols-2">
                    <OnboardingPanel
                        ojt={ojt}
                        items={onboardingItems}
                        canManage={isCompanyAdmin}
                    />
                    <FeedbackPanel
                        ojt={ojt}
                        items={feedback}
                        canAdd={!isCompanyAdmin}
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
                                                className={
                                                    report.attendance_status ===
                                                    'late'
                                                        ? 'border-amber-500/30 text-amber-700 dark:text-amber-300'
                                                        : report.attendance_status ===
                                                            'on_time'
                                                          ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                                          : ''
                                                }
                                            >
                                                {report.attendance_status ===
                                                'late'
                                                    ? `Late · ${report.late_minutes ?? 0} min`
                                                    : report.attendance_status ===
                                                        'on_time'
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
                                            value={
                                                report.attendance_status ===
                                                'late'
                                                    ? `Late (${report.late_minutes ?? 0} minutes)`
                                                    : report.attendance_status ===
                                                        'on_time'
                                                      ? 'On time'
                                                      : 'Not classified'
                                            }
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

function OnboardingPanel({
    ojt,
    items,
    canManage,
}: {
    ojt: Ojt;
    items: OnboardingItem[];
    canManage: boolean;
}) {
    const completed = items.filter((item) => item.completedAt).length;

    return (
        <section className="rounded-2xl border bg-card/80 p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="flex items-center gap-2 font-semibold">
                        <ClipboardCheck className="size-4 text-primary" />
                        Onboarding checklist
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {completed} of {items.length} requirements complete
                    </p>
                </div>
                <Badge variant="secondary">
                    {items.length === 0
                        ? 'Not set'
                        : `${Math.round((completed / items.length) * 100)}%`}
                </Badge>
            </div>

            <div className="mt-5 grid gap-3">
                {items.length === 0 && (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No onboarding requirements have been added.
                    </div>
                )}
                {items.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-start gap-3 rounded-xl border bg-muted/15 p-3"
                    >
                        {canManage ? (
                            <Form {...updateOnboarding.form(item.id)}>
                                <input
                                    type="hidden"
                                    name="completed"
                                    value={item.completedAt ? '0' : '1'}
                                />
                                <Button
                                    type="submit"
                                    size="icon"
                                    variant="ghost"
                                    aria-label={
                                        item.completedAt
                                            ? 'Reopen requirement'
                                            : 'Complete requirement'
                                    }
                                >
                                    <CheckCircle2
                                        className={
                                            item.completedAt
                                                ? 'text-emerald-500'
                                                : 'text-muted-foreground'
                                        }
                                    />
                                </Button>
                            </Form>
                        ) : (
                            <CheckCircle2
                                className={`mt-2 size-4 ${item.completedAt ? 'text-emerald-500' : 'text-muted-foreground'}`}
                            />
                        )}
                        <div className="min-w-0 flex-1">
                            <p
                                className={
                                    item.completedAt
                                        ? 'font-medium line-through opacity-70'
                                        : 'font-medium'
                                }
                            >
                                {item.title}
                            </p>
                            {item.description && (
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {item.description}
                                </p>
                            )}
                            <p className="mt-2 text-xs text-muted-foreground">
                                {item.completedAt
                                    ? `Completed${item.completedBy ? ` by ${item.completedBy}` : ''}`
                                    : item.dueDate
                                      ? `Due ${formatDate(item.dueDate)}`
                                      : 'No due date'}
                            </p>
                        </div>
                        {canManage && (
                            <Form {...destroyOnboarding.form(item.id)}>
                                <Button
                                    type="submit"
                                    size="icon"
                                    variant="ghost"
                                    className="text-destructive"
                                    aria-label="Delete requirement"
                                >
                                    <Trash2 />
                                </Button>
                            </Form>
                        )}
                    </div>
                ))}
            </div>

            {canManage && (
                <Form
                    {...storeOnboarding.form(ojt.id)}
                    resetOnSuccess
                    className="mt-5 grid gap-3 border-t pt-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <input
                                    name="title"
                                    required
                                    maxLength={120}
                                    placeholder="Requirement title"
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                />
                                <input
                                    name="due_date"
                                    type="date"
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                />
                            </div>
                            <textarea
                                name="description"
                                rows={2}
                                maxLength={1000}
                                placeholder="Optional instructions"
                                className="rounded-md border bg-background px-3 py-2 text-sm"
                            />
                            <InputError
                                message={errors.title ?? errors.due_date}
                            />
                            <Button
                                type="submit"
                                variant="outline"
                                disabled={processing}
                                className="w-fit"
                            >
                                {processing ? <Spinner /> : <Plus />} Add
                                requirement
                            </Button>
                        </>
                    )}
                </Form>
            )}
        </section>
    );
}

function FeedbackPanel({
    ojt,
    items,
    canAdd,
}: {
    ojt: Ojt;
    items: FeedbackItem[];
    canAdd: boolean;
}) {
    return (
        <section className="rounded-2xl border bg-card/80 p-5 shadow-sm sm:p-6">
            <div>
                <p className="flex items-center gap-2 font-semibold">
                    <Star className="size-4 text-primary" /> Supervisor feedback
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                    A dated coaching and progress timeline.
                </p>
            </div>
            <div className="mt-5 grid max-h-80 gap-3 overflow-y-auto">
                {items.length === 0 && (
                    <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                        No supervisor feedback yet.
                    </div>
                )}
                {items.map((item) => (
                    <article
                        key={item.id}
                        className="rounded-xl border bg-muted/15 p-4"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="font-medium capitalize">
                                {item.category.replaceAll('_', ' ')}
                            </p>
                            <div
                                className="flex items-center gap-1 text-amber-500"
                                aria-label={`${item.rating} out of 5`}
                            >
                                {Array.from({ length: 5 }, (_, index) => (
                                    <Star
                                        key={index}
                                        className={`size-3.5 ${index < item.rating ? 'fill-current' : ''}`}
                                    />
                                ))}
                            </div>
                        </div>
                        <p className="mt-2 text-sm text-muted-foreground">
                            {item.comments}
                        </p>
                        <p className="mt-3 text-xs text-muted-foreground">
                            {item.supervisorName} ·{' '}
                            {new Date(item.createdAt).toLocaleDateString()}{' '}
                            {item.sharedWithSchool
                                ? '· Shared with school'
                                : ''}
                        </p>
                    </article>
                ))}
            </div>
            {canAdd && (
                <Form
                    {...storeFeedback.form(ojt.id)}
                    resetOnSuccess
                    className="mt-5 grid gap-3 border-t pt-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <select
                                    name="category"
                                    required
                                    defaultValue="progress"
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                >
                                    <option value="progress">Progress</option>
                                    <option value="attendance">
                                        Attendance
                                    </option>
                                    <option value="professionalism">
                                        Professionalism
                                    </option>
                                    <option value="communication">
                                        Communication
                                    </option>
                                    <option value="technical_skills">
                                        Technical skills
                                    </option>
                                </select>
                                <select
                                    name="rating"
                                    required
                                    defaultValue="4"
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                >
                                    {[5, 4, 3, 2, 1].map((rating) => (
                                        <option value={rating} key={rating}>
                                            {rating} / 5
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <textarea
                                name="comments"
                                required
                                rows={3}
                                maxLength={2000}
                                placeholder="Give specific, constructive feedback."
                                className="rounded-md border bg-background px-3 py-2 text-sm"
                            />
                            <label className="flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    name="shared_with_school"
                                    value="1"
                                    defaultChecked
                                />{' '}
                                Share with the assigned school coordinator
                            </label>
                            <InputError
                                message={errors.comments ?? errors.rating}
                            />
                            <Button
                                type="submit"
                                disabled={processing}
                                className="w-fit"
                            >
                                {processing ? <Spinner /> : <Plus />} Add
                                feedback
                            </Button>
                        </>
                    )}
                </Form>
            )}
        </section>
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
