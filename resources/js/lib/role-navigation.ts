import {
    Bell,
    Award,
    CalendarCheck2,
    CalendarDays,
    CalendarSync,
    ChartNoAxesCombined,
    ClipboardList,
    Clock8,
    FileCheck2,
    History,
    LayoutGrid,
    ListChecks,
    MessageCircle,
    Palette,
    ServerCog,
    ShieldCheck,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { dashboard } from '@/routes';
import { edit as appearanceSettings } from '@/routes/appearance';
import { index as attendanceCalendar } from '@/routes/attendance-calendar';
import { index as attendanceCorrections } from '@/routes/attendance-corrections';
import { index as certificatesIndex } from '@/routes/certificates';
import { index as activityLogs } from '@/routes/company/activity-logs';
import { index as analyticsIndex } from '@/routes/company/analytics';
import { index as approvalInbox } from '@/routes/company/approvals';
import { index as attendanceMonitorIndex } from '@/routes/company/attendance-monitor';
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
import type { NavigationCounts, NavItem, NavSection, User } from '@/types';

export type RoleNavigation = {
    sections: NavSection[];
    primaryItems: NavItem[];
    moreSections: NavSection[];
};

export function roleNavigation(
    role: User['role'],
    counts: NavigationCounts,
): RoleNavigation {
    const notifications: NavItem = {
        title: 'Notifications',
        mobileTitle: 'Alerts',
        href: notificationsIndex(),
        icon: Bell,
        badge: counts.unreadNotificationsCount,
    };
    const corrections: NavItem = {
        title: 'Time Corrections',
        mobileTitle: 'Requests',
        href: attendanceCorrections(),
        icon: CalendarSync,
        badge: counts.pendingCorrectionsCount,
    };
    const messages: NavItem = {
        title: 'Messages',
        href: messagesIndex(),
        icon: MessageCircle,
        badge: counts.unreadMessagesCount,
    };
    const certificates: NavItem = {
        title: 'Certificates',
        href: certificatesIndex(),
        icon: Award,
    };
    const accountSection: NavSection = {
        title: 'Account',
        items: [
            { title: 'Profile', href: profileSettings(), icon: UserRound },
            { title: 'Security', href: securitySettings(), icon: ShieldCheck },
            {
                title: 'Appearance',
                href: appearanceSettings(),
                icon: Palette,
            },
        ],
    };

    if (role === 'company_admin') {
        const dashboardItem: NavItem = {
            title: 'Dashboard',
            href: dashboard(),
            icon: LayoutGrid,
        };
        const ojtAccounts: NavItem = {
            title: 'OJT Accounts',
            mobileTitle: 'OJTs',
            href: managedOjtsIndex(),
            icon: UsersRound,
        };
        const reviews: NavItem = {
            title: 'Review Reports',
            mobileTitle: 'Reviews',
            href: approvalInbox(),
            icon: ClipboardList,
            badge: counts.pendingReportsCount,
        };
        const dtrSignOff: NavItem = {
            title: 'DTR Sign-off',
            href: dtrSubmissionsIndex(),
            icon: FileCheck2,
        };
        const analytics: NavItem = {
            title: 'OJT Analytics',
            mobileTitle: 'Analytics',
            href: analyticsIndex(),
            icon: ChartNoAxesCombined,
        };
        const attendanceMonitor: NavItem = {
            title: 'Attendance Monitor',
            mobileTitle: 'Attendance',
            href: attendanceMonitorIndex(),
            icon: CalendarCheck2,
        };
        const workCalendar: NavItem = {
            title: 'Work Calendar',
            mobileTitle: 'Calendar',
            href: attendanceCalendar(),
            icon: CalendarDays,
        };

        return {
            sections: [
                {
                    title: 'Workspace',
                    items: [dashboardItem, ojtAccounts, analytics],
                },
                {
                    title: 'Review & Approval',
                    items: [reviews, corrections, dtrSignOff, certificates],
                },
                {
                    title: 'Attendance',
                    items: [
                        attendanceMonitor,
                        workCalendar,
                        {
                            title: 'Work Schedule',
                            href: attendancePolicy(),
                            icon: Clock8,
                        },
                        {
                            title: 'Leave & Calendar',
                            href: leaveIndex(),
                            icon: CalendarDays,
                        },
                    ],
                },
                {
                    title: 'Administration',
                    items: [
                        {
                            title: 'Audit Trail',
                            href: activityLogs(),
                            icon: History,
                        },
                        {
                            title: 'System Operations',
                            href: operationsIndex(),
                            icon: ServerCog,
                        },
                    ],
                },
                { title: 'Updates', items: [notifications] },
            ],
            primaryItems: [
                dashboardItem,
                attendanceMonitor,
                reviews,
                notifications,
            ],
            moreSections: [
                {
                    title: 'Workspace',
                    items: [ojtAccounts, analytics],
                },
                {
                    title: 'Review & Approval',
                    items: [corrections, dtrSignOff, certificates],
                },
                {
                    title: 'Attendance',
                    items: [
                        workCalendar,
                        {
                            title: 'Work Schedule',
                            href: attendancePolicy(),
                            icon: Clock8,
                        },
                        {
                            title: 'Leave & Calendar',
                            href: leaveIndex(),
                            icon: CalendarDays,
                        },
                    ],
                },
                {
                    title: 'Administration',
                    items: [
                        {
                            title: 'Audit Trail',
                            href: activityLogs(),
                            icon: History,
                        },
                        {
                            title: 'System Operations',
                            href: operationsIndex(),
                            icon: ServerCog,
                        },
                    ],
                },
                accountSection,
            ],
        };
    }

    if (role === 'supervisor') {
        const myOjts: NavItem = {
            title: 'My OJTs',
            mobileTitle: 'OJTs',
            href: supervisorDashboard(),
            icon: UsersRound,
        };
        const dtrSignOff: NavItem = {
            title: 'DTR Sign-off',
            href: dtrSubmissionsIndex(),
            icon: FileCheck2,
        };

        return {
            sections: [
                { title: 'Workspace', items: [myOjts, messages] },
                {
                    title: 'Review & Approval',
                    items: [
                        corrections,
                        {
                            title: 'Leave Requests',
                            href: leaveIndex(),
                            icon: CalendarDays,
                        },
                        dtrSignOff,
                        certificates,
                    ],
                },
                { title: 'Updates', items: [notifications] },
            ],
            primaryItems: [myOjts, messages, corrections, notifications],
            moreSections: [
                {
                    title: 'Review & Approval',
                    items: [
                        {
                            title: 'Leave Requests',
                            href: leaveIndex(),
                            icon: CalendarDays,
                        },
                        dtrSignOff,
                        certificates,
                    ],
                },
                accountSection,
            ],
        };
    }

    const dashboardItem: NavItem = {
        title: 'Dashboard',
        href: dashboard(),
        icon: LayoutGrid,
    };
    const dailyReports: NavItem = {
        title: 'Daily Reports',
        mobileTitle: 'Reports',
        href: reportsIndex(),
        icon: ClipboardList,
    };
    const tasks: NavItem = {
        title: 'Tasks',
        href: tasksIndex(),
        icon: ListChecks,
    };
    const dtrSignOff: NavItem = {
        title: 'DTR Sign-off',
        href: dtrSubmissionsIndex(),
        icon: FileCheck2,
    };
    const calendar: NavItem = {
        title: 'Attendance Calendar',
        mobileTitle: 'Calendar',
        href: attendanceCalendar(),
        icon: CalendarDays,
    };

    return {
        sections: [
            { title: 'Today', items: [dashboardItem, dailyReports, calendar] },
            { title: 'Workspace', items: [tasks, messages] },
            {
                title: 'Records',
                items: [
                    dtrSignOff,
                    certificates,
                    corrections,
                    { title: 'Leave', href: leaveIndex(), icon: CalendarDays },
                ],
            },
            { title: 'Updates', items: [notifications] },
        ],
        primaryItems: [dashboardItem, dailyReports, calendar, messages],
        moreSections: [
            {
                title: 'Records',
                items: [
                    tasks,
                    dtrSignOff,
                    certificates,
                    corrections,
                    { title: 'Leave', href: leaveIndex(), icon: CalendarDays },
                ],
            },
            { title: 'Updates', items: [notifications] },
            accountSection,
        ],
    };
}
