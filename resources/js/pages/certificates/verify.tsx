import { Head, Link } from '@inertiajs/react';
import {
    Award,
    Ban,
    CheckCircle2,
    Fingerprint,
    ShieldCheck,
} from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { Button } from '@/components/ui/button';
import { home } from '@/routes';

type Certificate = {
    certificateNumber: string;
    status: 'finalized' | 'pending_supervisor' | 'revoked';
    ojtName: string;
    studentId: string | null;
    companyName: string;
    allocatedHours: string;
    adminSignerName: string;
    supervisorSignerName: string | null;
    finalizedAt: string | null;
    verificationHash: string | null;
    revokedAt: string | null;
};

export default function VerifyCertificate({
    certificate,
}: {
    certificate: Certificate;
}) {
    const valid = certificate.status === 'finalized';

    return (
        <>
            <Head title={`Verify ${certificate.certificateNumber}`} />
            <main className="min-h-screen bg-[#05090d] px-4 py-8 text-white sm:px-6 sm:py-14">
                <div className="mx-auto max-w-3xl">
                    <header className="mb-8 flex items-center justify-between gap-4">
                        <Link href={home()} className="flex items-center gap-3">
                            <span className="flex size-10 items-center justify-center rounded-xl border border-cyan-400/25 bg-cyan-400/10">
                                <AppLogoIcon className="size-6" />
                            </span>
                            <span className="font-semibold">OJT Report</span>
                        </Link>
                        <span className="text-xs tracking-[0.18em] text-cyan-200/65 uppercase">
                            Public verification
                        </span>
                    </header>

                    <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] shadow-2xl shadow-cyan-950/25 backdrop-blur-xl">
                        <div className="border-b border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,.16),transparent_52%)] p-6 sm:p-9">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="text-xs font-semibold tracking-[0.2em] text-cyan-300 uppercase">
                                        Completion certificate
                                    </p>
                                    <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                        {valid
                                            ? 'Certificate verified'
                                            : certificate.status === 'revoked'
                                              ? 'Certificate revoked'
                                              : 'Certificate pending'}
                                    </h1>
                                    <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                                        This record was checked directly against
                                        the issuing company’s certificate
                                        ledger.
                                    </p>
                                </div>
                                <div
                                    className={`flex size-14 items-center justify-center rounded-2xl border ${
                                        valid
                                            ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                                            : 'border-red-400/30 bg-red-400/10 text-red-300'
                                    }`}
                                >
                                    {valid ? (
                                        <CheckCircle2 className="size-7" />
                                    ) : (
                                        <Ban className="size-7" />
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="grid gap-6 p-6 sm:grid-cols-2 sm:p-9">
                            <Detail
                                label="Certificate number"
                                value={certificate.certificateNumber}
                            />
                            <Detail
                                label="Issued by"
                                value={certificate.companyName}
                            />
                            <Detail
                                label="OJT name"
                                value={certificate.ojtName}
                            />
                            <Detail
                                label="Student ID"
                                value={certificate.studentId ?? 'Not recorded'}
                            />
                            <Detail
                                label="Certified hours"
                                value={`${certificate.allocatedHours} hours`}
                            />
                            <Detail
                                label="Finalized"
                                value={
                                    certificate.finalizedAt
                                        ? formatDate(certificate.finalizedAt)
                                        : 'Not yet finalized'
                                }
                            />
                            <Detail
                                label="Company administrator"
                                value={certificate.adminSignerName}
                            />
                            <Detail
                                label="OJT supervisor"
                                value={
                                    certificate.supervisorSignerName ??
                                    'Awaiting signature'
                                }
                            />
                        </div>

                        {certificate.status === 'revoked' && (
                            <div className="mx-6 mb-6 rounded-2xl border border-red-400/25 bg-red-400/10 p-4 sm:mx-9 sm:mb-9">
                                <p className="font-semibold text-red-200">
                                    Revocation notice
                                </p>
                                <p className="mt-1 text-sm text-red-100/75">
                                    Revoked by the issuing company. Contact the
                                    company administrator for details.
                                    {certificate.revokedAt &&
                                        ` · ${formatDate(certificate.revokedAt)}`}
                                </p>
                            </div>
                        )}

                        <div className="border-t border-white/10 p-6 sm:p-9">
                            <div className="flex items-start gap-3 text-sm text-slate-400">
                                <Fingerprint className="mt-0.5 size-5 shrink-0 text-cyan-300" />
                                <div className="min-w-0">
                                    <p className="font-medium text-slate-200">
                                        Integrity fingerprint
                                    </p>
                                    <p className="mt-1 font-mono text-xs leading-5 break-all">
                                        {certificate.verificationHash ??
                                            'Available after finalization'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </section>

                    <div className="mt-6 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
                        <p className="flex items-center gap-2 text-xs text-slate-500">
                            <ShieldCheck className="size-4" />
                            Signature drawings remain private and are shown only
                            on authorized copies.
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            className="border-white/15 bg-white/5 text-white hover:bg-white/10 hover:text-white"
                        >
                            <Link href={home()}>
                                <Award /> Visit OJT Report
                            </Link>
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
            <p className="mt-1 text-base font-medium text-slate-100">{value}</p>
        </div>
    );
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'long',
        timeStyle: 'short',
    }).format(new Date(value));
}
