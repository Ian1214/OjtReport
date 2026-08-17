import { Form, Head } from '@inertiajs/react';
import { Archive, BookOpenCheck, Plus, RotateCcw } from 'lucide-react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/CurriculumOutcomeController';
import {
    DashboardHero,
    DashboardSectionHeader,
    EmptyState,
    MetricCard,
} from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { index } from '@/routes/school/curriculum-outcomes';

type Outcome = {
    id: number;
    code: string;
    title: string;
    description: string | null;
    isActive: boolean;
    taskCount: number;
    completedTaskCount: number;
};

export default function CurriculumOutcomes({
    schoolName,
    outcomes,
}: {
    schoolName: string;
    outcomes: Outcome[];
}) {
    const activeCount = outcomes.filter((outcome) => outcome.isActive).length;
    const demonstratedCount = outcomes.filter(
        (outcome) => outcome.completedTaskCount > 0,
    ).length;

    return (
        <>
            <Head title="Curriculum outcomes" />
            <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">
                <DashboardHero
                    eyebrow="School-owned framework"
                    title="Curriculum outcomes"
                    description={`Define ${schoolName}'s learning outcomes. Supervisors can map real tasks to active outcomes, creating verified evidence without changing school records.`}
                />

                <section className="grid gap-3 sm:grid-cols-3">
                    <MetricCard
                        icon={BookOpenCheck}
                        label="Active outcomes"
                        value={activeCount}
                    />
                    <MetricCard
                        icon={Plus}
                        label="Task mappings"
                        value={outcomes.reduce(
                            (total, outcome) => total + outcome.taskCount,
                            0,
                        )}
                    />
                    <MetricCard
                        icon={BookOpenCheck}
                        label="Demonstrated"
                        value={demonstratedCount}
                        accent="success"
                    />
                </section>

                <Card className="border-primary/15">
                    <CardHeader>
                        <CardTitle>Add a learning outcome</CardTitle>
                        <p className="text-sm text-muted-foreground">
                            Use the official code and a short, measurable title.
                        </p>
                    </CardHeader>
                    <CardContent>
                        <Form
                            {...store.form()}
                            resetOnSuccess
                            className="grid gap-4 lg:grid-cols-[10rem_minmax(0,1fr)_minmax(0,1.4fr)_auto] lg:items-end"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <div className="grid gap-2">
                                        <Label htmlFor="code">Code</Label>
                                        <Input
                                            id="code"
                                            name="code"
                                            placeholder="IT-LO1"
                                            required
                                        />
                                        <InputError message={errors.code} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="title">Title</Label>
                                        <Input
                                            id="title"
                                            name="title"
                                            placeholder="Develop secure web applications"
                                            required
                                        />
                                        <InputError message={errors.title} />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="description">
                                            Evidence guidance (optional)
                                        </Label>
                                        <Input
                                            id="description"
                                            name="description"
                                            placeholder="Describe acceptable workplace evidence."
                                        />
                                        <InputError
                                            message={errors.description}
                                        />
                                    </div>
                                    <Button disabled={processing}>
                                        {processing ? <Spinner /> : <Plus />}
                                        Add outcome
                                    </Button>
                                </>
                            )}
                        </Form>
                    </CardContent>
                </Card>

                <section>
                    <DashboardSectionHeader
                        title="Outcome catalog"
                        description="Archiving prevents new task mappings but preserves existing verified evidence."
                    />
                    {outcomes.length === 0 ? (
                        <EmptyState
                            className="mt-4"
                            icon={BookOpenCheck}
                            title="No curriculum outcomes yet"
                            description="Add the first outcome so supervisors can connect workplace tasks to the school curriculum."
                        />
                    ) : (
                        <div className="mt-4 grid gap-3 lg:grid-cols-2">
                            {outcomes.map((outcome) => (
                                <Card
                                    key={outcome.id}
                                    className={
                                        outcome.isActive
                                            ? 'bg-card/90'
                                            : 'bg-muted/30 opacity-75'
                                    }
                                >
                                    <CardContent className="grid gap-4 p-5">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <Badge variant="outline">
                                                        {outcome.code}
                                                    </Badge>
                                                    <Badge
                                                        variant={
                                                            outcome.isActive
                                                                ? 'default'
                                                                : 'secondary'
                                                        }
                                                    >
                                                        {outcome.isActive
                                                            ? 'Active'
                                                            : 'Archived'}
                                                    </Badge>
                                                </div>
                                                <h2 className="mt-3 font-semibold">
                                                    {outcome.title}
                                                </h2>
                                                {outcome.description && (
                                                    <p className="mt-1 text-sm text-muted-foreground">
                                                        {outcome.description}
                                                    </p>
                                                )}
                                            </div>
                                            <Form {...update.form(outcome.id)}>
                                                {({ processing }) => (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        disabled={processing}
                                                    >
                                                        {processing ? (
                                                            <Spinner />
                                                        ) : outcome.isActive ? (
                                                            <Archive />
                                                        ) : (
                                                            <RotateCcw />
                                                        )}
                                                        {outcome.isActive
                                                            ? 'Archive'
                                                            : 'Activate'}
                                                    </Button>
                                                )}
                                            </Form>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            {outcome.completedTaskCount} completed
                                            task evidence · {outcome.taskCount}{' '}
                                            total mappings
                                        </p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </section>
            </div>
        </>
    );
}

CurriculumOutcomes.layout = {
    breadcrumbs: [{ title: 'Curriculum outcomes', href: index() }],
};
