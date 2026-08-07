import { Form, Head, Link } from '@inertiajs/react';
import {
    CheckCircle2,
    ClipboardList,
    MessageCircle,
    Plus,
    FileText,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/SupervisorTaskController';
import { DashboardHero, MetricCard } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import { show as showMessages } from '@/routes/messages';
import { reports as ojtReports } from '@/routes/supervisor/ojts';

type Task = {
    id: number;
    title: string;
    description: string | null;
    status: 'not_started' | 'ongoing' | 'finished';
    dueDate: string | null;
};

type Ojt = {
    id: number;
    name: string;
    studentId: string;
    program: string | null;
    department: string | null;
    position: string | null;
    tasks: Task[];
};

export default function SupervisorDashboard({ ojts }: { ojts: Ojt[] }) {
    const [openOjtId, setOpenOjtId] = useState<number | null>(null);
    const taskCount = ojts.reduce((total, ojt) => total + ojt.tasks.length, 0);
    const completedCount = ojts.reduce(
        (total, ojt) =>
            total +
            ojt.tasks.filter((task) => task.status === 'finished').length,
        0,
    );

    return (
        <>
            <Head title="Supervisor dashboard" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Supervisor workspace"
                    title="Assigned OJTs"
                    description="Assign clear work items and follow each intern’s progress from one secure workspace."
                />

                <div className="grid gap-4 sm:grid-cols-3">
                    <MetricCard
                        icon={UsersRound}
                        label="Assigned OJTs"
                        value={ojts.length}
                    />
                    <MetricCard
                        icon={ClipboardList}
                        label="Open tasks"
                        value={taskCount - completedCount}
                    />
                    <MetricCard
                        icon={CheckCircle2}
                        label="Completed tasks"
                        value={completedCount}
                        accent="success"
                    />
                </div>

                {ojts.length === 0 ? (
                    <Card className="border-dashed">
                        <CardContent className="p-10 text-center text-sm text-muted-foreground">
                            No OJTs have been assigned to you yet. Ask your
                            company administrator to assign an OJT from Managed
                            OJTs.
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4 xl:grid-cols-2">
                        {ojts.map((ojt) => (
                            <Card key={ojt.id} className="rounded-2xl">
                                <CardHeader className="flex-row items-start justify-between gap-4">
                                    <div>
                                        <CardTitle>{ojt.name}</CardTitle>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {ojt.studentId} ·{' '}
                                            {ojt.position ?? 'OJT'} ·{' '}
                                            {ojt.department ??
                                                'Department not set'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link href={ojtReports(ojt.id)}>
                                                <FileText />
                                                Reports
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            asChild
                                        >
                                            <Link href={showMessages(ojt.id)}>
                                                <MessageCircle />
                                                Message
                                            </Link>
                                        </Button>
                                        <Button
                                            size="sm"
                                            onClick={() =>
                                                setOpenOjtId(
                                                    openOjtId === ojt.id
                                                        ? null
                                                        : ojt.id,
                                                )
                                            }
                                        >
                                            <Plus />
                                            Add task
                                        </Button>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {openOjtId === ojt.id && (
                                        <TaskForm
                                            ojtId={ojt.id}
                                            onSuccess={() => setOpenOjtId(null)}
                                        />
                                    )}
                                    {ojt.tasks.length === 0 ? (
                                        <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">
                                            No tasks assigned yet.
                                        </p>
                                    ) : (
                                        <div className="space-y-2">
                                            {ojt.tasks.map((task) => (
                                                <article
                                                    key={task.id}
                                                    className="rounded-xl border bg-muted/20 p-3"
                                                >
                                                    <div className="flex items-start justify-between gap-3">
                                                        <div>
                                                            <p className="font-medium">
                                                                {task.title}
                                                            </p>
                                                            {task.description && (
                                                                <p className="mt-1 text-sm text-muted-foreground">
                                                                    {
                                                                        task.description
                                                                    }
                                                                </p>
                                                            )}
                                                        </div>
                                                        <Badge
                                                            variant={
                                                                task.status ===
                                                                'finished'
                                                                    ? 'default'
                                                                    : 'secondary'
                                                            }
                                                        >
                                                            {formatStatus(
                                                                task.status,
                                                            )}
                                                        </Badge>
                                                    </div>
                                                    {task.dueDate && (
                                                        <p className="mt-2 text-xs text-muted-foreground">
                                                            Due{' '}
                                                            {formatDate(
                                                                task.dueDate,
                                                            )}
                                                        </p>
                                                    )}
                                                </article>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

function TaskForm({
    ojtId,
    onSuccess,
}: {
    ojtId: number;
    onSuccess: () => void;
}) {
    return (
        <Form
            {...store.form(ojtId)}
            resetOnSuccess
            onSuccess={onSuccess}
            className="grid gap-3 rounded-xl border border-primary/20 bg-primary/4 p-4"
        >
            {({ errors, processing }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor={`title-${ojtId}`}>Task title</Label>
                        <Input
                            id={`title-${ojtId}`}
                            name="title"
                            required
                            placeholder="Prepare weekly inventory"
                        />
                        <InputError message={errors.title} />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor={`description-${ojtId}`}>
                            Instructions
                        </Label>
                        <textarea
                            id={`description-${ojtId}`}
                            name="description"
                            placeholder="Add the expected output or context."
                            className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                        <InputError message={errors.description} />
                    </div>
                    <div className="grid gap-2 sm:max-w-52">
                        <Label htmlFor={`due-date-${ojtId}`}>Due date</Label>
                        <Input
                            id={`due-date-${ojtId}`}
                            name="due_date"
                            type="date"
                        />
                        <InputError message={errors.due_date} />
                    </div>
                    <div className="flex justify-end">
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing && <Spinner />}Assign task
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

function formatStatus(status: Task['status']): string {
    return status === 'not_started'
        ? 'Not started'
        : status === 'ongoing'
          ? 'Ongoing'
          : 'Finished';
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
        new Date(`${date}T00:00:00`),
    );
}

SupervisorDashboard.layout = {
    breadcrumbs: [{ title: 'Dashboard', href: dashboard() }],
};
