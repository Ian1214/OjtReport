import { Head } from '@inertiajs/react';
import {
    Building2,
    Database,
    FileText,
    ShieldCheck,
    UsersRound,
} from 'lucide-react';
import {
    DashboardHero,
    MetricCard,
    StatusBadge,
} from '@/components/dashboard-ui';

type Props = {
    stats: {
        companies: number;
        users: number;
        activeUsers: number;
        ojts: number;
        reportsThisMonth: number;
    };
    companies: {
        id: number;
        name: string;
        users: number;
        activeUsers: number;
        ojts: number;
        createdAt: string | null;
    }[];
    health: {
        database: { healthy: boolean };
        cache: { healthy: boolean };
        storage: { healthy: boolean };
        queue: { healthy: boolean };
        scheduler: { healthy: boolean };
    };
};

export default function PlatformDashboard({ stats, companies, health }: Props) {
    const healthy =
        health.database.healthy &&
        health.cache.healthy &&
        health.storage.healthy &&
        health.queue.healthy &&
        health.scheduler.healthy;

    return (
        <>
            <Head title="Platform operations" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Platform administration"
                    title="Global operations console"
                    description="Monitor tenant adoption and core infrastructure without entering or editing private company records."
                    actions={
                        <StatusBadge
                            status={healthy ? 'online' : 'pending'}
                            label={
                                healthy
                                    ? 'Core services healthy'
                                    : 'Attention required'
                            }
                        />
                    }
                />
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    <MetricCard
                        icon={Building2}
                        label="Companies"
                        value={stats.companies}
                    />
                    <MetricCard
                        icon={UsersRound}
                        label="All users"
                        value={stats.users}
                    />
                    <MetricCard
                        icon={ShieldCheck}
                        label="Active accounts"
                        value={stats.activeUsers}
                        accent="success"
                    />
                    <MetricCard
                        icon={UsersRound}
                        label="OJTs"
                        value={stats.ojts}
                    />
                    <MetricCard
                        icon={FileText}
                        label="Reports this month"
                        value={stats.reportsThisMonth}
                    />
                </section>
                <section className="rounded-3xl border border-primary/15 bg-card/85 p-5">
                    <div className="mb-4 flex items-center gap-3">
                        <Database className="size-5 text-primary" />
                        <div>
                            <h2 className="font-semibold">Tenant directory</h2>
                            <p className="text-sm text-muted-foreground">
                                Aggregate account counts only; private tenant
                                content is not exposed.
                            </p>
                        </div>
                    </div>
                    <div className="grid gap-3">
                        {companies.map((company) => (
                            <article
                                key={company.id}
                                className="grid gap-3 rounded-2xl border p-4 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                            >
                                <div>
                                    <p className="font-semibold">
                                        {company.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Joined{' '}
                                        {company.createdAt
                                            ? new Date(
                                                  company.createdAt,
                                              ).toLocaleDateString()
                                            : '—'}
                                    </p>
                                </div>
                                <span className="text-sm">
                                    {company.ojts} OJTs
                                </span>
                                <span className="text-sm">
                                    {company.activeUsers}/{company.users} active
                                </span>
                                <StatusBadge
                                    status={
                                        company.activeUsers > 0
                                            ? 'online'
                                            : 'pending'
                                    }
                                    label={
                                        company.activeUsers > 0
                                            ? 'Active'
                                            : 'Inactive'
                                    }
                                />
                            </article>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}
