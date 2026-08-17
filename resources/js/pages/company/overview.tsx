import { Head, Link, usePoll } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Award,
    Building2,
    CalendarDays,
    CheckCircle2,
    ClipboardCheck,
    Clock3,
    FileCheck2,
    FileClock,
    FileText,
    HardDrive,
    Radio,
    ShieldCheck,
    Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    DashboardHero,
    DashboardSectionHeader,
    DashboardWorkspace,
    MetricCard,
    NextActionCard,
    StatusBadge,
} from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as attendanceCorrections } from '@/routes/attendance-corrections';
import { index as certificatesIndex } from '@/routes/certificates';
import { index as approvalInbox } from '@/routes/company/approvals';
import { index as attendanceMonitor } from '@/routes/company/attendance-monitor';
import { index as departmentsIndex } from '@/routes/company/departments';
import { index as managedOjtsIndex } from '@/routes/company/ojts';
import { index as operationsIndex } from '@/routes/company/operations';
import { index as documentsIndex } from '@/routes/documents';
import { index as dtrSubmissionsIndex } from '@/routes/dtr-submissions';
import { index as leaveIndex } from '@/routes/leave';

type Monitoring = {
    attendance: {
        recorded: number;
        timedIn: number;
        timedOut: number;
        late: number;
        onLeave: number;
        notRecorded: number;
    };
    queues: {
        reports: number;
        corrections: number;
        leave: number;
        documents: number;
        dtrs: number;
        certificates: number;
        total: number;
    };
    workforce: {
        onboarding: number;
        paused: number;
        unassignedSupervisor: number;
        online: number;
        supervisors: number;
        departments: number;
    };
    records: {
        finalizedDtrs: number;
        finalizedCertificates: number;
        approvedDocuments: number;
    };
    system: {
        backupStatus: string;
        backupCompletedAt: string | null;
        backupVerifiedAt: string | null;
    };
    refreshedAt: string;
};

type Props = {
    company: { name: string };
    stats: {
        totalOjtCount: number;
        activeOjtCount: number;
        completedOjtCount: number;
    };
    monitoring: Monitoring;
};

export default function CompanyOverview({ company, stats, monitoring }: Props) {
    usePoll(30_000, { only: ['stats', 'monitoring'] }, { mode: 'rest' });

    const hasAttention = monitoring.queues.total > 0;
    const backupHealthy =
        monitoring.system.backupStatus === 'completed' &&
        monitoring.system.backupVerifiedAt !== null;

    return (
        <>
            <Head title={`${company.name} monitoring`} />

            <DashboardWorkspace>
                <DashboardHero
                    eyebrow="Live operations monitor"
                    title={company.name}
                    description="A read-only overview of attendance, approval queues, OJT coverage, verified records, and system readiness."
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <StatusBadge
                                status="online"
                                label="Monitoring active"
                            />
                            <span className="text-xs text-muted-foreground">
                                Updated {formatTime(monitoring.refreshedAt)}
                            </span>
                        </div>
                    }
                />

                <NextActionCard
                    icon={hasAttention ? AlertTriangle : CheckCircle2}
                    eyebrow="System attention"
                    title={
                        hasAttention
                            ? `${monitoring.queues.total} item${monitoring.queues.total === 1 ? '' : 's'} require review`
                            : 'All monitored queues are clear'
                    }
                    description={
                        hasAttention
                            ? 'Open the highest-priority queue to keep attendance, documents, and official records moving.'
                            : 'There are currently no pending admin reviews across reports, corrections, leave, documents, DTRs, or certificates.'
                    }
                    tone={hasAttention ? 'warning' : 'success'}
                    status={
                        <StatusBadge
                            status={hasAttention ? 'pending' : 'approved'}
                            label={hasAttention ? 'Review needed' : 'All clear'}
                        />
                    }
                    action={
                        hasAttention ? (
                            <Button variant="outline" asChild>
                                <Link href={priorityQueueUrl(monitoring)}>
                                    Open priority queue <ArrowRight />
                                </Link>
                            </Button>
                        ) : undefined
                    }
                />

                <section className="grid gap-4">
                    <DashboardSectionHeader
                        title="Today’s attendance"
                        description="Live attendance coverage for active OJTs. Open Attendance Monitor for individual records."
                        aside={
                            <Button variant="outline" size="sm" asChild>
                                <Link href={attendanceMonitor()}>
                                    View attendance <ArrowRight />
                                </Link>
                            </Button>
                        }
                    />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <MetricCard
                            icon={FileCheck2}
                            label="Attendance recorded"
                            value={monitoring.attendance.recorded}
                            detail={`${stats.activeOjtCount} active OJTs`}
                            accent="success"
                        />
                        <MetricCard
                            icon={Radio}
                            label="Currently timed in"
                            value={monitoring.attendance.timedIn}
                            detail={`${monitoring.attendance.timedOut} already timed out`}
                        />
                        <MetricCard
                            icon={Clock3}
                            label="Late arrivals"
                            value={monitoring.attendance.late}
                            detail="Recorded after the allowed arrival time"
                            accent={
                                monitoring.attendance.late > 0
                                    ? 'warning'
                                    : 'success'
                            }
                        />
                        <MetricCard
                            icon={AlertTriangle}
                            label="Not yet recorded"
                            value={monitoring.attendance.notRecorded}
                            detail={`${monitoring.attendance.onLeave} on approved leave`}
                            accent={
                                monitoring.attendance.notRecorded > 0
                                    ? 'warning'
                                    : 'success'
                            }
                        />
                    </div>
                </section>

                <section className="grid gap-4">
                    <DashboardSectionHeader
                        title="Review queues"
                        description="Every admin decision waiting across the system, separated by workflow."
                        aside={
                            <Badge
                                variant={hasAttention ? 'default' : 'secondary'}
                            >
                                {monitoring.queues.total} pending
                            </Badge>
                        }
                    />
                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        <MonitorWidget
                            icon={ClipboardCheck}
                            label="Daily reports"
                            value={monitoring.queues.reports}
                            description="Submitted hours awaiting approval"
                            href={approvalInbox()}
                        />
                        <MonitorWidget
                            icon={FileClock}
                            label="Time corrections"
                            value={monitoring.queues.corrections}
                            description="Attendance changes awaiting admin review"
                            href={attendanceCorrections()}
                        />
                        <MonitorWidget
                            icon={CalendarDays}
                            label="Leave requests"
                            value={monitoring.queues.leave}
                            description="Supervisor-reviewed leave awaiting action"
                            href={leaveIndex()}
                        />
                        <MonitorWidget
                            icon={FileText}
                            label="Documents"
                            value={monitoring.queues.documents}
                            description="Vault uploads awaiting verification"
                            href={documentsIndex()}
                        />
                        <MonitorWidget
                            icon={FileCheck2}
                            label="DTR sign-offs"
                            value={monitoring.queues.dtrs}
                            description="Signed periods awaiting final review"
                            href={dtrSubmissionsIndex()}
                        />
                        <MonitorWidget
                            icon={Award}
                            label="Certificates"
                            value={monitoring.queues.certificates}
                            description="Certificates awaiting supervisor signature"
                            href={certificatesIndex()}
                        />
                    </div>
                </section>

                <div className="grid items-start gap-5 xl:grid-cols-2">
                    <MonitoringPanel
                        icon={Users}
                        title="OJT program health"
                        description="Lifecycle and supervision coverage across the company."
                        href={managedOjtsIndex()}
                    >
                        <HealthRow
                            label="Active OJTs"
                            value={stats.activeOjtCount}
                            tone="success"
                        />
                        <HealthRow
                            label="Onboarding"
                            value={monitoring.workforce.onboarding}
                        />
                        <HealthRow
                            label="Paused"
                            value={monitoring.workforce.paused}
                            tone="warning"
                        />
                        <HealthRow
                            label="Completed"
                            value={stats.completedOjtCount}
                            tone="success"
                        />
                        <HealthRow
                            label="Without supervisor"
                            value={monitoring.workforce.unassignedSupervisor}
                            tone="warning"
                        />
                        <HealthRow
                            label="Online now"
                            value={monitoring.workforce.online}
                            tone="success"
                        />
                    </MonitoringPanel>

                    <MonitoringPanel
                        icon={Building2}
                        title="Organization coverage"
                        description="Teams and official records available in the platform."
                        href={departmentsIndex()}
                    >
                        <HealthRow
                            label="Active departments"
                            value={monitoring.workforce.departments}
                        />
                        <HealthRow
                            label="Supervisors"
                            value={monitoring.workforce.supervisors}
                        />
                        <HealthRow
                            label="Finalized DTRs"
                            value={monitoring.records.finalizedDtrs}
                            tone="success"
                        />
                        <HealthRow
                            label="Final certificates"
                            value={monitoring.records.finalizedCertificates}
                            tone="success"
                        />
                        <HealthRow
                            label="Approved documents"
                            value={monitoring.records.approvedDocuments}
                            tone="success"
                        />
                        <HealthRow
                            label="Total OJT records"
                            value={stats.totalOjtCount}
                        />
                    </MonitoringPanel>
                </div>

                <section className="rounded-3xl border bg-card/90 p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                            <span
                                className={cn(
                                    'grid size-11 shrink-0 place-items-center rounded-2xl',
                                    backupHealthy
                                        ? 'bg-emerald-500/10 text-emerald-600'
                                        : 'bg-amber-500/10 text-amber-600',
                                )}
                            >
                                {backupHealthy ? (
                                    <ShieldCheck className="size-5" />
                                ) : (
                                    <HardDrive className="size-5" />
                                )}
                            </span>
                            <div>
                                <p className="font-semibold">
                                    System recovery readiness
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {backupSummary(monitoring.system)}
                                </p>
                                {monitoring.system.backupCompletedAt && (
                                    <p className="mt-2 text-xs text-muted-foreground">
                                        Last completed{' '}
                                        {formatDateTime(
                                            monitoring.system.backupCompletedAt,
                                        )}
                                    </p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <StatusBadge
                                status={backupHealthy ? 'approved' : 'pending'}
                                label={
                                    backupHealthy
                                        ? 'Backup verified'
                                        : 'Check required'
                                }
                            />
                            <Button variant="outline" asChild>
                                <Link href={operationsIndex()}>
                                    System operations <ArrowRight />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </section>
            </DashboardWorkspace>
        </>
    );
}

function MonitorWidget({
    icon: Icon,
    label,
    value,
    description,
    href,
}: {
    icon: LucideIcon;
    label: string;
    value: number;
    description: string;
    href: ReturnType<typeof dashboard>;
}) {
    const needsAttention = value > 0;

    return (
        <Link
            href={href}
            className={cn(
                'command-panel group flex min-h-36 items-start gap-4 rounded-2xl border bg-card/88 p-5 transition hover:-translate-y-0.5 hover:border-primary/30',
                needsAttention && 'border-amber-500/25 bg-amber-500/4',
            )}
        >
            <span
                className={cn(
                    'grid size-11 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary',
                    needsAttention && 'bg-amber-500/10 text-amber-600',
                )}
            >
                <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold">{label}</span>
                    <span className="text-2xl font-semibold tabular-nums">
                        {value}
                    </span>
                </span>
                <span className="mt-2 block text-sm leading-5 text-muted-foreground">
                    {description}
                </span>
                <span className="mt-3 flex items-center gap-1 text-xs font-medium text-primary">
                    Open queue{' '}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </span>
            </span>
        </Link>
    );
}

function MonitoringPanel({
    icon: Icon,
    title,
    description,
    href,
    children,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    href: ReturnType<typeof dashboard>;
    children: React.ReactNode;
}) {
    return (
        <section className="rounded-3xl border bg-card/90 p-5 shadow-sm sm:p-6">
            <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                    </span>
                    <div>
                        <h2 className="font-semibold">{title}</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {description}
                        </p>
                    </div>
                </div>
                <Button variant="ghost" size="icon" asChild>
                    <Link href={href} aria-label={`Open ${title}`}>
                        <ArrowRight />
                    </Link>
                </Button>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {children}
            </div>
        </section>
    );
}

function HealthRow({
    label,
    value,
    tone = 'primary',
}: {
    label: string;
    value: number;
    tone?: 'primary' | 'success' | 'warning';
}) {
    return (
        <div className="rounded-2xl border bg-background/60 p-3">
            <p
                className={cn(
                    'text-xl font-semibold tabular-nums',
                    tone === 'success' && 'text-emerald-600',
                    tone === 'warning' && 'text-amber-600',
                )}
            >
                {value}
            </p>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {label}
            </p>
        </div>
    );
}

function priorityQueueUrl(
    monitoring: Monitoring,
): ReturnType<typeof dashboard> {
    if (monitoring.queues.reports > 0) {
        return approvalInbox();
    }

    if (monitoring.queues.corrections > 0) {
        return attendanceCorrections();
    }

    if (monitoring.queues.leave > 0) {
        return leaveIndex();
    }

    if (monitoring.queues.documents > 0) {
        return documentsIndex();
    }

    if (monitoring.queues.dtrs > 0) {
        return dtrSubmissionsIndex();
    }

    return certificatesIndex();
}

function backupSummary(system: Monitoring['system']): string {
    if (system.backupStatus === 'not_available') {
        return 'No backup record is available yet. Open System Operations to create and verify one.';
    }

    if (system.backupStatus === 'failed') {
        return 'The latest backup failed and requires administrator attention.';
    }

    if (system.backupVerifiedAt === null) {
        return 'The latest backup completed but has not been verified yet.';
    }

    return `The latest backup was verified ${formatDateTime(system.backupVerifiedAt)}.`;
}

function formatTime(value: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

CompanyOverview.layout = {
    breadcrumbs: [{ title: 'Monitoring', href: dashboard() }],
};
