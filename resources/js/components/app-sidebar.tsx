import { Link, usePage, usePoll } from '@inertiajs/react';
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
import { roleNavigation } from '@/lib/role-navigation';
import { dashboard } from '@/routes';
import type { NavigationCounts } from '@/types';

export function AppSidebar() {
    const { auth, navigation } = usePage<{
        navigation: NavigationCounts;
    }>().props;
    usePoll(15_000, { only: ['navigation'] }, { mode: 'rest' });
    const { sections } = roleNavigation(auth.user.role, navigation);

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-sidebar-border/70 bg-sidebar/95 shadow-[18px_0_55px_-38px_color-mix(in_oklab,var(--primary)_60%,transparent)] backdrop-blur-xl"
        >
            <SidebarHeader className="relative p-3 pb-2 after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-sidebar-primary/35 after:to-transparent">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="command-panel h-14 rounded-2xl border border-sidebar-primary/15 bg-sidebar-accent/35 px-3 transition-all hover:border-sidebar-primary/35 hover:bg-sidebar-accent"
                            asChild
                        >
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
                <div className="px-3 pt-2 group-data-[collapsible=icon]:hidden">
                    <p className="text-[10px] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
                        {workspaceLabel(auth.user.role)}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 text-xs text-sidebar-foreground/65">
                        <span className="status-pulse size-1.5 rounded-full bg-sidebar-primary" />
                        Secure workspace
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-1 pb-2">
                <NavMain sections={sections} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/70 bg-sidebar-accent/10 p-2">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

function workspaceLabel(
    role: 'company_admin' | 'supervisor' | 'ojt' | 'school_coordinator',
): string {
    return role === 'company_admin'
        ? 'Company workspace'
        : role === 'supervisor'
          ? 'Supervisor workspace'
          : role === 'school_coordinator'
            ? 'School workspace'
            : 'OJT workspace';
}
