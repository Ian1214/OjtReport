import { usePage } from '@inertiajs/react';

import AppLogoIcon from '@/components/app-logo-icon';

export default function AppLogo() {
    const { name } = usePage().props;

    return (
        <>
            <div className="relative flex aspect-square size-9 items-center justify-center rounded-xl border border-sidebar-primary/20 bg-sidebar-primary/8 shadow-[0_0_24px_-10px_var(--sidebar-primary)]">
                <span className="absolute inset-1 rounded-lg border border-sidebar-primary/10" />
                <AppLogoIcon className="relative size-7 object-contain drop-shadow-[0_0_7px_color-mix(in_oklab,var(--sidebar-primary)_55%,transparent)]" />
            </div>
            <div className="ml-1.5 grid flex-1 text-left">
                <span className="truncate text-sm leading-tight font-semibold tracking-tight">
                    {name}
                </span>
                <span className="truncate text-[9px] font-medium tracking-[0.16em] text-sidebar-foreground/45 uppercase">
                    Operations hub
                </span>
            </div>
        </>
    );
}
