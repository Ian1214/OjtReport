import { Form, Head } from '@inertiajs/react';
import {
    Archive,
    Building2,
    Clock3,
    FileClock,
    TimerOff,
    Pencil,
    Plus,
    UserRoundCog,
    UsersRound,
} from 'lucide-react';
import {
    destroy,
    index,
    store,
    update,
} from '@/actions/App/Http/Controllers/Company/DepartmentController';
import { DashboardHero, EmptyState } from '@/components/dashboard-ui';
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

type Department = {
    id: number;
    name: string;
    description: string | null;
    headSupervisorId: number | null;
    headSupervisorName: string | null;
    capacity: number | null;
    workStartTime: string | null;
    workEndTime: string | null;
    lateGraceMinutes: number | null;
    workDays: number[] | null;
    isActive: boolean;
    ojtCount: number;
    activeOjtCount: number;
    approvedHours: number;
    pendingReports: number;
    lateDays: number;
};

type Supervisor = { id: number; name: string };

export default function DepartmentsIndex({
    departments,
    supervisors,
}: {
    departments: Department[];
    supervisors: Supervisor[];
}) {
    return (
        <>
            <Head title="Departments" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Organization"
                    title="Department management"
                    description="Organize OJTs by team, assign department heads, control capacity, and apply department-specific schedules."
                    actions={
                        <CreateDepartmentDialog supervisors={supervisors} />
                    }
                />

                {departments.length === 0 ? (
                    <EmptyState
                        icon={Building2}
                        title="No departments yet"
                        description="Create the first department to organize OJT assignments."
                        action={
                            <CreateDepartmentDialog supervisors={supervisors} />
                        }
                    />
                ) : (
                    <section className="grid items-stretch gap-4 lg:grid-cols-2 2xl:grid-cols-3">
                        {departments.map((department) => (
                            <Card
                                key={department.id}
                                className="flex h-full flex-col border-primary/15 bg-card/85"
                            >
                                <CardHeader className="gap-3">
                                    <div className="flex items-start justify-between gap-3">
                                        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                                            <Building2 className="size-5" />
                                        </span>
                                        <Badge
                                            variant={
                                                department.isActive
                                                    ? 'secondary'
                                                    : 'outline'
                                            }
                                        >
                                            {department.isActive
                                                ? 'Active'
                                                : 'Archived'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <CardTitle>{department.name}</CardTitle>
                                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                            {department.description ??
                                                'No description provided.'}
                                        </p>
                                    </div>
                                </CardHeader>
                                <CardContent className="flex flex-1 flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-3">
                                        <DepartmentMetric
                                            icon={UsersRound}
                                            label="Assigned OJTs"
                                            value={`${department.ojtCount}${department.capacity ? ` / ${department.capacity}` : ''}`}
                                        />
                                        <DepartmentMetric
                                            icon={UserRoundCog}
                                            label="Department head"
                                            value={
                                                department.headSupervisorName ??
                                                'Not assigned'
                                            }
                                        />
                                        <DepartmentMetric
                                            icon={Clock3}
                                            label="Work schedule"
                                            value={scheduleLabel(department)}
                                            wide
                                        />
                                        <DepartmentMetric
                                            icon={FileClock}
                                            label="Approved hours"
                                            value={department.approvedHours.toFixed(
                                                2,
                                            )}
                                        />
                                        <DepartmentMetric
                                            icon={TimerOff}
                                            label="Needs attention"
                                            value={`${department.pendingReports} pending · ${department.lateDays} late`}
                                        />
                                    </div>
                                    <div className="mt-auto grid grid-cols-2 gap-2 border-t border-primary/10 pt-4">
                                        <EditDepartmentDialog
                                            department={department}
                                            supervisors={supervisors}
                                        />
                                        {department.isActive && (
                                            <Form
                                                {...destroy.form(department.id)}
                                            >
                                                {({ processing }) => (
                                                    <Button
                                                        type="submit"
                                                        variant="outline"
                                                        className="w-full text-destructive"
                                                        disabled={processing}
                                                    >
                                                        {processing ? (
                                                            <Spinner />
                                                        ) : (
                                                            <Archive />
                                                        )}
                                                        Archive
                                                    </Button>
                                                )}
                                            </Form>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </section>
                )}
            </div>
        </>
    );
}

function CreateDepartmentDialog({
    supervisors,
}: {
    supervisors: Supervisor[];
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button>
                    <Plus /> Create department
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogTitle>Create a department</DialogTitle>
                <DialogDescription>
                    Capacity and schedule overrides are optional. Empty schedule
                    fields use the company policy.
                </DialogDescription>
                <DepartmentForm supervisors={supervisors} />
            </DialogContent>
        </Dialog>
    );
}

function EditDepartmentDialog({
    department,
    supervisors,
}: {
    department: Department;
    supervisors: Supervisor[];
}) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                    <Pencil /> Edit
                </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
                <DialogTitle>Edit {department.name}</DialogTitle>
                <DialogDescription>
                    Renaming this department updates every assigned OJT while
                    preserving the audit history.
                </DialogDescription>
                <DepartmentForm
                    supervisors={supervisors}
                    department={department}
                />
            </DialogContent>
        </Dialog>
    );
}

function DepartmentForm({
    supervisors,
    department,
}: {
    supervisors: Supervisor[];
    department?: Department;
}) {
    const route = department ? update.form(department.id) : store.form();

    return (
        <Form {...route} className="mt-5 grid gap-5">
            {({ errors, processing }) => (
                <>
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field label="Department name" error={errors.name}>
                            <Input
                                name="name"
                                required
                                maxLength={255}
                                defaultValue={department?.name}
                                placeholder="Human Resources"
                            />
                        </Field>
                        <Field label="Capacity" error={errors.capacity}>
                            <Input
                                name="capacity"
                                type="number"
                                min="1"
                                max="10000"
                                defaultValue={department?.capacity ?? ''}
                                placeholder="No limit"
                            />
                        </Field>
                        <Field
                            label="Department head"
                            error={errors.head_supervisor_id}
                        >
                            <select
                                name="head_supervisor_id"
                                defaultValue={
                                    department?.headSupervisorId ?? ''
                                }
                                className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">Not assigned</option>
                                {supervisors.map((supervisor) => (
                                    <option
                                        key={supervisor.id}
                                        value={supervisor.id}
                                    >
                                        {supervisor.name}
                                    </option>
                                ))}
                            </select>
                        </Field>
                        <Field
                            label="Late grace minutes"
                            error={errors.late_grace_minutes}
                        >
                            <Input
                                name="late_grace_minutes"
                                type="number"
                                min="0"
                                max="180"
                                defaultValue={
                                    department?.lateGraceMinutes ?? ''
                                }
                                placeholder="Company default"
                            />
                        </Field>
                        <Field
                            label="Work starts"
                            error={errors.work_start_time}
                        >
                            <Input
                                name="work_start_time"
                                type="time"
                                defaultValue={timeInput(
                                    department?.workStartTime,
                                )}
                            />
                        </Field>
                        <Field label="Work ends" error={errors.work_end_time}>
                            <Input
                                name="work_end_time"
                                type="time"
                                defaultValue={timeInput(
                                    department?.workEndTime,
                                )}
                            />
                        </Field>
                        <Field
                            label="Description"
                            error={errors.description}
                            wide
                        >
                            <textarea
                                name="description"
                                maxLength={500}
                                rows={3}
                                defaultValue={department?.description ?? ''}
                                className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </Field>
                        <div className="grid gap-2 sm:col-span-2">
                            <Label>Work days</Label>
                            <div className="flex flex-wrap gap-2">
                                {weekdays.map((day) => (
                                    <label
                                        key={day.value}
                                        className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            name="work_days[]"
                                            value={day.value}
                                            defaultChecked={
                                                department?.workDays?.includes(
                                                    day.value,
                                                ) ?? day.value <= 5
                                            }
                                        />
                                        {day.label}
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.work_days} />
                        </div>
                        {department && (
                            <label className="flex items-center gap-3 rounded-xl border p-3 text-sm sm:col-span-2">
                                <input
                                    type="checkbox"
                                    name="is_active"
                                    value="1"
                                    defaultChecked={department.isActive}
                                />
                                Active department
                            </label>
                        )}
                    </div>
                    <DialogFooter className="gap-2">
                        <DialogClose asChild>
                            <Button type="button" variant="secondary">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button type="submit" disabled={processing}>
                            {processing && <Spinner />}
                            {department
                                ? 'Save department'
                                : 'Create department'}
                        </Button>
                    </DialogFooter>
                </>
            )}
        </Form>
    );
}

function Field({
    label,
    error,
    children,
    wide = false,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
    wide?: boolean;
}) {
    return (
        <div className={`grid gap-2 ${wide ? 'sm:col-span-2' : ''}`}>
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function DepartmentMetric({
    icon: Icon,
    label,
    value,
    wide = false,
}: {
    icon: typeof UsersRound;
    label: string;
    value: string;
    wide?: boolean;
}) {
    return (
        <div
            className={`rounded-xl border border-primary/10 bg-muted/20 p-3 ${wide ? 'col-span-2' : ''}`}
        >
            <Icon className="size-4 text-primary" />
            <p className="mt-2 text-xs text-muted-foreground">{label}</p>
            <p className="mt-1 truncate text-sm font-semibold">{value}</p>
        </div>
    );
}

function scheduleLabel(department: Department): string {
    if (!department.workStartTime) {
        return 'Uses company schedule';
    }

    return `${timeInput(department.workStartTime)}${department.workEndTime ? ` – ${timeInput(department.workEndTime)}` : ''}`;
}

function timeInput(value?: string | null): string {
    return value?.slice(0, 5) ?? '';
}

const weekdays = [
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
    { value: 7, label: 'Sun' },
];

DepartmentsIndex.layout = {
    breadcrumbs: [{ title: 'Departments', href: index() }],
};
