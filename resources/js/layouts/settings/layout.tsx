import { Link } from '@inertiajs/react';
import {
    Gauge,
    Palette,
    ShieldCheck,
    SlidersHorizontal,
    UserRound,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { Button } from '@/components/ui/button';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editPreferences } from '@/routes/preferences';
import { edit } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { index as settingsIndex } from '@/routes/settings';
import type { NavItem } from '@/types';

const sidebarNavItems: NavItem[] = [
    {
        title: 'Overview',
        href: settingsIndex(),
        icon: Gauge,
    },
    {
        title: 'Profile',
        href: edit(),
        icon: UserRound,
    },
    {
        title: 'Security',
        href: editSecurity(),
        icon: ShieldCheck,
    },
    {
        title: 'Preferences',
        href: editPreferences(),
        icon: SlidersHorizontal,
    },
    {
        title: 'Appearance',
        href: editAppearance(),
        icon: Palette,
    },
];

export default function SettingsLayout({ children }: PropsWithChildren) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <section className="command-panel relative mb-6 overflow-hidden rounded-3xl border border-primary/20 bg-card/85 px-5 py-6 backdrop-blur-sm sm:px-7">
                <div className="absolute inset-x-0 top-0 h-px bg-linear-to-r from-transparent via-primary/80 to-transparent" />
                <div className="absolute -top-20 right-0 size-52 rounded-full bg-primary/10 blur-3xl" />
                <div className="relative flex items-center gap-4">
                    <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/25 bg-primary/10 text-primary shadow-[0_0_28px_-12px_var(--primary)]">
                        <SlidersHorizontal className="size-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-semibold tracking-[0.2em] text-primary uppercase">
                            Control center
                        </p>
                        <h1 className="mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
                            Settings
                        </h1>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Personalize your workspace, alerts, and account
                            protection.
                        </p>
                    </div>
                </div>
            </section>

            <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
                <aside className="min-w-0">
                    <nav
                        className="command-panel grid grid-cols-2 gap-1 rounded-2xl border border-border/75 bg-card/80 p-2 backdrop-blur-sm sm:grid-cols-5 lg:sticky lg:top-20 lg:grid-cols-1"
                        aria-label="Settings"
                    >
                        {sidebarNavItems.map((item, index) => (
                            <Button
                                key={`${toUrl(item.href)}-${index}`}
                                size="sm"
                                variant="ghost"
                                asChild
                                className={cn(
                                    'h-11 w-full justify-start gap-2.5 border border-transparent px-3',
                                    {
                                        'border-primary/20 bg-primary/10 text-primary shadow-[inset_3px_0_var(--primary)]':
                                            isCurrentOrParentUrl(item.href),
                                    },
                                )}
                            >
                                <Link href={item.href}>
                                    {item.icon && (
                                        <item.icon className="size-4" />
                                    )}
                                    {item.title}
                                </Link>
                            </Button>
                        ))}
                    </nav>
                </aside>

                <div className="min-w-0">
                    <section className="command-panel max-w-3xl space-y-10 rounded-2xl border border-border/75 bg-card/82 p-5 backdrop-blur-sm sm:p-7">
                        {children}
                    </section>
                </div>
            </div>
        </div>
    );
}
