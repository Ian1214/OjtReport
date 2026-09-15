import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold whitespace-nowrap transition-[color,background-color,border-color,box-shadow,transform,opacity] duration-200 outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 disabled:hover:translate-y-0 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[loading]:pointer-events-none data-[loading]:opacity-60 motion-safe:hover:-translate-y-px motion-safe:active:translate-y-0 motion-safe:active:scale-[0.985] dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    {
        variants: {
            variant: {
                default:
                    'border border-primary/45 bg-linear-to-br from-primary via-primary to-primary/80 text-primary-foreground shadow-[0_14px_34px_-20px_color-mix(in_oklab,var(--primary)_90%,transparent),inset_0_1px_color-mix(in_oklab,white_30%,transparent)] hover:border-primary/65 hover:shadow-[0_18px_42px_-20px_color-mix(in_oklab,var(--primary)_95%,transparent)] hover:brightness-105',
                destructive:
                    'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40',
                outline:
                    'border border-input/80 bg-background/55 shadow-[inset_0_1px_color-mix(in_oklab,white_8%,transparent)] backdrop-blur-xl hover:border-luxury/35 hover:bg-accent/80 hover:text-accent-foreground hover:shadow-[0_14px_30px_-24px_color-mix(in_oklab,var(--luxury)_55%,transparent)]',
                secondary:
                    'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
                ghost: 'hover:bg-accent/75 hover:text-accent-foreground',
                link: 'text-primary underline-offset-4 hover:underline',
            },
            size: {
                default: 'h-10 px-4 py-2 has-[>svg]:px-3',
                sm: 'h-8 rounded-lg px-3 has-[>svg]:px-2.5',
                lg: 'h-11 rounded-xl px-6 has-[>svg]:px-4',
                icon: 'size-9',
            },
        },
        defaultVariants: {
            variant: 'default',
            size: 'default',
        },
    },
);

function Button({
    className,
    variant,
    size,
    asChild = false,
    ...props
}: React.ComponentProps<'button'> &
    VariantProps<typeof buttonVariants> & {
        asChild?: boolean;
    }) {
    const Comp = asChild ? Slot : 'button';

    return (
        <Comp
            data-slot="button"
            className={cn(buttonVariants({ variant, size, className }))}
            {...props}
        />
    );
}

export { Button, buttonVariants };
