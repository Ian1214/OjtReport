import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

type DashboardHeroProps = {
    eyebrow: string;
    title: string;
    description: string;
    actions?: ReactNode;
};

export function DashboardHero({
    eyebrow,
    title,
    description,
    actions,
}: DashboardHeroProps) {
    return (
        <section className="relative overflow-hidden rounded-3xl border border-primary/15 bg-card px-5 py-7 shadow-[0_24px_80px_-36px_color-mix(in_oklab,var(--primary)_55%,transparent)] sm:px-7 sm:py-9">
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
    accent?: 'primary' | 'success';
};

export function MetricCard({
    icon: Icon,
    label,
    value,
    detail,
    accent = 'primary',
}: MetricCardProps) {
    const iconClass =
        accent === 'success'
            ? 'bg-emerald-500/10 text-emerald-600'
            : 'bg-primary/10 text-primary';

    return (
        <section className="group relative overflow-hidden rounded-2xl border border-border/80 bg-card/90 p-5 shadow-[0_12px_30px_-20px_rgb(0_0_0_/_0.5)] transition duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_20px_44px_-24px_color-mix(in_oklab,var(--primary)_45%,transparent)]">
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
