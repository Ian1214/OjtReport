import { Link, usePage } from '@inertiajs/react';
import {
    Bell,
    CalendarSync,
    CalendarDays,
    ClipboardList,
    Clock8,
    FileClock,
    History,
    Home,
    ListChecks,
    MessageCircle,
    MoreHorizontal,
    Palette,
    ShieldCheck,
    UserRound,
    UsersRound,
    FileCheck2,
    ServerCog,
} from 'lucide-react';
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
import { dashboard } from '@/routes';
import { edit as appearanceSettings } from '@/routes/appearance';
import { index as attendanceCorrections } from '@/routes/attendance-corrections';
import { index as activityLogs } from '@/routes/company/activity-logs';
import { index as approvalInbox } from '@/routes/company/approvals';
import { edit as attendancePolicy } from '@/routes/company/attendance-policy';
import { index as managedOjtsIndex } from '@/routes/company/ojts';
import { index as operationsIndex } from '@/routes/company/operations';
import { index as dtrSubmissionsIndex } from '@/routes/dtr-submissions';
import { index as leaveIndex } from '@/routes/leave';
import { index as messagesIndex } from '@/routes/messages';
import { index as notificationsIndex } from '@/routes/notifications';
import { edit as profileSettings } from '@/routes/profile';
import { index as reportsIndex } from '@/routes/reports';
import { edit as securitySettings } from '@/routes/security';
import { dashboard as supervisorDashboard } from '@/routes/supervisor';
import { index as tasksIndex } from '@/routes/tasks';
import type { NavItem, User } from '@/types';

type MobileItem = NavItem & { badge?: number };

export function AppMobileNav() {
    const { auth, navigation } = usePage<{
        auth: { user: User };
        navigation: {
            pendingReportsCount: number;
            unreadMessagesCount: number;
            unreadNotificationsCount: number;
            pendingCorrectionsCount: number;
        };
    }>().props;
    const { currentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const { primaryItems, moreItems } = roleItems(auth.user.role, navigation);
    const isMoreActive = moreItems.some((item) =>
        isCurrentOrParentUrl(item.href),
    );

    return (
        <nav
            aria-label={`${roleName(auth.user.role)} mobile navigation`}
            className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-2 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-[0_-12px_35px_-24px_rgb(0_0_0_/_0.7)] backdrop-blur-xl md:hidden"
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
                            className={`relative flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                            {item.icon && <item.icon className="size-5" />}
                            <span className="max-w-full truncate">
                                {item.title}
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
                            className={`flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl px-1 text-[11px] font-medium transition-colors ${isMoreActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                        >
                            <MoreHorizontal className="size-5" />
                            <span>More</span>
                        </button>
                    </SheetTrigger>
                    <SheetContent
                        side="bottom"
                        className="max-h-[82dvh] rounded-t-3xl pb-[max(1rem,env(safe-area-inset-bottom))]"
                    >
                        <SheetHeader className="border-b px-5 pt-5 pb-4 text-left">
                            <SheetTitle>More options</SheetTitle>
                            <SheetDescription>
                                Settings and less frequent tools.
                            </SheetDescription>
                        </SheetHeader>
                        <div className="grid gap-2 overflow-y-auto px-4 pb-2">
                            {moreItems.map((item) => (
                                <SheetClose asChild key={item.title}>
                                    <Link
                                        href={item.href}
                                        className={`flex min-h-14 items-center gap-3 rounded-2xl border px-4 text-sm font-medium ${isCurrentOrParentUrl(item.href, currentUrl) ? 'border-primary/25 bg-primary/8 text-primary' : 'bg-card hover:bg-muted/60'}`}
                                    >
                                        {item.icon && (
                                            <item.icon className="size-5" />
                                        )}
                                        <span className="flex-1">
                                            {item.title}
                                        </span>
                                        {item.badge !== undefined &&
                                            item.badge > 0 && (
                                                <CountBadge
                                                    count={item.badge}
                                                />
                                            )}
                                    </Link>
                                </SheetClose>
                            ))}
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </nav>
    );
}

function roleItems(
    role: User['role'],
    navigation: {
        pendingReportsCount: number;
        unreadMessagesCount: number;
        unreadNotificationsCount: number;
        pendingCorrectionsCount: number;
    },
): { primaryItems: MobileItem[]; moreItems: MobileItem[] } {
    const settings: MobileItem[] = [
        { title: 'Profile', href: profileSettings(), icon: UserRound },
        { title: 'Security', href: securitySettings(), icon: ShieldCheck },
        { title: 'Appearance', href: appearanceSettings(), icon: Palette },
    ];

    if (role === 'company_admin') {
        return {
            primaryItems: [
                { title: 'Home', href: dashboard(), icon: Home },
                { title: 'OJTs', href: managedOjtsIndex(), icon: UsersRound },
                {
                    title: 'Reviews',
                    href: approvalInbox(),
                    icon: ClipboardList,
                    badge: navigation.pendingReportsCount,
                },
                {
                    title: 'Alerts',
                    href: notificationsIndex(),
                    icon: Bell,
                    badge: navigation.unreadNotificationsCount,
                },
            ],
            moreItems: [
                {
                    title: 'Work schedule',
                    href: attendancePolicy(),
                    icon: Clock8,
                },
                {
                    title: 'Time requests',
                    href: attendanceCorrections(),
                    icon: FileClock,
                    badge: navigation.pendingCorrectionsCount,
                },
                { title: 'Audit trail', href: activityLogs(), icon: History },
                {
                    title: 'Leave & calendar',
                    href: leaveIndex(),
                    icon: CalendarDays,
                },
                {
                    title: 'DTR sign-off',
                    href: dtrSubmissionsIndex(),
                    icon: FileCheck2,
                },
                {
                    title: 'System operations',
                    href: operationsIndex(),
                    icon: ServerCog,
                },
                ...settings,
            ],
        };
    }

    if (role === 'supervisor') {
        return {
            primaryItems: [
                {
                    title: 'My OJTs',
                    href: supervisorDashboard(),
                    icon: UsersRound,
                },
                {
                    title: 'Messages',
                    href: messagesIndex(),
                    icon: MessageCircle,
                    badge: navigation.unreadMessagesCount,
                },
                {
                    title: 'Requests',
                    href: attendanceCorrections(),
                    icon: CalendarSync,
                    badge: navigation.pendingCorrectionsCount,
                },
                {
                    title: 'Alerts',
                    href: notificationsIndex(),
                    icon: Bell,
                    badge: navigation.unreadNotificationsCount,
                },
            ],
            moreItems: [
                {
                    title: 'Leave requests',
                    href: leaveIndex(),
                    icon: CalendarDays,
                },
                {
                    title: 'DTR sign-off',
                    href: dtrSubmissionsIndex(),
                    icon: FileCheck2,
                },
                ...settings,
            ],
        };
    }

    return {
        primaryItems: [
            { title: 'Home', href: dashboard(), icon: Home },
            { title: 'Tasks', href: tasksIndex(), icon: ListChecks },
            { title: 'Reports', href: reportsIndex(), icon: ClipboardList },
            {
                title: 'Messages',
                href: messagesIndex(),
                icon: MessageCircle,
                badge: navigation.unreadMessagesCount,
            },
        ],
        moreItems: [
            {
                title: 'Notifications',
                href: notificationsIndex(),
                icon: Bell,
                badge: navigation.unreadNotificationsCount,
            },
            {
                title: 'Time corrections',
                href: attendanceCorrections(),
                icon: CalendarSync,
                badge: navigation.pendingCorrectionsCount,
            },
            { title: 'Leave', href: leaveIndex(), icon: CalendarDays },
            {
                title: 'DTR sign-off',
                href: dtrSubmissionsIndex(),
                icon: FileCheck2,
            },
            ...settings,
        ],
    };
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
    return role === 'company_admin'
        ? 'Company administrator'
        : role === 'supervisor'
          ? 'Supervisor'
          : 'OJT';
}
