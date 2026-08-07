import { Head, Link, router } from '@inertiajs/react';
import {
    Activity,
    Filter,
    LogIn,
    Search,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import { useState } from 'react';
import { DashboardHero } from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { index as activityLogs } from '@/routes/company/activity-logs';

type Log = {
    id: number;
    event: string;
    description: string;
    properties: Record<string, unknown>;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    actor: { name: string; role: string } | null;
};

type Props = {
    logs: {
        data: Log[];
        current_page: number;
        last_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
    events: string[];
    filters: { search: string; event: string };
};

export default function ActivityLogs({ logs, events, filters }: Props) {
    const [search, setSearch] = useState(filters.search);
    const [event, setEvent] = useState(filters.event);

    function submit(eventObject: React.FormEvent<HTMLFormElement>) {
        eventObject.preventDefault();
        router.get(
            activityLogs.url(),
            { search: search || undefined, event: event || undefined },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title="Activity Logs" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Security and accountability"
                    title="Activity Logs"
                    description="Review company-scoped sign-ins, account actions, attendance events, approvals, and policy acceptance."
                    actions={
                        <Badge variant="secondary">{logs.total} records</Badge>
                    }
                />

                <Card>
                    <CardContent className="p-5">
                        <form
                            onSubmit={submit}
                            className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem_auto] md:items-end"
                        >
                            <div className="grid gap-2">
                                <Label htmlFor="log-search">Search</Label>
                                <div className="relative">
                                    <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                                    <Input
                                        id="log-search"
                                        value={search}
                                        onChange={(e) =>
                                            setSearch(e.target.value)
                                        }
                                        placeholder="Actor or activity"
                                        className="pl-9"
                                    />
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="log-event">Event</Label>
                                <select
                                    id="log-event"
                                    value={event}
                                    onChange={(e) => setEvent(e.target.value)}
                                    className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                >
                                    <option value="">All events</option>
                                    {events.map((value) => (
                                        <option key={value} value={value}>
                                            {eventLabel(value)}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit">
                                    <Filter /> Filter
                                </Button>
                                {(filters.search || filters.event) && (
                                    <Button variant="outline" asChild>
                                        <Link href={activityLogs()}>Reset</Link>
                                    </Button>
                                )}
                            </div>
                        </form>
                    </CardContent>
                </Card>

                {logs.data.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                            <Activity className="size-8 text-muted-foreground" />
                            <p className="font-medium">No activity found</p>
                            <p className="text-sm text-muted-foreground">
                                New company activity will appear here.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-3">
                        {logs.data.map((log) => (
                            <LogRow key={log.id} log={log} />
                        ))}
                    </div>
                )}

                {(logs.prev_page_url || logs.next_page_url) && (
                    <div className="flex items-center justify-between gap-3">
                        <PageButton href={logs.prev_page_url}>
                            Previous
                        </PageButton>
                        <span className="text-sm text-muted-foreground">
                            Page {logs.current_page} of {logs.last_page}
                        </span>
                        <PageButton href={logs.next_page_url}>Next</PageButton>
                    </div>
                )}
            </div>
        </>
    );
}

function LogRow({ log }: { log: Log }) {
    const Icon =
        log.event === 'user.login'
            ? LogIn
            : log.event === 'terms.accepted'
              ? ShieldCheck
              : UserRound;

    return (
        <Card className="rounded-xl">
            <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
                <div className="flex min-w-0 gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        <Icon className="size-5" />
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-medium">{log.description}</p>
                            <Badge variant="outline">
                                {eventLabel(log.event)}
                            </Badge>
                        </div>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {log.actor?.name ?? 'Deleted user'} ·{' '}
                            {roleLabel(log.actor?.role)}
                            {log.ipAddress ? ` · ${log.ipAddress}` : ''}
                        </p>
                    </div>
                </div>
                <time
                    className="shrink-0 text-sm text-muted-foreground"
                    dateTime={log.createdAt}
                >
                    {formatDateTime(log.createdAt)}
                </time>
            </CardContent>
        </Card>
    );
}

function PageButton({
    href,
    children,
}: {
    href: string | null;
    children: React.ReactNode;
}) {
    return (
        <Button variant="outline" disabled={!href} asChild={Boolean(href)}>
            {href ? (
                <Link href={href}>{children}</Link>
            ) : (
                <span>{children}</span>
            )}
        </Button>
    );
}
function eventLabel(value: string): string {
    return value
        .split('.')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}
function roleLabel(value?: string): string {
    return value ? value.replaceAll('_', ' ') : 'Unknown role';
}
function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

ActivityLogs.layout = {
    breadcrumbs: [{ title: 'Activity Logs', href: activityLogs() }],
};
