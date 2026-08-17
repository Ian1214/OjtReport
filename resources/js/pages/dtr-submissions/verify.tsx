import { Head, Link } from '@inertiajs/react';
import { Ban, CheckCircle2, Fingerprint, ShieldCheck } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';

type RecordData = {
    valid: boolean;
    revoked: boolean;
    ojtName: string;
    studentId: string | null;
    companyName: string | null;
    periodStart: string;
    periodEnd: string;
    totalHours: string;
    verifiedAt: string | null;
    fingerprint: string | null;
};

export default function VerifyDtr({ record }: { record: RecordData }) {
    return (
        <>
            <Head title="Verify DTR" />
            <main className="min-h-screen bg-[#05090d] px-4 py-8 text-white sm:px-6 sm:py-14">
                <div className="mx-auto max-w-3xl">
                    <header className="mb-8 flex items-center justify-between gap-4">
                        <Link href={home()} className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-xl border border-cyan-400/25 bg-cyan-400/10">
                                <AppLogoIcon className="size-6" />
                            </span>
                            <span className="font-semibold">OJT Report</span>
                        </Link>
                        <span className="text-xs tracking-[0.18em] text-cyan-200/65 uppercase">
                            Public DTR verification
                        </span>
                    </header>
                    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-cyan-950/25 backdrop-blur-xl">
                        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_52%)] p-6 sm:p-9">
                            <div className="flex items-start justify-between gap-5">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">
                                        Daily Time Record
                                    </p>
                                    <h1 className="mt-2 text-3xl font-semibold">
                                        {record.valid
                                            ? 'DTR verified'
                                            : record.revoked
                                              ? 'DTR revoked'
                                              : 'Integrity check failed'}
                                    </h1>
                                    <p className="mt-3 text-sm leading-6 text-slate-300">
                                        Checked directly against the
                                        company-approved, electronically signed
                                        record.
                                    </p>
                                </div>
                                <span
                                    className={`grid size-14 place-items-center rounded-2xl border ${record.valid ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300' : 'border-red-400/30 bg-red-400/10 text-red-300'}`}
                                >
                                    {record.valid ? (
                                        <CheckCircle2 className="size-7" />
                                    ) : (
                                        <Ban className="size-7" />
                                    )}
                                </span>
                            </div>
                        </div>
                        <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-9">
                            <Detail label="OJT name" value={record.ojtName} />
                            <Detail
                                label="Student ID"
                                value={record.studentId ?? 'Not recorded'}
                            />
                            <Detail
                                label="Company"
                                value={record.companyName ?? 'Not recorded'}
                            />
                            <Detail
                                label="Approved hours"
                                value={`${record.totalHours} hours`}
                            />
                            <Detail
                                label="Period"
                                value={`${formatDate(record.periodStart)} – ${formatDate(record.periodEnd)}`}
                            />
                            <Detail
                                label="Verified"
                                value={
                                    record.verifiedAt
                                        ? new Date(
                                              record.verifiedAt,
                                          ).toLocaleString()
                                        : 'Not recorded'
                                }
                            />
                        </div>
                        <div className="border-t border-white/10 p-6 sm:p-9">
                            <div className="flex items-start gap-3">
                                <Fingerprint className="mt-0.5 size-5 shrink-0 text-cyan-300" />
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-200">
                                        Integrity fingerprint
                                    </p>
                                    <p className="mt-1 font-mono text-xs leading-5 break-all text-slate-400">
                                        {record.fingerprint ?? 'Unavailable'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                        <p className="flex items-center gap-2 text-xs text-slate-500">
                            <ShieldCheck className="size-4" />
                            Signature drawings and daily summaries remain
                            private.
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        >
                            <Link href={home()}>Visit OJT Report</Link>
                        </Button>
                    </div>
                </div>
            </main>
        </>
    );
}

function Detail({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">
                {label}
            </p>
            <p className="mt-1 font-medium text-slate-100">{value}</p>
        </div>
    );
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
        new Date(`${value}T00:00:00`),
    );
}
