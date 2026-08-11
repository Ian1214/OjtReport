import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, FileSignature, Printer, ShieldCheck } from 'lucide-react';
import { SignaturePreview } from '@/components/signature-pad';
import type { SignatureValue } from '@/components/signature-pad';
import { Button } from '@/components/ui/button';
import { index as dtrSignOffIndex } from '@/routes/dtr-submissions';
import { index as reportsIndex } from '@/routes/reports';

type DtrReport = {
    id: number;
    report_date: string;
    time_in: string | null;
    time_out: string | null;
    total_hours: string;
    attendance_status: 'on_time' | 'late' | null;
    late_minutes: number | null;
};

type Props = {
    profile: {
        name: string;
        studentId: string | null;
        position: string | null;
        department: string | null;
        company: string | null;
    };
    reports: DtrReport[];
    totalHours: number;
    printable: boolean;
    submission: {
        periodStart: string;
        periodEnd: string;
        studentSignatureName: string | null;
        studentSignatureStrokes: SignatureValue | null;
        studentSignedAt: string;
        supervisorSignatureName: string | null;
        supervisorSignatureStrokes: SignatureValue | null;
        supervisorSignedAt: string;
        verifiedAt: string | null;
    } | null;
};

export default function Dtr({
    profile,
    reports,
    totalHours,
    printable,
    submission,
}: Props) {
    return (
        <>
            <Head title="Daily Time Record" />

            <main className="min-h-svh bg-muted/30 p-4 sm:p-8 print:bg-white print:p-0">
                <div className="mx-auto max-w-5xl rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
                    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
                        <Button variant="outline" asChild>
                            <Link
                                href={
                                    printable
                                        ? dtrSignOffIndex()
                                        : reportsIndex()
                                }
                            >
                                <ArrowLeft />
                                {printable
                                    ? 'Back to DTR sign-off'
                                    : 'Back to reports'}
                            </Link>
                        </Button>
                        {printable ? (
                            <Button
                                type="button"
                                onClick={() => window.print()}
                            >
                                <Printer />
                                Print signed DTR
                            </Button>
                        ) : (
                            <Button asChild>
                                <Link href={dtrSignOffIndex()}>
                                    <FileSignature />
                                    Sign DTR before printing
                                </Link>
                            </Button>
                        )}
                    </div>

                    {!printable && (
                        <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200 print:hidden">
                            <FileSignature className="mt-0.5 size-5 shrink-0" />
                            <p>
                                This is a preview. Printing becomes available
                                after you sign and submit a period, your
                                supervisor signs it, and the company
                                administrator completes verification.
                            </p>
                        </div>
                    )}

                    <header className="border-b pb-6 text-center">
                        <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
                            OJT Daily Time Record
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold">
                            Daily Time Record
                        </h1>
                        {submission && (
                            <p className="mt-2 text-sm text-muted-foreground">
                                {formatDate(submission.periodStart)} –{' '}
                                {formatDate(submission.periodEnd)}
                            </p>
                        )}
                    </header>

                    <section className="grid gap-3 py-6 text-sm sm:grid-cols-2">
                        <DtrDetail label="Name" value={profile.name} />
                        <DtrDetail
                            label="Student ID"
                            value={profile.studentId ?? 'Not assigned'}
                        />
                        <DtrDetail
                            label="OJT Position / Department"
                            value={`${profile.position ?? 'Not set'} / ${profile.department ?? 'Not set'}`}
                        />
                        <DtrDetail
                            label="Company"
                            value={profile.company ?? 'Not set'}
                        />
                    </section>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-y bg-muted/40">
                                    <th className="px-3 py-3 font-semibold">
                                        Date
                                    </th>
                                    <th className="px-3 py-3 font-semibold">
                                        Time In
                                    </th>
                                    <th className="px-3 py-3 font-semibold">
                                        Time Out
                                    </th>
                                    <th className="px-3 py-3 font-semibold">
                                        Arrival
                                    </th>
                                    <th className="px-3 py-3 text-right font-semibold">
                                        Total Hours
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-3 py-10 text-center text-muted-foreground"
                                        >
                                            No daily reports have been
                                            submitted.
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map((report) => (
                                        <tr
                                            key={report.id}
                                            className="border-b"
                                        >
                                            <td className="px-3 py-3">
                                                {formatDate(report.report_date)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {formatTime(report.time_in)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {formatTime(report.time_out)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {report.attendance_status ===
                                                'late'
                                                    ? `Late (${report.late_minutes ?? 0} min)`
                                                    : report.attendance_status ===
                                                        'on_time'
                                                      ? 'On time'
                                                      : '—'}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                {report.total_hours}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2">
                                    <td
                                        colSpan={4}
                                        className="px-3 py-4 text-right font-semibold"
                                    >
                                        Total completed hours
                                    </td>
                                    <td className="px-3 py-4 text-right font-semibold">
                                        {Number(totalHours).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="mt-16 grid gap-12 text-sm sm:grid-cols-2">
                        <SignatureLine
                            name={
                                submission?.studentSignatureName ?? profile.name
                            }
                            label="Student signature"
                            strokes={
                                submission?.studentSignatureStrokes ?? null
                            }
                            signedAt={submission?.studentSignedAt ?? null}
                        />
                        <SignatureLine
                            name={
                                submission?.supervisorSignatureName ??
                                'Awaiting supervisor'
                            }
                            label="Supervisor signature"
                            strokes={
                                submission?.supervisorSignatureStrokes ?? null
                            }
                            signedAt={submission?.supervisorSignedAt ?? null}
                        />
                    </div>

                    {submission?.verifiedAt && (
                        <div className="mt-10 flex items-center justify-center gap-2 border-t pt-4 text-xs text-muted-foreground">
                            <ShieldCheck className="size-4" />
                            Company verified{' '}
                            {formatDateTime(submission.verifiedAt)}
                        </div>
                    )}
                </div>
            </main>
        </>
    );
}

function DtrDetail({ label, value }: { label: string; value: string }) {
    return (
        <p>
            <span className="font-semibold">{label}: </span>
            {value}
        </p>
    );
}

function SignatureLine({
    name,
    label,
    strokes,
    signedAt,
}: {
    name: string;
    label: string;
    strokes: SignatureValue | null;
    signedAt: string | null;
}) {
    const hasDrawing = Boolean(strokes?.strokes.length);

    return (
        <div className="text-center">
            <div className="flex min-h-24 items-end justify-center px-4">
                {hasDrawing ? (
                    <SignaturePreview
                        value={strokes}
                        label={`${name} ${label}`}
                        className="h-24 max-w-xs"
                    />
                ) : (
                    <p className="pb-3 font-medium italic">{name}</p>
                )}
            </div>
            <div className="border-t pt-2">
                <p className="font-medium">{name}</p>
                <p className="mt-1 text-muted-foreground">{label}</p>
                <p className="mt-1 text-xs text-muted-foreground">
                    {signedAt
                        ? `Electronically signed ${formatDateTime(signedAt)}`
                        : 'Not yet electronically signed'}
                </p>
            </div>
        </div>
    );
}

function formatDateTime(date: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Manila',
    }).format(new Date(date));
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
    }).format(new Date(`${date.slice(0, 10)}T00:00:00`));
}

function formatTime(time: string | null): string {
    if (!time) {
        return '—';
    }

    const [hours = 0, minutes = 0] = time.split(':').map(Number);

    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(2000, 0, 1, hours, minutes));
}
