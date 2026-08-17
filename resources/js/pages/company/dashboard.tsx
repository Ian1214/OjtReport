import { Form, Head, Link, router, usePage, usePoll } from '@inertiajs/react';
import {
    AlertCircle,
    Building2,
    CalendarDays,
    CheckCircle2,
    Clock3,
    Download,
    FileText,
    Pencil,
    Plus,
    Search,
    Send,
    Trash2,
    Upload,
    Users,
} from 'lucide-react';
import { useState } from 'react';
import OjtBulkImportController from '@/actions/App/Http/Controllers/Company/OjtBulkImportController';
import {
    destroy as destroyOjt,
    resendSetupLink,
    store,
    updateStartDate,
    updateSupervisor,
} from '@/actions/App/Http/Controllers/Company/OjtController';
import { update as updateOjtProfile } from '@/actions/App/Http/Controllers/Company/OjtProfileController';
import { store as storeSupervisor } from '@/actions/App/Http/Controllers/Company/SupervisorController';
import {
    DashboardHero,
    EmptyState,
    MetricCard,
    StatusBadge,
} from '@/components/dashboard-ui';
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
    departmentId: number | null;
    position: string;
    program: string;
    year: number;
    status: 'onboarding' | 'active' | 'paused' | 'completed' | 'withdrawn';
    supervisorName: string | null;
    supervisorId: number | null;
    requiredHours: number;
    startDate: string | null;
    completedHours: number;
    hoursLeft: number;
    isComplete: boolean;
    isOnline: boolean;
    lastSeenAt: string | null;
    setupDelivery: {
        status: 'queued' | 'sent' | 'failed';
        queuedAt: string;
        sentAt: string | null;
        failedAt: string | null;
        failureReason: string | null;
    } | null;
};

type Supervisor = {
    id: number;
    name: string;
    email: string;
    isOnline: boolean;
    lastSeenAt: string | null;
};

type Department = {
    id: number | null;
    name: string;
    ojtCount: number;
    isActive: boolean;
};

type Props = {
    company: { name: string };
    ojts: Ojt[];
    filters: {
        search: string;
        status: 'all' | Ojt['status'];
        department: string;
    };
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
    supervisors: Supervisor[];
    departments: Department[];
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
    departments,
}: Props) {
    const { flash } = usePage<{
        flash?: { createdAccount?: CreatedAccount; status?: string };
    }>().props;
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [showSupervisorForm, setShowSupervisorForm] = useState(false);
    const [showBulkImport, setShowBulkImport] = useState(false);
    const [search, setSearch] = useState(filters.search);
    const [status, setStatus] = useState(filters.status);
    const [department, setDepartment] = useState(filters.department);
    const createdAccount = flash?.createdAccount;
    const groupedOjts = ojts.reduce<Record<string, Ojt[]>>((groups, ojt) => {
        const departmentName = ojt.department || 'Unassigned department';
        groups[departmentName] ??= [];
        groups[departmentName].push(ojt);

        return groups;
    }, {});

    usePoll(
        15_000,
        {
            only: ['ojts', 'supervisors', 'departments', 'pagination', 'stats'],
        },
        { mode: 'rest' },
    );

    function applyFilters(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        router.get(
            managedOjtsIndex.url(),
            {
                search: search || undefined,
                status,
                department: department || undefined,
            },
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
                                    setShowBulkImport((visible) => !visible)
                                }
                            >
                                <Upload />
                                {showBulkImport ? 'Close import' : 'Import CSV'}
                            </Button>
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
                            <StatusBadge
                                status="queued"
                                label="Setup link queued"
                            />
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
                        departments={departments
                            .filter((department) => department.isActive)
                            .map((department) => department.name)}
                        onSuccess={() => setShowCreateForm(false)}
                    />
                )}

                {showBulkImport && (
                    <BulkImportForm
                        onSuccess={() => setShowBulkImport(false)}
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
                        className="mt-5 grid gap-3 md:grid-cols-[minmax(14rem,1fr)_12rem_10rem_auto]"
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
                            value={department}
                            onChange={(event) =>
                                setDepartment(event.target.value)
                            }
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <option value="">All departments</option>
                            {departments.map((department) => (
                                <option
                                    key={department.name}
                                    value={department.name}
                                >
                                    {department.name} ({department.ojtCount})
                                </option>
                            ))}
                        </select>
                        <select
                            value={status}
                            onChange={(event) =>
                                setStatus(
                                    event.target.value as 'all' | Ojt['status'],
                                )
                            }
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        >
                            <option value="all">All statuses</option>
                            <option value="onboarding">Onboarding</option>
                            <option value="active">Active</option>
                            <option value="paused">Paused</option>
                            <option value="completed">Completed</option>
                            <option value="withdrawn">Withdrawn</option>
                        </select>
                        <Button type="submit" variant="outline">
                            Filter
                        </Button>
                    </form>

                    {ojts.length === 0 ? (
                        <EmptyState
                            icon={Users}
                            title={
                                filters.search ||
                                filters.status !== 'all' ||
                                filters.department
                                    ? 'No matching OJTs'
                                    : 'No OJT accounts yet'
                            }
                            description={
                                filters.search ||
                                filters.status !== 'all' ||
                                filters.department
                                    ? 'Try a different search or status filter.'
                                    : 'Add your first intern to begin monitoring attendance.'
                            }
                            action={
                                !filters.search &&
                                filters.status === 'all' &&
                                !filters.department ? (
                                    <Button
                                        onClick={() => setShowCreateForm(true)}
                                    >
                                        <Plus />
                                        Add your first OJT
                                    </Button>
                                ) : undefined
                            }
                            className="mt-5"
                        />
                    ) : (
                        <>
                            <div className="mt-5 grid gap-6">
                                {Object.entries(groupedOjts).map(
                                    ([departmentName, departmentOjts]) => (
                                        <section
                                            key={departmentName}
                                            className="grid gap-3"
                                        >
                                            <div className="flex items-center justify-between gap-3 border-b border-primary/10 pb-3">
                                                <div className="flex min-w-0 items-center gap-3">
                                                    <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                                                        <Building2 className="size-4" />
                                                    </span>
                                                    <div className="min-w-0">
                                                        <h3 className="truncate font-semibold">
                                                            {departmentName}
                                                        </h3>
                                                        <p className="text-xs text-muted-foreground">
                                                            Department OJT team
                                                        </p>
                                                    </div>
                                                </div>
                                                <Badge variant="outline">
                                                    {departmentOjts.length}{' '}
                                                    {departmentOjts.length === 1
                                                        ? 'OJT'
                                                        : 'OJTs'}
                                                </Badge>
                                            </div>
                                            <div className="grid items-stretch gap-4 xl:grid-cols-2">
                                                {departmentOjts.map((ojt) => (
                                                    <OjtProgressCard
                                                        key={ojt.id}
                                                        ojt={ojt}
                                                        supervisors={
                                                            supervisors
                                                        }
                                                        departments={
                                                            departments
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        </section>
                                    ),
                                )}
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

function BulkImportForm({ onSuccess }: { onSuccess: () => void }) {
    return (
        <Card className="rounded-2xl border-primary/20 bg-card/90 shadow-sm">
            <CardHeader>
                <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                    Bulk onboarding
                </p>
                <CardTitle className="mt-1">Import OJTs from CSV</CardTitle>
                <p className="text-sm text-muted-foreground">
                    Import up to 100 accounts. The system validates every row
                    before creating anything and queues a secure setup email for
                    each OJT.
                </p>
            </CardHeader>
            <CardContent>
                <Form
                    {...OjtBulkImportController.form()}
                    resetOnSuccess
                    onSuccess={onSuccess}
                    className="grid gap-4"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="rounded-xl border bg-muted/20 p-4 text-sm">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div>
                                        <p className="font-medium">
                                            Required header order
                                        </p>
                                        <code className="mt-2 block overflow-x-auto text-xs text-muted-foreground">
                                            name,email,program,year,department,position,required_hours,start_date
                                        </code>
                                    </div>
                                    <Button variant="outline" size="sm" asChild>
                                        <a
                                            href={`${import.meta.env.BASE_URL}templates/ojt-import-template.csv`}
                                            download="ojt-import-template.csv"
                                        >
                                            <Download /> Download CSV template
                                        </a>
                                    </Button>
                                </div>
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="ojt-import-file">
                                    CSV file
                                </Label>
                                <Input
                                    id="ojt-import-file"
                                    name="file"
                                    type="file"
                                    required
                                    accept=".csv,text/csv"
                                />
                                <InputError message={errors.file} />
                            </div>
                            <div className="flex flex-wrap gap-2">
                                <Button type="submit" disabled={processing}>
                                    {processing ? <Spinner /> : <Upload />}{' '}
                                    Validate and import
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={onSuccess}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </CardContent>
        </Card>
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
    departments,
    onSuccess,
}: {
    supervisors: Supervisor[];
    departments: string[];
    onSuccess: () => void;
}) {
    const [departmentOption, setDepartmentOption] = useState('');
    const isCustomDepartment = departmentOption === '__custom';
    const departmentOptions = Array.from(
        new Set([
            ...departments,
            'Administration',
            'Finance',
            'Human Resources',
            'Information Technology',
            'Marketing',
            'Operations',
        ]),
    ).sort((left, right) => left.localeCompare(right));

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
                    onSuccess={() => {
                        setDepartmentOption('');
                        onSuccess();
                    }}
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
                                <div className="grid gap-2">
                                    <Label htmlFor="department-option">
                                        Department
                                    </Label>
                                    <select
                                        id="department-option"
                                        value={departmentOption}
                                        onChange={(event) =>
                                            setDepartmentOption(
                                                event.target.value,
                                            )
                                        }
                                        required
                                        className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                    >
                                        <option value="" disabled>
                                            Select department
                                        </option>
                                        {departmentOptions.map((department) => (
                                            <option
                                                key={department}
                                                value={department}
                                            >
                                                {department}
                                            </option>
                                        ))}
                                        <option value="__custom">
                                            + Create another department
                                        </option>
                                    </select>
                                    {isCustomDepartment ? (
                                        <Input
                                            name="department"
                                            required
                                            maxLength={255}
                                            autoFocus
                                            placeholder="e.g. Legal and Compliance"
                                        />
                                    ) : (
                                        <input
                                            type="hidden"
                                            name="department"
                                            value={departmentOption}
                                        />
                                    )}
                                    <InputError message={errors.department} />
                                    <p className="text-xs text-muted-foreground">
                                        New department names automatically
                                        become categories in Managed OJTs.
                                    </p>
                                </div>
                                <Field
                                    label="OJT role / type"
                                    name="position"
                                    placeholder="e.g. HR Intern or Junior Web Developer"
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
                                                {supervisor.email} ·{' '}
                                                {supervisor.isOnline
                                                    ? 'Online'
                                                    : 'Offline'}
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
    departments,
}: {
    ojt: Ojt;
    supervisors: Supervisor[];
    departments: Department[];
}) {
    const progress = Math.min(
        100,
        (ojt.completedHours / ojt.requiredHours) * 100,
    );

    return (
        <article className="flex h-full flex-col rounded-2xl border border-primary/10 bg-card/80 p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md sm:p-5">
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-base font-semibold">
                            {ojt.name}
                        </p>
                        <StatusBadge
                            status={ojt.isOnline ? 'online' : 'offline'}
                        />
                    </div>
                </div>
                <StatusBadge
                    status={ojt.isComplete ? 'completed' : 'in_progress'}
                    label={
                        ojt.isComplete
                            ? 'Completed'
                            : `${ojt.hoursLeft.toFixed(2)} hrs left`
                    }
                />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-primary/10 bg-muted/20 p-3 text-sm">
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">Student ID</p>
                    <p className="mt-1 truncate font-medium">{ojt.studentId}</p>
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">OJT role</p>
                    <p className="mt-1 truncate font-medium">{ojt.position}</p>
                </div>
                <div className="col-span-2 min-w-0 border-t border-primary/10 pt-3">
                    <p className="text-xs text-muted-foreground">
                        Assigned supervisor
                    </p>
                    <p className="mt-1 truncate font-medium">
                        {ojt.supervisorName ?? 'Not assigned'}
                    </p>
                </div>
                <div className="col-span-2 flex items-center justify-between gap-3 border-t border-primary/10 pt-3">
                    <span className="text-xs text-muted-foreground">
                        Lifecycle status
                    </span>
                    <Badge variant="outline" className="capitalize">
                        {ojt.status.replace('_', ' ')}
                    </Badge>
                </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
                <Button size="sm" variant="outline" asChild className="w-full">
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
                            className="w-full"
                        >
                            {processing ? <Spinner /> : <Send />}
                            Resend setup
                        </Button>
                    )}
                </Form>
                <StartDateDialog ojt={ojt} />
                <EditOjtDialog ojt={ojt} departments={departments} />
                <OjtDeletionDialog ojt={ojt} />
            </div>

            <SetupDeliveryStatus ojt={ojt} />

            <div className="mt-5 rounded-xl bg-muted/20 p-3">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <div className="mt-2 flex justify-between gap-3 text-xs text-muted-foreground">
                    <span>{ojt.completedHours.toFixed(2)} completed hours</span>
                    <span>{ojt.requiredHours} required hours</span>
                </div>
            </div>

            <Form
                {...updateSupervisor.form(ojt.id)}
                className="mt-auto grid gap-2 border-t border-primary/10 pt-4 sm:grid-cols-[1fr_auto] sm:items-end"
            >
                {({ processing }) => (
                    <>
                        <div className="grid min-w-0 gap-2">
                            <Label
                                htmlFor={`supervisor-${ojt.id}`}
                                className="text-xs"
                            >
                                Change supervisor assignment
                            </Label>
                            <select
                                id={`supervisor-${ojt.id}`}
                                name="supervisor_id"
                                defaultValue={ojt.supervisorId ?? ''}
                                className="h-9 min-w-0 rounded-md border border-input bg-background px-2 text-sm text-foreground"
                            >
                                <option value="">Assign later</option>
                                {supervisors.map((supervisor) => (
                                    <option
                                        key={supervisor.id}
                                        value={supervisor.id}
                                    >
                                        {supervisor.name}
                                        {supervisor.isOnline ? ' · Online' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
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

function EditOjtDialog({
    ojt,
    departments,
}: {
    ojt: Ojt;
    departments: Department[];
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full">
                    <Pencil /> Edit profile
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogTitle>Edit {ojt.name}</DialogTitle>
                <DialogDescription>
                    Update account details, transfer departments, or change the
                    internship lifecycle status. Every change is recorded in the
                    audit trail.
                </DialogDescription>
                <Form
                    {...updateOjtProfile.form(ojt.id)}
                    className="mt-5 grid gap-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Full name"
                                    name="name"
                                    defaultValue={ojt.name}
                                    error={errors.name}
                                />
                                <Field
                                    label="Email address"
                                    name="email"
                                    type="email"
                                    defaultValue={ojt.email}
                                    error={errors.email}
                                />
                                <div className="grid gap-2">
                                    <Label htmlFor={`program-${ojt.id}`}>
                                        Program
                                    </Label>
                                    <select
                                        id={`program-${ojt.id}`}
                                        name="program"
                                        defaultValue={ojt.program}
                                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    >
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
                                    defaultValue={ojt.year}
                                    error={errors.year}
                                />
                                <div className="grid gap-2">
                                    <Label htmlFor={`department-${ojt.id}`}>
                                        Department
                                    </Label>
                                    <select
                                        id={`department-${ojt.id}`}
                                        name="department_id"
                                        defaultValue={ojt.departmentId ?? ''}
                                        required
                                        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                    >
                                        {departments
                                            .filter(
                                                (
                                                    department,
                                                ): department is Department & {
                                                    id: number;
                                                } =>
                                                    department.id !== null &&
                                                    (department.isActive ||
                                                        department.id ===
                                                            ojt.departmentId),
                                            )
                                            .map((department) => (
                                                <option
                                                    key={department.id}
                                                    value={department.id}
                                                >
                                                    {department.name}
                                                    {department.isActive
                                                        ? ''
                                                        : ' · Archived'}
                                                </option>
                                            ))}
                                    </select>
                                    <InputError
                                        message={errors.department_id}
                                    />
                                </div>
                                <Field
                                    label="OJT role / type"
                                    name="position"
                                    defaultValue={ojt.position}
                                    error={errors.position}
                                />
                                <Field
                                    label="Required hours"
                                    name="required_hours"
                                    type="number"
                                    min="1"
                                    max="2000"
                                    defaultValue={ojt.requiredHours}
                                    error={errors.required_hours}
                                />
                                <Field
                                    label="Start date"
                                    name="start_date"
                                    type="date"
                                    defaultValue={ojt.startDate ?? ''}
                                    error={errors.start_date}
                                />
                                <div className="grid gap-2">
                                    <Label htmlFor={`status-${ojt.id}`}>
                                        Lifecycle status
                                    </Label>
                                    <select
                                        id={`status-${ojt.id}`}
                                        name="ojt_status"
                                        defaultValue={ojt.status}
                                        className="h-10 rounded-md border border-input bg-background px-3 text-sm capitalize"
                                    >
                                        {[
                                            'onboarding',
                                            'active',
                                            'paused',
                                            'completed',
                                            'withdrawn',
                                        ].map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </select>
                                    <InputError message={errors.ojt_status} />
                                </div>
                            </div>
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save OJT profile
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function StartDateDialog({ ojt }: { ojt: Ojt }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full">
                    <CalendarDays />
                    Start date
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Correct internship start date</DialogTitle>
                <DialogDescription>
                    Use the OJT&apos;s actual first workday. This allows them to
                    submit earlier attendance for company approval.
                </DialogDescription>
                <Form
                    {...updateStartDate.form(ojt.id)}
                    className="mt-5 grid gap-5"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor={`start-date-${ojt.id}`}>
                                    Actual first workday
                                </Label>
                                <Input
                                    id={`start-date-${ojt.id}`}
                                    name="start_date"
                                    type="date"
                                    defaultValue={ojt.startDate ?? ''}
                                    max={new Date().toLocaleDateString('en-CA')}
                                    required
                                />
                                <InputError message={errors.start_date} />
                            </div>
                            <DialogFooter className="gap-2">
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">
                                        Cancel
                                    </Button>
                                </DialogClose>
                                <Button type="submit" disabled={processing}>
                                    {processing && <Spinner />}
                                    Save start date
                                </Button>
                            </DialogFooter>
                        </>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
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
                    {timestamp === null
                        ? 'Just now'
                        : formatDeliveryTime(timestamp)}
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
                    size="sm"
                    variant="outline"
                    className="w-full border-destructive/20 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Delete ${ojt.name}`}
                >
                    <Trash2 className="size-4" />
                    Archive
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogTitle>Archive {ojt.name}&apos;s account?</DialogTitle>
                <DialogDescription>
                    The OJT will no longer be able to sign in. Reports and audit
                    history are retained securely until the retention period
                    ends.
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
                                Archive OJT account
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
