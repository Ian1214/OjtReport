import { Head, Link, usePage } from '@inertiajs/react';
import {
    ArrowRight,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    Clock8,
    FileClock,
    History,
    UserPlus,
    Users,
    CalendarDays,
    FileCheck2,
    ServerCog,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { index as attendanceCorrections } from '@/routes/attendance-corrections';
import { index as activityLogs } from '@/routes/company/activity-logs';
import { index as approvalInbox } from '@/routes/company/approvals';
import { edit as attendancePolicy } from '@/routes/company/attendance-policy';
import { index as managedOjtsIndex } from '@/routes/company/ojts';
import { index as operationsIndex } from '@/routes/company/operations';
import { index as dtrSubmissionsIndex } from '@/routes/dtr-submissions';
import { index as leaveIndex } from '@/routes/leave';

type Props = {
    company: { name: string };
    stats: {
        totalOjtCount: number;
        activeOjtCount: number;
        completedOjtCount: number;
    };
};

export default function CompanyOverview({ company, stats }: Props) {
    const { navigation } = usePage<{
        navigation: {
            pendingReportsCount: number;
            pendingCorrectionsCount: number;
        };
    }>().props;
    const needsAttention =
        navigation.pendingReportsCount + navigation.pendingCorrectionsCount;

    return (
        <>
            <Head title={`${company.name} overview`} />

            <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_44%)] p-4 sm:p-6">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-5">
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                                Company overview
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Welcome back
                            </h1>
                            <p className="mt-2 text-sm text-muted-foreground sm:text-base">
                                Manage {company.name}&apos;s OJT program from
                                one simple workspace.
                            </p>
                        </div>
                        <Button asChild className="w-full sm:w-auto">
                            <Link href={managedOjtsIndex()}>
                                <UserPlus />
                                Add or manage an OJT
                            </Link>
                        </Button>
                    </header>

                    <section
                        className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm sm:p-6 ${needsAttention > 0 ? 'border-amber-500/25 bg-amber-500/6' : 'border-emerald-500/25 bg-emerald-500/6'}`}
                    >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                            <div className="flex items-start gap-3">
                                <span
                                    className={`grid size-11 shrink-0 place-items-center rounded-2xl ${needsAttention > 0 ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300' : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'}`}
                                >
                                    {needsAttention > 0 ? (
                                        <ClipboardCheck className="size-5" />
                                    ) : (
                                        <CheckCircle2 className="size-5" />
                                    )}
                                </span>
                                <div>
                                    <p className="font-semibold">
                                        {needsAttention > 0
                                            ? `${needsAttention} item${needsAttention === 1 ? '' : 's'} need your attention`
                                            : 'Everything is up to date'}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {needsAttention > 0
                                            ? 'Review pending reports and time-correction requests when you are ready.'
                                            : 'There are no pending reports or time requests right now.'}
                                    </p>
                                </div>
                            </div>
                            {needsAttention > 0 && (
                                <Button variant="outline" asChild>
                                    <Link href={approvalInbox()}>
                                        Review pending work
                                        <ArrowRight />
                                    </Link>
                                </Button>
                            )}
                        </div>
                    </section>

                    <div className="grid gap-3 sm:grid-cols-3">
                        <StatCard
                            icon={Users}
                            value={stats.totalOjtCount}
                            label="Total OJTs"
                            detail="All OJT accounts"
                        />
                        <StatCard
                            icon={Clock3}
                            value={stats.activeOjtCount}
                            label="Currently active"
                            detail="Still completing hours"
                        />
                        <StatCard
                            icon={CheckCircle2}
                            value={stats.completedOjtCount}
                            label="Completed"
                            detail="Required hours finished"
                        />
                    </div>

                    <section className="rounded-3xl border bg-card/90 p-5 shadow-sm sm:p-6">
                        <div>
                            <p className="font-semibold">
                                What would you like to do?
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Choose an action below. Each area contains only
                                the tools needed for that job.
                            </p>
                        </div>
                        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            <ActionCard
                                icon={Users}
                                title="OJT accounts"
                                description="Create accounts, assign supervisors, and check remaining hours."
                                href={managedOjtsIndex()}
                                badge={`${stats.activeOjtCount} active`}
                            />
                            <ActionCard
                                icon={ClipboardCheck}
                                title="Review reports"
                                description="Approve or return daily attendance and work summaries."
                                href={approvalInbox()}
                                badge={
                                    navigation.pendingReportsCount > 0
                                        ? `${navigation.pendingReportsCount} waiting`
                                        : undefined
                                }
                            />
                            <ActionCard
                                icon={FileClock}
                                title="Time requests"
                                description="Review OJT requests to correct attendance times."
                                href={attendanceCorrections()}
                                badge={
                                    navigation.pendingCorrectionsCount > 0
                                        ? `${navigation.pendingCorrectionsCount} waiting`
                                        : undefined
                                }
                            />
                            <ActionCard
                                icon={Clock8}
                                title="Work schedule"
                                description="Set the expected arrival time and grace period."
                                href={attendancePolicy()}
                            />
                            <ActionCard
                                icon={History}
                                title="Audit trail"
                                description="See important account and attendance activity."
                                href={activityLogs()}
                            />
                            <ActionCard
                                icon={CalendarDays}
                                title="Leave & calendar"
                                description="Review leave requests and company non-working days."
                                href={leaveIndex()}
                            />
                            <ActionCard
                                icon={FileCheck2}
                                title="DTR sign-off"
                                description="Finalize verified DTR periods and lock approved records."
                                href={dtrSubmissionsIndex()}
                            />
                            <ActionCard
                                icon={ServerCog}
                                title="System operations"
                                description="Check health, backups, security, and recovery readiness."
                                href={operationsIndex()}
                            />
                        </div>
                    </section>
                </div>
            </div>
        </>
    );
}

function StatCard({
    icon: Icon,
    value,
    label,
    detail,
}: {
    icon: typeof Users;
    value: number;
    label: string;
    detail: string;
}) {
    return (
        <div className="flex items-center gap-4 rounded-2xl border bg-card/90 p-4 shadow-sm sm:p-5">
            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-5" />
            </span>
            <div>
                <p className="text-2xl font-semibold">{value}</p>
                <p className="text-sm font-medium">{label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{detail}</p>
            </div>
        </div>
    );
}

function ActionCard({
    icon: Icon,
    title,
    description,
    href,
    badge,
}: {
    icon: typeof Users;
    title: string;
    description: string;
    href: ReturnType<typeof dashboard>;
    badge?: string;
}) {
    return (
        <Link
            href={href}
            className="group flex min-h-40 flex-col rounded-2xl border bg-background/70 p-4 transition-colors hover:border-primary/25 hover:bg-primary/4"
        >
            <div className="flex items-start justify-between gap-3">
                <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="size-5" />
                </span>
                {badge && <Badge variant="secondary">{badge}</Badge>}
            </div>
            <p className="mt-4 font-semibold">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {description}
            </p>
            <ArrowRight className="mt-auto size-4 self-end text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </Link>
    );
}

CompanyOverview.layout = {
    breadcrumbs: [{ title: 'Overview', href: dashboard() }],
};
