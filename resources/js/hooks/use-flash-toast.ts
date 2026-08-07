import { router } from '@inertiajs/react';
import { useEffect } from 'react';
import { toast } from 'sonner';
import type { FlashToast } from '@/types/ui';

const toastTitles: Record<FlashToast['type'], string> = {
    success: 'Success',
    info: 'Heads up',
    warning: 'Attention needed',
    error: 'Something went wrong',
};

function showFlashToast(data: FlashToast): void {
    toast[data.type](toastTitles[data.type], {
        description: data.message,
        duration: data.type === 'error' ? 7000 : 5000,
        id: `flash-${data.type}-${data.message}`,
    });
}

export function useFlashToast(): void {
    useEffect(() => {
        const removeFlashListener = router.on('flash', (event) => {
            const flash = (event as CustomEvent).detail?.flash;
            const data = flash?.toast as FlashToast | undefined;

            if (!data) {
                return;
            }

            showFlashToast(data);
        });

        const removeNetworkErrorListener = router.on('networkError', () => {
            toast.error('Connection interrupted', {
                description:
                    'We could not reach the server. Check your connection and try again.',
                duration: 8000,
                id: 'network-error',
            });
        });

        return () => {
            removeFlashListener();
            removeNetworkErrorListener();
        };
    }, []);
}
