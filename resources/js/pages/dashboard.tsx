import { Form, Head, Link, usePage } from '@inertiajs/react';
import {
    BriefcaseBusiness,
    CalendarDays,
    Clock3,
    GraduationCap,
    ListChecks,
    MessageCircle,
} from 'lucide-react';
import { updateStatus } from '@/actions/App/Http/Controllers/SupervisorTaskController';
import { DashboardHero, MetricCard } from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { show as showMessages } from '@/routes/messages';
import type { User } from '@/types';

type Task = {
    id: number;
    title: string;
    description: string | null;
    status: 'not_started' | 'ongoing' | 'finished';
    dueDate: string | null;
};

export default function Dashboard({
    supervisor,
    tasks = [],
}: {
    supervisor?: { id: number; name: string } | null;
    tasks?: Task[];
}) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const user = auth.user;
    const isComplete = user.end_date !== null;

    return (
        <>
            <Head title="Dashboard" />

            <div className="flex flex-1 flex-col gap-6 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_48%)] p-4 md:p-6">
                <DashboardHero
                    eyebrow="OJT workspace"
                    title={`Good day, ${user.name}`}
                    description={
                        isComplete
                            ? 'You have completed your required OJT hours. Your internship record is ready for review.'
                            : 'Your internship is active. Record your daily attendance and work reports to keep your progress up to date.'
                    }
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            {supervisor && (
                                <Button variant="outline" asChild>
                                    <Link href={showMessages(supervisor.id)}>
                                        <MessageCircle />
                                        Message supervisor
                                    </Link>
                                </Button>
                            )}
                            <Badge
                                variant={isComplete ? 'default' : 'secondary'}
                                className="px-3 py-1"
                            >
                                {isComplete
                                    ? 'Internship completed'
                                    : 'Internship in progress'}
                            </Badge>
                        </div>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        icon={GraduationCap}
                        label="Student ID"
                        value={user.student_id}
                    />
                    <MetricCard
                        icon={Clock3}
                        label="Required hours"
                        value={`${user.required_hours} hrs`}
                        detail="Tracked from completed reports"
                    />
                    <MetricCard
                        icon={CalendarDays}
                        label="Start date"
                        value={formatDate(user.start_date)}
                    />
                    <MetricCard
                        icon={BriefcaseBusiness}
                        label="OJT status"
                        value={isComplete ? 'Complete' : 'Active'}
                        accent={isComplete ? 'success' : 'primary'}
                    />
                </div>

                <section className="relative overflow-hidden rounded-3xl border bg-card/90 p-5 shadow-[0_18px_50px_-30px_rgb(0_0_0_/_0.55)] sm:p-6">
                    <div className="absolute top-0 left-0 h-20 w-1 bg-linear-to-b from-primary via-primary/35 to-transparent" />
                    <div className="flex flex-col gap-1 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold">
                                Internship details
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Your assigned academic and workplace
                                information.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <Detail label="Program" value={user.program} />
                        <Detail
                            label="Year level"
                            value={`Year ${user.year}`}
                        />
                        <Detail label="Company" value={user.company} />
                        <Detail label="Department" value={user.department} />
                        <Detail label="Position" value={user.position} />
                        <Detail
                            label="Completion date"
                            value={
                                user.end_date === null
                                    ? 'Set automatically after required hours'
                                    : formatDate(user.end_date)
                            }
                        />
                    </div>
                </section>

                <section className="rounded-3xl border bg-card/90 p-5 shadow-sm sm:p-6">
                    <div className="flex items-start justify-between gap-4 border-b pb-5">
                        <div>
                            <p className="flex items-center gap-2 text-sm font-semibold">
                                <ListChecks className="size-4 text-primary" />
                                Assigned tasks
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {supervisor
                                    ? `Tasks from ${supervisor.name}. Keep your status current so your supervisor can track progress.`
                                    : 'Your administrator has not assigned a supervisor yet.'}
                            </p>
                        </div>
                        <Badge variant="secondary">{tasks.length} total</Badge>
                    </div>
                    {tasks.length === 0 ? (
                        <p className="mt-5 rounded-xl border border-dashed p-5 text-sm text-muted-foreground">
                            No tasks have been assigned yet.
                        </p>
                    ) : (
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {tasks.map((task) => (
                                <article
                                    key={task.id}
                                    className="rounded-xl border bg-muted/20 p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <p className="font-semibold">
                                            {task.title}
                                        </p>
                                        <Badge
                                            variant={
                                                task.status === 'finished'
                                                    ? 'default'
                                                    : 'secondary'
                                            }
                                        >
                                            {formatStatus(task.status)}
                                        </Badge>
                                    </div>
                                    {task.description && (
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {task.description}
                                        </p>
                                    )}
                                    {task.dueDate && (
                                        <p className="mt-3 text-xs text-muted-foreground">
                                            Due {formatDate(task.dueDate)}
                                        </p>
                                    )}
                                    <Form
                                        {...updateStatus.form(task.id)}
                                        className="mt-4 flex flex-wrap gap-2"
                                    >
                                        {({ processing }) => (
                                            <>
                                                {(
                                                    [
                                                        'not_started',
                                                        'ongoing',
                                                        'finished',
                                                    ] as const
                                                ).map((status) => (
                                                    <Button
                                                        key={status}
                                                        type="submit"
                                                        name="status"
                                                        value={status}
                                                        size="sm"
                                                        variant={
                                                            task.status ===
                                                            status
                                                                ? 'default'
                                                                : 'outline'
                                                        }
                                                        disabled={processing}
                                                    >
                                                        {formatStatus(status)}
                                                    </Button>
                                                ))}
                                            </>
                                        )}
                                    </Form>
                                </article>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function formatStatus(status: Task['status']): string {
    return status === 'not_started'
        ? 'Not started'
        : status === 'ongoing'
          ? 'Ongoing'
          : 'Finished';
}

function Detail({ label, value }: { label: string; value: string | null }) {
    return (
        <div className="rounded-xl border border-border/80 bg-muted/30 p-4 transition-colors hover:border-primary/25 hover:bg-primary/4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                {label}
            </p>
            <p className="mt-2 text-sm font-semibold">{value ?? 'Not set'}</p>
        </div>
    );
}

function formatDate(date: string | null): string {
    if (date === null) {
        return 'Not set';
    }

    return new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
    }).format(new Date(`${date.slice(0, 10)}T00:00:00`));
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Dashboard',
            href: dashboard(),
        },
    ],
};
