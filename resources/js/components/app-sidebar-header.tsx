import { usePage } from '@inertiajs/react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { SidebarTrigger } from '@/components/ui/sidebar';
import type { BreadcrumbItem as BreadcrumbItemType, User } from '@/types';

export function AppSidebarHeader({
    breadcrumbs = [],
}: {
    breadcrumbs?: BreadcrumbItemType[];
}) {
    const { auth } = usePage<{ auth: { user: User | null } }>().props;

    return (
        <header className="relative flex h-16 shrink-0 items-center gap-2 border-b border-primary/10 bg-background/72 px-6 shadow-[0_14px_40px_-32px_color-mix(in_oklab,var(--primary)_55%,transparent)] backdrop-blur-xl transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12 after:absolute after:inset-x-0 after:bottom-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-primary/30 after:to-transparent md:px-4">
            <div className="flex items-center gap-2">
                <SidebarTrigger className="-ml-1" />
                <Breadcrumbs breadcrumbs={breadcrumbs} />
            </div>
            {auth.user && (
                <div className="ml-auto hidden items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-[inset_0_1px_color-mix(in_oklab,white_7%,transparent)] sm:flex">
                    <span className="status-pulse size-1.5 rounded-full bg-primary" />
                    {roleLabel(auth.user.role)} workspace
                </div>
            )}
        </header>
    );
}

function roleLabel(role: User['role']): string {
    return role === 'company_admin'
        ? 'Company'
        : role === 'supervisor'
          ? 'Supervisor'
          : role === 'school_coordinator'
            ? 'School'
            : 'OJT';
}
