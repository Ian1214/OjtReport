import type { InertiaLinkProps } from '@inertiajs/react';
import type { LucideIcon } from 'lucide-react';

export type BreadcrumbItem = {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type NavItem = {
    title: string;
    mobileTitle?: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
    badge?: number;
};

export type NavSection = {
    title: string;
    items: NavItem[];
};

export type NavigationCounts = {
    pendingReportsCount: number;
    unreadMessagesCount: number;
    unreadNotificationsCount: number;
    pendingCorrectionsCount: number;
};
