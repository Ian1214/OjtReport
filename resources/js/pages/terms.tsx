import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    Clock8,
    HeartHandshake,
    Scale,
    ShieldCheck,
} from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Button } from '@/components/ui/button';
import { home, register } from '@/routes';

const sections = [
    {
        icon: Clock8,
        title: 'Attendance and punctuality',
        text: 'OJT users must arrive ready to work by the official time set by their company, record only their own attendance, and submit truthful daily reports. The company-defined start time and grace period determine whether a record is marked On time or Late. There is no claim that Philippine law establishes one universal start time for every internship.',
    },
    {
        icon: ShieldCheck,
        title: 'Privacy and account security',
        text: 'Personal data is collected for account administration, attendance, internship supervision, reports, communication, and compliance records. Users must protect credentials and confidential information. Authorized company administrators and assigned supervisors receive only the access required by their role.',
    },
    {
        icon: HeartHandshake,
        title: 'Safety and respectful conduct',
        text: 'Users must follow workplace safety procedures, promptly report hazards, and maintain a professional environment free from harassment, discrimination, threats, and retaliation—including in system messages and uploaded images.',
    },
];

export default function Terms() {
    return (
        <>
            <Head title="Terms and Company Rules" />
            <main className="min-h-svh bg-[#030712] px-4 py-8 text-slate-100 sm:px-6 sm:py-12">
                <div className="mx-auto max-w-5xl">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <Link
                            href={home()}
                            className="inline-flex items-center gap-3"
                        >
                            <AppLogo />
                        </Link>
                        <Button
                            variant="outline"
                            asChild
                            className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        >
                            <Link href={register()}>
                                <ArrowLeft /> Back to registration
                            </Link>
                        </Button>
                    </div>

                    <header className="mt-10 rounded-3xl border border-emerald-400/15 bg-gradient-to-br from-emerald-400/10 via-white/[0.04] to-amber-300/5 p-6 sm:p-10">
                        <p className="text-sm font-semibold tracking-[0.2em] text-emerald-300 uppercase">
                            Effective August 6, 2026
                        </p>
                        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
                            Terms, Privacy Notice, and Company Rules
                        </h1>
                        <p className="mt-4 max-w-3xl leading-7 text-slate-300">
                            These terms govern use of OJT Report. They provide a
                            practical policy framework informed by Philippine
                            privacy, internship, workplace safety, and
                            safe-spaces requirements. Each company remains
                            responsible for reviewing its own legal and school
                            obligations.
                        </p>
                    </header>

                    <div className="mt-6 grid gap-4 md:grid-cols-3">
                        {sections.map(({ icon: Icon, title, text }) => (
                            <section
                                key={title}
                                className="rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                            >
                                <Icon className="size-6 text-emerald-300" />
                                <h2 className="mt-4 font-semibold text-white">
                                    {title}
                                </h2>
                                <p className="mt-2 text-sm leading-6 text-slate-400">
                                    {text}
                                </p>
                            </section>
                        ))}
                    </div>

                    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                        <Scale className="size-6 text-amber-300" />
                        <h2 className="mt-4 text-xl font-semibold">
                            Use of records and user responsibilities
                        </h2>
                        <div className="mt-4 grid gap-4 text-sm leading-7 text-slate-300 sm:grid-cols-2">
                            <p>
                                Attendance labels support supervision and
                                review; they are not automatic disciplinary
                                findings. Administrators should verify context
                                and approved correction requests before taking
                                action.
                            </p>
                            <p>
                                Users must provide accurate information, use
                                authorized accounts only, avoid unlawful or
                                abusive content, and report suspected account
                                misuse or inaccurate personal data to their
                                company administrator.
                            </p>
                            <p>
                                Companies should retain data only as long as
                                needed for the internship, legitimate records,
                                and applicable school or legal obligations, then
                                securely dispose of it.
                            </p>
                            <p>
                                The platform may be unavailable during
                                maintenance or circumstances beyond reasonable
                                control. Users should promptly report outages
                                that prevent accurate time recording.
                            </p>
                        </div>
                    </section>

                    <section className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-6 sm:p-8">
                        <h2 className="text-xl font-semibold">
                            Official Philippine references
                        </h2>
                        <p className="mt-2 text-sm leading-6 text-slate-400">
                            These links are provided for transparency and do not
                            replace advice from the company, school, CHED, DOLE,
                            the National Privacy Commission, or qualified
                            counsel.
                        </p>
                        <ul className="mt-4 grid gap-3 text-sm text-emerald-300">
                            <li>
                                <a
                                    className="underline underline-offset-4"
                                    href="https://legacy.ched.gov.ph/2017-ched-memorandum-orders/"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    CHED Memorandum Order No. 104, series of
                                    2017 — Student Internship Program
                                </a>
                            </li>
                            <li>
                                <a
                                    className="underline underline-offset-4"
                                    href="https://privacy.gov.ph/data-privacy-act/"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Republic Act No. 10173 — Data Privacy Act of
                                    2012
                                </a>
                            </li>
                            <li>
                                <a
                                    className="underline underline-offset-4"
                                    href="https://lawphil.net/statutes/repacts/ra2018/ra_11058_2018.html"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Republic Act No. 11058 — Occupational Safety
                                    and Health
                                </a>
                            </li>
                            <li>
                                <a
                                    className="underline underline-offset-4"
                                    href="https://lawphil.net/statutes/repacts/ra2019/ra_11313_2019.html"
                                    target="_blank"
                                    rel="noreferrer"
                                >
                                    Republic Act No. 11313 — Safe Spaces Act
                                </a>
                            </li>
                        </ul>
                    </section>
                </div>
            </main>
        </>
    );
}
