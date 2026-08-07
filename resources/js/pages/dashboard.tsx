import { Form, Head, Link, usePage, usePoll } from '@inertiajs/react';
import {
    ArrowRight,
    BriefcaseBusiness,
    CalendarDays,
    CheckCircle2,
    Clock3,
    GraduationCap,
    ListChecks,
    MessageCircle,
    Play,
} from 'lucide-react';
import { timeIn } from '@/actions/App/Http/Controllers/DailyReportController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { show as showMessages } from '@/routes/messages';
import { index as reportsIndex } from '@/routes/reports';
import { index as tasksIndex } from '@/routes/tasks';
import type { User } from '@/types';

type Task = {
    id: number;
    title: string;
    description: string | null;
    status: 'not_started' | 'ongoing' | 'finished';
    dueDate: string | null;
};

type Today = {
    status: 'not_started' | 'timed_in' | 'summary_due' | 'submitted';
    timeIn: string | null;
    timeOut: string | null;
    approvalStatus: 'pending' | 'approved' | 'rejected' | null;
};

type Progress = {
    approvedHours: number;
    requiredHours: number;
    remainingHours: number;
    percentage: number;
};

type TaskSummary = {
    notStarted: number;
    ongoing: number;
    finished: number;
};

type Props = {
    supervisor?: {
        id: number;
        name: string;
        isOnline: boolean;
        lastSeenAt: string | null;
    } | null;
    today: Today;
    progress: Progress;
    taskSummary: TaskSummary;
    tasks?: Task[];
};

export default function Dashboard({
    supervisor,
    today,
    progress,
    taskSummary,
    tasks = [],
}: Props) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const user = auth.user;
    const isComplete = user.end_date !== null;

    usePoll(15_000, { only: ['supervisor', 'today'] }, { mode: 'rest' });

    return (
        <>
            <Head title="Home" />

            <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_42%)] p-4 sm:p-6">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
                    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                                OJT home
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Good day, {firstName(user.name)}
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                                Here is what you need to do today.
                            </p>
                        </div>
                        <Badge
                            variant={isComplete ? 'default' : 'secondary'}
                            className="w-fit px-3 py-1"
                        >
                            {isComplete ? 'OJT completed' : 'OJT in progress'}
                        </Badge>
                    </header>

                    <div className="grid items-stretch gap-5 lg:grid-cols-[1.35fr_0.65fr]">
                        <TodayCard today={today} isComplete={isComplete} />
                        <ProgressCard progress={progress} />
                    </div>

                    <div className="grid items-start gap-5 lg:grid-cols-[1.35fr_0.65fr]">
                        <section className="overflow-hidden rounded-3xl border bg-card/90 shadow-sm">
                            <div className="flex items-center justify-between gap-3 border-b px-5 py-4 sm:px-6">
                                <div>
                                    <h2 className="flex items-center gap-2 font-semibold">
                                        <ListChecks className="size-4 text-primary" />
                                        Current tasks
                                    </h2>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Focus on what is waiting or already in
                                        progress.
                                    </p>
                                </div>
                                <Button variant="ghost" size="sm" asChild>
                                    <Link href={tasksIndex()}>
                                        View all
                                        <ArrowRight />
                                    </Link>
                                </Button>
                            </div>

                            <div className="grid gap-3 p-4 sm:p-5">
                                {tasks.length === 0 ? (
                                    <div className="rounded-2xl border border-dashed p-6 text-center">
                                        <CheckCircle2 className="mx-auto size-7 text-primary" />
                                        <p className="mt-2 text-sm font-medium">
                                            You are all caught up
                                        </p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            New assignments from your supervisor
                                            will appear here.
                                        </p>
                                    </div>
                                ) : (
                                    tasks.map((task) => (
                                        <Link
                                            key={task.id}
                                            href={tasksIndex()}
                                            className="flex items-start gap-3 rounded-2xl border bg-background/70 p-4 transition-colors hover:border-primary/25 hover:bg-primary/4"
                                        >
                                            <span
                                                className={`mt-0.5 size-2.5 shrink-0 rounded-full ${task.status === 'ongoing' ? 'bg-primary' : 'bg-amber-500'}`}
                                            />
                                            <span className="min-w-0 flex-1">
                                                <span className="block font-medium">
                                                    {task.title}
                                                </span>
                                                <span className="mt-1 block text-xs text-muted-foreground">
                                                    {task.status === 'ongoing'
                                                        ? 'Ongoing'
                                                        : 'Not started'}
                                                    {task.dueDate
                                                        ? ` · Due ${formatDate(task.dueDate)}`
                                                        : ''}
                                                </span>
                                            </span>
                                            <ArrowRight className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                                        </Link>
                                    ))
                                )}
                            </div>

                            <div className="grid grid-cols-3 border-t bg-muted/20">
                                <TaskCount
                                    value={taskSummary.notStarted}
                                    label="Waiting"
                                />
                                <TaskCount
                                    value={taskSummary.ongoing}
                                    label="Ongoing"
                                />
                                <TaskCount
                                    value={taskSummary.finished}
                                    label="Finished"
                                />
                            </div>
                        </section>

                        <div className="grid gap-5">
                            <SupervisorCard supervisor={supervisor} />

                            <section className="rounded-3xl border bg-card/90 p-5 shadow-sm">
                                <h2 className="flex items-center gap-2 font-semibold">
                                    <BriefcaseBusiness className="size-4 text-primary" />
                                    Your placement
                                </h2>
                                <dl className="mt-4 grid gap-3 text-sm">
                                    <Detail
                                        label="Student ID"
                                        value={user.student_id}
                                    />
                                    <Detail
                                        label="Position"
                                        value={user.position}
                                    />
                                    <Detail
                                        label="Department"
                                        value={user.department}
                                    />
                                    <Detail
                                        label="Company"
                                        value={user.company}
                                    />
                                </dl>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}

function TodayCard({
    today,
    isComplete,
}: {
    today: Today;
    isComplete: boolean;
}) {
    const content = todayContent(today, isComplete);

    return (
        <section className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-5 shadow-[0_24px_70px_-42px_color-mix(in_oklab,var(--primary)_65%,transparent)] sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-primary via-emerald-400 to-transparent" />
            <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary sm:size-14">
                    <content.icon className="size-6" />
                </span>
                <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                        Today
                    </p>
                    <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
                        {content.title}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                        {content.description}
                    </p>

                    {(today.timeIn || today.timeOut) && (
                        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
                            {today.timeIn && (
                                <span className="rounded-full bg-muted px-3 py-1.5">
                                    Time in · {formatTime(today.timeIn)}
                                </span>
                            )}
                            {today.timeOut && (
                                <span className="rounded-full bg-muted px-3 py-1.5">
                                    Time out · {formatTime(today.timeOut)}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="mt-5">
                        {today.status === 'not_started' && !isComplete ? (
                            <Form {...timeIn.form()}>
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        size="lg"
                                        disabled={processing}
                                        className="w-full sm:w-auto"
                                    >
                                        {processing ? <Spinner /> : <Play />}
                                        {processing
                                            ? 'Recording time…'
                                            : 'Time in now'}
                                    </Button>
                                )}
                            </Form>
                        ) : (
                            <Button
                                size="lg"
                                asChild
                                className="w-full sm:w-auto"
                            >
                                <Link href={reportsIndex()}>
                                    {content.action}
                                    <ArrowRight />
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}

function ProgressCard({ progress }: { progress: Progress }) {
    return (
        <section className="rounded-3xl border bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
                <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <Clock3 className="size-5" />
                </span>
                <span className="text-sm font-semibold text-primary">
                    {progress.percentage}%
                </span>
            </div>
            <p className="mt-5 text-sm text-muted-foreground">
                Hours remaining
            </p>
            <p className="mt-1 text-3xl font-semibold tracking-tight">
                {formatHours(progress.remainingHours)}
            </p>
            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-linear-to-r from-primary to-emerald-400 transition-[width]"
                    style={{ width: `${progress.percentage}%` }}
                />
            </div>
            <p className="mt-3 text-xs text-muted-foreground">
                {formatHours(progress.approvedHours)} approved of{' '}
                {formatHours(progress.requiredHours)} required
            </p>
        </section>
    );
}

function SupervisorCard({ supervisor }: Pick<Props, 'supervisor'>) {
    return (
        <section className="rounded-3xl border bg-card/90 p-5 shadow-sm">
            <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Your supervisor
            </p>
            {supervisor ? (
                <>
                    <div className="mt-3 flex items-center gap-3">
                        <span className="relative grid size-11 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                            {initials(supervisor.name)}
                            <span
                                className={`absolute right-0 bottom-0 size-3 rounded-full border-2 border-card ${supervisor.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/45'}`}
                            />
                        </span>
                        <div className="min-w-0">
                            <p className="truncate font-semibold">
                                {supervisor.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                                {supervisor.isOnline ? 'Online now' : 'Offline'}
                            </p>
                        </div>
                    </div>
                    <Button variant="outline" className="mt-4 w-full" asChild>
                        <Link href={showMessages(supervisor.id)}>
                            <MessageCircle />
                            Send a message
                        </Link>
                    </Button>
                </>
            ) : (
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    A supervisor has not been assigned yet. Your company
                    administrator will connect one to your account.
                </p>
            )}
        </section>
    );
}

function TaskCount({ value, label }: { value: number; label: string }) {
    return (
        <div className="border-r px-2 py-3 text-center last:border-r-0">
            <p className="font-semibold">{value}</p>
            <p className="text-[11px] text-muted-foreground">{label}</p>
        </div>
    );
}

function Detail({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="flex items-start justify-between gap-4 border-b pb-3 last:border-b-0 last:pb-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="max-w-[60%] text-right font-medium">
                {value ?? 'Not set'}
            </dd>
        </div>
    );
}

function todayContent(today: Today, isComplete: boolean) {
    if (isComplete) {
        return {
            icon: GraduationCap,
            title: 'Your required hours are complete',
            description:
                'Your approved attendance has reached the required OJT hours. You can review or print your records anytime.',
            action: 'View completed reports',
        };
    }

    if (today.status === 'timed_in') {
        return {
            icon: Clock3,
            title: 'You are currently timed in',
            description:
                'Continue your assigned work. When your workday ends, open attendance and record your time out.',
            action: 'Open attendance',
        };
    }

    if (today.status === 'summary_due') {
        return {
            icon: ListChecks,
            title: 'Add today’s work summary',
            description:
                'Your time out is recorded. Describe the work you completed to finish today’s report.',
            action: 'Write work summary',
        };
    }

    if (today.status === 'submitted') {
        return {
            icon: CheckCircle2,
            title:
                today.approvalStatus === 'approved'
                    ? 'Today’s report is approved'
                    : today.approvalStatus === 'rejected'
                      ? 'Today’s report needs changes'
                      : 'Today’s report is submitted',
            description:
                today.approvalStatus === 'rejected'
                    ? 'Review the administrator’s feedback and correct your report.'
                    : 'Your attendance and daily work summary are safely recorded.',
            action: 'View today’s report',
        };
    }

    return {
        icon: CalendarDays,
        title: 'Ready to begin your workday?',
        description:
            'Tap Time in when you arrive. The system will record the current time automatically.',
        action: 'Open attendance',
    };
}

function firstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
        new Date(`${date.slice(0, 10)}T00:00:00`),
    );
}

function formatTime(time: string): string {
    return new Intl.DateTimeFormat('en', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(`2000-01-01T${time}`));
}

function formatHours(hours: number): string {
    return `${new Intl.NumberFormat('en', { maximumFractionDigits: 2 }).format(hours)} hrs`;
}

Dashboard.layout = {
    breadcrumbs: [{ title: 'Home', href: dashboard() }],
};
