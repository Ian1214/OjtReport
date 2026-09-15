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
    const { sections } = roleNavigation(
        auth.user.role,
        navigation,
        auth.user.company_permissions ?? [],
    );

    return (
        <Sidebar
            collapsible="icon"
            variant="inset"
            className="border-r border-sidebar-border/55 bg-sidebar/90 shadow-[22px_0_70px_-48px_color-mix(in_oklab,var(--primary)_70%,transparent)] backdrop-blur-2xl"
        >
            <SidebarHeader className="relative p-3 pb-2 after:absolute after:inset-x-4 after:bottom-0 after:h-px after:bg-linear-to-r after:from-transparent after:via-luxury/35 after:to-sidebar-primary/20">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            size="lg"
                            className="command-panel h-14 rounded-2xl border border-sidebar-primary/12 bg-sidebar-accent/28 px-3 shadow-[inset_0_1px_color-mix(in_oklab,white_7%,transparent)] transition-all duration-300 hover:border-luxury/25 hover:bg-sidebar-accent/70"
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
                        <span className="status-pulse size-1.5 rounded-full bg-luxury" />
                        Secure workspace
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-1 pb-2">
                <NavMain sections={sections} />
            </SidebarContent>

            <SidebarFooter className="border-t border-sidebar-border/55 bg-sidebar-accent/8 p-2 backdrop-blur-xl">
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}

function workspaceLabel(role: Parameters<typeof roleNavigation>[0]): string {
    return role === 'platform_admin'
        ? 'Platform workspace'
        : role === 'company_admin' || role === 'company_staff'
          ? 'Company workspace'
          : role === 'supervisor'
            ? 'Supervisor workspace'
            : role === 'school_coordinator'
              ? 'School workspace'
              : 'OJT workspace';
}
