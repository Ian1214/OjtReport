import { Form, Head } from '@inertiajs/react';
import { create as register } from '@/actions/App/Http/Controllers/Auth/RegisterController';
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

Login.layout = {
    title: 'Log in to your account',
    description: 'Enter your email and password below to log in',
};
