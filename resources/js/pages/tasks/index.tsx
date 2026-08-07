import { Form, Head, Link } from '@inertiajs/react';
import {
    CalendarDays,
    CheckCircle2,
    CircleDashed,
    CircleDot,
    MessageCircle,
} from 'lucide-react';
import { updateStatus } from '@/actions/App/Http/Controllers/SupervisorTaskController';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { index as messagesIndex } from '@/routes/messages';
import { index as tasksIndex } from '@/routes/tasks';

type TaskStatus = 'not_started' | 'ongoing' | 'finished';

type Task = {
    id: number;
    title: string;
    description: string | null;
    status: TaskStatus;
    dueDate: string | null;
};

const sections: {
    status: TaskStatus;
    title: string;
    emptyText: string;
    icon: typeof CircleDashed;
}[] = [
    {
        status: 'ongoing',
        title: 'Ongoing',
        emptyText: 'No task is currently in progress.',
        icon: CircleDot,
    },
    {
        status: 'not_started',
        title: 'Not started',
        emptyText: 'You have no waiting tasks.',
        icon: CircleDashed,
    },
    {
        status: 'finished',
        title: 'Finished',
        emptyText: 'Completed tasks will appear here.',
        icon: CheckCircle2,
    },
];

export default function Tasks({
    supervisorName,
    tasks,
}: {
    supervisorName: string | null;
    tasks: Task[];
}) {
    return (
        <>
            <Head title="My tasks" />

            <div className="flex flex-1 flex-col bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_7%,transparent),transparent_40%)] p-4 sm:p-6">
                <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
                    <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                                My work
                            </p>
                            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                                Assigned tasks
                            </h1>
                            <p className="mt-2 max-w-2xl text-sm text-muted-foreground sm:text-base">
                                {supervisorName
                                    ? `${supervisorName} assigned these tasks. Update a task as your work progresses.`
                                    : 'Your assigned tasks will appear here after a supervisor is connected to your account.'}
                            </p>
                        </div>
                        <Button variant="outline" asChild>
                            <Link href={messagesIndex()}>
                                <MessageCircle />
                                Message supervisor
                            </Link>
                        </Button>
                    </header>

                    <div className="grid gap-3 sm:grid-cols-3">
                        {sections.map((section) => {
                            const count = tasks.filter(
                                (task) => task.status === section.status,
                            ).length;

                            return (
                                <div
                                    key={section.status}
                                    className="flex items-center gap-3 rounded-2xl border bg-card/90 p-4 shadow-sm"
                                >
                                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                                        <section.icon className="size-5" />
                                    </span>
                                    <div>
                                        <p className="text-2xl font-semibold">
                                            {count}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {section.title}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className="grid items-start gap-5 xl:grid-cols-3">
                        {sections.map((section) => {
                            const matchingTasks = tasks.filter(
                                (task) => task.status === section.status,
                            );

                            return (
                                <section
                                    key={section.status}
                                    className="overflow-hidden rounded-3xl border bg-card/85 shadow-sm"
                                >
                                    <div className="flex items-center justify-between gap-3 border-b bg-muted/25 px-5 py-4">
                                        <h2 className="flex items-center gap-2 font-semibold">
                                            <section.icon className="size-4 text-primary" />
                                            {section.title}
                                        </h2>
                                        <Badge variant="secondary">
                                            {matchingTasks.length}
                                        </Badge>
                                    </div>
                                    <div className="grid gap-3 p-3">
                                        {matchingTasks.length === 0 ? (
                                            <p className="rounded-2xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                                                {section.emptyText}
                                            </p>
                                        ) : (
                                            matchingTasks.map((task) => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                />
                                            ))
                                        )}
                                    </div>
                                </section>
                            );
                        })}
                    </div>
                </div>
            </div>
        </>
    );
}

function TaskCard({ task }: { task: Task }) {
    return (
        <article className="rounded-2xl border bg-background/80 p-4 shadow-xs">
            <h3 className="leading-snug font-semibold">{task.title}</h3>
            {task.description && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {task.description}
                </p>
            )}
            {task.dueDate && (
                <p className="mt-3 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                    <CalendarDays className="size-3.5" />
                    Due {formatDate(task.dueDate)}
                </p>
            )}

            <Form
                {...updateStatus.form(task.id)}
                className="mt-4 grid grid-cols-3 gap-1.5"
            >
                {({ processing }) =>
                    (['not_started', 'ongoing', 'finished'] as const).map(
                        (status) => (
                            <Button
                                key={status}
                                type="submit"
                                name="status"
                                value={status}
                                size="sm"
                                variant={
                                    task.status === status
                                        ? 'default'
                                        : 'outline'
                                }
                                disabled={processing}
                                className="h-auto min-h-9 px-1 text-[11px]"
                            >
                                {formatStatus(status)}
                            </Button>
                        ),
                    )
                }
            </Form>
        </article>
    );
}

function formatStatus(status: TaskStatus): string {
    return status === 'not_started'
        ? 'Not started'
        : status === 'ongoing'
          ? 'Ongoing'
          : 'Finished';
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
        new Date(`${date.slice(0, 10)}T00:00:00`),
    );
}

Tasks.layout = {
    breadcrumbs: [{ title: 'Tasks', href: tasksIndex() }],
};
