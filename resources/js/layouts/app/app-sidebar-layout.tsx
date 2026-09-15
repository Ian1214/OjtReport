import { usePage } from '@inertiajs/react';
import { AlertTriangle, Info, Siren } from 'lucide-react';
import { AppContent } from '@/components/app-content';
import { AppMobileNav } from '@/components/app-mobile-nav';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
}: AppLayoutProps) {
    const { auth, platformAnnouncement } = usePage().props;
    const hasAuthenticatedUser = auth.user !== null;

    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className={`overflow-x-hidden ${hasAuthenticatedUser ? 'pb-24 md:pb-0' : ''}`}
            >
                <AppSidebarHeader breadcrumbs={breadcrumbs} />
                {platformAnnouncement && (
                    <div
                        className={`mx-4 mt-4 flex items-start gap-3 rounded-2xl border p-4 text-sm md:mx-6 ${
                            platformAnnouncement.severity === 'critical'
                                ? 'border-destructive/30 bg-destructive/10 text-destructive'
                                : platformAnnouncement.severity === 'warning'
                                  ? 'border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200'
                                  : 'border-primary/25 bg-primary/10 text-foreground'
                        }`}
                        role="status"
                    >
                        {platformAnnouncement.severity === 'critical' ? (
                            <Siren className="mt-0.5 size-5 shrink-0" />
                        ) : platformAnnouncement.severity === 'warning' ? (
                            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
                        ) : (
                            <Info className="mt-0.5 size-5 shrink-0 text-primary" />
                        )}
                        <div>
                            <p className="font-semibold">
                                {platformAnnouncement.title}
                            </p>
                            <p className="mt-1 opacity-85">
                                {platformAnnouncement.message}
                            </p>
                        </div>
                    </div>
                )}
                {children}
            </AppContent>
            {hasAuthenticatedUser && <AppMobileNav />}
        </AppShell>
    );
}
