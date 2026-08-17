import { Head, Link } from '@inertiajs/react';
import { Award, BriefcaseBusiness, UserRound } from 'lucide-react';
import { show } from '@/actions/App/Http/Controllers/CompetencyPassportController';
import { DashboardHero, EmptyState } from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type Student = {
    id: number;
    name: string;
    studentId: string | null;
    program: string | null;
    companyName: string;
    supervisorName: string;
    approvedHours: number;
    requiredHours: number;
    completedTasks: number;
    evaluations: number;
};

type Props = {
    students: {
        data: Student[];
        links: { url: string | null; label: string; active: boolean }[];
    };
};

export default function PassportIndex({ students }: Props) {
    return (
        <>
            <Head title="Competency passports" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <DashboardHero
                    eyebrow="Verified outcomes"
                    title="OJT competency passports"
                    description="Review evidence-backed skills, completed work, approved hours, evaluations, and verified credentials in one record."
                />

                {students.data.length === 0 ? (
                    <EmptyState
                        icon={Award}
                        title="No passports available"
                        description="Eligible OJT accounts will appear here."
                    />
                ) : (
                    <section className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
                        {students.data.map((student) => {
                            const progress = Math.min(
                                100,
                                (student.approvedHours /
                                    Math.max(1, student.requiredHours)) *
                                    100,
                            );

                            return (
                                <Card
                                    key={student.id}
                                    className="overflow-hidden border-primary/15 bg-card/90"
                                >
                                    <CardHeader className="border-b bg-primary/[0.04]">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <CardTitle>
                                                    {student.name}
                                                </CardTitle>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {student.studentId ??
                                                        'No student ID'}
                                                </p>
                                            </div>
                                            <Badge variant="outline">
                                                {progress.toFixed(0)}%
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="grid gap-4 p-5">
                                        <div className="grid gap-2 text-sm">
                                            <p className="flex items-center gap-2">
                                                <BriefcaseBusiness className="size-4 text-primary" />
                                                {student.companyName}
                                            </p>
                                            <p className="flex items-center gap-2 text-muted-foreground">
                                                <UserRound className="size-4" />
                                                Supervisor:{' '}
                                                {student.supervisorName}
                                            </p>
                                        </div>
                                        <div>
                                            <div className="flex justify-between gap-3 text-sm">
                                                <span>Verified hours</span>
                                                <strong>
                                                    {student.approvedHours.toFixed(
                                                        2,
                                                    )}{' '}
                                                    / {student.requiredHours}
                                                </strong>
                                            </div>
                                            <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                                                <div
                                                    className="h-full rounded-full bg-primary"
                                                    style={{
                                                        width: `${progress}%`,
                                                    }}
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3 text-sm">
                                            <div className="rounded-xl border p-3">
                                                <p className="text-muted-foreground">
                                                    Finished tasks
                                                </p>
                                                <p className="mt-1 text-lg font-semibold">
                                                    {student.completedTasks}
                                                </p>
                                            </div>
                                            <div className="rounded-xl border p-3">
                                                <p className="text-muted-foreground">
                                                    Evaluations
                                                </p>
                                                <p className="mt-1 text-lg font-semibold">
                                                    {student.evaluations}
                                                </p>
                                            </div>
                                        </div>
                                        <Button asChild>
                                            <Link href={show(student.id)}>
                                                <Award /> View passport
                                            </Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </section>
                )}

                {students.links.length > 3 && (
                    <div className="flex flex-wrap justify-center gap-2">
                        {students.links.map((link, index) => (
                            <Button
                                key={`${link.label}-${index}`}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                asChild={Boolean(link.url)}
                                disabled={!link.url}
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
            </div>
        </>
    );
}
