import * as React from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
    return (
        <input
            type={type}
            data-slot="input"
            className={cn(
                'flex h-11 w-full min-w-0 rounded-xl border border-input bg-background/65 px-3.5 py-2 text-base text-foreground shadow-[inset_0_1px_color-mix(in_oklab,white_4%,transparent)] backdrop-blur-sm transition-[color,border-color,box-shadow,background-color] outline-none selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm',
                'focus-visible:border-primary/60 focus-visible:bg-background focus-visible:shadow-[0_0_24px_-10px_color-mix(in_oklab,var(--primary)_70%,transparent)] focus-visible:ring-[3px] focus-visible:ring-primary/15',
                'aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40',
                className,
            )}
            {...props}
        />
    );
}

export { Input };
