import { Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    Clock3,
    MapPinCheck,
    QrCode,
    RefreshCw,
    ScanLine,
    ShieldCheck,
    Smartphone,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { qr } from '@/actions/App/Http/Controllers/Company/AttendanceVerificationController';
import { DashboardHero } from '@/components/dashboard-ui';
import { Button } from '@/components/ui/button';
import { edit as attendancePolicy } from '@/routes/company/attendance-policy';

type Props = {
    company: {
        name: string;
        verificationMode: 'qr' | 'qr_and_geolocation';
    };
    qrImage: string;
    expiresAt: string;
};

export default function AttendanceVerificationQr({
    company,
    qrImage,
    expiresAt,
}: Props) {
    const [secondsRemaining, setSecondsRemaining] = useState(() =>
        remainingSeconds(expiresAt),
    );

    useEffect(() => {
        const updateCountdown = () => {
            setSecondsRemaining(remainingSeconds(expiresAt));
        };
        const timer = window.setInterval(updateCountdown, 1000);

        return () => window.clearInterval(timer);
    }, [expiresAt]);

    const isExpired = secondsRemaining === 0;
    const requiresLocation = company.verificationMode === 'qr_and_geolocation';

    return (
        <>
            <Head title="Attendance verification QR" />

            <div className="relative flex flex-1 flex-col gap-6 overflow-hidden bg-muted/20 p-4 md:p-6">
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute -top-40 right-0 size-96 rounded-full bg-cyan-500/8 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute bottom-0 -left-32 size-80 rounded-full bg-emerald-500/8 blur-3xl"
                />

                <DashboardHero
                    eyebrow={`${company.name} · Secure attendance`}
                    title="Scan to verify attendance"
                    description="Display this rotating company code at the workplace. The OJT scans it from their signed-in phone before recording time in."
                />

                <div className="relative grid gap-6 xl:grid-cols-[minmax(22rem,.9fr)_minmax(0,1.1fr)]">
                    <section className="overflow-hidden rounded-3xl border border-primary/20 bg-card/90 shadow-xl shadow-primary/5 backdrop-blur-xl">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 px-5 py-4 sm:px-6">
                            <div className="flex items-center gap-3">
                                <span className="relative flex size-3">
                                    {!isExpired && (
                                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
                                    )}
                                    <span
                                        className={`relative inline-flex size-3 rounded-full ${isExpired ? 'bg-destructive' : 'bg-emerald-500'}`}
                                    />
                                </span>
                                <div>
                                    <p className="text-sm font-semibold">
                                        {isExpired
                                            ? 'Code expired'
                                            : 'Live verification code'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Refreshing creates a new signed link
                                    </p>
                                </div>
                            </div>
                            <div
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs font-semibold ${isExpired ? 'border-destructive/25 bg-destructive/10 text-destructive' : 'border-primary/20 bg-primary/10 text-primary'}`}
                            >
                                <Clock3 className="size-3.5" />
                                {isExpired
                                    ? 'Expired'
                                    : formatCountdown(secondsRemaining)}
                            </div>
                        </div>

                        <div className="grid place-items-center p-5 sm:p-8">
                            <div className="relative w-full max-w-[26rem]">
                                <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-cyan-400/20 via-primary/10 to-emerald-400/20 blur-xl" />
                                <div className="relative overflow-hidden rounded-[1.75rem] border border-white/20 bg-white p-4 shadow-2xl sm:p-6">
                                    <img
                                        src={qrImage}
                                        alt={`Attendance verification QR code for ${company.name}`}
                                        className={`aspect-square w-full transition duration-300 ${isExpired ? 'opacity-20 grayscale' : ''}`}
                                    />
                                    {isExpired && (
                                        <div className="absolute inset-0 grid place-items-center p-8 text-center">
                                            <div className="rounded-2xl border border-red-200 bg-white/95 px-5 py-4 text-slate-950 shadow-xl">
                                                <p className="font-bold">
                                                    This code has expired
                                                </p>
                                                <p className="mt-1 text-sm text-slate-600">
                                                    Generate a fresh code to
                                                    continue.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-3 border-t border-border/70 p-5 sm:grid-cols-2 sm:p-6">
                            <Button asChild size="lg">
                                <Link href={qr()}>
                                    <RefreshCw /> Generate fresh QR
                                </Link>
                            </Button>
                            <Button variant="outline" size="lg" asChild>
                                <Link href={attendancePolicy()}>
                                    <ArrowLeft /> Back to policy
                                </Link>
                            </Button>
                        </div>
                    </section>

                    <div className="grid content-start gap-6">
                        <section className="rounded-3xl border bg-card/80 p-5 shadow-sm backdrop-blur-xl sm:p-6">
                            <div className="flex items-start gap-4">
                                <div className="grid size-11 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
                                    <ScanLine className="size-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold">
                                        How the OJT checks in
                                    </h2>
                                    <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                        Complete these steps in the same mobile
                                        browser session.
                                    </p>
                                </div>
                            </div>

                            <ol className="mt-6 grid gap-3">
                                <Instruction
                                    number="01"
                                    icon={Smartphone}
                                    title="Open the secure mobile site"
                                    description="The OJT signs in on their phone using the HTTPS site address."
                                />
                                <Instruction
                                    number="02"
                                    icon={QrCode}
                                    title="Scan this rotating code"
                                    description="Use the phone camera and open the detected link in the same signed-in browser."
                                />
                                {requiresLocation && (
                                    <Instruction
                                        number="03"
                                        icon={MapPinCheck}
                                        title="Allow one-time location access"
                                        description="Return to Attendance, provide consent, and allow location when the browser asks."
                                    />
                                )}
                                <Instruction
                                    number={requiresLocation ? '04' : '03'}
                                    icon={CheckCircle2}
                                    title="Tap Time in now"
                                    description="The server records the official time after every enabled verification succeeds."
                                />
                            </ol>
                        </section>

                        <section className="grid gap-4 sm:grid-cols-2">
                            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                                <ShieldCheck className="size-5 text-emerald-500" />
                                <h3 className="mt-4 font-semibold">
                                    Short-lived and signed
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    Each code expires after ten minutes and is
                                    valid only for {company.name}.
                                </p>
                            </div>
                            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-500/5 p-5">
                                <MapPinCheck className="size-5 text-cyan-500" />
                                <h3 className="mt-4 font-semibold">
                                    Privacy-aware location
                                </h3>
                                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                    {requiresLocation
                                        ? 'Location is requested once at time in and is not continuously tracked.'
                                        : 'Location verification is not required by the current company policy.'}
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </>
    );
}

function Instruction({
    number,
    icon: Icon,
    title,
    description,
}: {
    number: string;
    icon: typeof Smartphone;
    title: string;
    description: string;
}) {
    return (
        <li className="group flex gap-4 rounded-2xl border border-border/70 bg-background/50 p-4 transition hover:border-primary/25 hover:bg-primary/[0.03]">
            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted font-mono text-xs font-bold text-muted-foreground transition group-hover:bg-primary/10 group-hover:text-primary">
                {number}
            </div>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0 text-primary" />
                    <h3 className="font-medium">{title}</h3>
                </div>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                    {description}
                </p>
            </div>
        </li>
    );
}

function remainingSeconds(expiresAt: string): number {
    return Math.max(
        0,
        Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 1000),
    );
}

function formatCountdown(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')} remaining`;
}

AttendanceVerificationQr.layout = {
    breadcrumbs: [
        { title: 'Attendance policy', href: attendancePolicy() },
        { title: 'Verification QR', href: qr() },
    ],
};
