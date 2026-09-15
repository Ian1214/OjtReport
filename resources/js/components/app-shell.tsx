import { usePage } from '@inertiajs/react';
import { useEffect } from 'react';
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

    useEffect(() => {
        const className = 'user-font-large';
        document.documentElement.classList.toggle(
            className,
            preferences.font_size === 'large',
        );

        return () => document.documentElement.classList.remove(className);
    }, [preferences.font_size]);

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
            data-font-size={preferences.font_size ?? 'standard'}
            data-reduce-motion={preferences.reduce_motion ?? false}
            data-high-contrast={preferences.high_contrast ?? false}
        >
            {children}
        </SidebarProvider>
    );
}
