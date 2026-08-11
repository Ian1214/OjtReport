import { Form, Head } from '@inertiajs/react';
import { ShieldCheck } from 'lucide-react';
import { createPortal } from 'react-dom';
import { create as register } from '@/actions/App/Http/Controllers/Auth/RegisterController';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import PasskeyVerify from '@/components/passkey-verify';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { store } from '@/routes/login';
import { request } from '@/routes/password';

type Props = {
    status?: string;
    canResetPassword: boolean;
};

export default function Login({ status, canResetPassword }: Props) {
    return (
        <>
            <Head title="Log in" />

            <PasskeyVerify />

            {status && (
                <div className="rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm font-medium text-green-700 dark:text-green-400">
                    {status}
                </div>
            )}

            <Form
                {...store.form()}
                resetOnSuccess={['password']}
                className="grid gap-6"
            >
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    name="email"
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    placeholder="email@example.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <div className="flex items-center">
                                    <Label htmlFor="password">Password</Label>
                                    {canResetPassword && (
                                        <TextLink
                                            href={request()}
                                            className="ml-auto text-sm text-emerald-300 hover:text-emerald-200"
                                            tabIndex={5}
                                        >
                                            Forgot your password?
                                        </TextLink>
                                    )}
                                </div>
                                <PasswordInput
                                    id="password"
                                    name="password"
                                    required
                                    tabIndex={2}
                                    autoComplete="current-password"
                                    placeholder="Password"
                                />
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex items-center gap-3 rounded-md border border-white/10 bg-white/5 px-3 py-2">
                                <Checkbox
                                    id="remember"
                                    name="remember"
                                    tabIndex={3}
                                />
                                <Label htmlFor="remember">Remember me</Label>
                            </div>

                            <Button
                                type="submit"
                                className="mt-2 h-10 w-full bg-gradient-to-r from-emerald-500 to-emerald-400 font-semibold text-black shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-emerald-300"
                                tabIndex={4}
                                disabled={processing}
                                data-test="login-button"
                            >
                                {processing && <Spinner />}
                                Log in
                            </Button>
                        </div>

                        {processing && <LoginLoadingOverlay />}
                    </>
                )}
            </Form>

            <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                    Managing an OJT team?
                </span>
                <div className="h-px flex-1 bg-border" />
            </div>

            <p className="text-center text-sm text-slate-400">
                <TextLink
                    href={register()}
                    className="text-emerald-300 decoration-emerald-400/40 hover:text-emerald-200"
                >
                    Register your company
                </TextLink>
            </p>
        </>
    );
}

function LoginLoadingOverlay() {
    if (typeof document === 'undefined') {
        return null;
    }

    return createPortal(
        <div
            className="fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-[#010409]/95 px-5 text-white backdrop-blur-xl"
            role="status"
            aria-live="polite"
            aria-label="Authenticating your account"
            aria-busy="true"
        >
            <div
                className="absolute inset-0 opacity-20"
                style={{
                    backgroundImage:
                        'linear-gradient(rgba(16,185,129,.16) 1px, transparent 1px), linear-gradient(90deg,rgba(16,185,129,.16) 1px, transparent 1px)',
                    backgroundSize: '32px 32px',
                    maskImage:
                        'radial-gradient(circle at center, black, transparent 72%)',
                }}
            />
            <div className="absolute inset-x-0 top-1/2 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent shadow-[0_0_22px_rgba(52,211,153,.85)] motion-safe:animate-pulse" />
            <div className="absolute top-1/2 left-1/2 size-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[90px] sm:size-[38rem]" />
            <div className="absolute top-[16%] left-[12%] size-1.5 rounded-full bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,.9)] motion-safe:animate-ping" />
            <div className="absolute right-[15%] bottom-[20%] size-1 rounded-full bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,.9)] [animation-delay:700ms] motion-safe:animate-ping" />

            <div className="relative flex w-full max-w-sm flex-col items-center">
                <div className="mb-6 flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/5 px-3 py-1.5 font-mono text-[10px] tracking-[0.28em] text-emerald-200 uppercase shadow-[0_0_30px_rgba(16,185,129,.1)]">
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                    Secure access protocol
                </div>

                <div className="relative grid size-56 place-items-center sm:size-64">
                    <div className="absolute inset-0 rounded-full border border-emerald-300/15 shadow-[0_0_60px_rgba(16,185,129,.15),inset_0_0_40px_rgba(16,185,129,.08)]" />
                    <div className="absolute inset-3 rounded-full border border-dashed border-emerald-300/40 motion-safe:animate-[spin_10s_linear_infinite]" />
                    <div className="absolute inset-9 rounded-full border-2 border-transparent border-t-cyan-300 border-r-cyan-300/20 shadow-[0_0_24px_rgba(34,211,238,.18)] motion-safe:animate-[spin_2.4s_linear_infinite]" />
                    <div className="absolute inset-14 rounded-full border border-transparent border-b-emerald-300 border-l-emerald-300/30 motion-safe:animate-[spin_3.6s_linear_infinite_reverse]" />
                    <div className="absolute inset-20 rounded-full border border-emerald-200/20 bg-emerald-300/5 motion-safe:animate-pulse" />

                    <div className="absolute inset-0 motion-safe:animate-[spin_3s_linear_infinite]">
                        <div className="absolute top-1/2 left-1/2 h-px w-[45%] origin-left bg-gradient-to-r from-emerald-300/80 to-transparent shadow-[0_0_12px_rgba(52,211,153,.8)]" />
                    </div>

                    <div className="absolute top-1/2 left-0 h-px w-7 -translate-y-1/2 bg-gradient-to-r from-transparent to-emerald-300/70" />
                    <div className="absolute top-1/2 right-0 h-px w-7 -translate-y-1/2 bg-gradient-to-l from-transparent to-emerald-300/70" />
                    <div className="absolute top-0 left-1/2 h-7 w-px -translate-x-1/2 bg-gradient-to-b from-transparent to-emerald-300/70" />
                    <div className="absolute bottom-0 left-1/2 h-7 w-px -translate-x-1/2 bg-gradient-to-t from-transparent to-emerald-300/70" />

                    <div className="relative grid size-20 place-items-center rounded-full border border-emerald-200/30 bg-[#06110f]/90 shadow-[0_0_35px_rgba(16,185,129,.28),inset_0_0_18px_rgba(16,185,129,.18)]">
                        <span className="absolute inset-0 rounded-full bg-emerald-300/10 motion-safe:animate-ping" />
                        <AppLogoIcon className="relative z-10 size-11 drop-shadow-[0_0_12px_rgba(52,211,153,.75)]" />
                    </div>
                </div>

                <div className="mt-7 text-center">
                    <p className="font-mono text-xs tracking-[0.32em] text-emerald-300 uppercase">
                        Identity scan active
                    </p>
                    <h2 className="mt-3 text-xl font-semibold tracking-tight text-white sm:text-2xl">
                        Authenticating
                        <span className="ml-1 inline-flex w-6 justify-start">
                            <span className="motion-safe:animate-pulse">.</span>
                            <span className="[animation-delay:250ms] motion-safe:animate-pulse">
                                .
                            </span>
                            <span className="[animation-delay:500ms] motion-safe:animate-pulse">
                                .
                            </span>
                        </span>
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">
                        Establishing your secure workspace
                    </p>
                </div>

                <div className="mt-7 w-full overflow-hidden rounded-full border border-emerald-300/15 bg-white/5 p-1">
                    <div className="h-1.5 w-2/3 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-300 to-emerald-300 shadow-[0_0_18px_rgba(52,211,153,.65)] motion-safe:animate-[pulse_1.2s_ease-in-out_infinite]" />
                </div>
                <div className="mt-3 flex w-full justify-between font-mono text-[9px] tracking-[0.18em] text-slate-500 uppercase">
                    <span>Encrypted</span>
                    <span>Verifying credentials</span>
                    <span>Protected</span>
                </div>
            </div>
        </div>,
        document.body,
    );
}

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
