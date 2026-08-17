import { Form, Head, Link, router } from '@inertiajs/react';
import {
    CheckCircle2,
    Clock3,
    Clock8,
    ExternalLink,
    MapPinCheck,
    QrCode,
    RefreshCw,
    Scale,
    ScanLine,
    ShieldCheck,
    Smartphone,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { update } from '@/actions/App/Http/Controllers/Company/AttendancePolicyController';
import { update as updateVerification } from '@/actions/App/Http/Controllers/Company/AttendanceVerificationController';
import { DashboardHero } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { terms } from '@/routes';
import { edit as attendancePolicy } from '@/routes/company/attendance-policy';

type Props = {
    company: {
        name: string;
        workStartTime: string;
        lateGraceMinutes: number;
        timezone: string;
        workDays: number[];
        verificationMode:
            'disabled' | 'qr' | 'geolocation' | 'qr_and_geolocation';
        attendanceLatitude: string | null;
        attendanceLongitude: string | null;
        attendanceRadiusMeters: number;
    };
    attendanceQr: {
        qrImage: string;
        expiresAt: string;
    } | null;
};

export default function AttendancePolicy({ company, attendanceQr }: Props) {
    return (
        <>
            <Head title="Attendance policy" />

            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow={`${company.name} · Company rules`}
                    title="Attendance policy"
                    description="Set the official daily arrival time. Every new time-in is classified and saved as On time or Late for a clear audit trail."
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,.75fr)]">
                    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                        <div className="flex items-start gap-3 border-b pb-5">
                            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                <Clock8 className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold">
                                    Official time in
                                </h2>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    The server records attendance in Philippine
                                    time. A grace period keeps arrivals within
                                    the allowed window marked On time.
                                </p>
                            </div>
                        </div>

                        <Form {...update.form()} className="mt-6 grid gap-5">
                            {({ errors, processing, recentlySuccessful }) => (
                                <>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="work_start_time">
                                                Required arrival time
                                            </Label>
                                            <Input
                                                id="work_start_time"
                                                name="work_start_time"
                                                type="time"
                                                required
                                                defaultValue={
                                                    company.workStartTime
                                                }
                                            />
                                            <InputError
                                                message={errors.work_start_time}
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="late_grace_minutes">
                                                Grace period (minutes)
                                            </Label>
                                            <Input
                                                id="late_grace_minutes"
                                                name="late_grace_minutes"
                                                type="number"
                                                min="0"
                                                max="120"
                                                required
                                                defaultValue={
                                                    company.lateGraceMinutes
                                                }
                                            />
                                            <InputError
                                                message={
                                                    errors.late_grace_minutes
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="timezone">
                                                Attendance timezone
                                            </Label>
                                            <select
                                                id="timezone"
                                                name="timezone"
                                                defaultValue={company.timezone}
                                                className="h-10 rounded-md border bg-background px-3 text-sm"
                                            >
                                                <option value="Asia/Manila">
                                                    Philippines (Asia/Manila)
                                                </option>
                                                <option value="Asia/Singapore">
                                                    Singapore (Asia/Singapore)
                                                </option>
                                                <option value="UTC">UTC</option>
                                            </select>
                                            <InputError
                                                message={errors.timezone}
                                            />
                                        </div>
                                        <fieldset className="grid gap-2">
                                            <legend className="text-sm font-medium">
                                                Scheduled work days
                                            </legend>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    'Mon',
                                                    'Tue',
                                                    'Wed',
                                                    'Thu',
                                                    'Fri',
                                                    'Sat',
                                                    'Sun',
                                                ].map((day, index) => (
                                                    <label
                                                        key={day}
                                                        className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            name="work_days[]"
                                                            value={index + 1}
                                                            defaultChecked={company.workDays.includes(
                                                                index + 1,
                                                            )}
                                                        />
                                                        {day}
                                                    </label>
                                                ))}
                                            </div>
                                            <InputError
                                                message={errors.work_days}
                                            />
                                        </fieldset>
                                    </div>
                                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-6 text-muted-foreground">
                                        Example: with an 8:00 AM start and
                                        10-minute grace period, 8:10 AM is On
                                        time and 8:11 AM is Late. Existing
                                        records keep their original schedule
                                        snapshot.
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button
                                            type="submit"
                                            disabled={processing}
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <ShieldCheck />
                                            )}
                                            Save attendance policy
                                        </Button>
                                        {recentlySuccessful && (
                                            <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
                                                Policy saved
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}
                        </Form>
                    </section>

                    <aside className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                        <Scale className="size-6 text-primary" />
                        <h2 className="mt-4 font-semibold">Company rules</h2>
                        <ul className="mt-3 grid gap-3 text-sm leading-6 text-muted-foreground">
                            <li>
                                • Arrive ready to work by the official time in.
                            </li>
                            <li>
                                • Use Time in only when physically present and
                                ready to begin.
                            </li>
                            <li>
                                • Never ask another person to record attendance
                                for you.
                            </li>
                            <li>
                                • Submit an accurate daily summary after timing
                                out.
                            </li>
                            <li>
                                • Protect company and fellow interns&apos;
                                confidential information.
                            </li>
                            <li>
                                • Follow safety instructions and maintain a
                                respectful workplace.
                            </li>
                        </ul>
                        <Button
                            variant="outline"
                            className="mt-6 w-full"
                            asChild
                        >
                            <Link href={terms()}>
                                Read complete terms
                                <ExternalLink />
                            </Link>
                        </Button>
                    </aside>
                </div>

                <section className="rounded-2xl border border-primary/20 bg-card p-5 shadow-sm sm:p-6">
                    <div className="flex items-start gap-3 border-b pb-5">
                        <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                            <MapPinCheck className="size-5" />
                        </div>
                        <div>
                            <h2 className="font-semibold">
                                Attendance verification
                            </h2>
                            <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                QR codes prove the OJT scanned a short-lived
                                company code. Location is optional and requires
                                consent on every time-in.
                            </p>
                        </div>
                    </div>
                    <Form
                        {...updateVerification.form()}
                        className="mt-6 grid gap-5"
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="verification_mode">
                                            Verification mode
                                        </Label>
                                        <select
                                            id="verification_mode"
                                            name="attendance_verification_mode"
                                            defaultValue={
                                                company.verificationMode
                                            }
                                            className="h-10 rounded-md border bg-background px-3 text-sm"
                                        >
                                            <option value="disabled">
                                                Disabled
                                            </option>
                                            <option value="qr">QR only</option>
                                            <option value="geolocation">
                                                Location only
                                            </option>
                                            <option value="qr_and_geolocation">
                                                QR + location
                                            </option>
                                        </select>
                                        <InputError
                                            message={
                                                errors.attendance_verification_mode
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="latitude">
                                            Workplace latitude
                                        </Label>
                                        <Input
                                            id="latitude"
                                            name="attendance_latitude"
                                            type="number"
                                            step="0.0000001"
                                            defaultValue={
                                                company.attendanceLatitude ?? ''
                                            }
                                        />
                                        <InputError
                                            message={errors.attendance_latitude}
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="longitude">
                                            Workplace longitude
                                        </Label>
                                        <Input
                                            id="longitude"
                                            name="attendance_longitude"
                                            type="number"
                                            step="0.0000001"
                                            defaultValue={
                                                company.attendanceLongitude ??
                                                ''
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors.attendance_longitude
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="radius">
                                            Allowed radius (meters)
                                        </Label>
                                        <Input
                                            id="radius"
                                            name="attendance_radius_meters"
                                            type="number"
                                            min="25"
                                            max="5000"
                                            defaultValue={
                                                company.attendanceRadiusMeters
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors.attendance_radius_meters
                                            }
                                        />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    <Button type="submit" disabled={processing}>
                                        {processing ? (
                                            <Spinner />
                                        ) : (
                                            <ShieldCheck />
                                        )}{' '}
                                        Save verification
                                    </Button>
                                    {attendanceQr && (
                                        <AttendanceQrDialog
                                            companyName={company.name}
                                            verificationMode={
                                                company.verificationMode
                                            }
                                            attendanceQr={attendanceQr}
                                        />
                                    )}
                                </div>
                                <p className="text-xs leading-5 text-muted-foreground">
                                    Privacy: location is collected only at
                                    time-in, stored with that attendance record
                                    for audit, and never tracked continuously.
                                </p>
                            </>
                        )}
                    </Form>
                </section>
            </div>
        </>
    );
}

function AttendanceQrDialog({
    companyName,
    verificationMode,
    attendanceQr,
}: {
    companyName: string;
    verificationMode: Props['company']['verificationMode'];
    attendanceQr: NonNullable<Props['attendanceQr']>;
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [secondsRemaining, setSecondsRemaining] = useState(() =>
        remainingSeconds(attendanceQr.expiresAt),
    );

    useEffect(() => {
        if (!isOpen) {
            return;
        }

        const timer = window.setInterval(() => {
            setSecondsRemaining(remainingSeconds(attendanceQr.expiresAt));
        }, 1000);

        return () => window.clearInterval(timer);
    }, [attendanceQr.expiresAt, isOpen]);

    const isExpired = secondsRemaining === 0;
    const requiresLocation = verificationMode === 'qr_and_geolocation';

    const updateOpenState = (open: boolean) => {
        setIsOpen(open);

        if (open) {
            setSecondsRemaining(remainingSeconds(attendanceQr.expiresAt));
        }
    };

    const refreshQr = () => {
        router.reload({
            only: ['attendanceQr'],
            onStart: () => setIsRefreshing(true),
            onFinish: () => setIsRefreshing(false),
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={updateOpenState}>
            <DialogTrigger asChild>
                <Button type="button" variant="outline">
                    <QrCode /> Show rotating QR
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[94dvh] gap-0 overflow-y-auto p-0 sm:max-w-4xl">
                <DialogHeader className="border-b border-border/70 px-5 py-5 pr-14 sm:px-7">
                    <div className="mb-1 flex items-center gap-2 text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                        <ScanLine className="size-4" /> Secure attendance
                    </div>
                    <DialogTitle className="text-xl sm:text-2xl">
                        Scan to verify attendance
                    </DialogTitle>
                    <DialogDescription className="max-w-2xl leading-6">
                        Display this rotating code at the workplace. The OJT
                        scans it from their signed-in phone before recording
                        time in.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid lg:grid-cols-[minmax(18rem,.85fr)_minmax(0,1.15fr)]">
                    <section className="border-b border-border/70 p-5 sm:p-7 lg:border-r lg:border-b-0">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5">
                                <span className="relative flex size-2.5">
                                    {!isExpired && (
                                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:animate-none" />
                                    )}
                                    <span
                                        className={`relative inline-flex size-2.5 rounded-full ${isExpired ? 'bg-destructive' : 'bg-emerald-500'}`}
                                    />
                                </span>
                                <span className="text-sm font-semibold">
                                    {isExpired ? 'Code expired' : 'Live code'}
                                </span>
                            </div>
                            <span
                                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-xs font-semibold ${isExpired ? 'border-destructive/25 bg-destructive/10 text-destructive' : 'border-primary/20 bg-primary/10 text-primary'}`}
                            >
                                <Clock3 className="size-3.5" />
                                {isExpired
                                    ? 'Expired'
                                    : formatCountdown(secondsRemaining)}
                            </span>
                        </div>

                        <div className="relative mx-auto max-w-sm">
                            <div className="absolute -inset-3 rounded-[2rem] bg-gradient-to-br from-cyan-400/20 via-primary/10 to-emerald-400/20 blur-xl" />
                            <div className="relative overflow-hidden rounded-[1.6rem] border border-white/20 bg-white p-4 shadow-2xl sm:p-5">
                                <img
                                    src={attendanceQr.qrImage}
                                    alt={`Attendance verification QR code for ${companyName}`}
                                    className={`aspect-square w-full transition duration-300 ${isExpired ? 'opacity-20 grayscale' : ''}`}
                                />
                                {isExpired && (
                                    <div className="absolute inset-0 grid place-items-center p-6 text-center">
                                        <div className="rounded-2xl border border-red-200 bg-white/95 px-5 py-4 text-slate-950 shadow-xl">
                                            <p className="font-bold">
                                                This code has expired
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600">
                                                Generate a fresh QR to continue.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button
                            type="button"
                            size="lg"
                            className="mt-5 w-full"
                            disabled={isRefreshing}
                            onClick={refreshQr}
                        >
                            {isRefreshing ? <Spinner /> : <RefreshCw />}
                            Generate fresh QR
                        </Button>
                    </section>

                    <section className="p-5 sm:p-7">
                        <div className="flex items-start gap-3">
                            <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                <Smartphone className="size-5" />
                            </div>
                            <div>
                                <h3 className="font-semibold">
                                    How the OJT checks in
                                </h3>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    Complete these steps in the same signed-in
                                    mobile browser.
                                </p>
                            </div>
                        </div>

                        <ol className="mt-5 grid gap-3">
                            <QrStep
                                number="01"
                                icon={Smartphone}
                                title="Open the secure mobile site"
                                description="The OJT signs in on their phone using the HTTPS site address."
                            />
                            <QrStep
                                number="02"
                                icon={QrCode}
                                title="Scan this rotating code"
                                description="Use the phone camera and open the detected link in the same signed-in browser."
                            />
                            {requiresLocation && (
                                <QrStep
                                    number="03"
                                    icon={MapPinCheck}
                                    title="Allow one-time location access"
                                    description="Return to Attendance, provide consent, and allow location when the browser asks."
                                />
                            )}
                            <QrStep
                                number={requiresLocation ? '04' : '03'}
                                icon={CheckCircle2}
                                title="Tap Time in now"
                                description="The server records the official time after every enabled verification succeeds."
                            />
                        </ol>

                        <div className="mt-5 rounded-xl border border-primary/15 bg-primary/[0.04] p-4 text-xs leading-5 text-muted-foreground">
                            Each QR is signed, expires after ten minutes, and is
                            valid only for {companyName}. Location is requested
                            once and is never continuously tracked.
                        </div>
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function QrStep({
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
        <li className="flex gap-3 rounded-xl border border-border/70 bg-background/50 p-3.5">
            <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted font-mono text-xs font-bold text-muted-foreground">
                {number}
            </span>
            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <Icon className="size-4 shrink-0 text-primary" />
                    <h4 className="text-sm font-medium">{title}</h4>
                </div>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
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

    return `${String(minutes).padStart(2, '0')}:${String(remainder).padStart(2, '0')}`;
}

AttendancePolicy.layout = {
    breadcrumbs: [{ title: 'Attendance policy', href: attendancePolicy() }],
};
