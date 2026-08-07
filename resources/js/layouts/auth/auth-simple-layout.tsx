// import { Link } from '@inertiajs/react';
// import AppLogoIcon from '@/components/app-logo-icon';
// import { home } from '@/routes';
// import type { AuthLayoutProps } from '@/types';

// export default function AuthSimpleLayout({
//     children,
//     title,
//     description,
// }: AuthLayoutProps) {
//     return (
//         <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-background p-6 md:p-10">
//             <div className="w-full max-w-sm">
//                 <div className="flex flex-col gap-8">
//                     <div className="flex flex-col items-center gap-4">
//                         <Link
//                             href={home()}
//                             className="flex flex-col items-center gap-2 font-medium"
//                         >
//                             <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-md">
//                                 <AppLogoIcon className="size-9 fill-current text-[var(--foreground)] dark:text-white" />
//                             </div>
//                             <span className="sr-only">{title}</span>
//                         </Link>

//                         <div className="space-y-2 text-center">
//                             <h1 className="text-xl font-medium">{title}</h1>
//                             <p className="text-center text-sm text-muted-foreground">
//                                 {description}
//                             </p>
//                         </div>
//                     </div>
//                     {children}
//                 </div>
//             </div>
//         </div>
//     );
// }
import { Link } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthSimpleLayout({
    children,
    title,
    description,
    wide = false,
}: AuthLayoutProps) {
    return (
        <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#030712] px-4 py-12 sm:px-6">
            <div className="absolute top-0 -left-48 size-[32rem] rounded-full bg-emerald-500/20 blur-[150px]" />
            <div className="absolute -right-48 bottom-0 size-[30rem] rounded-full bg-yellow-400/10 blur-[150px]" />
            <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px), linear-gradient(90deg,rgba(255,255,255,.25) 1px, transparent 1px)',
                    backgroundSize: '42px 42px',
                }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(3,7,18,.8))]" />

            <div
                className={`relative z-10 w-full ${wide ? 'max-w-3xl' : 'max-w-md'}`}
            >
                <Link
                    href={home()}
                    className="mb-8 flex items-center justify-center gap-3 text-white"
                >
                    <div className="flex size-10 items-center justify-center">
                        <AppLogoIcon className="size-10 object-contain drop-shadow-lg" />
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-bold tracking-[0.18em]">
                            OJT REPORT
                        </p>
                        <p className="text-[10px] tracking-[0.24em] text-slate-400">
                            MANAGEMENT SYSTEM
                        </p>
                    </div>
                </Link>

                <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 text-white shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
                    {title && (
                        <h1 className="text-2xl font-semibold tracking-tight text-white">
                            {title}
                        </h1>
                    )}

                    {description && (
                        <p className="mt-2 mb-7 text-sm leading-6 text-slate-400">
                            {description}
                        </p>
                    )}

                    {children}
                </div>
            </div>
        </div>
    );
}
