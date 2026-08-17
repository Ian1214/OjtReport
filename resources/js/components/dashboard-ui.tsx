import {
    AlertTriangle,
    CheckCircle2,
    Circle,
    CircleDot,
    Clock3,
    XCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type DashboardHeroProps = {
    eyebrow: string;
    title: string;
    description: string;
    actions?: ReactNode;
};

export function DashboardWorkspace({
    children,
    className,
}: {
    children: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'relative isolate flex flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_85%_0%,color-mix(in_oklab,var(--primary)_11%,transparent),transparent_34%),radial-gradient(circle_at_5%_95%,color-mix(in_oklab,var(--primary)_5%,transparent),transparent_28%)]',
                className,
            )}
        >
            <div className="pointer-events-none absolute inset-0 -z-10 [background-image:linear-gradient(to_right,var(--primary)_1px,transparent_1px),linear-gradient(to_bottom,var(--primary)_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.035]" />
            <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-6 p-4 sm:p-6 lg:p-8">
                {children}
            </div>
        </div>
    );
}

export function DashboardSectionHeader({
    title,
    description,
    aside,
}: {
    title: string;
    description: string;
    aside?: ReactNode;
}) {
    return (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
                <h2 className="text-lg font-semibold tracking-tight sm:text-xl">
                    {title}
                </h2>
                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
            </div>
            {aside && <div className="shrink-0">{aside}</div>}
        </div>
    );
}

export function DashboardHero({
    eyebrow,
    title,
    description,
    actions,
}: DashboardHeroProps) {
    return (
        <section className="command-panel relative overflow-hidden rounded-3xl border border-primary/20 bg-card/88 px-5 py-7 backdrop-blur-sm sm:px-7 sm:py-9">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent" />
            <div className="absolute -top-24 -right-20 size-64 rounded-full bg-primary/12 blur-3xl" />
            <div className="absolute right-1/4 -bottom-32 size-56 rounded-full bg-emerald-500/10 blur-3xl" />
            <div className="absolute top-0 right-12 h-full w-px bg-linear-to-b from-primary/25 via-transparent to-transparent" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                <div className="max-w-2xl">
                    <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/8 px-3 py-1">
                        <span className="size-1.5 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
                        <p className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
                            {eyebrow}
                        </p>
                    </div>
                    <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
                        {title}
                    </h1>
                    <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
                        {description}
                    </p>
                </div>
                {actions && <div className="shrink-0">{actions}</div>}
            </div>
        </section>
    );
}

type MetricCardProps = {
    icon: LucideIcon;
    label: string;
    value: string | number | null;
    detail?: string;
    accent?: 'primary' | 'success' | 'warning';
};

export function MetricCard({
    icon: Icon,
    label,
    value,
    detail,
    accent = 'primary',
}: MetricCardProps) {
    const iconClass = {
        primary: 'bg-primary/10 text-primary',
        success: 'bg-emerald-500/10 text-emerald-600',
        warning: 'bg-amber-500/10 text-amber-600',
    }[accent];

    return (
        <section className="command-panel group relative overflow-hidden rounded-2xl border border-border/80 bg-card/88 p-5 backdrop-blur-sm transition duration-200 hover:border-primary/25 hover:shadow-[0_20px_44px_-24px_color-mix(in_oklab,var(--primary)_45%,transparent)] motion-safe:hover:-translate-y-0.5">
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/55 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
            <div className="flex items-start justify-between gap-4">
                <div>
                    <p className="text-sm font-medium text-muted-foreground">
                        {label}
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight">
                        {value ?? 'Not set'}
                    </p>
                    {detail && (
                        <p className="mt-2 text-xs text-muted-foreground">
                            {detail}
                        </p>
                    )}
                </div>
                <div
                    className={`rounded-xl p-2.5 ring-1 ring-current/10 ring-inset ${iconClass}`}
                >
                    <Icon className="size-5" />
                </div>
            </div>
        </section>
    );
}

export type WorkspaceStatus =
    | 'active'
    | 'approved'
    | 'completed'
    | 'failed'
    | 'finished'
    | 'in_progress'
    | 'late'
    | 'not_started'
    | 'offline'
    | 'ongoing'
    | 'online'
    | 'on_time'
    | 'pending'
    | 'queued'
    | 'rejected'
    | 'sent'
    | 'submitted'
    | 'timed_in';

const statusStyles: Record<
    WorkspaceStatus,
    { icon: LucideIcon; label: string; className: string }
> = {
    active: status('Active', CircleDot, 'primary'),
    approved: status('Approved', CheckCircle2, 'success'),
    completed: status('Completed', CheckCircle2, 'success'),
    failed: status('Failed', XCircle, 'danger'),
    finished: status('Finished', CheckCircle2, 'success'),
    in_progress: status('In progress', CircleDot, 'primary'),
    late: status('Late', AlertTriangle, 'danger'),
    not_started: status('Not started', Circle, 'neutral'),
    offline: status('Offline', Circle, 'neutral'),
    ongoing: status('Ongoing', CircleDot, 'primary'),
    online: status('Online', CircleDot, 'success'),
    on_time: status('On time', CheckCircle2, 'success'),
    pending: status('Pending', Clock3, 'warning'),
    queued: status('Queued', Clock3, 'warning'),
    rejected: status('Needs changes', AlertTriangle, 'danger'),
    sent: status('Sent', CheckCircle2, 'success'),
    submitted: status('Submitted', Clock3, 'warning'),
    timed_in: status('Timed in', CircleDot, 'primary'),
};

export function StatusBadge({
    status: currentStatus,
    label,
    className,
}: {
    status: WorkspaceStatus;
    label?: string;
    className?: string;
}) {
    const presentation = statusStyles[currentStatus];
    const Icon = presentation.icon;

    return (
        <span
            className={cn(
                'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold',
                presentation.className,
                className,
            )}
        >
            <Icon className="size-3.5" aria-hidden="true" />
            {label ?? presentation.label}
        </span>
    );
}

type NextActionCardProps = {
    icon: LucideIcon;
    eyebrow?: string;
    title: string;
    description: string;
    status?: ReactNode;
    details?: ReactNode;
    action?: ReactNode;
    tone?: 'primary' | 'success' | 'warning';
};

export function NextActionCard({
    icon: Icon,
    eyebrow = 'Next action',
    title,
    description,
    status: statusElement,
    details,
    action,
    tone = 'primary',
}: NextActionCardProps) {
    const toneStyles = {
        primary: 'border-primary/25 bg-primary/6 text-primary',
        success:
            'border-emerald-500/25 bg-emerald-500/6 text-emerald-700 dark:text-emerald-300',
        warning:
            'border-amber-500/25 bg-amber-500/6 text-amber-700 dark:text-amber-300',
    }[tone];

    return (
        <section
            className={cn(
                'command-panel relative overflow-hidden rounded-3xl border p-5 sm:p-6',
                toneStyles,
            )}
        >
            <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-current/60 to-transparent" />
            <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-start gap-3.5">
                    <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-current/15 bg-background/45 shadow-[inset_0_1px_color-mix(in_oklab,white_8%,transparent)]">
                        <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold tracking-[0.14em] uppercase">
                                {eyebrow}
                            </p>
                            {statusElement}
                        </div>
                        <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-foreground">
                            {title}
                        </h2>
                        <p className="mt-1.5 max-w-2xl text-sm leading-6 text-muted-foreground">
                            {description}
                        </p>
                        {details && <div className="mt-3">{details}</div>}
                    </div>
                </div>
                {action && <div className="shrink-0">{action}</div>}
            </div>
        </section>
    );
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    action,
    compact = false,
    className,
}: {
    icon: LucideIcon;
    title: string;
    description: string;
    action?: ReactNode;
    compact?: boolean;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-2xl border border-dashed border-primary/20 bg-primary/3 text-center',
                compact ? 'p-5' : 'p-8 sm:p-10',
                className,
            )}
        >
            <div className="absolute inset-x-1/4 top-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent" />
            <span className="mx-auto grid size-11 place-items-center rounded-2xl border border-primary/15 bg-primary/8 text-primary">
                <Icon className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-3 font-semibold">{title}</p>
            <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted-foreground">
                {description}
            </p>
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}

export function DashboardSkeleton() {
    return (
        <div
            role="status"
            aria-label="Loading workspace"
            className="grid gap-4 motion-safe:animate-pulse"
        >
            <div className="h-40 rounded-3xl border border-primary/10 bg-primary/5" />
            <div className="grid gap-4 sm:grid-cols-3">
                {[0, 1, 2].map((item) => (
                    <div
                        key={item}
                        className="h-28 rounded-2xl border border-border/60 bg-muted/35"
                    />
                ))}
            </div>
            <div className="h-64 rounded-3xl border border-border/60 bg-muted/25" />
            <span className="sr-only">Loading…</span>
        </div>
    );
}

function status(
    label: string,
    icon: LucideIcon,
    tone: 'primary' | 'success' | 'warning' | 'danger' | 'neutral',
) {
    const tones = {
        primary: 'border-primary/25 bg-primary/10 text-primary',
        success:
            'border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        warning:
            'border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        danger: 'border-destructive/25 bg-destructive/10 text-destructive',
        neutral: 'border-border bg-muted/45 text-muted-foreground',
    };

    return { label, icon, className: tones[tone] };
}
