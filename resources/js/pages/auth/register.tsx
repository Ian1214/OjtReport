import { Form, Head } from '@inertiajs/react';
import { Building2, ShieldCheck, UserPlus } from 'lucide-react';
import InputError from '@/components/input-error';
import PasswordInput from '@/components/password-input';
import TextLink from '@/components/text-link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { login, terms } from '@/routes';
import { store } from '@/routes/register';

export default function Register() {
    return (
        <>
            <Head title="Register your company" />

            <div className="mb-7 grid gap-3 sm:grid-cols-3">
                <OnboardingStep icon={Building2} text="Register your company" />
                <OnboardingStep icon={UserPlus} text="Create OJT accounts" />
                <OnboardingStep icon={ShieldCheck} text="Monitor progress" />
            </div>

            <Form {...store.form()} className="flex flex-col gap-7">
                {({ processing, errors }) => (
                    <>
                        <div className="grid gap-5">
                            <div className="grid gap-2">
                                <Label htmlFor="company_name">Company name</Label>
                                <Input
                                    id="company_name"
                                    name="company_name"
                                    required
                                    autoFocus
                                    autoComplete="organization"
                                    placeholder="Acme Technologies Inc."
                                />
                                <InputError message={errors.company_name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="name">Administrator name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    required
                                    autoComplete="name"
                                    placeholder="Juan Dela Cruz"
                                />
                                <InputError message={errors.name} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="email">Work email address</Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    required
                                    autoComplete="email"
                                    placeholder="admin@company.com"
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="password">Password</Label>
                                    <PasswordInput
                                        id="password"
                                        name="password"
                                        required
                                        autoComplete="new-password"
                                    />
                                    <InputError message={errors.password} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="password_confirmation">
                                        Confirm password
                                    </Label>
                                    <PasswordInput
                                        id="password_confirmation"
                                        name="password_confirmation"
                                        required
                                        autoComplete="new-password"
                                    />
                                </div>
                            </div>
                        </div>

                        <p className="rounded-xl border border-emerald-400/15 bg-emerald-400/5 px-4 py-3 text-sm leading-6 text-slate-300">
                            After registration, you can create OJT accounts using
                            each intern&apos;s real email address. They receive a secure
                            account setup link and create their own password.
                        </p>

                        <div className="grid gap-2">
                            <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-slate-300">
                                <input
                                    type="checkbox"
                                    name="terms"
                                    value="1"
                                    required
                                    className="mt-1 size-4 rounded border-white/20 accent-emerald-400"
                                />
                                <span>
                                    I am authorized to register this company and I
                                    agree to the{' '}
                                    <TextLink
                                        href={terms()}
                                        className="text-emerald-300 hover:text-emerald-200"
                                    >
                                        Terms, Privacy Notice, and Company Rules
                                    </TextLink>
                                    .
                                </span>
                            </label>
                            <InputError message={errors.terms} />
                        </div>

                        <Button
                            type="submit"
                            className="h-11 w-full bg-gradient-to-r from-emerald-400 to-emerald-500 font-semibold text-slate-950 hover:from-emerald-300 hover:to-emerald-400"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Create company workspace
                        </Button>
                    </>
                )}
            </Form>

            <p className="text-center text-sm text-slate-400">
                Already have an account?{' '}
                <TextLink
                    href={login()}
                    className="text-emerald-300 decoration-emerald-400/40 hover:text-emerald-200"
                >
                    Log in
                </TextLink>
            </p>
        </>
    );
}

function OnboardingStep({
    icon: Icon,
    text,
}: {
    icon: typeof Building2;
    text: string;
}) {
    return (
        <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300">
            <Icon className="size-4 shrink-0 text-emerald-300" />
            <span>{text}</span>
        </div>
    );
}

Register.layout = {
    title: 'Set up your company workspace',
    description: 'Create the administrator account that will manage your OJT team.',
    wide: true,
};
