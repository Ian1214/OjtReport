import {
    Bell,
    Award,
    BadgeCheck,
    BookOpenCheck,
    Building2,
    CalendarCheck2,
    CalendarDays,
    CalendarSync,
    ChartNoAxesCombined,
    ClipboardList,
    ClipboardCheck,
    Clock8,
    FileCheck2,
    FolderLock,
    History,
    LayoutGrid,
    ListChecks,
    MessageCircle,
    Palette,
    ServerCog,
    ArchiveRestore,
    ShieldCheck,
    School,
    UserRound,
    UsersRound,
} from 'lucide-react';
import { dashboard } from '@/routes';
import { index as actionCenterIndex } from '@/routes/actions';
import { edit as appearanceSettings } from '@/routes/appearance';
import { index as attendanceCalendar } from '@/routes/attendance-calendar';
import { index as attendanceCorrections } from '@/routes/attendance-corrections';
import { index as certificatesIndex } from '@/routes/certificates';
import { index as activityLogs } from '@/routes/company/activity-logs';
import { index as analyticsIndex } from '@/routes/company/analytics';
import { index as approvalInbox } from '@/routes/company/approvals';
import { index as attendanceMonitorIndex } from '@/routes/company/attendance-monitor';
import { edit as attendancePolicy } from '@/routes/company/attendance-policy';
import { index as departmentsIndex } from '@/routes/company/departments';
import { index as managedOjtsIndex } from '@/routes/company/ojts';
import { index as operationsIndex } from '@/routes/company/operations';
import { index as recoveryIndex } from '@/routes/company/recovery';
import { index as schoolAccessIndex } from '@/routes/company/school-access';
import { index as teamIndex } from '@/routes/company/team';
import { index as documentsIndex } from '@/routes/documents';
import { index as dtrSubmissionsIndex } from '@/routes/dtr-submissions';
import { index as evaluationsIndex } from '@/routes/evaluations';
import { index as leaveIndex } from '@/routes/leave';
import { index as messagesIndex } from '@/routes/messages';
import { index as notificationsIndex } from '@/routes/notifications';
import { index as passportsIndex } from '@/routes/passports';
import { dashboard as platformDashboard } from '@/routes/platform';
import { edit as profileSettings } from '@/routes/profile';
import { index as reportsIndex } from '@/routes/reports';
import { dashboard as schoolDashboard } from '@/routes/school';
import { index as curriculumOutcomesIndex } from '@/routes/school/curriculum-outcomes';
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
    permissions: string[] = [],
): RoleNavigation {
    const can = (permission: string): boolean =>
        role === 'company_admin' || permissions.includes(permission);
    const notifications: NavItem = {
        title: 'Notifications',
        mobileTitle: 'Alerts',
        href: notificationsIndex(),
        icon: Bell,
        badge: counts.unreadNotificationsCount,
    };
    const actionCenter: NavItem = {
        title: 'Action Center',
        mobileTitle: 'Actions',
        href: actionCenterIndex(),
        icon: ListChecks,
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
    const evaluations: NavItem = {
        title: 'Performance Evaluations',
        mobileTitle: 'Evaluations',
        href: evaluationsIndex(),
        icon: ClipboardCheck,
    };
    const documents: NavItem = {
        title: 'Document Vault',
        mobileTitle: 'Documents',
        href: documentsIndex(),
        icon: FolderLock,
    };
    const passports: NavItem = {
        title: 'Competency Passports',
        mobileTitle: 'Passports',
        href: passportsIndex(),
        icon: BadgeCheck,
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

    if (role === 'platform_admin') {
        const platform: NavItem = {
            title: 'Platform Overview',
            mobileTitle: 'Platform',
            href: platformDashboard(),
            icon: ShieldCheck,
        };

        return {
            sections: [
                { title: 'Platform', items: [platform] },
                { title: 'Updates', items: [notifications] },
                accountSection,
            ],
            primaryItems: [platform, notifications],
            moreSections: [accountSection],
        };
    }

    if (role === 'company_admin' || role === 'company_staff') {
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
                    items: [
                        dashboardItem,
                        ...(can('people.manage')
                            ? [
                                  ojtAccounts,
                                  {
                                      title: 'Departments',
                                      href: departmentsIndex(),
                                      icon: Building2,
                                  },
                              ]
                            : []),
                        ...(can('analytics.view') ? [analytics] : []),
                    ],
                },
                {
                    title: 'Review & Approval',
                    items: [
                        ...(can('reports.review') ? [reviews] : []),
                        ...(can('attendance.manage') ? [corrections] : []),
                        ...(can('records.sign_off')
                            ? [evaluations, passports, dtrSignOff, certificates]
                            : []),
                        ...(can('documents.review') ? [documents] : []),
                    ],
                },
                {
                    title: 'Attendance',
                    items: can('attendance.manage')
                        ? [
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
                          ]
                        : [],
                },
                {
                    title: 'Administration',
                    items: [
                        ...(can('people.manage')
                            ? [
                                  {
                                      title: 'School Access',
                                      href: schoolAccessIndex(),
                                      icon: School,
                                  },
                                  {
                                      title: 'Company Team',
                                      mobileTitle: 'Team',
                                      href: teamIndex(),
                                      icon: UsersRound,
                                  },
                              ]
                            : []),
                        ...(can('audit.view')
                            ? [
                                  {
                                      title: 'Audit Trail',
                                      href: activityLogs(),
                                      icon: History,
                                  },
                                  {
                                      title: 'Recovery Center',
                                      mobileTitle: 'Recovery',
                                      href: recoveryIndex(),
                                      icon: ArchiveRestore,
                                  },
                              ]
                            : []),
                        ...(can('operations.manage')
                            ? [
                                  {
                                      title: 'System Operations',
                                      href: operationsIndex(),
                                      icon: ServerCog,
                                  },
                              ]
                            : []),
                    ],
                },
                { title: 'Updates', items: [actionCenter, notifications] },
            ].filter((section) => section.items.length > 0),
            primaryItems: [
                dashboardItem,
                ...(can('attendance.manage') ? [attendanceMonitor] : []),
                ...(can('reports.review') ? [reviews] : []),
                notifications,
            ].slice(0, 4),
            moreSections: [
                {
                    title: 'Workspace',
                    items: [
                        ...(can('people.manage')
                            ? [
                                  ojtAccounts,
                                  {
                                      title: 'Departments',
                                      href: departmentsIndex(),
                                      icon: Building2,
                                  },
                              ]
                            : []),
                        ...(can('analytics.view') ? [analytics] : []),
                    ],
                },
                {
                    title: 'Review & Approval',
                    items: [
                        ...(can('attendance.manage') ? [corrections] : []),
                        ...(can('records.sign_off')
                            ? [evaluations, passports, dtrSignOff, certificates]
                            : []),
                        ...(can('documents.review') ? [documents] : []),
                    ],
                },
                {
                    title: 'Attendance',
                    items: can('attendance.manage')
                        ? [
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
                          ]
                        : [],
                },
                {
                    title: 'Administration',
                    items: [
                        ...(can('people.manage')
                            ? [
                                  {
                                      title: 'School Access',
                                      href: schoolAccessIndex(),
                                      icon: School,
                                  },
                                  {
                                      title: 'Company Team',
                                      mobileTitle: 'Team',
                                      href: teamIndex(),
                                      icon: UsersRound,
                                  },
                              ]
                            : []),
                        ...(can('audit.view')
                            ? [
                                  {
                                      title: 'Audit Trail',
                                      href: activityLogs(),
                                      icon: History,
                                  },
                                  {
                                      title: 'Recovery Center',
                                      mobileTitle: 'Recovery',
                                      href: recoveryIndex(),
                                      icon: ArchiveRestore,
                                  },
                              ]
                            : []),
                        ...(can('operations.manage')
                            ? [
                                  {
                                      title: 'System Operations',
                                      href: operationsIndex(),
                                      icon: ServerCog,
                                  },
                              ]
                            : []),
                    ],
                },
                accountSection,
            ].filter((section) => section.items.length > 0),
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
                {
                    title: 'Workspace',
                    items: [myOjts, evaluations, passports, messages],
                },
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
                { title: 'Updates', items: [actionCenter, notifications] },
            ],
            primaryItems: [myOjts, evaluations, messages, notifications],
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

    if (role === 'school_coordinator') {
        const schoolPortal: NavItem = {
            title: 'Student Oversight',
            mobileTitle: 'Students',
            href: schoolDashboard(),
            icon: School,
        };
        const verifiedDtrs: NavItem = {
            title: 'Verified DTRs',
            mobileTitle: 'DTRs',
            href: dtrSubmissionsIndex(),
            icon: FileCheck2,
        };

        return {
            sections: [
                {
                    title: 'School Workspace',
                    items: [
                        schoolPortal,
                        {
                            title: 'Curriculum Outcomes',
                            mobileTitle: 'Outcomes',
                            href: curriculumOutcomesIndex(),
                            icon: BookOpenCheck,
                        },
                    ],
                },
                {
                    title: 'Verified Records',
                    items: [
                        evaluations,
                        passports,
                        verifiedDtrs,
                        certificates,
                        documents,
                    ],
                },
                { title: 'Updates', items: [notifications] },
            ],
            primaryItems: [
                schoolPortal,
                evaluations,
                verifiedDtrs,
                notifications,
            ],
            moreSections: [accountSection],
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
                    evaluations,
                    passports,
                    dtrSignOff,
                    certificates,
                    documents,
                    corrections,
                    { title: 'Leave', href: leaveIndex(), icon: CalendarDays },
                ],
            },
            { title: 'Updates', items: [actionCenter, notifications] },
        ],
        primaryItems: [dashboardItem, dailyReports, calendar, messages],
        moreSections: [
            {
                title: 'Records',
                items: [
                    tasks,
                    evaluations,
                    passports,
                    dtrSignOff,
                    certificates,
                    documents,
                    corrections,
                    { title: 'Leave', href: leaveIndex(), icon: CalendarDays },
                ],
            },
            { title: 'Updates', items: [actionCenter, notifications] },
            accountSection,
        ],
    };
}
