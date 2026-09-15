import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Award,
    CheckCircle2,
    ClipboardCheck,
    ClockAlert,
    FileCheck2,
    FilePenLine,
    FolderClock,
    ListTodo,
    ShieldCheck,
    UserRoundCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
    DashboardHero,
    DashboardSectionHeader,
    DashboardWorkspace,
    EmptyState,
    StatusBadge,
} from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ActionTone = 'urgent' | 'attention' | 'standard';

type ActionItem = {
    id: string;
    title: string;
    description: string;
    count: number;
    href: string;
    priority: number;
    group: string;
    tone: ActionTone;
};

const icons: Record<string, LucideIcon> = {
    'daily-reports': ClipboardCheck,
    'time-corrections': ClockAlert,
    'leave-requests': FilePenLine,
    'dtr-sign-offs': FileCheck2,
    'document-reviews': FolderClock,
    'unassigned-ojts': UserRoundCheck,
    'certificate-signatures': Award,
    'evaluation-drafts': ClipboardCheck,
    'reports-needing-changes': FilePenLine,
    'unfinished-workdays': ClockAlert,
    'rejected-dtr-periods': FileCheck2,
    'rejected-documents': FolderClock,
    'onboarding-checklist': ListTodo,
};

export default function ActionCenter({ items }: { items: ActionItem[] }) {
    const groups = items.reduce<Record<string, ActionItem[]>>(
        (result, item) => {
            result[item.group] ??= [];
            result[item.group].push(item);

            return result;
        },
        {},
    );
    const total = items.reduce((sum, item) => sum + item.count, 0);
    const firstAction = items[0];

    return (
        <>
            <Head title="Action center" />
            <DashboardWorkspace>
                <DashboardHero
                    eyebrow="Priority workspace"
                    title="Action center"
                    description="One clear list of work assigned to your role. Each item opens its existing protected workflow—nothing is duplicated here."
                    actions={
                        <StatusBadge
                            status={total > 0 ? 'pending' : 'approved'}
                            label={
                                total > 0
                                    ? `${total} total action${total === 1 ? '' : 's'}`
                                    : 'All clear'
                            }
                        />
                    }
                />

                {items.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="You are all caught up"
                        description="There are no outstanding actions assigned to your role. New items will appear here automatically."
                    />
                ) : (
                    <>
                        {firstAction && (
                            <section className="relative overflow-hidden rounded-3xl border border-amber-400/25 bg-gradient-to-br from-amber-400/10 via-card/90 to-card p-5 shadow-sm md:p-6">
                                <div className="absolute -top-20 -right-20 size-52 rounded-full bg-amber-400/10 blur-3xl" />
                                <div className="relative flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                                    <div className="flex min-w-0 items-start gap-4">
                                        <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-amber-400/15 text-amber-500 ring-1 ring-amber-400/20">
                                            <AlertTriangle className="size-5" />
                                        </span>
                                        <div>
                                            <p className="text-xs font-semibold tracking-[0.16em] text-amber-500 uppercase">
                                                Recommended next action
                                            </p>
                                            <h2 className="mt-1 text-xl font-semibold tracking-tight">
                                                {firstAction.title}
                                            </h2>
                                            <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                                                {firstAction.description}
                                            </p>
                                        </div>
                                    </div>
                                    <Button asChild className="shrink-0">
                                        <Link href={firstAction.href}>
                                            Continue ({firstAction.count})
                                            <ArrowRight />
                                        </Link>
                                    </Button>
                                </div>
                            </section>
                        )}

                        {Object.entries(groups).map(([group, groupItems]) => (
                            <section key={group} className="grid gap-4">
                                <DashboardSectionHeader
                                    title={group}
                                    description={groupDescription(group)}
                                    aside={
                                        <Badge variant="secondary">
                                            {groupItems.reduce(
                                                (sum, item) => sum + item.count,
                                                0,
                                            )}{' '}
                                            pending
                                        </Badge>
                                    }
                                />
                                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                                    {groupItems.map((item) => (
                                        <ActionCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </section>
                        ))}

                        <aside className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/[0.04] p-4 text-sm text-muted-foreground">
                            <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                            <p>
                                Action Center only summarizes your assigned
                                work. Decisions, signatures, and edits still
                                happen in their original permission-controlled
                                pages.
                            </p>
                        </aside>
                    </>
                )}
            </DashboardWorkspace>
        </>
    );
}

function ActionCard({ item }: { item: ActionItem }) {
    const Icon = icons[item.id] ?? ListTodo;

    return (
        <article
            className={cn(
                'group flex min-h-56 flex-col rounded-3xl border bg-card/85 p-5 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md',
                item.tone === 'urgent' && 'border-amber-400/25',
                item.tone === 'attention' && 'border-primary/20',
                item.tone === 'standard' && 'border-border/70',
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <span
                    className={cn(
                        'grid size-11 place-items-center rounded-2xl ring-1',
                        item.tone === 'urgent' &&
                            'bg-amber-400/10 text-amber-500 ring-amber-400/20',
                        item.tone === 'attention' &&
                            'bg-primary/10 text-primary ring-primary/15',
                        item.tone === 'standard' &&
                            'bg-muted text-muted-foreground ring-border/60',
                    )}
                >
                    <Icon className="size-5" />
                </span>
                <Badge
                    variant={item.tone === 'urgent' ? 'default' : 'secondary'}
                >
                    {item.count} pending
                </Badge>
            </div>
            <h3 className="mt-5 text-lg font-semibold tracking-tight">
                {item.title}
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                {item.description}
            </p>
            <Button
                asChild
                variant="outline"
                className="mt-auto w-full justify-between sm:w-auto sm:self-start"
            >
                <Link href={item.href}>
                    Open workflow
                    <ArrowRight className="transition-transform group-hover:translate-x-0.5" />
                </Link>
            </Button>
        </article>
    );
}

function groupDescription(group: string): string {
    const descriptions: Record<string, string> = {
        Approvals: 'Decisions waiting for your role before work can continue.',
        'Official records':
            'Documents and signed records that need verification or completion.',
        People: 'Assignments needed to keep ownership and supervision clear.',
        'Daily work': 'Incomplete or returned work from attendance reporting.',
        'OJT development':
            'Saved coaching and evaluation work that is not yet final.',
        'Getting started':
            'Required setup steps for a complete and compliant internship record.',
    };

    return descriptions[group] ?? 'Items that need your attention.';
}
