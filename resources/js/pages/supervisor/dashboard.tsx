import { Form, Head, Link, usePage, usePoll } from '@inertiajs/react';
import {
    ArrowRight,
    CalendarDays,
    CheckCircle2,
    ChevronDown,
    ChevronUp,
    ClipboardList,
    FileText,
    MessageCircle,
    Plus,
    UsersRound,
} from 'lucide-react';
import { useState } from 'react';
import { store } from '@/actions/App/Http/Controllers/SupervisorTaskController';
import {
    DashboardHero,
    DashboardSectionHeader,
    DashboardWorkspace,
    EmptyState,
    MetricCard,
    NextActionCard,
    StatusBadge,
} from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { dashboard } from '@/routes';
import {
    index as messagesIndex,
    show as showMessages,
} from '@/routes/messages';
import { reports as ojtReports } from '@/routes/supervisor/ojts';
import type { User } from '@/types';

type Task = {
    id: number;
    title: string;
    description: string | null;
    status: 'not_started' | 'ongoing' | 'finished';
    dueDate: string | null;
    outcomes: { code: string; title: string }[];
};

type Ojt = {
    id: number;
    name: string;
    studentId: string;
    program: string | null;
    department: string | null;
    position: string | null;
    isOnline: boolean;
    lastSeenAt: string | null;
    unreadCount: number;
    outcomes: { id: number; code: string; title: string }[];
    tasks: Task[];
};

export default function SupervisorDashboard({ ojts }: { ojts: Ojt[] }) {
    const { auth, navigation } = usePage<{
        auth: { user: User };
        navigation: { unreadMessagesCount: number };
    }>().props;
    const [expandedOjtId, setExpandedOjtId] = useState<number | null>(null);
    const [taskFormOjtId, setTaskFormOjtId] = useState<number | null>(null);
    const openTaskCount = ojts.reduce(
        (total, ojt) =>
            total +
            ojt.tasks.filter((task) => task.status !== 'finished').length,
        0,
    );
    const onlineCount = ojts.filter((ojt) => ojt.isOnline).length;
    const priorityOjt =
        ojts.find((ojt) => ojt.unreadCount > 0) ?? ojts.at(0) ?? null;

    usePoll(15_000, { only: ['ojts', 'navigation'] }, { mode: 'rest' });

    return (
        <>
            <Head title="My OJTs" />

            <DashboardWorkspace>
                <DashboardHero
                    eyebrow="Supervisor workspace"
                    title={`Good day, ${firstName(auth.user.name)}`}
                    description="Guide your assigned OJTs, monitor task progress, review reports, and respond to messages from one workspace."
                    actions={
                        <Button
                            variant="outline"
                            asChild
                            className="w-full sm:w-auto"
                        >
                            <Link href={messagesIndex()}>
                                <MessageCircle /> Open messages
                                {navigation.unreadMessagesCount > 0 && (
                                    <Badge>
                                        {navigation.unreadMessagesCount}
                                    </Badge>
                                )}
                            </Link>
                        </Button>
                    }
                />

                <NextActionCard
                    icon={
                        navigation.unreadMessagesCount > 0
                            ? MessageCircle
                            : ojts.length === 0
                              ? UsersRound
                              : ClipboardList
                    }
                    title={
                        navigation.unreadMessagesCount > 0
                            ? `${navigation.unreadMessagesCount} unread ${navigation.unreadMessagesCount === 1 ? 'message' : 'messages'}`
                            : ojts.length === 0
                              ? 'Waiting for an OJT assignment'
                              : openTaskCount > 0
                                ? `${openTaskCount} open ${openTaskCount === 1 ? 'task' : 'tasks'} to monitor`
                                : 'Your OJT team is on track'
                    }
                    description={
                        navigation.unreadMessagesCount > 0
                            ? 'An OJT may be waiting for your guidance. Open the conversation to respond.'
                            : ojts.length === 0
                              ? 'A company administrator needs to assign an OJT before you can manage tasks and reports.'
                              : openTaskCount > 0
                                ? 'Open an OJT workspace to review progress, assign work, or check submitted reports.'
                                : 'There are no open tasks. Check in with your assigned OJTs when needed.'
                    }
                    tone={
                        navigation.unreadMessagesCount > 0
                            ? 'warning'
                            : ojts.length === 0
                              ? 'primary'
                              : 'success'
                    }
                    status={
                        <StatusBadge
                            status={
                                navigation.unreadMessagesCount > 0
                                    ? 'pending'
                                    : ojts.length === 0
                                      ? 'not_started'
                                      : openTaskCount > 0
                                        ? 'ongoing'
                                        : 'approved'
                            }
                            label={
                                navigation.unreadMessagesCount > 0
                                    ? 'Response needed'
                                    : ojts.length === 0
                                      ? 'Assignment needed'
                                      : openTaskCount > 0
                                        ? 'Work in progress'
                                        : 'All clear'
                            }
                        />
                    }
                    action={
                        navigation.unreadMessagesCount > 0 ? (
                            <Button variant="outline" asChild>
                                <Link href={messagesIndex()}>
                                    Open messages
                                    <ArrowRight />
                                </Link>
                            </Button>
                        ) : priorityOjt ? (
                            <Button
                                variant="outline"
                                onClick={() => setExpandedOjtId(priorityOjt.id)}
                            >
                                Open OJT workspace
                                <ArrowRight />
                            </Button>
                        ) : undefined
                    }
                />

                <div className="grid gap-3 sm:grid-cols-3">
                    <MetricCard
                        icon={UsersRound}
                        value={ojts.length}
                        label="Assigned OJTs"
                        detail="People under your supervision"
                    />
                    <MetricCard
                        icon={ClipboardList}
                        value={openTaskCount}
                        label="Open tasks"
                        detail="Waiting or currently ongoing"
                    />
                    <MetricCard
                        icon={CheckCircle2}
                        value={onlineCount}
                        label="Online now"
                        detail="Available in the system"
                        accent="success"
                    />
                </div>

                <section>
                    <DashboardSectionHeader
                        title="Your OJT team"
                        description="Each workspace keeps reports, conversations, and assigned tasks together."
                        aside={
                            <Badge variant="secondary">
                                {ojts.length} total
                            </Badge>
                        }
                    />

                    {ojts.length === 0 ? (
                        <EmptyState
                            icon={UsersRound}
                            title="No OJTs assigned yet"
                            description="Ask the company administrator to assign an OJT to your supervisor account."
                            className="mt-4"
                        />
                    ) : (
                        <div className="mt-4 grid items-start gap-4 xl:grid-cols-2">
                            {ojts.map((ojt) => (
                                <OjtCard
                                    key={ojt.id}
                                    ojt={ojt}
                                    expanded={expandedOjtId === ojt.id}
                                    taskFormOpen={taskFormOjtId === ojt.id}
                                    onToggle={() => {
                                        setExpandedOjtId(
                                            expandedOjtId === ojt.id
                                                ? null
                                                : ojt.id,
                                        );
                                        setTaskFormOjtId(null);
                                    }}
                                    onToggleTaskForm={() =>
                                        setTaskFormOjtId(
                                            taskFormOjtId === ojt.id
                                                ? null
                                                : ojt.id,
                                        )
                                    }
                                    onTaskCreated={() => setTaskFormOjtId(null)}
                                />
                            ))}
                        </div>
                    )}
                </section>
            </DashboardWorkspace>
        </>
    );
}

function OjtCard({
    ojt,
    expanded,
    taskFormOpen,
    onToggle,
    onToggleTaskForm,
    onTaskCreated,
}: {
    ojt: Ojt;
    expanded: boolean;
    taskFormOpen: boolean;
    onToggle: () => void;
    onToggleTaskForm: () => void;
    onTaskCreated: () => void;
}) {
    const ongoingCount = ojt.tasks.filter(
        (task) => task.status === 'ongoing',
    ).length;
    const waitingCount = ojt.tasks.filter(
        (task) => task.status === 'not_started',
    ).length;

    return (
        <article className="overflow-hidden rounded-3xl border bg-card/90 shadow-sm">
            <div className="p-5 sm:p-6">
                <div className="flex items-start gap-3">
                    <span className="relative grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                        {initials(ojt.name)}
                        <span
                            className={`absolute right-0 bottom-0 size-3.5 rounded-full border-2 border-card ${ojt.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/45'}`}
                        />
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <h3 className="truncate text-lg font-semibold">
                                {ojt.name}
                            </h3>
                            <StatusBadge
                                status={ojt.isOnline ? 'online' : 'offline'}
                            />
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {ojt.position ?? 'OJT Intern'} ·{' '}
                            {ojt.department ?? 'Department not set'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            Student ID: {ojt.studentId}
                        </p>
                    </div>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-2">
                    <Button variant="outline" asChild>
                        <Link href={ojtReports(ojt.id)}>
                            <FileText />
                            View reports
                        </Link>
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={showMessages(ojt.id)}>
                            <MessageCircle />
                            Message
                            {ojt.unreadCount > 0 && (
                                <span className="rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                                    {ojt.unreadCount > 99
                                        ? '99+'
                                        : ojt.unreadCount}
                                </span>
                            )}
                        </Link>
                    </Button>
                </div>

                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={expanded}
                    className="mt-3 flex min-h-12 w-full items-center gap-3 rounded-xl border bg-muted/25 px-4 text-left text-sm font-medium transition-colors hover:bg-muted/50"
                >
                    <ClipboardList className="size-4 text-primary" />
                    <span className="flex-1">Manage tasks</span>
                    <span className="text-xs text-muted-foreground">
                        {ongoingCount} ongoing · {waitingCount} waiting
                    </span>
                    {expanded ? (
                        <ChevronUp className="size-4" />
                    ) : (
                        <ChevronDown className="size-4" />
                    )}
                </button>
            </div>

            {expanded && (
                <div className="border-t bg-muted/15 p-4 sm:p-5">
                    <div className="flex items-center justify-between gap-3">
                        <div>
                            <p className="font-semibold">Assigned tasks</p>
                            <p className="text-xs text-muted-foreground">
                                {ojt.tasks.length} total
                            </p>
                        </div>
                        <Button size="sm" onClick={onToggleTaskForm}>
                            <Plus />
                            {taskFormOpen ? 'Close form' : 'Assign task'}
                        </Button>
                    </div>

                    {taskFormOpen && (
                        <TaskForm
                            ojtId={ojt.id}
                            outcomes={ojt.outcomes}
                            onSuccess={onTaskCreated}
                        />
                    )}

                    {ojt.tasks.length === 0 ? (
                        <p className="mt-4 rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                            No tasks assigned yet. Use Assign task to create the
                            first one.
                        </p>
                    ) : (
                        <div className="mt-4 grid gap-2">
                            {ojt.tasks.map((task) => (
                                <article
                                    key={task.id}
                                    className="rounded-xl border bg-background/80 p-3"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-medium">
                                                {task.title}
                                            </p>
                                            {task.description && (
                                                <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                                    {task.description}
                                                </p>
                                            )}
                                        </div>
                                        <StatusBadge status={task.status} />
                                    </div>
                                    {task.dueDate && (
                                        <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                            <CalendarDays className="size-3.5" />
                                            Due {formatDate(task.dueDate)}
                                        </p>
                                    )}
                                    {task.outcomes.length > 0 && (
                                        <div className="mt-2 flex flex-wrap gap-1.5">
                                            {task.outcomes.map((outcome) => (
                                                <span
                                                    key={outcome.code}
                                                    title={outcome.title}
                                                    className="rounded-full border border-cyan-500/20 bg-cyan-500/10 px-2 py-0.5 text-[11px] font-medium text-cyan-500"
                                                >
                                                    {outcome.code}
                                                </span>
                                            ))}
                                        </div>
                                    )}
                                </article>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </article>
    );
}

function TaskForm({
    ojtId,
    outcomes,
    onSuccess,
}: {
    ojtId: number;
    outcomes: { id: number; code: string; title: string }[];
    onSuccess: () => void;
}) {
    return (
        <Form
            {...store.form(ojtId)}
            resetOnSuccess
            onSuccess={onSuccess}
            className="mt-4 grid gap-3 rounded-2xl border border-primary/20 bg-primary/4 p-4"
        >
            {({ errors, processing }) => (
                <>
                    <div className="grid gap-2">
                        <Label htmlFor={`title-${ojtId}`}>Task title</Label>
                        <Input
                            id={`title-${ojtId}`}
                            name="title"
                            required
                            placeholder="Example: Prepare the weekly inventory"
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
                            placeholder="Explain what should be completed."
                            className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                        />
                        <InputError message={errors.description} />
                    </div>
                    <div className="grid gap-2 sm:max-w-52">
                        <Label htmlFor={`due-date-${ojtId}`}>
                            Due date (optional)
                        </Label>
                        <Input
                            id={`due-date-${ojtId}`}
                            name="due_date"
                            type="date"
                        />
                        <InputError message={errors.due_date} />
                    </div>
                    {outcomes.length > 0 && (
                        <fieldset className="grid gap-2">
                            <legend className="text-sm font-medium">
                                School learning outcomes (optional)
                            </legend>
                            <p className="text-xs text-muted-foreground">
                                Link this work to the student&apos;s school
                                curriculum. Completed work becomes verified
                                passport evidence.
                            </p>
                            <div className="grid gap-2 sm:grid-cols-2">
                                {outcomes.map((outcome) => (
                                    <label
                                        key={outcome.id}
                                        className="flex min-h-11 items-start gap-2 rounded-xl border bg-background/80 p-3 text-sm"
                                    >
                                        <input
                                            type="checkbox"
                                            name="outcome_ids[]"
                                            value={outcome.id}
                                            className="mt-0.5 size-4 accent-primary"
                                        />
                                        <span>
                                            <strong>{outcome.code}</strong>{' '}
                                            <span className="text-muted-foreground">
                                                {outcome.title}
                                            </span>
                                        </span>
                                    </label>
                                ))}
                            </div>
                            <InputError message={errors.outcome_ids} />
                        </fieldset>
                    )}
                    <div className="flex justify-end">
                        <Button type="submit" size="sm" disabled={processing}>
                            {processing && <Spinner />}
                            Assign task
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
        new Date(`${date}T00:00:00`),
    );
}

function firstName(name: string): string {
    return name.trim().split(/\s+/)[0] ?? name;
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

SupervisorDashboard.layout = {
    breadcrumbs: [{ title: 'My OJTs', href: dashboard() }],
};
