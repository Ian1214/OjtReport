import { usePage } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { AppVariant, Auth, UserPreferences } from '@/types';

type Props = {
    children: ReactNode;
    variant?: AppVariant;
};

export function AppShell({ children, variant = 'sidebar' }: Props) {
    const { auth, sidebarOpen } = usePage<{
        auth: Auth;
        sidebarOpen: boolean;
    }>().props;
    const preferences: Partial<UserPreferences> = auth.user.preferences ?? {};

    if (variant === 'header') {
        return (
            <div className="flex min-h-screen w-full flex-col">{children}</div>
        );
    }

    return (
        <SidebarProvider
            className="command-shell"
            defaultOpen={sidebarOpen}
            data-density={preferences.interface_density ?? 'comfortable'}
            data-reduce-motion={preferences.reduce_motion ?? false}
            data-high-contrast={preferences.high_contrast ?? false}
        >
            {children}
        </SidebarProvider>
    );
}
