import { Form, Head, Link } from '@inertiajs/react';
import { CheckCircle2, Clock8, ExternalLink, ShieldCheck } from 'lucide-react';
import { update } from '@/actions/App/Http/Controllers/OjtTermsController';
import AppLogoIcon from '@/components/app-logo-icon';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { terms } from '@/routes';

export default function AcceptTerms({ companyName }: { companyName: string }) {
    return (
        <>
            <Head title="Accept OJT Terms" />
            <main className="relative min-h-svh overflow-hidden bg-[#030712] px-4 py-8 text-slate-100 sm:px-6">
                <div className="absolute -top-40 -left-40 size-96 rounded-full bg-emerald-500/15 blur-[130px]" />
                <div className="absolute -right-40 -bottom-40 size-96 rounded-full bg-amber-400/10 blur-[130px]" />

                <div className="relative mx-auto max-w-3xl">
                    <div className="flex items-center justify-center gap-3">
                        <AppLogoIcon className="size-10" />
                        <div>
                            <p className="font-bold tracking-[0.16em]">OJT REPORT</p>
                            <p className="text-xs text-slate-400">{companyName}</p>
                        </div>
                    </div>

                    <section className="mt-8 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.05] shadow-2xl shadow-black/30 backdrop-blur-xl">
                        <header className="border-b border-white/10 bg-gradient-to-r from-emerald-400/10 to-transparent p-6 sm:p-8">
                            <p className="text-sm font-semibold text-emerald-300">Required before continuing</p>
                            <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">Read and accept your OJT terms</h1>
                            <p className="mt-3 text-sm leading-6 text-slate-400">Please review the rules below. Your acceptance date will be saved in the company audit log.</p>
                        </header>

                        <div className="max-h-[48vh] space-y-5 overflow-y-auto p-6 sm:p-8">
                            <Rule icon={Clock8} title="Attendance and punctuality">
                                Arrive ready to work by your company&apos;s official time in. Record only your own attendance, never ask another person to time in for you, and submit accurate daily reports. Your arrival is marked On time or Late using the company schedule and grace period.
                            </Rule>
                            <Rule icon={CheckCircle2} title="Honest reports and corrections">
                                Daily summaries must truthfully describe your work. If an attendance record is incorrect, use the correction workflow and explain the reason. Never alter, fabricate, or misrepresent internship records.
                            </Rule>
                            <Rule icon={ShieldCheck} title="Privacy, safety, and respectful conduct">
                                Protect credentials and confidential information, follow workplace safety instructions, and do not send harassment, threats, discriminatory content, or unauthorized personal images through the system.
                            </Rule>
                            <div className="rounded-xl border border-white/10 bg-black/20 p-4 text-sm leading-6 text-slate-400">
                                Attendance labels support supervision and are not automatic disciplinary findings. Approved corrections remain auditable. Personal data is used for internship administration, attendance, reports, supervision, communication, and legitimate compliance records.
                            </div>
                        </div>

                        <Form {...update.form()} className="border-t border-white/10 p-6 sm:p-8">
                            {({ errors, processing }) => (
                                <div className="grid gap-5">
                                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/5 p-4 text-sm leading-6 text-slate-300">
                                        <input type="checkbox" name="terms" value="1" required className="mt-1 size-4 shrink-0 accent-emerald-400" />
                                        <span>I have read and agree to follow the OJT Terms, Privacy Notice, and Company Rules.</span>
                                    </label>
                                    <InputError message={errors.terms} />
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                        <Button variant="ghost" asChild className="text-slate-300 hover:bg-white/10 hover:text-white">
                                            <Link href={terms()} target="_blank">Read the complete terms <ExternalLink /></Link>
                                        </Button>
                                        <Button type="submit" disabled={processing} className="bg-emerald-400 font-semibold text-slate-950 hover:bg-emerald-300">
                                            {processing ? <Spinner /> : <CheckCircle2 />}
                                            Done and continue
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </Form>
                    </section>
                </div>
            </main>
        </>
    );
}

function Rule({ icon: Icon, title, children }: { icon: typeof Clock8; title: string; children: React.ReactNode }) {
    return (
        <div className="flex gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-400/10 text-emerald-300"><Icon className="size-5" /></div>
            <div><h2 className="font-semibold text-white">{title}</h2><p className="mt-1 text-sm leading-6 text-slate-400">{children}</p></div>
        </div>
    );
}
