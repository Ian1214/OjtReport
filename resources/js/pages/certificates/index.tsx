import { Form, Head, Link } from '@inertiajs/react';
import { Award, CheckCircle2, Clock3, Printer, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    destroy,
    print as printCertificate,
    sign,
    store,
} from '@/actions/App/Http/Controllers/CompletionCertificateController';
import { DashboardHero } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import SignaturePad, { isSignatureComplete } from '@/components/signature-pad';
import type { SignatureValue } from '@/components/signature-pad';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Certificate = {
    id: number;
    certificateNumber: string;
    ojtName: string;
    studentId: string | null;
    allocatedHours: string;
    approvedHoursSnapshot: string;
    status: 'pending_supervisor' | 'finalized';
    companyName: string;
    adminSignerName: string;
    adminSignedAt: string;
    supervisorName: string;
    supervisorSignedAt: string | null;
    finalizedAt: string | null;
};

type OjtOption = {
    id: number;
    name: string;
    studentId: string | null;
    supervisorName: string | null;
    approvedHours: string;
    allocatedHours: string;
    availableHours: string;
};

type Props = {
    role: 'company_admin' | 'supervisor' | 'ojt' | 'school_coordinator';
    signerName: string;
    ojts: OjtOption[];
    certificates: { data: Certificate[] };
};

export default function Certificates({
    role,
    signerName,
    ojts,
    certificates,
}: Props) {
    const [adminSignature, setAdminSignature] =
        useState<SignatureValue>(emptySignature());
    const [selectedOjtId, setSelectedOjtId] = useState('');
    const selectedOjt = useMemo(
        () => ojts.find((ojt) => String(ojt.id) === selectedOjtId),
        [ojts, selectedOjtId],
    );

    return (
        <>
            <Head title="Completion certificates" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Verified achievement"
                    title="Completion certificates"
                    description={descriptionFor(role)}
                />

                {role === 'company_admin' && (
                    <Card>
                        <CardHeader>
                            <CardTitle>Issue a certificate</CardTitle>
                            <CardDescription>
                                Allocate any portion of the OJT’s approved,
                                uncertified hours. Your signature starts the
                                supervisor sign-off workflow.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form
                                {...store.form()}
                                className="grid gap-5"
                                onSuccess={() => {
                                    setAdminSignature(emptySignature());
                                    setSelectedOjtId('');
                                }}
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <div className="grid gap-4 lg:grid-cols-3">
                                            <div className="grid gap-2 lg:col-span-2">
                                                <Label htmlFor="ojt_id">
                                                    OJT account
                                                </Label>
                                                <select
                                                    id="ojt_id"
                                                    name="ojt_id"
                                                    value={selectedOjtId}
                                                    onChange={(event) =>
                                                        setSelectedOjtId(
                                                            event.target.value,
                                                        )
                                                    }
                                                    required
                                                    className="h-11 w-full rounded-xl border border-input bg-background/65 px-3 text-sm transition outline-none focus:border-primary/60 focus:ring-3 focus:ring-primary/15"
                                                >
                                                    <option value="">
                                                        Select an OJT
                                                    </option>
                                                    {ojts.map((ojt) => (
                                                        <option
                                                            key={ojt.id}
                                                            value={ojt.id}
                                                            disabled={
                                                                Number(
                                                                    ojt.availableHours,
                                                                ) <= 0
                                                            }
                                                        >
                                                            {ojt.name} —{' '}
                                                            {ojt.availableHours}{' '}
                                                            hours available
                                                        </option>
                                                    ))}
                                                </select>
                                                <InputError
                                                    message={errors.ojt_id}
                                                />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="allocated_hours">
                                                    Hours to certify
                                                </Label>
                                                <Input
                                                    id="allocated_hours"
                                                    name="allocated_hours"
                                                    type="number"
                                                    min="0.01"
                                                    max={
                                                        selectedOjt?.availableHours
                                                    }
                                                    step="0.01"
                                                    placeholder="250"
                                                    required
                                                />
                                                <InputError
                                                    message={
                                                        errors.allocated_hours
                                                    }
                                                />
                                            </div>
                                        </div>

                                        {selectedOjt && (
                                            <div className="grid gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm sm:grid-cols-4">
                                                <Metric
                                                    label="Approved"
                                                    value={`${selectedOjt.approvedHours} h`}
                                                />
                                                <Metric
                                                    label="Already allocated"
                                                    value={`${selectedOjt.allocatedHours} h`}
                                                />
                                                <Metric
                                                    label="Available"
                                                    value={`${selectedOjt.availableHours} h`}
                                                />
                                                <Metric
                                                    label="Supervisor"
                                                    value={
                                                        selectedOjt.supervisorName ??
                                                        'Not assigned'
                                                    }
                                                />
                                            </div>
                                        )}

                                        <div className="grid gap-2">
                                            <Label htmlFor="signature">
                                                Confirm your full name
                                            </Label>
                                            <Input
                                                id="signature"
                                                name="signature"
                                                placeholder={`Type ${signerName}`}
                                                autoComplete="name"
                                                required
                                            />
                                            <InputError
                                                message={errors.signature}
                                            />
                                        </div>
                                        <SignaturePad
                                            id="administrator-certificate-signature"
                                            value={adminSignature}
                                            onChange={setAdminSignature}
                                            error={errors.signature_data}
                                            required
                                        />
                                        <Button
                                            type="submit"
                                            className="justify-self-start"
                                            disabled={
                                                processing ||
                                                !selectedOjt ||
                                                !isSignatureComplete(
                                                    adminSignature,
                                                )
                                            }
                                        >
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <Award />
                                            )}
                                            Create and send for signature
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}

                <section className="grid gap-4">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {role === 'supervisor'
                                ? 'Certificates awaiting your signature'
                                : 'Certificate records'}
                        </h2>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Finalized certificates are printable records. If a
                            signed record must be withdrawn, the company can
                            revoke it with an auditable reason.
                        </p>
                    </div>

                    {certificates.data.length === 0 ? (
                        <Card>
                            <CardContent className="py-8 text-center text-sm text-muted-foreground">
                                No completion certificates are available yet.
                            </CardContent>
                        </Card>
                    ) : (
                        certificates.data.map((certificate) => (
                            <CertificateCard
                                key={certificate.id}
                                certificate={certificate}
                                role={role}
                                signerName={signerName}
                            />
                        ))
                    )}
                </section>
            </div>
        </>
    );
}

function CertificateCard({
    certificate,
    role,
    signerName,
}: {
    certificate: Certificate;
    role: Props['role'];
    signerName: string;
}) {
    const [signature, setSignature] =
        useState<SignatureValue>(emptySignature());
    const finalized = certificate.status === 'finalized';

    return (
        <Card className="overflow-hidden">
            <CardContent className="grid gap-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold">
                                {certificate.ojtName}
                            </h3>
                            <Badge variant={finalized ? 'default' : 'outline'}>
                                {finalized ? <CheckCircle2 /> : <Clock3 />}
                                {finalized
                                    ? 'Finalized'
                                    : 'Supervisor signature pending'}
                            </Badge>
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {certificate.certificateNumber} ·{' '}
                            {certificate.studentId ?? 'No student ID'}
                        </p>
                    </div>
                    <div className="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3 text-right">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Certified hours
                        </p>
                        <p className="mt-1 text-xl font-semibold text-primary">
                            {certificate.allocatedHours}
                        </p>
                    </div>
                </div>

                <div className="grid gap-3 text-sm sm:grid-cols-2">
                    <SignerStatus
                        title="Company administrator"
                        name={certificate.adminSignerName}
                        date={certificate.adminSignedAt}
                        complete
                    />
                    <SignerStatus
                        title="Assigned supervisor"
                        name={certificate.supervisorName}
                        date={certificate.supervisorSignedAt}
                        complete={finalized}
                    />
                </div>

                {role === 'supervisor' && !finalized && (
                    <Form
                        {...sign.form(certificate.id)}
                        className="grid gap-4 rounded-2xl border border-primary/15 bg-primary/4 p-4"
                        onSuccess={() => setSignature(emptySignature())}
                    >
                        {({ errors, processing }) => (
                            <>
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={`signature-${certificate.id}`}
                                    >
                                        Confirm your full name
                                    </Label>
                                    <Input
                                        id={`signature-${certificate.id}`}
                                        name="signature"
                                        placeholder={`Type ${signerName}`}
                                        required
                                    />
                                    <InputError message={errors.signature} />
                                </div>
                                <SignaturePad
                                    id={`supervisor-signature-${certificate.id}`}
                                    value={signature}
                                    onChange={setSignature}
                                    error={errors.signature_data}
                                    required
                                />
                                <Button
                                    type="submit"
                                    className="justify-self-start"
                                    disabled={
                                        processing ||
                                        !isSignatureComplete(signature)
                                    }
                                >
                                    {processing ? <Spinner /> : <Award />}
                                    Sign and release to OJT
                                </Button>
                            </>
                        )}
                    </Form>
                )}

                <div className="flex flex-wrap justify-end gap-2">
                    {role === 'company_admin' && (
                        <DeleteCertificateButton certificate={certificate} />
                    )}
                    {finalized && (
                        <Button variant="outline" asChild>
                            <Link href={printCertificate(certificate.id)}>
                                <Printer /> Open printable certificate
                            </Link>
                        </Button>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function DeleteCertificateButton({
    certificate,
}: {
    certificate: Certificate;
}) {
    const finalized = certificate.status === 'finalized';

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive">
                    <Trash2 />{' '}
                    {finalized ? 'Revoke certificate' : 'Remove draft'}
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>
                        {finalized
                            ? 'Revoke this certificate?'
                            : 'Remove this draft?'}
                    </DialogTitle>
                    <DialogDescription>
                        {finalized
                            ? `${certificate.certificateNumber} will remain publicly verifiable but will be clearly marked as revoked. Its allocated hours will become available again.`
                            : `${certificate.certificateNumber} is not finalized and will be removed. Its allocated hours will become available again.`}{' '}
                        This action is recorded in the audit trail.
                    </DialogDescription>
                </DialogHeader>
                <Form {...destroy.form(certificate.id)}>
                    {({ errors, processing }) => (
                        <div className="grid gap-4">
                            {finalized && (
                                <div className="grid gap-2">
                                    <Label
                                        htmlFor={`revocation-${certificate.id}`}
                                    >
                                        Reason for revocation
                                    </Label>
                                    <textarea
                                        id={`revocation-${certificate.id}`}
                                        name="revocation_reason"
                                        required
                                        minLength={10}
                                        maxLength={1000}
                                        rows={4}
                                        placeholder="Explain why this signed certificate must be revoked."
                                        className="w-full resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary/60 focus:ring-3 focus:ring-primary/15"
                                    />
                                    <InputError
                                        message={errors.revocation_reason}
                                    />
                                </div>
                            )}
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="outline">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button
                                    type="submit"
                                    variant="destructive"
                                    disabled={processing}
                                >
                                    {processing ? <Spinner /> : <Trash2 />}
                                    {finalized
                                        ? 'Revoke certificate'
                                        : 'Remove draft'}
                                </Button>
                            </DialogFooter>
                        </div>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <p className="text-xs font-medium text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
        </div>
    );
}

function SignerStatus({
    title,
    name,
    date,
    complete,
}: {
    title: string;
    name: string;
    date: string | null;
    complete: boolean;
}) {
    return (
        <div className="rounded-xl border bg-muted/30 p-4">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className="mt-1 font-semibold">{name}</p>
            <p className="mt-1 text-xs text-muted-foreground">
                {complete && date
                    ? `Signed ${formatDateTime(date)}`
                    : 'Awaiting electronic signature'}
            </p>
        </div>
    );
}

function descriptionFor(role: Props['role']): string {
    if (role === 'company_admin') {
        return 'Issue partial or full certificates using only verified, approved OJT hours.';
    }

    if (role === 'supervisor') {
        return 'Review company-issued certificates and countersign them before release.';
    }

    return 'Open and print certificates signed by your company administrator and supervisor.';
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function emptySignature(): SignatureValue {
    return { version: 1, strokes: [] };
}
