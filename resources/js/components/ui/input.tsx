import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                'flex h-11 w-full min-w-0 rounded-xl border border-input/80 bg-background/55 px-3.5 py-2 text-base text-foreground shadow-[inset_0_1px_color-mix(in_oklab,white_6%,transparent)] backdrop-blur-xl transition-[color,border-color,box-shadow,background-color] duration-200 outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                'focus-visible:border-primary/55 focus-visible:bg-background/85 focus-visible:shadow-[0_0_28px_-12px_color-mix(in_oklab,var(--primary)_72%,transparent),inset_0_1px_color-mix(in_oklab,var(--luxury)_16%,transparent)] focus-visible:ring-[3px] focus-visible:ring-primary/12',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                className,
            )}
            {...props}
        />
    );
}

export { Input };
