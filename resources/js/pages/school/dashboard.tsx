import { Head, Link } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowRight,
    Award,
    CheckCircle2,
    FileCheck2,
    GraduationCap,
    Search,
    UsersRound,
} from 'lucide-react';
import {
    DashboardHero,
    DashboardSectionHeader,
    DashboardWorkspace,
    EmptyState,
    MetricCard,
    NextActionCard,
    StatusBadge,
} from '@/components/dashboard-ui';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { index as certificates } from '@/routes/certificates';
import { index as dtrSubmissions } from '@/routes/dtr-submissions';
import { dashboard as schoolDashboard } from '@/routes/school';
import { show as showStudent } from '@/routes/school/students';

type Student = {
    id: number;
    name: string;
    studentId: string | null;
    program: string | null;
    companyName: string;
    supervisorName: string;
    requiredHours: number;
    approvedHours: number;
    remainingHours: number;
    lateDays: number;
    pendingReports: number;
    unfinishedTasks: number;
    isComplete: boolean;
    acknowledgedAt: string | null;
};

type Props = {
    schoolName: string;
    summary: {
        students: number;
        completedStudents: number;
        finalizedDtrs: number;
        finalizedCertificates: number;
    };
    students: {
        data: Student[];
        links: { url: string | null; label: string; active: boolean }[];
    };
};

export default function SchoolDashboard({
    schoolName,
    summary,
    students,
}: Props) {
    const attentionStudents = students.data.filter(
        (student) =>
            student.pendingReports > 0 ||
            student.lateDays > 0 ||
            student.unfinishedTasks > 0,
    );
    const priorityStudent = attentionStudents.at(0) ?? students.data.at(0);

    return (
        <>
            <Head title={`${schoolName} coordinator portal`} />
            <DashboardWorkspace>
                <DashboardHero
                    eyebrow="School coordinator portal"
                    title={schoolName}
                    description="Monitor assigned students across partner companies without changing company attendance, task, or approval records."
                    actions={
                        <div className="flex flex-wrap gap-2">
                            <Button variant="outline" asChild>
                                <Link href={dtrSubmissions()}>
                                    <FileCheck2 />
                                    Verified DTRs
                                </Link>
                            </Button>
                            <Button variant="outline" asChild>
                                <Link href={certificates()}>
                                    <Award />
                                    Certificates
                                </Link>
                            </Button>
                        </div>
                    }
                />
                <NextActionCard
                    icon={
                        students.data.length === 0
                            ? GraduationCap
                            : attentionStudents.length > 0
                              ? AlertTriangle
                              : CheckCircle2
                    }
                    title={
                        students.data.length === 0
                            ? 'Waiting for student access'
                            : attentionStudents.length > 0
                              ? `${attentionStudents.length} student${attentionStudents.length === 1 ? '' : 's'} may need attention`
                              : 'Assigned students are on track'
                    }
                    description={
                        students.data.length === 0
                            ? 'A partner company must assign an OJT to your school before oversight records appear.'
                            : attentionStudents.length > 0
                              ? 'Review pending reports, late attendance, and unfinished tasks without changing company records.'
                              : 'No pending, late, or unfinished indicators appear for the students on this page.'
                    }
                    tone={
                        students.data.length === 0
                            ? 'primary'
                            : attentionStudents.length > 0
                              ? 'warning'
                              : 'success'
                    }
                    status={
                        <StatusBadge
                            status={
                                students.data.length === 0
                                    ? 'not_started'
                                    : attentionStudents.length > 0
                                      ? 'pending'
                                      : 'approved'
                            }
                            label={
                                students.data.length === 0
                                    ? 'Access pending'
                                    : attentionStudents.length > 0
                                      ? 'Review suggested'
                                      : 'All clear'
                            }
                        />
                    }
                    action={
                        priorityStudent ? (
                            <Button variant="outline" asChild>
                                <Link href={showStudent(priorityStudent.id)}>
                                    View student <ArrowRight />
                                </Link>
                            </Button>
                        ) : undefined
                    }
                />
                <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MetricCard
                        icon={UsersRound}
                        label="Assigned students"
                        value={summary.students}
                    />
                    <MetricCard
                        icon={CheckCircle2}
                        label="Hours completed"
                        value={summary.completedStudents}
                        accent="success"
                    />
                    <MetricCard
                        icon={FileCheck2}
                        label="Verified DTRs"
                        value={summary.finalizedDtrs}
                    />
                    <MetricCard
                        icon={Award}
                        label="Certificates"
                        value={summary.finalizedCertificates}
                    />
                </section>
                <section className="grid gap-4">
                    <DashboardSectionHeader
                        title="Student oversight"
                        description="Progress and attention indicators use approved attendance, submitted reports, and supervisor tasks."
                    />
                    {students.data.length === 0 ? (
                        <EmptyState
                            icon={GraduationCap}
                            title="No students assigned"
                            description="A partner company must explicitly connect an OJT to your school."
                        />
                    ) : (
                        students.data.map((student) => (
                            <Card
                                key={student.id}
                                className="group border-primary/10 bg-card/88 transition hover:border-primary/30"
                            >
                                <CardContent className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(16rem,1fr)_auto] lg:items-center">
                                    <div>
                                        <div className="flex flex-wrap items-center gap-2">
                                            <p className="font-semibold">
                                                {student.name}
                                            </p>
                                            <StatusBadge
                                                status={
                                                    student.isComplete
                                                        ? 'completed'
                                                        : 'active'
                                                }
                                            />
                                            {student.acknowledgedAt && (
                                                <StatusBadge
                                                    status="approved"
                                                    label="School acknowledged"
                                                />
                                            )}
                                        </div>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            {student.studentId ??
                                                'No student ID'}{' '}
                                            ·{' '}
                                            {student.program ??
                                                'Program not set'}
                                        </p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {student.companyName} · Supervisor:{' '}
                                            {student.supervisorName}
                                        </p>
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-sm">
                                            <span>
                                                {student.approvedHours.toFixed(
                                                    2,
                                                )}{' '}
                                                / {student.requiredHours} hours
                                            </span>
                                            <span>
                                                {student.remainingHours.toFixed(
                                                    2,
                                                )}{' '}
                                                left
                                            </span>
                                        </div>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                                            <div
                                                className="h-full rounded-full bg-primary"
                                                style={{
                                                    width: `${Math.min(100, (student.approvedHours / Math.max(1, student.requiredHours)) * 100)}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {student.pendingReports} pending
                                            reports · {student.lateDays} late
                                            days · {student.unfinishedTasks}{' '}
                                            open tasks
                                        </p>
                                    </div>
                                    <Button variant="outline" asChild>
                                        <Link href={showStudent(student.id)}>
                                            <Search />
                                            View student
                                        </Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </section>
                {students.links.length > 3 && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {students.links.map((link, index) => (
                            <Button
                                key={`${link.label}-${index}`}
                                size="sm"
                                variant={link.active ? 'default' : 'outline'}
                                disabled={!link.url}
                                asChild={Boolean(link.url)}
                            >
                                {link.url ? (
                                    <Link href={link.url}>
                                        {link.label
                                            .replace('&laquo;', '‹')
                                            .replace('&raquo;', '›')}
                                    </Link>
                                ) : (
                                    <span>{link.label}</span>
                                )}
                            </Button>
                        ))}
                    </div>
                )}
            </DashboardWorkspace>
        </>
    );
}

SchoolDashboard.layout = {
    breadcrumbs: [{ title: 'School portal', href: schoolDashboard() }],
};
