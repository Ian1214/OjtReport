import { Form, Head, Link } from '@inertiajs/react';
import {
    ArrowLeft,
    CheckCircle2,
    ClipboardList,
    FolderLock,
    ListChecks,
    Star,
} from 'lucide-react';
import { index as documentsIndex } from '@/actions/App/Http/Controllers/DocumentController';
import { acknowledge } from '@/actions/App/Http/Controllers/SchoolCoordinatorDashboardController';
import {
    DashboardHero,
    EmptyState,
    StatusBadge,
} from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { dashboard as schoolDashboard } from '@/routes/school';

type Student = {
    id: number;
    name: string;
    studentId: string | null;
    program: string | null;
    companyName: string;
    supervisorName: string;
    department: string | null;
    position: string | null;
    year: number | null;
    requiredHours: number;
    approvedHours: number;
    remainingHours: number;
    lateDays: number;
    pendingReports: number;
    unfinishedTasks: number;
    isComplete: boolean;
    acknowledgedAt: string | null;
    startDate: string | null;
    endDate: string | null;
};
type Report = {
    id: number;
    date: string;
    hours: string;
    summary: string;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    attendanceStatus: 'on_time' | 'late' | null;
};
type Task = {
    id: number;
    title: string;
    description: string | null;
    status: 'not_started' | 'ongoing' | 'finished';
    dueDate: string | null;
};
type Feedback = {
    id: number;
    category: string;
    rating: number;
    comments: string;
    supervisorName: string;
    createdAt: string;
};

export default function SchoolStudent({
    student,
    recentReports,
    tasks,
    feedback,
}: {
    student: Student;
    recentReports: Report[];
    tasks: Task[];
    feedback: Feedback[];
}) {
    return (
        <>
            <Head title={`${student.name} · School portal`} />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <DashboardHero
                    eyebrow="Read-only student record"
                    title={student.name}
                    description={`${student.companyName} · ${student.position ?? 'OJT'} · Supervisor: ${student.supervisorName}`}
                    actions={
                        <div className="flex flex-wrap items-center gap-2">
                            <Button variant="outline" asChild>
                                <Link
                                    href={documentsIndex({
                                        query: { ojt: student.id },
                                    })}
                                >
                                    <FolderLock /> View {student.name}'s
                                    documents
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={schoolDashboard()}>
                                    <ArrowLeft />
                                    All students
                                </Link>
                            </Button>
                        </div>
                    }
                />
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <Info
                        label="Approved hours"
                        value={`${student.approvedHours.toFixed(2)} / ${student.requiredHours}`}
                    />
                    <Info
                        label="Hours remaining"
                        value={student.remainingHours.toFixed(2)}
                    />
                    <Info
                        label="Attendance"
                        value={`${student.lateDays} late day${student.lateDays === 1 ? '' : 's'}`}
                    />
                    <Info
                        label="Open work"
                        value={`${student.pendingReports} reports · ${student.unfinishedTasks} tasks`}
                    />
                </section>
                {student.isComplete && !student.acknowledgedAt && (
                    <Card className="border-emerald-500/25 bg-emerald-500/5">
                        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <p className="font-semibold">
                                    Completion is ready for school
                                    acknowledgement
                                </p>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    This records acknowledgement only; it does
                                    not modify company attendance or approvals.
                                </p>
                            </div>
                            <Form {...acknowledge.form(student.id)}>
                                {({ errors, processing }) => (
                                    <>
                                        <Button disabled={processing}>
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <CheckCircle2 />
                                            )}
                                            Acknowledge completion
                                        </Button>
                                        <InputError
                                            message={errors.completion}
                                        />
                                    </>
                                )}
                            </Form>
                        </CardContent>
                    </Card>
                )}
                <div className="grid items-start gap-6 xl:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ClipboardList className="size-5 text-primary" />
                                Recent daily reports
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {recentReports.length === 0 ? (
                                <EmptyState
                                    icon={ClipboardList}
                                    title="No reports"
                                    description="Submitted reports will appear here."
                                    compact
                                />
                            ) : (
                                recentReports.map((report) => (
                                    <article
                                        key={report.id}
                                        className="rounded-xl border p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="font-medium">
                                                {formatDate(report.date)} ·{' '}
                                                {report.hours} hours
                                            </p>
                                            <StatusBadge
                                                status={report.approvalStatus}
                                            />
                                        </div>
                                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                            {report.summary}
                                        </p>
                                    </article>
                                ))
                            )}
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <ListChecks className="size-5 text-primary" />
                                Supervisor-assigned tasks
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {tasks.length === 0 ? (
                                <EmptyState
                                    icon={ListChecks}
                                    title="No tasks"
                                    description="Supervisor task progress will appear here."
                                    compact
                                />
                            ) : (
                                tasks.map((task) => (
                                    <article
                                        key={task.id}
                                        className="rounded-xl border p-4"
                                    >
                                        <div className="flex flex-wrap items-center justify-between gap-2">
                                            <p className="font-medium">
                                                {task.title}
                                            </p>
                                            <StatusBadge status={task.status} />
                                        </div>
                                        {task.description && (
                                            <p className="mt-2 text-sm text-muted-foreground">
                                                {task.description}
                                            </p>
                                        )}
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            Due:{' '}
                                            {task.dueDate
                                                ? formatDate(task.dueDate)
                                                : 'No due date'}
                                        </p>
                                    </article>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Star className="size-5 text-primary" /> Shared
                            supervisor feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-3 md:grid-cols-2">
                        {feedback.length === 0 ? (
                            <EmptyState
                                icon={Star}
                                title="No shared feedback"
                                description="Feedback the supervisor shares with the school will appear here."
                                compact
                            />
                        ) : (
                            feedback.map((item) => (
                                <article
                                    key={item.id}
                                    className="rounded-xl border p-4"
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="font-medium capitalize">
                                            {item.category.replaceAll('_', ' ')}
                                        </p>
                                        <span className="text-sm text-amber-500">
                                            {item.rating}/5
                                        </span>
                                    </div>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        {item.comments}
                                    </p>
                                    <p className="mt-3 text-xs text-muted-foreground">
                                        {item.supervisorName} ·{' '}
                                        {new Date(
                                            item.createdAt,
                                        ).toLocaleDateString()}
                                    </p>
                                </article>
                            ))
                        )}
                    </CardContent>
                </Card>
            </div>
        </>
    );
}

function Info({ label, value }: { label: string; value: string }) {
    return (
        <Card className="bg-card/85">
            <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{label}</p>
                <p className="mt-2 text-xl font-semibold">{value}</p>
            </CardContent>
        </Card>
    );
}
function formatDate(value: string) {
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00Z`));
}

SchoolStudent.layout = {
    breadcrumbs: [{ title: 'School portal', href: schoolDashboard() }],
};
