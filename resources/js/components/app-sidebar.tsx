import { Link, usePage } from '@inertiajs/react';
import {
    BookOpen,
    Bell,
    ClipboardPlus,
    CalendarSync,
    FolderGit2,
    LayoutGrid,
    MessageCircle,
    ListChecks,
    UsersRound,
    Clock8,
    ScrollText,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { index as attendanceCorrections } from '@/routes/attendance-corrections';
import { index as activityLogs } from '@/routes/company/activity-logs';
import { index as approvalInbox } from '@/routes/company/approvals';
import { edit as attendancePolicy } from '@/routes/company/attendance-policy';
import { index as managedOjtsIndex } from '@/routes/company/ojts';
import { index as messagesIndex } from '@/routes/messages';
import { index as notificationsIndex } from '@/routes/notifications';
import { index as reportsIndex } from '@/routes/reports';
import { dashboard as supervisorDashboard } from '@/routes/supervisor';
import type { NavItem } from '@/types';

const mainNavItemsBase: NavItem[] = [
    {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Daily reports',
        href: reportsIndex(),
        icon: ClipboardPlus,
    },
    {
        title: 'Messages',
        href: messagesIndex(),
        icon: MessageCircle,
    },
];

const supervisorNavItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: supervisorDashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Messages',
        href: messagesIndex(),
        icon: MessageCircle,
    },
];

const footerNavItems: NavItem[] = [
    {
        title: 'Repository',
        href: 'https://github.com/laravel/react-starter-kit',
        icon: FolderGit2,
    },
    {
        title: 'Documentation',
        href: 'https://laravel.com/docs/starter-kits#react',
        icon: BookOpen,
    },
];

export function AppSidebar() {
    const { auth, navigation } = usePage<{
        navigation: {
            pendingReportsCount: number;
            unreadNotificationsCount: number;
            pendingCorrectionsCount: number;
        };
    }>().props;
    const notificationsItem: NavItem = {
        title: 'Notifications',
        href: notificationsIndex(),
        icon: Bell,
        badge: navigation.unreadNotificationsCount,
    };
    const correctionsItem: NavItem = {
        title: 'Time Corrections',
        href: attendanceCorrections(),
        icon: CalendarSync,
        badge: navigation.pendingCorrectionsCount,
    };
    const companyNavItems: NavItem[] = [
        mainNavItemsBase[0],
        {
            title: 'Approval Inbox',
            href: approvalInbox(),
            icon: ListChecks,
            badge: navigation.pendingReportsCount,
        },
        {
            title: 'Managed OJTs',
            href: managedOjtsIndex(),
            icon: UsersRound,
        },
        {
            title: 'Attendance Policy',
            href: attendancePolicy(),
            icon: Clock8,
        },
        {
            title: 'Activity Logs',
            href: activityLogs(),
            icon: ScrollText,
        },
        correctionsItem,
        notificationsItem,
    ];
    const mainNavItems =
        auth.user.role === 'company_admin'
            ? companyNavItems
            : auth.user.role === 'supervisor'
              ? [...supervisorNavItems, correctionsItem, notificationsItem]
              : [...mainNavItemsBase, correctionsItem, notificationsItem];

    return (
        <Sidebar collapsible="icon" variant="inset">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            <SidebarContent>
                <NavMain items={mainNavItems} />
            </SidebarContent>

            <SidebarFooter>
                <NavFooter items={footerNavItems} className="mt-auto" />
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
