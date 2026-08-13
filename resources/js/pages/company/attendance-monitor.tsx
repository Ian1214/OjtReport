import { Head, Link, router, usePoll } from '@inertiajs/react';
import {
    AlertTriangle,
    CheckCircle2,
    Download,
    Radio,
    RotateCcw,
    Search,
    UserRoundX,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { DashboardHero, MetricCard } from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    exportMethod as exportAttendance,
    index as attendanceMonitor,
} from '@/routes/company/attendance-monitor';
import { show as showOjt } from '@/routes/company/ojts';

type AttendanceState = 'absent' | 'timed_in' | 'summary_due' | 'completed';
type Punctuality = 'on_time' | 'late' | null;

type OjtAttendance = {
    id: number;
    name: string;
    studentId: string | null;
    department: string | null;
    position: string | null;
    supervisorName: string | null;
    state: AttendanceState;
    punctuality: Punctuality;
    timeIn: string | null;
    timeOut: string | null;
    totalHours: number;
    approvalStatus: 'pending' | 'approved' | 'rejected' | null;
    lateMinutes: number;
    approvedHours: number;
    requiredHours: number;
    remainingHours: number;
    missingTimeOutCount: number;
    isOnline: boolean;
};

type Props = {
    companyName: string;
    date: string;
    timezone: string;
    filters: {
        search: string;
        status: string;
        supervisorId: string;
    };
    stats: {
        total: number;
        present: number;
        absent: number;
        timedIn: number;
        completed: number;
        onTime: number;
        late: number;
        missingTimeOut: number;
    };
    ojts: {
        data: OjtAttendance[];
        total: number;
        from: number | null;
        to: number | null;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    supervisors: Array<{ id: number; name: string }>;
};

export default function AttendanceMonitor({
    companyName,
    date,
    timezone,
    filters,
    stats,
    ojts,
    supervisors,
}: Props) {
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [supervisorId, setSupervisorId] = useState(filters.supervisorId);
    const [selectedDate, setSelectedDate] = useState(date);

    usePoll(15_000, { only: ['stats', 'ojts'] }, { mode: 'rest' });

    const query = {
        search: search || undefined,
        status: status === 'all' ? undefined : status,
        supervisor_id: supervisorId || undefined,
        date: selectedDate,
    };

    function applyFilters(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        router.get(
            attendanceMonitor.url({ query }),
            {},
            {
                preserveState: true,
                replace: true,
            },
        );
    }

    return (
        <>
            <Head title="Attendance monitor" />
            <div className="flex flex-1 flex-col gap-6 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_44%)] p-4 sm:p-6">
                <DashboardHero
                    eyebrow={`${companyName} · Live attendance`}
                    title="Attendance monitoring center"
                    description={`Monitor daily attendance, punctuality, completed hours, and missing time-outs. Times follow ${timezone}.`}
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Badge variant="secondary" className="gap-1.5">
                                <span className="status-pulse size-2 rounded-full bg-emerald-500" />
                                Refreshes every 15 seconds
                            </Badge>
                            <Button variant="outline" asChild>
                                <a href={exportAttendance.url({ query })}>
                                    <Download />
                                    Export CSV
                                </a>
                            </Button>
                        </div>
                    }
                />

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        icon={UsersRound}
                        label="Present"
                        value={stats.present}
                        detail={`${stats.total} managed OJTs`}
                        accent="success"
                    />
                    <MetricCard
                        icon={Radio}
                        label="Currently timed in"
                        value={stats.timedIn}
                        detail={`${stats.completed} finished attendance`}
                    />
                    <MetricCard
                        icon={CheckCircle2}
                        label="On time"
                        value={stats.onTime}
                        detail={`${stats.late} late arrivals`}
                        accent="success"
                    />
                    <MetricCard
                        icon={AlertTriangle}
                        label="Needs attention"
                        value={stats.absent + stats.missingTimeOut}
                        detail={`${stats.absent} absent · ${stats.missingTimeOut} missing time-outs`}
                    />
                </section>

                <Card className="rounded-3xl border-primary/10 bg-card/90">
                    <CardHeader>
                        <CardTitle className="text-lg">
                            Find attendance
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form
                            onSubmit={applyFilters}
                            className="grid gap-4 lg:grid-cols-5"
                        >
                            <div className="grid gap-2 lg:col-span-2">
                                <Label htmlFor="attendance-search">
                                    OJT name or student ID
                                </Label>
                                <Input
                                    id="attendance-search"
                                    value={search}
                                    onChange={(event) =>
                                        setSearch(event.target.value)
                                    }
                                    placeholder="Search OJTs"
                                />
                            </div>
                            <FilterSelect
                                id="attendance-status"
                                label="Attendance status"
                                value={status}
                                onChange={setStatus}
                                options={[
                                    ['all', 'All statuses'],
                                    ['timed_in', 'Currently timed in'],
                                    ['completed', 'Completed attendance'],
                                    ['on_time', 'On time'],
                                    ['late', 'Late'],
                                    ['absent', 'Absent'],
                                ]}
                            />
                            <FilterSelect
                                id="attendance-supervisor"
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
                            <div className="grid gap-2">
                                <Label htmlFor="attendance-date">Date</Label>
                                <Input
                                    id="attendance-date"
                                    type="date"
                                    max={todayDate()}
                                    value={selectedDate}
                                    onChange={(event) =>
                                        setSelectedDate(event.target.value)
                                    }
                                />
                            </div>
                            <div className="flex flex-wrap gap-2 lg:col-span-5 lg:justify-end">
                                <Button variant="outline" asChild>
                                    <Link href={attendanceMonitor()}>
                                        <RotateCcw /> Reset
                                    </Link>
                                </Button>
                                <Button type="submit">
                                    <Search /> Apply filters
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>

                <section className="overflow-hidden rounded-3xl border bg-card/90 shadow-sm">
                    <div className="flex flex-col gap-1 border-b p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
                        <div>
                            <h2 className="text-lg font-semibold">
                                Attendance for {formatDate(date)}
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Showing {ojts.from ?? 0}–{ojts.to ?? 0} of{' '}
                                {ojts.total} OJTs
                            </p>
                        </div>
                    </div>

                    {ojts.data.length === 0 ? (
                        <div className="grid place-items-center gap-2 p-12 text-center">
                            <UserRoundX className="size-9 text-muted-foreground" />
                            <p className="font-medium">No matching OJTs</p>
                            <p className="text-sm text-muted-foreground">
                                Try changing the date or filters.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {ojts.data.map((ojt) => (
                                <AttendanceRow key={ojt.id} ojt={ojt} />
                            ))}
                        </div>
                    )}

                    {(ojts.prev_page_url || ojts.next_page_url) && (
                        <div className="flex items-center justify-between gap-3 border-t p-4">
                            <PaginationButton href={ojts.prev_page_url}>
                                Previous
                            </PaginationButton>
                            <PaginationButton href={ojts.next_page_url}>
                                Next
                            </PaginationButton>
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function AttendanceRow({ ojt }: { ojt: OjtAttendance }) {
    const progress =
        ojt.requiredHours > 0
            ? Math.min(100, (ojt.approvedHours / ojt.requiredHours) * 100)
            : 0;

    return (
        <article className="grid gap-4 p-5 transition-colors hover:bg-muted/20 sm:p-6 lg:grid-cols-[minmax(14rem,1.2fr)_minmax(12rem,.8fr)_minmax(15rem,1fr)_auto] lg:items-center">
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                    <Link
                        href={showOjt(ojt.id)}
                        className="truncate font-semibold hover:text-primary hover:underline"
                    >
                        {ojt.name}
                    </Link>
                    <span
                        className={`size-2 rounded-full ${ojt.isOnline ? 'bg-emerald-500 shadow-[0_0_10px_rgb(16_185_129/.7)]' : 'bg-muted-foreground/35'}`}
                        title={ojt.isOnline ? 'Online' : 'Offline'}
                    />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                    {ojt.studentId ?? 'No student ID'} ·{' '}
                    {ojt.position ?? 'No position'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                    Supervisor: {ojt.supervisorName ?? 'Not assigned'}
                </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <StateBadge state={ojt.state} />
                {ojt.punctuality && (
                    <PunctualityBadge
                        status={ojt.punctuality}
                        minutes={ojt.lateMinutes}
                    />
                )}
                {ojt.approvalStatus && (
                    <Badge variant="outline" className="capitalize">
                        {ojt.approvalStatus === 'rejected'
                            ? 'Needs changes'
                            : ojt.approvalStatus}
                    </Badge>
                )}
            </div>

            <div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm">
                    <span>
                        <span className="text-muted-foreground">In</span>{' '}
                        {formatTime(ojt.timeIn)}
                    </span>
                    <span>
                        <span className="text-muted-foreground">Out</span>{' '}
                        {formatTime(ojt.timeOut)}
                    </span>
                    <span>
                        <span className="text-muted-foreground">Today</span>{' '}
                        {ojt.totalHours.toFixed(2)}h
                    </span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="mt-1.5 text-xs text-muted-foreground">
                    {ojt.approvedHours.toFixed(2)}h approved ·{' '}
                    {ojt.remainingHours.toFixed(2)}h remaining
                </p>
            </div>

            <div className="lg:text-right">
                {ojt.missingTimeOutCount > 0 ? (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-300">
                        <AlertTriangle className="size-3.5" />{' '}
                        {ojt.missingTimeOutCount} missing time-out
                        {ojt.missingTimeOutCount === 1 ? '' : 's'}
                    </span>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        Records complete
                    </span>
                )}
            </div>
        </article>
    );
}

function StateBadge({ state }: { state: AttendanceState }) {
    const styles: Record<AttendanceState, string> = {
        absent: 'border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300',
        timed_in: 'border-primary/25 bg-primary/10 text-primary',
        summary_due:
            'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        completed:
            'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    };
    const labels: Record<AttendanceState, string> = {
        absent: 'Absent',
        timed_in: 'Timed in',
        summary_due: 'Summary due',
        completed: 'Completed',
    };

    return (
        <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[state]}`}
        >
            {labels[state]}
        </span>
    );
}

function PunctualityBadge({
    status,
    minutes,
}: {
    status: Exclude<Punctuality, null>;
    minutes: number;
}) {
    return status === 'late' ? (
        <span className="inline-flex rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-xs font-semibold text-red-700 dark:text-red-300">
            Late{minutes > 0 ? ` · ${minutes}m` : ''}
        </span>
    ) : (
        <span className="inline-flex rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300">
            On time
        </span>
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
                className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
                {options.map(([optionValue, optionLabel]) => (
                    <option key={optionValue || 'all'} value={optionValue}>
                        {optionLabel}
                    </option>
                ))}
            </select>
        </div>
    );
}

function PaginationButton({
    href,
    children,
}: {
    href: string | null;
    children: string;
}) {
    return href ? (
        <Button variant="outline" asChild>
            <Link href={href}>{children}</Link>
        </Button>
    ) : (
        <Button variant="outline" disabled>
            {children}
        </Button>
    );
}

function formatTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    const [hours, minutes] = value.split(':').map(Number);

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(2000, 0, 1, hours, minutes));
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'long',
        timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00Z`));
}

function todayDate(): string {
    const now = new Date();

    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}
