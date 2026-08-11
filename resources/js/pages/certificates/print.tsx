import { Head, Link } from '@inertiajs/react';
import { ArrowLeft, Award, Printer, ShieldCheck } from 'lucide-react';
import { SignaturePreview } from '@/components/signature-pad';
import type { SignatureValue } from '@/components/signature-pad';
import { Button } from '@/components/ui/button';
import { index } from '@/routes/certificates';

type Props = {
    certificate: {
        certificateNumber: string;
        ojtName: string;
        studentId: string | null;
        companyName: string;
        program: string | null;
        position: string | null;
        department: string | null;
        allocatedHours: string;
        adminSignatureName: string;
        adminSignatureStrokes: SignatureValue;
        adminSignedAt: string;
        supervisorSignatureName: string;
        supervisorSignatureStrokes: SignatureValue;
        supervisorSignedAt: string;
        finalizedAt: string;
        verificationHash: string;
        verificationUrl: string;
        verificationQrCode: string;
    };
};

export default function PrintableCertificate({ certificate }: Props) {
    return (
        <>
            <Head title={`Certificate ${certificate.certificateNumber}`} />
            <style>{`@media print { @page { size: A4 landscape; margin: 8mm; } }`}</style>
            <main className="min-h-screen bg-zinc-950 p-4 text-zinc-100 sm:p-8 print:flex print:min-h-0 print:items-start print:justify-center print:overflow-hidden print:bg-white print:p-0 print:text-black">
                <div className="mx-auto mb-4 flex max-w-5xl flex-wrap gap-3 print:hidden">
                    <Button variant="outline" asChild>
                        <Link href={index()}>
                            <ArrowLeft /> Back to certificates
                        </Link>
                    </Button>
                    <Button onClick={() => window.print()}>
                        <Printer /> Print or save as PDF
                    </Button>
                </div>

                <article className="relative mx-auto min-h-[720px] max-w-5xl overflow-hidden rounded-2xl border border-amber-400/35 bg-[#fcfaf3] p-6 text-zinc-950 shadow-2xl sm:p-12 print:h-[194mm] print:min-h-0 print:w-[281mm] print:max-w-none print:break-inside-avoid print:rounded-none print:border-4 print:p-[10mm] print:shadow-none">
                    <div className="pointer-events-none absolute inset-3 border border-amber-600/35" />
                    <div className="pointer-events-none absolute inset-5 border border-zinc-900/15" />
                    <div className="relative flex min-h-[640px] flex-col items-center text-center print:h-full print:min-h-0">
                        <div className="flex size-16 items-center justify-center rounded-full border border-amber-600/40 bg-amber-500/10">
                            <Award className="size-8 text-amber-700" />
                        </div>
                        <p className="mt-5 text-xs font-semibold tracking-[0.32em] text-amber-800 uppercase">
                            {certificate.companyName}
                        </p>
                        <h1 className="mt-5 font-serif text-4xl font-semibold tracking-tight sm:text-6xl">
                            Certificate of Completion
                        </h1>
                        <p className="mt-6 font-serif text-lg text-zinc-600 italic">
                            This certificate is proudly presented to
                        </p>
                        <h2 className="mt-4 border-b border-amber-700/40 px-8 pb-2 font-serif text-3xl font-semibold sm:text-5xl">
                            {certificate.ojtName}
                        </h2>
                        <p className="mt-6 max-w-3xl text-base leading-8 text-zinc-700 sm:text-lg">
                            for successfully rendering and completing{' '}
                            <strong className="text-2xl text-zinc-950">
                                {certificate.allocatedHours} hours
                            </strong>{' '}
                            of supervised on-the-job training
                            {certificate.position
                                ? ` as ${certificate.position}`
                                : ''}
                            {certificate.department
                                ? ` in the ${certificate.department}`
                                : ''}
                            .
                        </p>
                        {certificate.program && (
                            <p className="mt-3 text-sm text-zinc-600">
                                {certificate.program}
                                {certificate.studentId
                                    ? ` · Student ID ${certificate.studentId}`
                                    : ''}
                            </p>
                        )}
                        <p className="mt-6 text-sm text-zinc-600">
                            Issued on {formatDate(certificate.finalizedAt)}
                        </p>

                        <div className="mt-auto grid w-full gap-10 pt-14 sm:grid-cols-2">
                            <SignatureBlock
                                label="Company administrator"
                                name={certificate.adminSignatureName}
                                signature={certificate.adminSignatureStrokes}
                            />
                            <SignatureBlock
                                label="OJT supervisor"
                                name={certificate.supervisorSignatureName}
                                signature={
                                    certificate.supervisorSignatureStrokes
                                }
                            />
                        </div>

                        <div className="mt-8 flex w-full items-end justify-between gap-4 border-t border-zinc-300 pt-4 text-left text-[10px] text-zinc-500">
                            <div className="grid min-w-0 gap-1">
                                <span>{certificate.certificateNumber}</span>
                                <span className="flex items-center gap-1">
                                    <ShieldCheck className="size-3" />{' '}
                                    Electronically signed and integrity sealed
                                </span>
                                <span className="max-w-xl truncate font-mono">
                                    {certificate.verificationHash}
                                </span>
                                <span className="truncate">
                                    {certificate.verificationUrl}
                                </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2 text-right">
                                <span className="max-w-24 leading-4">
                                    Scan to verify authenticity
                                </span>
                                <img
                                    src={certificate.verificationQrCode}
                                    alt="Certificate verification QR code"
                                    className="size-20 border border-zinc-300 bg-white p-1"
                                />
                            </div>
                        </div>
                    </div>
                </article>
            </main>
        </>
    );
}

function SignatureBlock({
    label,
    name,
    signature,
}: {
    label: string;
    name: string;
    signature: SignatureValue;
}) {
    return (
        <div className="mx-auto w-full max-w-xs">
            <SignaturePreview
                value={signature}
                label={`${label} signature`}
                className="h-24 text-zinc-950 dark:text-zinc-950 print:text-black"
            />
            <div className="border-t border-zinc-700 pt-2">
                <p className="font-semibold">{name}</p>
                <p className="mt-1 text-xs tracking-wide text-zinc-500 uppercase">
                    {label}
                </p>
            </div>
        </div>
    );
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(
        new Date(value),
    );
}
