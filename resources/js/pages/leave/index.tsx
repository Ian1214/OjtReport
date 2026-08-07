import { Form, Head } from '@inertiajs/react';
import { CalendarDays, CheckCircle2, Clock3, Plus, Trash2 } from 'lucide-react';
import {
    destroy as destroyHoliday,
    store as storeHoliday,
} from '@/actions/App/Http/Controllers/Company/CompanyHolidayController';
import {
    review,
    store,
} from '@/actions/App/Http/Controllers/LeaveRequestController';
import { DashboardHero } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { index } from '@/routes/leave';

type Leave = {
    id: number;
    type: string;
    startDate: string;
    endDate: string;
    reason: string;
    status: string;
    ojtName: string;
    studentId: string | null;
    supervisorName: string | null;
    supervisorComment: string | null;
    adminComment: string | null;
};

type Props = {
    role: 'company_admin' | 'supervisor' | 'ojt';
    requests: { data: Leave[] };
    holidays: { id: number; date: string; name: string }[];
};

export default function LeaveIndex({ role, requests, holidays }: Props) {
    return (
        <>
            <Head title="Leave & work calendar" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Attendance planning"
                    title="Leave & work calendar"
                    description={
                        role === 'ojt'
                            ? 'Request time away and check company non-working days before planning attendance.'
                            : 'Review OJT requests and keep the company work calendar accurate.'
                    }
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(19rem,.6fr)]">
                    <section className="grid gap-4">
                        {role === 'ojt' && <LeaveForm />}
                        <div className="rounded-2xl border bg-card p-4 shadow-sm sm:p-6">
                            <div className="flex items-center gap-3">
                                <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                    <Clock3 className="size-5" />
                                </div>
                                <div>
                                    <h2 className="font-semibold">Requests</h2>
                                    <p className="text-sm text-muted-foreground">
                                        Supervisor review is followed by final
                                        administrator approval.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-5 grid gap-3">
                                {requests.data.length === 0 && (
                                    <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                        No leave requests yet.
                                    </p>
                                )}
                                {requests.data.map((leave) => (
                                    <LeaveCard
                                        key={leave.id}
                                        leave={leave}
                                        role={role}
                                    />
                                ))}
                            </div>
                        </div>
                    </section>

                    <aside className="h-fit rounded-2xl border bg-card p-5 shadow-sm">
                        <div className="flex items-center gap-3">
                            <CalendarDays className="size-5 text-primary" />
                            <h2 className="font-semibold">Company holidays</h2>
                        </div>
                        {role === 'company_admin' && (
                            <Form
                                {...storeHoliday.form()}
                                className="mt-5 grid gap-3"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="grid gap-2">
                                            <Label htmlFor="holiday_date">
                                                Date
                                            </Label>
                                            <Input
                                                id="holiday_date"
                                                name="holiday_date"
                                                type="date"
                                                required
                                            />
                                            <InputError
                                                message={errors.holiday_date}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="holiday_name">
                                                Holiday name
                                            </Label>
                                            <Input
                                                id="holiday_name"
                                                name="name"
                                                required
                                                maxLength={150}
                                            />
                                            <InputError message={errors.name} />
                                        </div>
                                        <Button disabled={processing}>
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <Plus />
                                            )}{' '}
                                            Add holiday
                                        </Button>
                                    </>
                                )}
                            </Form>
                        )}
                        <div className="mt-5 grid gap-2">
                            {holidays.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No company holidays configured.
                                </p>
                            )}
                            {holidays.map((holiday) => (
                                <div
                                    key={holiday.id}
                                    className="flex items-center gap-3 rounded-xl border p-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium">
                                            {holiday.name}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatDate(holiday.date)}
                                        </p>
                                    </div>
                                    {role === 'company_admin' && (
                                        <Form
                                            {...destroyHoliday.form(holiday.id)}
                                        >
                                            <Button
                                                type="submit"
                                                size="icon"
                                                variant="ghost"
                                                aria-label={`Remove ${holiday.name}`}
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </Form>
                                    )}
                                </div>
                            ))}
                        </div>
                    </aside>
                </div>
            </div>
        </>
    );
}

function LeaveForm() {
    return (
        <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
            <h2 className="font-semibold">Request time away</h2>
            <Form {...store.form()} resetOnSuccess className="mt-5 grid gap-4">
                {({ errors, processing }) => (
                    <>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="grid gap-2">
                                <Label htmlFor="type">Request type</Label>
                                <select
                                    id="type"
                                    name="type"
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                    defaultValue="leave"
                                >
                                    <option value="leave">
                                        Personal leave
                                    </option>
                                    <option value="sick">Sick leave</option>
                                    <option value="official_business">
                                        Official business
                                    </option>
                                </select>
                                <InputError message={errors.type} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="start_date">Start date</Label>
                                <Input
                                    id="start_date"
                                    name="start_date"
                                    type="date"
                                    required
                                />
                                <InputError message={errors.start_date} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="end_date">End date</Label>
                                <Input
                                    id="end_date"
                                    name="end_date"
                                    type="date"
                                    required
                                />
                                <InputError message={errors.end_date} />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="leave_reason">Reason</Label>
                            <textarea
                                id="leave_reason"
                                name="reason"
                                required
                                minLength={10}
                                maxLength={2000}
                                className="min-h-28 rounded-xl border bg-background p-3 text-sm"
                                placeholder="Briefly explain why you need this leave."
                            />
                            <InputError message={errors.reason} />
                        </div>
                        <Button className="w-fit" disabled={processing}>
                            {processing ? <Spinner /> : <CheckCircle2 />} Submit
                            request
                        </Button>
                    </>
                )}
            </Form>
        </section>
    );
}

function LeaveCard({ leave, role }: { leave: Leave; role: Props['role'] }) {
    const canReview =
        (role === 'supervisor' && leave.status === 'pending_supervisor') ||
        (role === 'company_admin' && leave.status === 'pending_admin');

    return (
        <article className="rounded-xl border p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h3 className="font-medium">
                        {role === 'ojt' ? labelType(leave.type) : leave.ojtName}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {formatDate(leave.startDate)} –{' '}
                        {formatDate(leave.endDate)}
                        {role !== 'ojt' && ` · ${labelType(leave.type)}`}
                    </p>
                </div>
                <Badge variant="outline">{labelStatus(leave.status)}</Badge>
            </div>
            <p className="mt-3 text-sm leading-6">{leave.reason}</p>
            {(leave.supervisorComment || leave.adminComment) && (
                <p className="mt-3 rounded-lg bg-muted p-3 text-sm text-muted-foreground">
                    {leave.adminComment ?? leave.supervisorComment}
                </p>
            )}
            {canReview && (
                <Form
                    {...review.form(leave.id)}
                    className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto_auto]"
                >
                    {({ errors, processing }) => (
                        <>
                            <div>
                                <Input
                                    name="comment"
                                    placeholder="Comment (required when rejecting)"
                                />
                                <InputError message={errors.comment} />
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
const labelType = (type: string) =>
    ({
        leave: 'Personal leave',
        sick: 'Sick leave',
        official_business: 'Official business',
    })[type] ?? type;
const labelStatus = (status: string) =>
    ({
        pending_supervisor: 'Awaiting supervisor',
        pending_admin: 'Awaiting administrator',
        approved: 'Approved',
        rejected: 'Rejected',
    })[status] ?? status;

LeaveIndex.layout = {
    breadcrumbs: [{ title: 'Leave & work calendar', href: index() }],
};
