import { Link } from '@inertiajs/react';
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuBadge,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import type { NavSection } from '@/types';

export function NavMain({ sections = [] }: { sections: NavSection[] }) {
    const { isCurrentOrParentUrl } = useCurrentUrl();

    return (
        <div className="flex flex-col gap-4 px-2 py-2">
            {sections.map((section) => (
                <SidebarGroup key={section.title} className="p-0">
                    <SidebarGroupLabel className="h-7 px-3 text-[10px] font-semibold tracking-[0.14em] text-sidebar-foreground/45 uppercase">
                        {section.title}
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        {section.items.map((item) => (
                            <SidebarMenuItem key={item.title}>
                                <SidebarMenuButton
                                    asChild
                                    isActive={isCurrentOrParentUrl(item.href)}
                                    tooltip={{ children: item.title }}
                                    className="relative h-10 rounded-xl border border-transparent px-3 text-[13px] font-medium text-sidebar-foreground/70 transition-all hover:border-sidebar-primary/10 hover:bg-sidebar-accent/70 hover:text-sidebar-accent-foreground data-[active=true]:border-sidebar-primary/20 data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground data-[active=true]:shadow-[inset_3px_0_var(--sidebar-primary),0_8px_25px_-18px_var(--sidebar-primary)] motion-safe:hover:translate-x-0.5"
                                >
                                    <Link href={item.href} prefetch>
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                                {item.badge !== undefined && item.badge > 0 && (
                                    <SidebarMenuBadge className="right-2 rounded-full bg-primary/10 px-1.5 text-[10px] font-semibold text-primary">
                                        {item.badge > 99 ? '99+' : item.badge}
                                    </SidebarMenuBadge>
                                )}
                            </SidebarMenuItem>
                        ))}
                    </SidebarMenu>
                </SidebarGroup>
            ))}
        </div>
    );
}
