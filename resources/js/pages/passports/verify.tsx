import { Head, Link } from '@inertiajs/react';
import { Award, ShieldCheck } from 'lucide-react';
import AppLogo from '@/components/app-logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';
import { PassportDetails } from './show';
import type { Passport } from './show';

export default function VerifyPassport({
    passport,
    expiresAt,
}: {
    passport: Passport;
    expiresAt: string;
}) {
    return (
        <>
            <Head title={`Verified passport · ${passport.name}`} />
            <main className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:py-10">
                <div className="mx-auto grid max-w-6xl gap-6">
                    <header className="flex flex-col gap-4 rounded-2xl border bg-card/90 p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                        <AppLogo />
                        <Button variant="outline" asChild>
                            <Link href={home()}>OJT Report home</Link>
                        </Button>
                    </header>
                    <section className="overflow-hidden rounded-3xl border border-emerald-500/25 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_16%,transparent),transparent_45%)] p-6 shadow-xl sm:p-9">
                        <div className="flex flex-wrap items-center gap-2">
                            <Badge className="gap-1 bg-emerald-500/15 text-emerald-500">
                                <ShieldCheck className="size-3.5" /> Active
                                verification record
                            </Badge>
                            <Badge variant="outline">
                                Expires{' '}
                                {new Date(expiresAt).toLocaleDateString()}
                            </Badge>
                        </div>
                        <div className="mt-5 flex items-start gap-4">
                            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
                                <Award className="size-7" />
                            </div>
                            <div>
                                <p className="text-sm tracking-[0.18em] text-muted-foreground uppercase">
                                    Verified OJT competency passport
                                </p>
                                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                    {passport.name}
                                </h1>
                                <p className="mt-2 text-muted-foreground">
                                    {passport.program ?? 'Internship program'} ·{' '}
                                    {passport.companyName}
                                </p>
                            </div>
                        </div>
                    </section>
                    <PassportDetails passport={passport} />
                    <p className="pb-6 text-center text-xs text-muted-foreground">
                        This privacy-controlled live record contains verified
                        aggregate outcomes only. It does not expose private
                        daily reports, messages, email addresses, or documents.
                    </p>
                </div>
            </main>
        </>
    );
}
