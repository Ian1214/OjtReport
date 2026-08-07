import { Form, Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import {
    AlertCircle,
    CheckCircle2,
    Clock3,
    FileText,
    Plus,
    Search,
    Send,
    Trash2,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import {
    destroy as destroyOjt,
    resendSetupLink,
    store,
    updateSupervisor,
} from '@/actions/App/Http/Controllers/Company/OjtController';
import { store as storeSupervisor } from '@/actions/App/Http/Controllers/Company/SupervisorController';
import { DashboardHero, MetricCard } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { programs } from '@/data/programs';
import { dashboard } from '@/routes';
import {
    index as managedOjtsIndex,
    show as showOjt,
} from '@/routes/company/ojts';

type Ojt = {
    id: number;
    name: string;
    email: string;
    studentId: string;
    department: string;
    position: string;
    supervisorName: string | null;
    supervisorId: number | null;
    requiredHours: number;
    completedHours: number;
    hoursLeft: number;
    isComplete: boolean;
    setupDelivery: {
        status: 'queued' | 'sent' | 'failed';
        queuedAt: string;
        sentAt: string | null;
        failedAt: string | null;
        failureReason: string | null;
    } | null;
};

type Props = {
    company: { name: string };
    ojts: Ojt[];
    filters: { search: string; status: 'all' | 'active' | 'completed' };
    pagination: {
        currentPage: number;
        lastPage: number;
        total: number;
        from: number | null;
        to: number | null;
        previousPageUrl: string | null;
        nextPageUrl: string | null;
    };
    stats: {
        totalOjtCount: number;
        activeOjtCount: number;
        completedOjtCount: number;
    };
    supervisors: Array<{ id: number; name: string; email: string }>;
};

type CreatedAccount = {
    name: string;
    email: string;
};

export default function CompanyDashboard({
    company,
    ojts,
    filters,
    pagination,
    stats,
    supervisors,
}: Props) {
    const { flash } = usePage<{
        flash?: { createdAccount?: CreatedAccount; status?: string };
    }>().props;
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showSupervisorForm, setShowSupervisorForm] = useState(false);
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const createdAccount = flash?.createdAccount;

    usePoll(10_000, { only: ['ojts'] });

    function applyFilters(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            managedOjtsIndex.url(),
            { search: search || undefined, status },
            { preserveState: true, replace: true },
        );
    }

    return (
        <>
            <Head title={`${company.name} dashboard`} />

            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Company workspace"
                    title={company.name}
                    description="Create OJT accounts, monitor attendance progress, and keep each internship program on track from one workspace."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                onClick={() =>
                                    setShowSupervisorForm((visible) => !visible)
                                }
                            >
                                <Users />
                                {showSupervisorForm
                                    ? 'Close supervisor form'
                                    : 'Add Supervisor'}
                            </Button>
                            <Button
                                onClick={() =>
                                    setShowCreateForm((visible) => !visible)
                                }
                            >
                                <Plus />
                                {showCreateForm ? 'Close form' : 'Add OJT'}
                            </Button>
                        </div>
                    }
                />

                {createdAccount && (
                    <section className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-5 shadow-sm sm:p-6">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                                <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-300">
                                    <CheckCircle2 className="size-4" />
                                    OJT account created
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    A secure password-setup email has been
                                    queued for {createdAccount.email}. No
                                    password is shared by email or displayed in
                                    the dashboard.
                                </p>
                            </div>
                            <Badge variant="outline">Setup link queued</Badge>
                        </div>
                    </section>
                )}

                {flash?.status && (
                    <p className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-primary">
                        {flash.status}
                    </p>
                )}

                {showCreateForm && (
                    <CreateOjtForm
                        supervisors={supervisors}
                        onSuccess={() => setShowCreateForm(false)}
                    />
                )}

                {showSupervisorForm && (
                    <CreateSupervisorForm
                        onSuccess={() => setShowSupervisorForm(false)}
                    />
                )}

                <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                        icon={Users}
                        label="Active OJTs"
                        value={stats.activeOjtCount}
                        detail="Currently completing internship hours"
                    />
                    <MetricCard
                        icon={CheckCircle2}
                        label="Completed"
                        value={stats.completedOjtCount}
                        detail="Reached their required hours"
                        accent="success"
                    />
                    <MetricCard
                        icon={Clock3}
                        label="Total managed"
                        value={stats.totalOjtCount}
                        detail="All OJT accounts in this workspace"
                    />
                </div>

                <section className="rounded-2xl border bg-card/80 p-5 shadow-sm sm:p-6">
                    <div className="flex flex-col gap-1 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-semibold">
                                Your OJT team
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Track each intern’s attendance progress and
                                remaining required hours.
                            </p>
                        </div>
                        <Badge variant="secondary">
                            {pagination.total} matching
                        </Badge>
                    </div>

                    <form
                        onSubmit={applyFilters}
                        className="mt-5 grid gap-3 sm:grid-cols-[1fr_10rem_auto]"
                    >
                        <div className="relative">
                            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(event) =>
                                    setSearch(event.target.value)
                                }
                                placeholder="Search name, student ID, department, or position"
                                className="pl-9"
                            />
                        </div>
                        <select
                            value={status}
                            onChange={(event) =>
                                setStatus(
                                    event.target.value as
                                        'all' | 'active' | 'completed',
                                )
                            }
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <option value="all">All statuses</option>
                            <option value="active">Active</option>
                            <option value="completed">Completed</option>
                        </select>
                        <Button type="submit" variant="outline">
                            Filter
                        </Button>
                    </form>

                    {ojts.length === 0 ? (
                        <div className="mt-5 rounded-xl border border-dashed bg-muted/20 p-10 text-center">
                            <Users className="mx-auto size-7 text-muted-foreground" />
                            <p className="mt-3 font-medium">
                                No OJT accounts yet
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Add your first intern to begin monitoring
                                attendance.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-5 grid gap-3">
                                {ojts.map((ojt) => (
                                    <OjtProgressCard
                                        key={ojt.id}
                                        ojt={ojt}
                                        supervisors={supervisors}
                                    />
                                ))}
                            </div>
                            {pagination.lastPage > 1 && (
                                <div className="mt-5 flex flex-col gap-3 border-t pt-5 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                                    <span>
                                        Showing {pagination.from}–
                                        {pagination.to} of {pagination.total}
                                    </span>
                                    <div className="flex gap-2">
                                        <PaginationButton
                                            url={pagination.previousPageUrl}
                                            label="Previous"
                                        />
                                        <PaginationButton
                                            url={pagination.nextPageUrl}
                                            label="Next"
                                        />
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </section>
            </div>
        </>
    );
}

function PaginationButton({
    url,
    label,
}: {
    url: string | null;
    label: string;
}) {
    if (url === null) {
        return (
            <Button size="sm" variant="outline" disabled>
                {label}
            </Button>
        );
    }

    return (
        <Button size="sm" variant="outline" asChild>
            <Link href={url}>{label}</Link>
        </Button>
    );
}

function CreateOjtForm({
    supervisors,
    onSuccess,
}: {
    supervisors: Array<{ id: number; name: string; email: string }>;
    onSuccess: () => void;
}) {
    return (
        <Card className="rounded-2xl border-primary/20 bg-card/90 shadow-sm">
            <CardHeader>
                <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                    New OJT account
                </p>
                <CardTitle className="mt-1">Create an OJT account</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Enter the OJT’s real email address. They will receive a
                    secure link to choose their own password.
                </p>
            </CardHeader>
            <CardContent>
                <Form
                    {...store.form()}
                    resetOnSuccess
                    onSuccess={onSuccess}
                    className="grid gap-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-5 md:grid-cols-2">
                                <Field
                                    label="Full name"
                                    name="name"
                                    placeholder="Juan Dela Cruz"
                                    error={errors.name}
                                />
                                <Field
                                    label="OJT email address"
                                    name="email"
                                    type="email"
                                    placeholder="student@gmail.com"
                                    error={errors.email}
                                />
                                <div className="grid gap-2">
                                    <Label htmlFor="program">Program</Label>
                                    <select
                                        id="program"
                                        name="program"
                                        required
                                        defaultValue=""
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <option value="" disabled>
                                            Select program
                                        </option>
                                        {programs.map((program) => (
                                            <option
                                                key={program}
                                                value={program}
                                            >
                                                {program}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.program} />
                                </div>
                                <Field
                                    label="Year level"
                                    name="year"
                                    type="number"
                                    min="1"
                                    max="6"
                                    placeholder="4"
                                    error={errors.year}
                                />
                                <Field
                                    label="Required hours"
                                    name="required_hours"
                                    type="number"
                                    min="1"
                                    placeholder="486"
                                    defaultValue="486"
                                    error={errors.required_hours}
                                />
                                <Field
                                    label="Department"
                                    name="department"
                                    placeholder="IT Department"
                                    error={errors.department}
                                />
                                <Field
                                    label="Position"
                                    name="position"
                                    placeholder="Junior Web Developer"
                                    error={errors.position}
                                />
                                <div className="grid gap-2">
                                    <Label htmlFor="supervisor_id">
                                        Assigned supervisor
                                    </Label>
                                    <select
                                        id="supervisor_id"
                                        name="supervisor_id"
                                        defaultValue=""
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <option value="">Assign later</option>
                                        {supervisors.map((supervisor) => (
                                            <option
                                                key={supervisor.id}
                                                value={supervisor.id}
                                            >
                                                {supervisor.name} ·{' '}
                                                {supervisor.email}
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-xs text-muted-foreground">
                                        Create a supervisor first, then assign
                                        them to enable tasks and private chat.
                                    </p>
                                    <InputError
                                        message={errors.supervisor_id}
                                    />
                                </div>
                                <Field
                                    label="Start date"
                                    name="start_date"
                                    type="date"
                                    error={errors.start_date}
                                />
                            </div>
                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <Button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full sm:w-auto"
                                >
                                    {processing && <Spinner />}
                                    Generate OJT account
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function CreateSupervisorForm({ onSuccess }: { onSuccess: () => void }) {
    return (
        <Card className="rounded-2xl border-primary/20 bg-card/90 shadow-sm">
            <CardHeader>
                <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                    Supervisor account
                </p>
                <CardTitle className="mt-1">
                    Create a supervisor account
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                    The supervisor receives a secure email to set their
                    password.
                </p>
            </CardHeader>
            <CardContent>
                <Form
                    {...storeSupervisor.form()}
                    resetOnSuccess
                    onSuccess={onSuccess}
                    className="grid gap-5 md:grid-cols-2"
                >
                    {({ errors, processing }) => (
                        <>
                            <Field
                                label="Full name"
                                name="name"
                                placeholder="Maria Cruz"
                                error={errors.name}
                            />
                            <Field
                                label="Email address"
                                name="email"
                                type="email"
                                placeholder="supervisor@company.com"
                                error={errors.email}
                            />
                            <div className="flex justify-end md:col-span-2">
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}Create supervisor
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
    );
}

function OjtProgressCard({
    ojt,
    supervisors,
}: {
    ojt: Ojt;
    supervisors: Array<{ id: number; name: string; email: string }>;
}) {
    const progress = Math.min(
        100,
        (ojt.completedHours / ojt.requiredHours) * 100,
    );

    return (
        <article className="rounded-xl border bg-muted/15 p-4 transition-colors hover:bg-muted/30 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                    <p className="truncate font-semibold">{ojt.name}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {ojt.studentId} · {ojt.position} · {ojt.department}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                        Supervisor: {ojt.supervisorName ?? 'Not assigned'}
                    </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <Badge variant={ojt.isComplete ? 'default' : 'secondary'}>
                        {ojt.isComplete
                            ? 'Completed'
                            : `${ojt.hoursLeft.toFixed(2)} hrs left`}
                    </Badge>
                    <Button size="sm" variant="outline" asChild>
                        <Link href={showOjt(ojt.id)}>
                            <FileText />
                            View reports
                        </Link>
                    </Button>
                    <Form {...resendSetupLink.form(ojt.id)}>
                        {({ processing }) => (
                            <Button
                                type="submit"
                                size="sm"
                                variant="outline"
                                disabled={processing}
                            >
                                {processing ? <Spinner /> : <Send />}
                                Resend setup
                            </Button>
                        )}
                    </Form>
                    <OjtDeletionDialog ojt={ojt} />
                </div>
            </div>
            <SetupDeliveryStatus ojt={ojt} />
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-muted">
                <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: `${progress}%` }}
                />
            </div>
            <div className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground">
                <span>{ojt.completedHours.toFixed(2)} completed hours</span>
                <span>{ojt.requiredHours} required hours</span>
            </div>
            <Form
                {...updateSupervisor.form(ojt.id)}
                className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center"
            >
                {({ processing }) => (
                    <>
                        <Label
                            htmlFor={`supervisor-${ojt.id}`}
                            className="text-xs"
                        >
                            Assigned supervisor
                        </Label>
                        <select
                            id={`supervisor-${ojt.id}`}
                            name="supervisor_id"
                            defaultValue={ojt.supervisorId ?? ''}
                            className="h-9 min-w-0 flex-1 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                        >
                            <option value="">Assign later</option>
                            {supervisors.map((supervisor) => (
                                <option
                                    key={supervisor.id}
                                    value={supervisor.id}
                                >
                                    {supervisor.name}
                                </option>
                            ))}
                        </select>
                        <Button
                            type="submit"
                            size="sm"
                            variant="outline"
                            disabled={processing}
                        >
                            {processing && <Spinner />}
                            Save assignment
                        </Button>
                    </>
                )}
            </Form>
        </article>
    );
}

function SetupDeliveryStatus({ ojt }: { ojt: Ojt }) {
    const delivery = ojt.setupDelivery;

    if (delivery === null) {
        return (
            <div className="mt-4 flex flex-col gap-2 rounded-lg border border-dashed bg-background/50 px-3 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <span>No setup email delivery has been recorded yet.</span>
                <span className="truncate">{ojt.email}</span>
            </div>
        );
    }

    const isSent = delivery.status === 'sent';
    const isFailed = delivery.status === 'failed';
    const timestamp = isSent
        ? delivery.sentAt
        : isFailed
          ? delivery.failedAt
          : delivery.queuedAt;

    return (
        <div
            className={`mt-4 rounded-lg border px-3 py-2.5 text-xs ${
                isSent
                    ? 'border-emerald-500/25 bg-emerald-500/5'
                    : isFailed
                      ? 'border-destructive/25 bg-destructive/5'
                      : 'border-amber-500/25 bg-amber-500/5'
            }`}
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2">
                    {isSent ? (
                        <CheckCircle2 className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
                    ) : isFailed ? (
                        <AlertCircle className="size-4 shrink-0 text-destructive" />
                    ) : (
                        <Clock3 className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
                    )}
                    <span className="font-medium">
                        {isSent
                            ? 'Setup email accepted by the mail server'
                            : isFailed
                              ? 'Setup email failed'
                              : 'Setup email queued'}
                    </span>
                </div>
                <span className="text-muted-foreground">
                    {timestamp === null ? 'Just now' : formatDeliveryTime(timestamp)}
                </span>
            </div>
            <p className="mt-1.5 break-all text-muted-foreground">
                Recipient: {ojt.email}
            </p>
            {delivery.failureReason && (
                <p className="mt-1.5 text-destructive">
                    {delivery.failureReason}
                </p>
            )}
        </div>
    );
}

function formatDeliveryTime(value: string): string {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

function Field({
    label,
    error,
    ...props
}: React.ComponentProps<typeof Input> & { label: string; error?: string }) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={props.name}>{label}</Label>
            <Input id={props.name} required {...props} />
            <InputError message={error} />
        </div>
    );
}

function OjtDeletionDialog({ ojt }: { ojt: Ojt }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    size="icon"
                    variant="ghost"
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${ojt.name}`}
                >
                    <Trash2 className="size-4" />
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Delete {ojt.name}&apos;s account?</DialogTitle>
                <DialogDescription>
                    This permanently removes the OJT account and all of its
                    daily reports. This cannot be undone.
                </DialogDescription>
                <Form {...destroyOjt.form(ojt.id)}>
                    {({ processing }) => (
                        <DialogFooter className="mt-6 gap-2">
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={processing}
                            >
                                {processing && <Spinner />}
                                Delete OJT account
                            </Button>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

CompanyDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
