import { Form, Head } from '@inertiajs/react';
import {
    Check,
    ClipboardCheck,
    Copy,
    ExternalLink,
    FileCheck2,
    Link2,
    ShieldCheck,
    Trash2,
} from 'lucide-react';
import { useState } from 'react';
import {
    destroyShare,
    storeShare,
} from '@/actions/App/Http/Controllers/CompetencyPassportController';
import { DashboardHero, EmptyState } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';

export type Passport = {
    name: string;
    studentId: string | null;
    program: string | null;
    position: string | null;
    department: string | null;
    companyName: string;
    supervisorName: string;
    schoolName: string | null;
    startDate: string | null;
    completionDate: string | null;
    approvedHours: number;
    requiredHours: number;
    approvedReports: number;
    completedTasks: {
        title: string;
        description: string | null;
        completedAt: string | null;
        outcomes: { code: string; title: string }[];
    }[];
    skills: {
        key: string;
        label: string;
        score: number | null;
        evidenceCount: number;
    }[];
    evaluationCount: number;
    certificates: {
        number: string;
        hours: number;
        finalizedAt: string | null;
    }[];
    schoolAcknowledgedAt: string | null;
    fingerprint: string;
    verifiedAt: string;
};

type ActiveShare = {
    id: number;
    url: string;
    expiresAt: string;
    accessCount: number;
    lastAccessedAt: string | null;
};

export default function PassportShow({
    passport,
    canManageSharing,
    activeShare,
    newShareUrl,
}: {
    passport: Passport;
    canManageSharing: boolean;
    activeShare: ActiveShare | null;
    newShareUrl: string | null;
}) {
    const [copied, setCopied] = useState(false);
    const shareUrl = newShareUrl ?? activeShare?.url ?? null;

    const copyLink = async () => {
        if (!shareUrl) {
            return;
        }

        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1800);
    };

    return (
        <>
            <Head title={`${passport.name} · Competency passport`} />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <DashboardHero
                    eyebrow="Verified OJT record"
                    title={`${passport.name}'s competency passport`}
                    description={`${passport.position ?? 'OJT'} · ${passport.department ?? 'Department not set'} · ${passport.companyName}`}
                />

                <PassportDetails passport={passport} />

                {canManageSharing && (
                    <Card className="border-cyan-500/20 bg-cyan-500/[0.04]">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Link2 className="size-5 text-cyan-400" />
                                Employer verification link
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                                You control access. Public viewers see verified
                                outcomes, never report text, messages, email, or
                                private documents.
                            </p>
                        </CardHeader>
                        <CardContent className="grid gap-4">
                            {shareUrl ? (
                                <div className="grid gap-3">
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <input
                                            readOnly
                                            value={shareUrl}
                                            className="min-w-0 flex-1 rounded-md border bg-background px-3 py-2 text-sm"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={copyLink}
                                        >
                                            {copied ? <Check /> : <Copy />}
                                            {copied ? 'Copied' : 'Copy link'}
                                        </Button>
                                        <Button variant="outline" asChild>
                                            <a
                                                href={shareUrl}
                                                target="_blank"
                                                rel="noreferrer"
                                            >
                                                <ExternalLink /> Preview
                                            </a>
                                        </Button>
                                    </div>
                                    {activeShare && (
                                        <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
                                            <span>
                                                Expires{' '}
                                                {new Date(
                                                    activeShare.expiresAt,
                                                ).toLocaleString()}{' '}
                                                · Opened{' '}
                                                {activeShare.accessCount} times
                                            </span>
                                            <Form
                                                {...destroyShare.form(
                                                    activeShare.id,
                                                )}
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        disabled={processing}
                                                    >
                                                        {processing ? (
                                                            <Spinner />
                                                        ) : (
                                                            <Trash2 />
                                                        )}
                                                        Revoke access
                                                    </Button>
                                                )}
                                            </Form>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                                    No active public link. Your passport remains
                                    private.
                                </p>
                            )}
                            <Form
                                {...storeShare.form()}
                                className="flex flex-col gap-3 sm:flex-row sm:items-end"
                            >
                                {({ errors, processing }) => (
                                    <>
                                        <label className="grid flex-1 gap-1.5 text-sm font-medium">
                                            Link validity
                                            <select
                                                name="expires_days"
                                                defaultValue="30"
                                                className="h-10 rounded-md border bg-background px-3"
                                            >
                                                <option value="7">
                                                    7 days
                                                </option>
                                                <option value="30">
                                                    30 days
                                                </option>
                                                <option value="60">
                                                    60 days
                                                </option>
                                                <option value="90">
                                                    90 days
                                                </option>
                                            </select>
                                            <InputError
                                                message={errors.expires_days}
                                            />
                                        </label>
                                        <Button disabled={processing}>
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <Link2 />
                                            )}
                                            {activeShare
                                                ? 'Replace link'
                                                : 'Create secure link'}
                                        </Button>
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}
            </div>
        </>
    );
}

export function PassportDetails({ passport }: { passport: Passport }) {
    const progress = Math.min(
        100,
        (passport.approvedHours / Math.max(1, passport.requiredHours)) * 100,
    );

    return (
        <div className="grid gap-6">
            <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <Metric
                    label="Approved hours"
                    value={`${passport.approvedHours.toFixed(2)} / ${passport.requiredHours}`}
                />
                <Metric label="Completion" value={`${progress.toFixed(0)}%`} />
                <Metric
                    label="Approved reports"
                    value={String(passport.approvedReports)}
                />
                <Metric
                    label="Completed tasks"
                    value={String(passport.completedTasks.length)}
                />
            </section>

            <div className="grid items-start gap-6 xl:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <ClipboardCheck className="size-5 text-primary" />
                            Verified competency profile
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        {passport.skills.map((skill) => (
                            <div key={skill.key} className="grid gap-2">
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <span>{skill.label}</span>
                                    <strong>
                                        {skill.score === null
                                            ? 'Not evaluated'
                                            : `${skill.score.toFixed(2)} / 5`}
                                    </strong>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-muted">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-primary"
                                        style={{
                                            width: `${skill.score === null ? 0 : (skill.score / 5) * 100}%`,
                                        }}
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {skill.evidenceCount} submitted supervisor
                                    evaluation
                                    {skill.evidenceCount === 1 ? '' : 's'}
                                </p>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileCheck2 className="size-5 text-primary" />
                            Completed work evidence
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3">
                        {passport.completedTasks.length === 0 ? (
                            <EmptyState
                                icon={FileCheck2}
                                title="No completed tasks yet"
                                description="Supervisor-verified completed tasks will appear here."
                                compact
                            />
                        ) : (
                            passport.completedTasks.map((task, index) => (
                                <article
                                    key={`${task.title}-${index}`}
                                    className="rounded-xl border p-4"
                                >
                                    <p className="font-medium">{task.title}</p>
                                    {task.description && (
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {task.description}
                                        </p>
                                    )}
                                    {task.outcomes.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {task.outcomes.map((outcome) => (
                                                <span
                                                    key={outcome.code}
                                                    title={outcome.title}
                                                    className="rounded-full border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-xs font-medium text-cyan-500"
                                                >
                                                    {outcome.code} · {outcome.title}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <ShieldCheck className="size-5 text-emerald-500" />
                        Trust and verification
                    </CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                    <TrustItem
                        label="Company"
                        value={passport.companyName}
                        detail={`Supervisor: ${passport.supervisorName}`}
                    />
                    <TrustItem
                        label="School"
                        value={passport.schoolName ?? 'Not linked'}
                        detail={
                            passport.schoolAcknowledgedAt
                                ? 'Completion acknowledged'
                                : 'Awaiting acknowledgement'
                        }
                    />
                    <TrustItem
                        label="Finalized certificates"
                        value={String(passport.certificates.length)}
                        detail={`${passport.certificates.reduce((total, item) => total + item.hours, 0).toFixed(2)} certified hours`}
                    />
                    <div className="rounded-xl border bg-muted/25 p-4 md:col-span-3">
                        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                            Evidence fingerprint
                        </p>
                        <p className="mt-2 font-mono text-xs break-all">
                            {passport.fingerprint}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <Card className="bg-card/90">
            <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-2xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}

function TrustItem({
    label,
    value,
    detail,
}: {
    label: string;
    value: string;
    detail: string;
}) {
    return (
        <div className="rounded-xl border p-4">
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="mt-1 font-semibold">{value}</p>
            <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        </div>
    );
}
