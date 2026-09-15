import { Head } from '@inertiajs/react';
import { History, ShieldCheck } from 'lucide-react';
import { DashboardHero } from '@/components/dashboard-ui';

type Log = {
    id: number;
    event: string;
    description: string;
    actor: { name: string; email: string } | null;
    ipAddress: string | null;
    createdAt: string | null;
};

export default function PlatformActivityLogs({
    logs,
}: {
    logs: { data: Log[] };
}) {
    return (
        <>
            <Head title="Platform audit trail" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Accountability"
                    title="Platform audit trail"
                    description="A tamper-resistant history of privileged platform actions. Tenant business records are not included."
                />
                <section className="overflow-hidden rounded-3xl border border-primary/15 bg-card/90">
                    <div className="flex items-center gap-3 border-b p-5">
                        <History className="size-5 text-primary" />
                        <h2 className="font-semibold">
                            Recent administrative actions
                        </h2>
                    </div>
                    {logs.data.length === 0 && (
                        <p className="p-10 text-center text-sm text-muted-foreground">
                            No platform actions have been recorded yet.
                        </p>
                    )}
                    {logs.data.map((log) => (
                        <article
                            key={log.id}
                            className="grid gap-2 border-b p-5 last:border-b-0 md:grid-cols-[1fr_auto]"
                        >
                            <div className="flex gap-3">
                                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                                <div>
                                    <p className="font-medium">
                                        {log.description}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        {log.event} ·{' '}
                                        {log.actor?.name ?? 'System'}
                                        {log.ipAddress
                                            ? ` · ${log.ipAddress}`
                                            : ''}
                                    </p>
                                </div>
                            </div>
                            <time className="text-xs text-muted-foreground">
                                {log.createdAt
                                    ? new Date(log.createdAt).toLocaleString()
                                    : '—'}
                            </time>
                        </article>
                    ))}
                </section>
            </div>
        </>
    );
}
