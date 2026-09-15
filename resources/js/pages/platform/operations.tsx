import { Form, Head } from '@inertiajs/react';
import {
    AlertTriangle,
    BellRing,
    CheckCircle2,
    DatabaseBackup,
    RefreshCw,
    ServerCog,
    Trash2,
} from 'lucide-react';
import {
    backup,
    verify,
} from '@/actions/App/Http/Controllers/Platform/OperationsController';
import { DashboardHero } from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import {
    store as publishAnnouncement,
    destroy as withdrawAnnouncement,
} from '@/routes/platform/announcements';
import {
    destroy as forgetJob,
    retry as retryJob,
} from '@/routes/platform/operations/failed-jobs';

type Health = {
    checkedAt: string;
    database: { healthy: boolean; latencyMs: number | null };
    cache: { healthy: boolean };
    storage: { healthy: boolean; disk: string };
    scheduler: { healthy: boolean };
    queue: { healthy: boolean; waitingJobs: number; failedJobs: number };
    mail: { healthy: boolean; mailer: string };
    backup: { healthy: boolean; status: string };
};
type Backup = {
    id: number;
    path: string;
    size: number;
    status: string;
    completedAt: string | null;
    verifiedAt: string | null;
};
type FailedJob = {
    uuid: string;
    connection: string;
    queue: string;
    failedAt: string;
};
type Announcement = {
    id: number;
    title: string;
    message: string;
    severity: string;
    startsAt: string | null;
    endsAt: string | null;
    publishedAt: string | null;
};

export default function PlatformOperations({
    health,
    environment,
    backups,
    failedJobs,
    announcements,
}: {
    health: Health;
    environment: string;
    backups: Backup[];
    failedJobs: FailedJob[];
    announcements: Announcement[];
}) {
    const checks = [
        [
            'Database',
            health.database.healthy,
            health.database.latencyMs === null
                ? 'Unavailable'
                : `${health.database.latencyMs} ms`,
        ],
        [
            'Queue',
            health.queue.healthy,
            `${health.queue.waitingJobs} waiting · ${health.queue.failedJobs} failed`,
        ],
        [
            'Scheduler',
            health.scheduler.healthy,
            health.scheduler.healthy
                ? 'Heartbeat current'
                : 'No current heartbeat',
        ],
        [
            'Cache',
            health.cache.healthy,
            health.cache.healthy ? 'Writable' : 'Unavailable',
        ],
        ['Storage', health.storage.healthy, health.storage.disk],
        ['Mail', health.mail.healthy, health.mail.mailer],
    ] as const;

    return (
        <>
            <Head title="Platform operations" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Reliability command center"
                    title="System operations"
                    description={`Monitor shared infrastructure and recover safe operational failures. Environment: ${environment}.`}
                />
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {checks.map(([label, healthy, detail]) => (
                        <div
                            key={label}
                            className="rounded-2xl border bg-card/90 p-4"
                        >
                            <div className="flex items-center justify-between">
                                <p className="font-semibold">{label}</p>
                                {healthy ? (
                                    <CheckCircle2 className="size-5 text-emerald-500" />
                                ) : (
                                    <AlertTriangle className="size-5 text-amber-500" />
                                )}
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                {detail}
                            </p>
                        </div>
                    ))}
                </section>
                <section className="rounded-3xl border border-primary/15 bg-card/90 p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                        <div className="flex gap-3">
                            <DatabaseBackup className="size-5 text-primary" />
                            <div>
                                <h2 className="font-semibold">
                                    System-wide backups
                                </h2>
                                <p className="text-sm text-muted-foreground">
                                    Create and verify encrypted recovery points.
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
                    <div className="mt-5 grid gap-2">
                        {backups.length === 0 && (
                            <p className="rounded-xl border p-5 text-sm text-muted-foreground">
                                No backup records yet.
                            </p>
                        )}
                        {backups.map((item) => (
                            <div
                                key={item.id}
                                className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
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
                                            : item.status}
                                    </p>
                                </div>
                                <Badge variant="outline">
                                    {item.verifiedAt ? 'Verified' : item.status}
                                </Badge>
                                {item.status === 'completed' && (
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
                                )}
                            </div>
                        ))}
                    </div>
                </section>
                <section className="rounded-3xl border border-primary/15 bg-card/90 p-5">
                    <div className="flex gap-3">
                        <ServerCog className="size-5 text-primary" />
                        <div>
                            <h2 className="font-semibold">
                                Failed background jobs
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Only operational metadata is shown; job payloads
                                and tenant content stay private.
                            </p>
                        </div>
                    </div>
                    <div className="mt-5 grid gap-2">
                        {failedJobs.length === 0 && (
                            <p className="rounded-xl border p-5 text-sm text-muted-foreground">
                                No failed jobs. The queue is clear.
                            </p>
                        )}
                        {failedJobs.map((job) => (
                            <div
                                key={job.uuid}
                                className="grid gap-3 rounded-xl border p-4 sm:grid-cols-[1fr_auto_auto] sm:items-center"
                            >
                                <div>
                                    <p className="font-medium">{job.queue}</p>
                                    <p className="text-xs break-all text-muted-foreground">
                                        {job.uuid} ·{' '}
                                        {new Date(
                                            job.failedAt,
                                        ).toLocaleString()}
                                    </p>
                                </div>
                                <Form {...retryJob.form(job.uuid)}>
                                    {({ processing }) => (
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            disabled={processing}
                                        >
                                            <RefreshCw /> Retry
                                        </Button>
                                    )}
                                </Form>
                                <Form {...forgetJob.form(job.uuid)}>
                                    {({ processing }) => (
                                        <Button
                                            size="sm"
                                            variant="destructive"
                                            disabled={processing}
                                        >
                                            <Trash2 /> Remove
                                        </Button>
                                    )}
                                </Form>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="grid gap-4 xl:grid-cols-[1fr_1.2fr]">
                    <Form
                        {...publishAnnouncement.form()}
                        resetOnSuccess
                        className="rounded-3xl border border-primary/15 bg-card/90 p-5"
                    >
                        {({ processing, errors }) => (
                            <>
                                <div className="flex gap-3">
                                    <BellRing className="size-5 text-primary" />
                                    <div>
                                        <h2 className="font-semibold">
                                            Publish announcement
                                        </h2>
                                        <p className="text-sm text-muted-foreground">
                                            Show a time-bound service or
                                            maintenance message to signed-in
                                            users.
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-5 grid gap-3">
                                    <Input
                                        name="title"
                                        placeholder="Announcement title"
                                        required
                                    />
                                    <textarea
                                        name="message"
                                        placeholder="What users need to know"
                                        required
                                        className="min-h-28 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                    />
                                    <select
                                        name="severity"
                                        defaultValue="info"
                                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        <option value="info">
                                            Information
                                        </option>
                                        <option value="warning">Warning</option>
                                        <option value="critical">
                                            Critical
                                        </option>
                                    </select>
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <Input
                                            name="starts_at"
                                            type="datetime-local"
                                        />
                                        <Input
                                            name="ends_at"
                                            type="datetime-local"
                                        />
                                    </div>
                                    {Object.values(errors).length > 0 && (
                                        <p className="text-sm text-destructive">
                                            {Object.values(errors)[0]}
                                        </p>
                                    )}
                                    <Button disabled={processing}>
                                        {processing ? (
                                            <Spinner />
                                        ) : (
                                            <BellRing />
                                        )}{' '}
                                        Publish
                                    </Button>
                                </div>
                            </>
                        )}
                    </Form>
                    <div className="rounded-3xl border border-primary/15 bg-card/90 p-5">
                        <h2 className="font-semibold">
                            Published announcements
                        </h2>
                        <div className="mt-4 grid gap-2">
                            {announcements.length === 0 && (
                                <p className="text-sm text-muted-foreground">
                                    No announcements published.
                                </p>
                            )}
                            {announcements.map((item) => (
                                <article
                                    key={item.id}
                                    className="rounded-xl border p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <Badge variant="outline">
                                                {item.severity}
                                            </Badge>
                                            <h3 className="mt-2 font-medium">
                                                {item.title}
                                            </h3>
                                            <p className="mt-1 text-sm text-muted-foreground">
                                                {item.message}
                                            </p>
                                        </div>
                                        <Form
                                            {...withdrawAnnouncement.form(
                                                item.id,
                                            )}
                                        >
                                            {({ processing }) => (
                                                <Button
                                                    size="icon"
                                                    variant="ghost"
                                                    disabled={processing}
                                                    aria-label="Withdraw announcement"
                                                >
                                                    <Trash2 />
                                                </Button>
                                            )}
                                        </Form>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </div>
                </section>
            </div>
        </>
    );
}
