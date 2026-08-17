import { Form, Head } from '@inertiajs/react';
import {
    CheckCircle2,
    DatabaseBackup,
    HardDrive,
    RefreshCw,
    ShieldAlert,
    XCircle,
} from 'lucide-react';
import { restore } from '@/actions/App/Http/Controllers/Company/OjtController';
import {
    backup,
    verify,
} from '@/actions/App/Http/Controllers/Company/OperationsController';
import { DashboardHero } from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { index } from '@/routes/company/operations';
import { exportMethod as privacyExport } from '@/routes/privacy';

type Props = {
    health: {
        checkedAt: string;
        database: {
            healthy: boolean;
            latencyMs: number | null;
            remedy: string;
        };
        cache: { healthy: boolean; remedy: string };
        storage: { healthy: boolean; disk: string; remedy: string };
        scheduler: {
            healthy: boolean;
            lastSeenAt: string | null;
            ageSeconds: number | null;
            remedy: string;
        };
        queue: {
            healthy: boolean;
            reachable: boolean;
            waitingJobs: number;
            failedJobs: number;
            lastSeenAt: string | null;
            ageSeconds: number | null;
            remedy: string;
        };
        mail: { healthy: boolean; mailer: string; remedy: string };
        backup: {
            healthy: boolean;
            status: string;
            completedAt: string | null;
            verifiedAt: string | null;
            remedy: string;
        };
        configuration: {
            debugDisabled: boolean;
            https: boolean;
            asyncQueue: boolean;
            mfaRequired: boolean;
        };
    };
    environment: string;
    backups: {
        id: number;
        path: string;
        size: number;
        status: string;
        completedAt: string | null;
        verifiedAt: string | null;
        failureMessage: string | null;
    }[];
    archivedOjts: {
        id: number;
        name: string;
        email: string;
        archivedAt: string | null;
    }[];
};

export default function Operations({
    health,
    environment,
    backups,
    archivedOjts,
}: Props) {
    const productionReady =
        health.database.healthy &&
        health.cache.healthy &&
        health.storage.healthy &&
        health.scheduler.healthy &&
        health.queue.healthy &&
        health.mail.healthy &&
        health.backup.healthy &&
        health.configuration.debugDisabled &&
        health.configuration.https &&
        health.configuration.asyncQueue;

    return (
        <>
            <Head title="System operations" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Reliability & recovery"
                    title="System operations"
                    description="Check production readiness, queue health, and verified database backups from one protected workspace."
                />
                <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    <HealthCard
                        label="Database"
                        value={
                            health.database.healthy
                                ? 'Connected'
                                : 'Unavailable'
                        }
                        healthy={health.database.healthy}
                        detail={
                            health.database.latencyMs === null
                                ? health.database.remedy
                                : `${health.database.latencyMs} ms response`
                        }
                    />
                    <HealthCard
                        label="Queue worker"
                        value={
                            health.queue.healthy
                                ? 'Responding'
                                : 'Needs attention'
                        }
                        healthy={health.queue.healthy}
                        detail={`${health.queue.waitingJobs} waiting · ${health.queue.failedJobs} failed`}
                    />
                    <HealthCard
                        label="Scheduler"
                        value={
                            health.scheduler.healthy
                                ? 'Running'
                                : 'No heartbeat'
                        }
                        healthy={health.scheduler.healthy}
                        detail={
                            health.scheduler.healthy
                                ? 'Checked every minute'
                                : health.scheduler.remedy
                        }
                    />
                    <HealthCard
                        label="Cache"
                        value={
                            health.cache.healthy ? 'Writable' : 'Unavailable'
                        }
                        healthy={health.cache.healthy}
                        detail={
                            health.cache.healthy
                                ? undefined
                                : health.cache.remedy
                        }
                    />
                    <HealthCard
                        label="Protected storage"
                        value={
                            health.storage.healthy ? 'Writable' : 'Unavailable'
                        }
                        healthy={health.storage.healthy}
                        detail={
                            health.storage.healthy
                                ? health.storage.disk
                                : health.storage.remedy
                        }
                    />
                    <HealthCard
                        label="Verified backup"
                        value={
                            health.backup.healthy ? 'Current' : 'Action needed'
                        }
                        healthy={health.backup.healthy}
                        detail={
                            health.backup.healthy
                                ? health.backup.status
                                : health.backup.remedy
                        }
                    />
                </section>
                <section
                    className={`rounded-2xl border p-5 shadow-sm ${productionReady ? 'border-emerald-500/25 bg-emerald-500/5' : 'border-amber-500/25 bg-amber-500/5'}`}
                >
                    <div className="flex items-start gap-3">
                        {productionReady ? (
                            <CheckCircle2 className="mt-0.5 size-5 text-emerald-500" />
                        ) : (
                            <ShieldAlert className="mt-0.5 size-5 text-amber-500" />
                        )}
                        <div>
                            <h2 className="font-semibold">
                                {productionReady
                                    ? 'Core production checks pass'
                                    : 'Production hardening still required'}
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                Run{' '}
                                <code className="rounded bg-background px-1.5 py-0.5">
                                    php artisan system:preflight
                                </code>{' '}
                                on the deployment server for the complete
                                release gate. Current environment: {environment}
                                . Last live diagnostic:{' '}
                                {new Date(health.checkedAt).toLocaleString()}.
                            </p>
                        </div>
                    </div>
                </section>
                <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                <DatabaseBackup className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold">
                                    Database backups
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Daily backups are automatic. Verification
                                    detects corruption or unexpected changes.
                                </p>
                            </div>
                        </div>
                        <Form {...backup.form()}>
                            {({ processing }) => (
                                <Button disabled={processing}>
                                    {processing ? (
                                        <Spinner />
                                    ) : (
                                        <DatabaseBackup />
                                    )}{' '}
                                    Back up now
                                </Button>
                            )}
                        </Form>
                    </div>
                    <div className="mt-6 overflow-hidden rounded-xl border">
                        <div className="hidden grid-cols-[1fr_auto_auto_auto] gap-4 bg-muted/60 px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase sm:grid">
                            <span>Backup</span>
                            <span>Size</span>
                            <span>Status</span>
                            <span>Action</span>
                        </div>
                        {backups.length === 0 && (
                            <p className="p-8 text-center text-sm text-muted-foreground">
                                No backups yet. Create the first verified
                                recovery point.
                            </p>
                        )}
                        {backups.map((item) => (
                            <div
                                key={item.id}
                                className="grid gap-3 border-t p-4 first:border-t-0 sm:grid-cols-[1fr_auto_auto_auto] sm:items-center"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-medium">
                                        {item.path}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {item.completedAt
                                            ? new Date(
                                                  item.completedAt,
                                              ).toLocaleString()
                                            : (item.failureMessage ??
                                              'In progress')}
                                    </p>
                                </div>
                                <span className="text-sm text-muted-foreground">
                                    {formatBytes(item.size)}
                                </span>
                                <Badge variant="outline">
                                    {item.verifiedAt ? 'Verified' : item.status}
                                </Badge>
                                {item.status === 'completed' ? (
                                    <Form {...verify.form(item.id)}>
                                        {({ processing }) => (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <Spinner />
                                                ) : (
                                                    <RefreshCw />
                                                )}{' '}
                                                Verify
                                            </Button>
                                        )}
                                    </Form>
                                ) : (
                                    <span />
                                )}
                            </div>
                        ))}
                    </div>
                </section>
                <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                    <h2 className="font-semibold">Archived OJT accounts</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Archived users cannot sign in. Their records remain
                        exportable and recoverable until automatic retention
                        pruning is enabled.
                    </p>
                    <div className="mt-5 grid gap-3">
                        {archivedOjts.length === 0 && (
                            <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                                No archived OJT accounts.
                            </p>
                        )}
                        {archivedOjts.map((ojt) => (
                            <div
                                key={ojt.id}
                                className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="font-medium">{ojt.name}</p>
                                    <p className="truncate text-sm text-muted-foreground">
                                        {ojt.email}
                                    </p>
                                </div>
                                <Button variant="outline" size="sm" asChild>
                                    <a href={privacyExport.url(ojt.id)}>
                                        Export data
                                    </a>
                                </Button>
                                <Form {...restore.form(ojt.id)}>
                                    {({ processing }) => (
                                        <Button size="sm" disabled={processing}>
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <RefreshCw />
                                            )}{' '}
                                            Restore account
                                        </Button>
                                    )}
                                </Form>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </>
    );
}

function HealthCard({
    label,
    value,
    healthy,
    detail,
}: {
    label: string;
    value: string;
    healthy: boolean;
    detail?: string;
}) {
    return (
        <article className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <HardDrive className="size-5 text-muted-foreground" />
                {healthy ? (
                    <CheckCircle2 className="size-5 text-emerald-500" />
                ) : (
                    <XCircle className="size-5 text-destructive" />
                )}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
            {detail && (
                <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
            )}
        </article>
    );
}

const formatBytes = (bytes: number) =>
    bytes === 0 ? '—' : `${(bytes / 1024 / 1024).toFixed(1)} MB`;

Operations.layout = {
    breadcrumbs: [{ title: 'System operations', href: index() }],
};
