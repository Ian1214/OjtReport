import type { Auth } from '@/types/auth';

declare module 'react' {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface InputHTMLAttributes<T> {
        passwordrules?: string;
    }
}

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        sharedPageProps: {
            name: string;
            auth: Auth;
            navigation: {
                pendingReportsCount: number;
                unreadNotificationsCount: number;
                pendingCorrectionsCount: number;
            };
            platformAnnouncement: {
                id: number;
                title: string;
                message: string;
                severity: 'info' | 'warning' | 'critical';
                ends_at: string | null;
            } | null;
            sidebarOpen: boolean;
            [key: string]: unknown;
        };
    }
}
