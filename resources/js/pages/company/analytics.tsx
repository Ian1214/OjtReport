import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    Award,
    ChartNoAxesCombined,
    CheckCircle2,
    Clock3,
    Download,
    UsersRound,
} from 'lucide-react';
import { DashboardHero } from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { complianceEvidence } from '@/routes/company/analytics';

type OjtMetric = {
    id: number;
    name: string;
    studentId: string | null;
    supervisorName: string;
    requiredHours: number;
    approvedHours: string;
    remainingHours: string;
    certifiedHours: string;
    reservedHours: string;
    uncertifiedHours: string;
    pendingReports: number;
    lateDays: number;
    missingWorkdays: number;
    risk: {
        level: 'low' | 'medium' | 'high';
        score: number;
        signals: string[];
        recommendedAction: string;
    };
};

type Props = {
    companyName: string;
    periodLabel: string;
    summary: {
        totalOjts: number;
        approvedHours: string;
        certifiedHours: string;
        reservedHours: string;
        uncertifiedHours: string;
        pendingReports: number;
        lateDays: number;
    };
    ojts: {
        data: OjtMetric[];
        links: { url: string | null; label: string; active: boolean }[];
    };
};

export default function CompanyAnalytics({
    companyName,
    periodLabel,
    summary,
    ojts,
}: Props) {
    return (
        <>
            <Head title="OJT analytics" />
            <div className="flex flex-1 flex-col gap-6 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_44%)] p-4 sm:p-6">
                <DashboardHero
                    eyebrow="Workforce intelligence"
                    title="OJT analytics"
                    description={`A clear operational view of ${companyName}'s attendance, approved hours, and certificate readiness.`}
                    actions={
                        <Button variant="outline" asChild>
                            <a href={complianceEvidence.url()}>
                                <Download /> Export compliance evidence
                            </a>
                        </Button>
                    }
                />

                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Metric
                        icon={UsersRound}
                        label="Managed OJTs"
                        value={String(summary.totalOjts)}
                        detail="Active and completed accounts"
                    />
                    <Metric
                        icon={CheckCircle2}
                        label="Approved hours"
                        value={summary.approvedHours}
                        detail="Verified daily reports"
                    />
                    <Metric
                        icon={Award}
                        label="Certified hours"
                        value={summary.certifiedHours}
                        detail={`${summary.reservedHours} hours awaiting signature`}
                    />
                    <Metric
                        icon={ChartNoAxesCombined}
                        label="Ready to certify"
                        value={summary.uncertifiedHours}
                        detail="Approved and not yet allocated"
                    />
                </section>

                <section className="grid gap-3 sm:grid-cols-2">
                    <AttentionCard
                        icon={Clock3}
                        label="Reports awaiting review"
                        value={summary.pendingReports}
                    />
                    <AttentionCard
                        icon={AlertTriangle}
                        label="Late attendance records"
                        value={summary.lateDays}
                    />
                </section>

                <section className="overflow-hidden rounded-3xl border bg-card/90 shadow-sm">
                    <div className="border-b p-5 sm:p-6">
                        <h2 className="text-lg font-semibold">OJT progress</h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Missing workdays are scheduled days in {periodLabel}{' '}
                            with no submitted attendance record. Approved leave
                            and company holidays are excluded.
                        </p>
                    </div>
                    {ojts.data.length === 0 ? (
                        <div className="p-10 text-center text-sm text-muted-foreground">
                            No OJT accounts are available.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1120px] text-sm">
                                <thead className="bg-muted/45 text-left text-xs tracking-wide text-muted-foreground uppercase">
                                    <tr>
                                        <th className="px-5 py-3">
                                            OJT / Supervisor
                                        </th>
                                        <th className="px-4 py-3">Progress</th>
                                        <th className="px-4 py-3">
                                            Certificates
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Pending
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Late
                                        </th>
                                        <th className="px-4 py-3 text-center">
                                            Missing days
                                        </th>
                                        <th className="px-4 py-3">
                                            Risk signals
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {ojts.data.map((ojt) => (
                                        <tr
                                            key={ojt.id}
                                            className="transition hover:bg-muted/25"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold">
                                                    {ojt.name}
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {ojt.studentId ??
                                                        'No student ID'}{' '}
                                                    · {ojt.supervisorName}
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p className="font-medium">
                                                    {ojt.approvedHours} /{' '}
                                                    {ojt.requiredHours} h
                                                </p>
                                                <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary"
                                                        style={{
                                                            width: `${Math.min(100, (Number(ojt.approvedHours) / Math.max(1, ojt.requiredHours)) * 100)}%`,
                                                        }}
                                                    />
                                                </div>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {ojt.remainingHours} h
                                                    remaining
                                                </p>
                                            </td>
                                            <td className="px-4 py-4">
                                                <p>
                                                    {ojt.certifiedHours} h
                                                    finalized
                                                </p>
                                                <p className="mt-1 text-xs text-muted-foreground">
                                                    {ojt.reservedHours} h
                                                    reserved ·{' '}
                                                    {ojt.uncertifiedHours} h
                                                    ready
                                                </p>
                                            </td>
                                            <CountCell
                                                value={ojt.pendingReports}
                                            />
                                            <CountCell
                                                value={ojt.lateDays}
                                                warning={ojt.lateDays > 0}
                                            />
                                            <CountCell
                                                value={ojt.missingWorkdays}
                                                warning={
                                                    ojt.missingWorkdays > 0
                                                }
                                            />
                                            <td className="px-4 py-4">
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        ojt.risk.level ===
                                                        'high'
                                                            ? 'border-destructive/30 text-destructive'
                                                            : ojt.risk.level ===
                                                                'medium'
                                                              ? 'border-amber-500/30 text-amber-500'
                                                              : 'border-emerald-500/30 text-emerald-500'
                                                    }
                                                >
                                                    {ojt.risk.level} ·{' '}
                                                    {ojt.risk.score}
                                                </Badge>
                                                <p className="mt-2 max-w-64 text-xs leading-5 text-muted-foreground">
                                                    {ojt.risk.signals[0] ??
                                                        'No concerning pattern detected.'}
                                                </p>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {ojts.links.length > 3 && (
                        <div className="flex flex-wrap justify-center gap-2 border-t p-4">
                            {ojts.links.map((link, index) => (
                                <Button
                                    key={`${link.label}-${index}`}
                                    variant={
                                        link.active ? 'default' : 'outline'
                                    }
                                    size="sm"
                                    asChild={Boolean(link.url)}
                                    disabled={!link.url}
                                >
                                    {link.url ? (
                                        <Link href={link.url}>
                                            {paginationLabel(link.label)}
                                        </Link>
                                    ) : (
                                        <span>
                                            {paginationLabel(link.label)}
                                        </span>
                                    )}
                                </Button>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

function Metric({
    icon: Icon,
    label,
    value,
    detail,
}: {
    icon: typeof UsersRound;
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <div className="rounded-2xl border bg-card/90 p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight">
                        {value}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        {detail}
                    </p>
                </div>
                <span className="rounded-xl border border-primary/20 bg-primary/10 p-2.5 text-primary">
                    <Icon className="size-5" />
                </span>
            </div>
        </div>
    );
}

function AttentionCard({
    icon: Icon,
    label,
    value,
}: {
    icon: typeof Clock3;
    label: string;
    value: number;
}) {
    return (
        <div className="flex items-center justify-between rounded-2xl border bg-card/80 p-4">
            <div className="flex items-center gap-3">
                <span className="rounded-xl bg-amber-500/10 p-2.5 text-amber-600">
                    <Icon className="size-5" />
                </span>
                <div>
                    <p className="font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                        Requires company follow-up
                    </p>
                </div>
            </div>
            <Badge variant={value > 0 ? 'destructive' : 'outline'}>
                {value}
            </Badge>
        </div>
    );
}

function CountCell({
    value,
    warning = false,
}: {
    value: number;
    warning?: boolean;
}) {
    return (
        <td className="px-4 py-4 text-center">
            <Badge variant={warning ? 'destructive' : 'outline'}>{value}</Badge>
        </td>
    );
}

function paginationLabel(label: string): string {
    return label.replace('&laquo;', '‹').replace('&raquo;', '›');
}
