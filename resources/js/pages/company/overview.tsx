import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, Clock3, Users } from 'lucide-react';
import { DashboardHero, MetricCard } from '@/components/dashboard-ui';
import { Button } from '@/components/ui/button';
import { dashboard } from '@/routes';
import { index as managedOjtsIndex } from '@/routes/company/ojts';

type Props = {
    company: { name: string };
    stats: {
        totalOjtCount: number;
        activeOjtCount: number;
        completedOjtCount: number;
    };
};

export default function CompanyOverview({ company, stats }: Props) {
    return (
        <>
            <Head title={`${company.name} dashboard`} />

            <div className="flex flex-1 flex-col gap-6 bg-[radial-gradient(ellipse_at_top_right,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_48%)] p-4 md:p-6">
                <DashboardHero
                    eyebrow="Company workspace"
                    title={`Welcome back, ${company.name}`}
                    description="Use this workspace to monitor your internship program. Manage OJT accounts and review their submitted daily reports from one dedicated area."
                    actions={
                        <Button asChild>
                            <Link href={managedOjtsIndex()}>
                                Manage OJTs
                                <ArrowRight />
                            </Link>
                        </Button>
                    }
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                        icon={Users}
                        label="Total OJTs"
                        value={stats.totalOjtCount}
                        detail="All accounts in your company workspace"
                    />
                    <MetricCard
                        icon={Clock3}
                        label="Active internships"
                        value={stats.activeOjtCount}
                        detail="OJT accounts still completing hours"
                    />
                    <MetricCard
                        icon={CheckCircle2}
                        label="Completed"
                        value={stats.completedOjtCount}
                        detail="OJT accounts that reached their requirements"
                        accent="success"
                    />
                </div>

                <section className="relative overflow-hidden rounded-3xl border border-primary/12 bg-card/90 p-6 shadow-[0_18px_50px_-30px_rgb(0_0_0_/_0.55)]">
                    <div className="absolute -right-10 -bottom-14 size-44 rounded-full bg-primary/8 blur-3xl" />
                    <div className="relative">
                        <p className="text-sm font-semibold">
                            Manage OJTs in one place
                        </p>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
                            Create OJT accounts, delete accounts when necessary,
                            track attendance progress, and open each OJT’s daily
                            reports in a view-only format.
                        </p>
                        <Button variant="outline" asChild className="mt-5">
                            <Link href={managedOjtsIndex()}>
                                Open Managed OJTs
                                <ArrowRight />
                            </Link>
                        </Button>
                    </div>
                </section>
            </div>
        </>
    );
}

CompanyOverview.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
