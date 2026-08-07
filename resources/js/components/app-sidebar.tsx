import { Link, usePage, usePoll } from '@inertiajs/react';
import {
    Bell,
    ClipboardPlus,
    CalendarSync,
    LayoutGrid,
    MessageCircle,
    ListChecks,
    UsersRound,
    Clock8,
    ScrollText,
    CalendarDays,
    FileCheck2,
    ServerCog,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
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
import { index as operationsIndex } from '@/routes/company/operations';
import { index as dtrSubmissionsIndex } from '@/routes/dtr-submissions';
import { index as leaveIndex } from '@/routes/leave';
import { index as messagesIndex } from '@/routes/messages';
import { index as notificationsIndex } from '@/routes/notifications';
import { index as reportsIndex } from '@/routes/reports';
import { dashboard as supervisorDashboard } from '@/routes/supervisor';
import { index as tasksIndex } from '@/routes/tasks';
import type { NavItem } from '@/types';

const ojtNavItems: NavItem[] = [
    {
        title: 'Home',
        href: dashboard(),
        icon: LayoutGrid,
    },
    {
        title: 'Tasks',
        href: tasksIndex(),
        icon: ListChecks,
    },
    {
        title: 'Attendance & Reports',
        href: reportsIndex(),
        icon: ClipboardPlus,
    },
    { title: 'Leave', href: leaveIndex(), icon: CalendarDays },
    { title: 'DTR sign-off', href: dtrSubmissionsIndex(), icon: FileCheck2 },
    {
        title: 'Messages',
        href: messagesIndex(),
        icon: MessageCircle,
    },
];

const supervisorNavItems: NavItem[] = [
    {
        title: 'My OJTs',
        href: supervisorDashboard(),
        icon: LayoutGrid,
    },
    { title: 'Leave requests', href: leaveIndex(), icon: CalendarDays },
    { title: 'DTR sign-off', href: dtrSubmissionsIndex(), icon: FileCheck2 },
    {
        title: 'Messages',
        href: messagesIndex(),
        icon: MessageCircle,
    },
];

export function AppSidebar() {
    const { auth, navigation } = usePage<{
        navigation: {
            pendingReportsCount: number;
            unreadNotificationsCount: number;
            pendingCorrectionsCount: number;
            unreadMessagesCount: number;
        };
    }>().props;
    usePoll(15_000, { only: ['navigation'] }, { mode: 'rest' });

    const withMessageBadge = (item: NavItem): NavItem =>
        item.title === 'Messages'
            ? { ...item, badge: navigation.unreadMessagesCount }
            : item;
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
        {
            title: 'Overview',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Review Reports',
            href: approvalInbox(),
            icon: ListChecks,
            badge: navigation.pendingReportsCount,
        },
        {
            title: 'OJT Accounts',
            href: managedOjtsIndex(),
            icon: UsersRound,
        },
        {
            title: 'Work Schedule',
            href: attendancePolicy(),
            icon: Clock8,
        },
        { title: 'Leave & Calendar', href: leaveIndex(), icon: CalendarDays },
        {
            title: 'DTR sign-off',
            href: dtrSubmissionsIndex(),
            icon: FileCheck2,
        },
        {
            title: 'System Operations',
            href: operationsIndex(),
            icon: ServerCog,
        },
        {
            title: 'Audit Trail',
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
              ? [
                    ...supervisorNavItems.map(withMessageBadge),
                    correctionsItem,
                    notificationsItem,
                ]
              : [
                    ...ojtNavItems.map(withMessageBadge),
                    correctionsItem,
                    notificationsItem,
                ];

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
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
