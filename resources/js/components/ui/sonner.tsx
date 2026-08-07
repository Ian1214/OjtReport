import { useFlashToast } from '@/hooks/use-flash-toast';
import { useAppearance } from '@/hooks/use-appearance';
import {
    AlertCircle,
    AlertTriangle,
    CheckCircle2,
    Info,
    LoaderCircle,
    X,
} from 'lucide-react';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

function Toaster({ ...props }: ToasterProps) {
    const { appearance } = useAppearance();

    useFlashToast();

    return (
        <Sonner
            theme={appearance}
            className="toaster group"
            position="top-right"
            richColors
            expand
            closeButton
            visibleToasts={4}
            duration={5000}
            gap={12}
            offset={{ top: 20, right: 20 }}
            mobileOffset={{
                top: 'calc(env(safe-area-inset-top) + 1rem)',
                right: '1rem',
                left: '1rem',
            }}
            swipeDirections={['right', 'left']}
            containerAriaLabel="Application notifications"
            icons={{
                success: <CheckCircle2 className="size-5" />,
                info: <Info className="size-5" />,
                warning: <AlertTriangle className="size-5" />,
                error: <AlertCircle className="size-5" />,
                loading: <LoaderCircle className="size-5 animate-spin" />,
                close: <X className="size-4" />,
            }}
            toastOptions={{
                classNames: {
                    toast: '!rounded-2xl !border !p-4 !shadow-2xl !backdrop-blur-xl',
                    content: '!gap-1',
                    title: '!text-sm !font-semibold !tracking-tight',
                    description: '!text-sm !leading-relaxed !opacity-80',
                    icon: '!size-5',
                    closeButton:
                        '!size-7 !rounded-lg !border-border !bg-background !text-foreground !shadow-sm hover:!bg-accent',
                    success:
                        '!border-emerald-500/30 !bg-emerald-50/95 !text-emerald-950 dark:!bg-emerald-950/95 dark:!text-emerald-50',
                    info: '!border-sky-500/30 !bg-sky-50/95 !text-sky-950 dark:!bg-sky-950/95 dark:!text-sky-50',
                    warning:
                        '!border-amber-500/30 !bg-amber-50/95 !text-amber-950 dark:!bg-amber-950/95 dark:!text-amber-50',
                    error: '!border-red-500/30 !bg-red-50/95 !text-red-950 dark:!bg-red-950/95 dark:!text-red-50',
                },
            }}
            style={
                {
                    '--normal-bg': 'var(--popover)',
                    '--normal-text': 'var(--popover-foreground)',
                    '--normal-border': 'var(--border)',
                } as React.CSSProperties
            }
            {...props}
        />
    );
}

export { Toaster };
