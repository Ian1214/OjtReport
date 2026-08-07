import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';

import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { initializeTheme } from '@/hooks/use-appearance';
import AppLayout from '@/layouts/app-layout';
import AuthLayout from '@/layouts/auth-layout';
import SettingsLayout from '@/layouts/settings/layout';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    resolve: async (name) => {
        const page = await resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        );

        if (name === 'welcome') {
            return page;
        }

        if (name.startsWith('auth/')) {
            page.default.layout = page.default.layout ?? AuthLayout;
        } else if (name.startsWith('settings/')) {
            page.default.layout = page.default.layout ?? [AppLayout, SettingsLayout];
        } else {
            page.default.layout = page.default.layout ?? AppLayout;
        }

        return page;
    },

    progress: {
        color: '#4B5563',
    },

    withApp(app) {
        return (
            <TooltipProvider delayDuration={0}>
                {app}
                <Toaster />
            </TooltipProvider>
        );
    },

    strictMode: true,
});

initializeTheme();