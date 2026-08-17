import { Link, usePage } from '@inertiajs/react';
import { MoreHorizontal } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import {
    Sheet,
    SheetClose,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from '@/components/ui/sheet';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { roleNavigation } from '@/lib/role-navigation';
import type { NavigationCounts, NavSection, User } from '@/types';

export function AppMobileNav() {
    const { auth, navigation } = usePage<{
        auth: { user: User };
        navigation: NavigationCounts;
    }>().props;
    const { isCurrentOrParentUrl } = useCurrentUrl();
    const { primaryItems, moreSections } = roleNavigation(
        auth.user.role,
        navigation,
        auth.user.company_permissions ?? [],
    );
    const moreItems = moreSections.flatMap((section) => section.items);
    const isMoreActive = moreItems.some((item) =>
        isCurrentOrParentUrl(item.href),
    );

    return (
        <nav
            aria-label={`${roleName(auth.user.role)} mobile navigation`}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-primary/15 bg-background/92 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-18px_55px_-30px_color-mix(in_oklab,var(--primary)_60%,transparent)] backdrop-blur-2xl before:absolute before:inset-x-1/4 before:top-0 before:h-px before:bg-linear-to-r before:from-transparent before:via-primary/70 before:to-transparent md:hidden"
        >
            <div className="mx-auto grid max-w-lg grid-cols-5 gap-1">
                {primaryItems.map((item) => {
                    const isActive = isCurrentOrParentUrl(item.href);

                    return (
                        <Link
                            key={item.title}
                            href={item.href}
                            prefetch
                            aria-current={isActive ? 'page' : undefined}
                            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-1 text-[11px] font-medium transition-all ${isActive ? 'border-primary/20 bg-primary/10 text-primary shadow-[inset_0_1px_color-mix(in_oklab,var(--primary)_20%,transparent)]' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                            {item.icon && <item.icon className="size-5" />}
                            <span className="max-w-full truncate">
                                {item.mobileTitle ?? item.title}
                            </span>
                            {item.badge !== undefined && item.badge > 0 && (
                                <CountBadge count={item.badge} compact />
                            )}
                        </Link>
                    );
                })}

                <Sheet>
                    <SheetTrigger asChild>
                        <button
                            type="button"
                            aria-label="Open more options"
                            aria-current={isMoreActive ? 'page' : undefined}
                            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl border px-1 text-[11px] font-medium transition-colors ${isMoreActive ? 'border-primary/20 bg-primary/10 text-primary' : 'border-transparent text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                            <MoreHorizontal className="size-5" />
                            <span>More</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent
                        side="bottom"
                        className="max-h-[82dvh] rounded-t-3xl border-primary/15 bg-background/97 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-[0_-28px_80px_-30px_color-mix(in_oklab,var(--primary)_45%,transparent)] backdrop-blur-2xl"
                    >
                        <SheetHeader className="border-b px-5 pt-5 pb-4 text-left">
                            <div className="flex items-center gap-3">
                                <div className="grid size-10 place-items-center rounded-xl border bg-muted/70 shadow-sm">
                                    <AppLogoIcon className="size-7 object-contain" />
                                </div>
                                <div>
                                    <SheetTitle>
                                        {roleName(auth.user.role)} menu
                                    </SheetTitle>
                                    <SheetDescription>
                                        {auth.user.name}
                                    </SheetDescription>
                                </div>
                            </div>
                        </SheetHeader>
                        <div className="grid gap-5 overflow-y-auto px-4 py-5 pb-2">
                            {moreSections.map((section) => (
                                <MobileSection
                                    key={section.title}
                                    section={section}
                                    isCurrentOrParentUrl={isCurrentOrParentUrl}
                                />
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
}

function MobileSection({
    section,
    isCurrentOrParentUrl,
}: {
    section: NavSection;
    isCurrentOrParentUrl: (
        href: NavSection['items'][number]['href'],
    ) => boolean;
}) {
    return (
        <section>
            <p className="mb-2 px-1 text-[10px] font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {section.title}
            </p>
            <div className="grid gap-2">
                {section.items.map((item) => (
                    <SheetClose asChild key={item.title}>
                        <Link
                            href={item.href}
                            prefetch
                            className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-sm font-medium transition-colors ${isCurrentOrParentUrl(item.href) ? 'border-primary/25 bg-primary/8 text-primary shadow-sm' : 'bg-card hover:bg-muted/60'}`}
                        >
                            {item.icon && <item.icon className="size-5" />}
                            <span className="flex-1">{item.title}</span>
                            {item.badge !== undefined && item.badge > 0 && (
                                <CountBadge count={item.badge} />
                            )}
                        </Link>
                    </SheetClose>
                ))}
            </div>
        </section>
    );
}

function CountBadge({
    count,
    compact = false,
}: {
    count: number;
    compact?: boolean;
}) {
    return (
        <span
            className={
                compact
                    ? 'absolute top-1.5 right-[20%] grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground'
                    : 'rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground'
            }
        >
            {count > 99 ? '99+' : count}
        </span>
    );
}

function roleName(role: User['role']): string {
    return role === 'platform_admin'
        ? 'Platform administrator'
        : role === 'company_admin'
          ? 'Company administrator'
          : role === 'company_staff'
            ? 'Company team member'
            : role === 'supervisor'
              ? 'Supervisor'
              : role === 'school_coordinator'
                ? 'School coordinator'
                : 'OJT';
}
