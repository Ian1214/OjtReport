import { Form, Head, Link } from '@inertiajs/react';
import {
    BarChart3,
    ClipboardCheck,
    FilePenLine,
    Plus,
    Star,
    Trash2,
} from 'lucide-react';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/PerformanceEvaluationController';
import {
    DashboardHero,
    EmptyState,
    StatusBadge,
} from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogClose,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { index as evaluationsIndex } from '@/routes/evaluations';
import type { User } from '@/types';

type OjtOption = { id: number; name: string; studentId: string | null };
type Evaluation = {
    id: number;
    ojtId: number;
    ojtName: string;
    studentId: string | null;
    supervisorName: string;
    periodStart: string;
    periodEnd: string;
    technicalScore: number | null;
    workQualityScore: number | null;
    communicationScore: number | null;
    professionalismScore: number | null;
    attendanceScore: number | null;
    averageScore: number | null;
    strengths: string | null;
    improvements: string | null;
    comments: string | null;
    status: 'draft' | 'submitted';
    submittedAt: string | null;
};
type Props = {
    role: User['role'];
    ojts: OjtOption[];
    evaluations: {
        data: Evaluation[];
        links: { url: string | null; label: string; active: boolean }[];
    };
};

export default function EvaluationIndex({ role, ojts, evaluations }: Props) {
    const canWrite = role === 'supervisor';

    return (
        <>
            <Head title="Performance evaluations" />
            <div className="flex flex-1 flex-col gap-6 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_46%)] p-4 sm:p-6">
                <DashboardHero
                    eyebrow="Professional development"
                    title="Performance evaluations"
                    description={
                        canWrite
                            ? 'Assess each OJT with a consistent five-part rubric. Drafts stay private until you submit them.'
                            : 'Review finalized feedback on skills, work quality, communication, professionalism, and attendance.'
                    }
                    actions={
                        canWrite && ojts.length > 0 ? (
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <Plus /> New evaluation
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
                                    <DialogHeader>
                                        <DialogTitle>
                                            Evaluate an OJT
                                        </DialogTitle>
                                        <DialogDescription>
                                            Save a private draft or submit the
                                            completed evaluation for authorized
                                            viewers.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <EvaluationForm ojts={ojts} />
                                </DialogContent>
                            </Dialog>
                        ) : undefined
                    }
                />
                <section className="grid gap-4">
                    {evaluations.data.length === 0 ? (
                        <Card>
                            <CardContent className="p-6">
                                <EmptyState
                                    icon={ClipboardCheck}
                                    title="No evaluations yet"
                                    description={
                                        canWrite
                                            ? 'Create the first structured evaluation when feedback is ready.'
                                            : 'Submitted evaluations will appear here.'
                                    }
                                    compact
                                />
                            </CardContent>
                        </Card>
                    ) : (
                        evaluations.data.map((evaluation) => (
                            <EvaluationCard
                                key={evaluation.id}
                                evaluation={evaluation}
                                canEdit={
                                    canWrite && evaluation.status === 'draft'
                                }
                                canDelete={role === 'company_admin'}
                            />
                        ))
                    )}
                </section>
                {evaluations.links.length > 3 && (
                    <nav
                        className="flex flex-wrap justify-center gap-2"
                        aria-label="Evaluation pages"
                    >
                        {evaluations.links.map((link, index) => (
                            <Button
                                key={link.label + '-' + index}
                                variant={link.active ? 'default' : 'outline'}
                                size="sm"
                                asChild={Boolean(link.url)}
                                disabled={!link.url}
                            >
                                {link.url ? (
                                    <Link href={link.url}>
                                        {pageLabel(link.label)}
                                    </Link>
                                ) : (
                                    <span>{pageLabel(link.label)}</span>
                                )}
                            </Button>
                        ))}
                    </nav>
                )}
            </div>
        </>
    );
}

function EvaluationCard({
    evaluation,
    canEdit,
    canDelete,
}: {
    evaluation: Evaluation;
    canEdit: boolean;
    canDelete: boolean;
}) {
    const scores = [
        ['Technical skills', evaluation.technicalScore],
        ['Work quality', evaluation.workQualityScore],
        ['Communication', evaluation.communicationScore],
        ['Professionalism', evaluation.professionalismScore],
        ['Attendance', evaluation.attendanceScore],
    ] as const;

    return (
        <Card className="overflow-hidden border-primary/10 bg-card/90">
            <CardHeader className="gap-4 border-b bg-muted/15 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <CardTitle>{evaluation.ojtName}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                        {evaluation.studentId ?? 'No student ID'} ·{' '}
                        {evaluation.periodStart} to {evaluation.periodEnd} ·{' '}
                        {evaluation.supervisorName}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <StatusBadge
                        status={
                            evaluation.status === 'draft'
                                ? 'pending'
                                : 'submitted'
                        }
                        label={
                            evaluation.status === 'draft'
                                ? 'Private draft'
                                : 'Submitted'
                        }
                    />
                    {canEdit && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <FilePenLine /> Edit
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
                                <DialogHeader>
                                    <DialogTitle>
                                        Edit evaluation draft
                                    </DialogTitle>
                                    <DialogDescription>
                                        Submitted evaluations are locked to
                                        preserve the official record.
                                    </DialogDescription>
                                </DialogHeader>
                                <EvaluationForm evaluation={evaluation} />
                            </DialogContent>
                        </Dialog>
                    )}
                    {canDelete && (
                        <DeleteEvaluationDialog evaluation={evaluation} />
                    )}
                </div>
            </CardHeader>
            <CardContent className="grid gap-6 p-5 sm:p-6">
                {evaluation.averageScore !== null && (
                    <div className="flex items-center gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4">
                        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                            <BarChart3 className="size-5" />
                        </span>
                        <div>
                            <p className="text-sm text-muted-foreground">
                                Overall rating
                            </p>
                            <p className="text-xl font-semibold">
                                {evaluation.averageScore.toFixed(2)} / 5.00
                            </p>
                        </div>
                    </div>
                )}
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                    {scores.map(([label, score]) => (
                        <div
                            key={label}
                            className="rounded-xl border bg-muted/15 p-3"
                        >
                            <p className="text-xs text-muted-foreground">
                                {label}
                            </p>
                            <p className="mt-2 flex items-center gap-1.5 font-semibold">
                                <Star className="size-4 text-primary" />{' '}
                                {score ?? 'Not rated'}
                                {score !== null && ' / 5'}
                            </p>
                        </div>
                    ))}
                </div>
                <div className="grid gap-5 md:grid-cols-2">
                    <Feedback label="Strengths" value={evaluation.strengths} />
                    <Feedback
                        label="Areas for growth"
                        value={evaluation.improvements}
                    />
                    {evaluation.comments && (
                        <Feedback
                            label="Additional comments"
                            value={evaluation.comments}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function DeleteEvaluationDialog({ evaluation }: { evaluation: Evaluation }) {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="destructive" size="sm">
                    <Trash2 /> Delete
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete this evaluation?</DialogTitle>
                    <DialogDescription className="leading-6">
                        This will permanently remove {evaluation.ojtName}&apos;s
                        evaluation for {evaluation.periodStart} to{' '}
                        {evaluation.periodEnd}. This action cannot be undone and
                        may affect evaluation summaries and competency records.
                    </DialogDescription>
                </DialogHeader>
                <Form
                    {...destroy.form(evaluation.id)}
                    options={{ preserveScroll: true }}
                >
                    {({ processing }) => (
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={processing}
                            >
                                {processing ? <Spinner /> : <Trash2 />}
                                Delete evaluation
                            </Button>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function EvaluationForm({
    ojts = [],
    evaluation,
}: {
    ojts?: OjtOption[];
    evaluation?: Evaluation;
}) {
    const form = evaluation ? update.form(evaluation.id) : store.form();

    return (
        <Form {...form} className="grid gap-5">
            {({ errors, processing }) => (
                <>
                    {!evaluation && (
                        <Field label="OJT" error={errors.ojt_id}>
                            <select
                                name="ojt_id"
                                required
                                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                            >
                                <option value="">Select an OJT</option>
                                {ojts.map((ojt) => (
                                    <option key={ojt.id} value={ojt.id}>
                                        {ojt.name}{' '}
                                        {ojt.studentId
                                            ? '· ' + ojt.studentId
                                            : ''}
                                    </option>
                                ))}
                            </select>
                        </Field>
                    )}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <Field
                            label="Period starts"
                            error={errors.period_start}
                        >
                            <Input
                                name="period_start"
                                type="date"
                                required
                                defaultValue={evaluation?.periodStart}
                            />
                        </Field>
                        <Field label="Period ends" error={errors.period_end}>
                            <Input
                                name="period_end"
                                type="date"
                                required
                                defaultValue={evaluation?.periodEnd}
                            />
                        </Field>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
                        <ScoreField
                            name="technical_score"
                            label="Technical skills"
                            value={evaluation?.technicalScore}
                            error={errors.technical_score}
                        />
                        <ScoreField
                            name="work_quality_score"
                            label="Work quality"
                            value={evaluation?.workQualityScore}
                            error={errors.work_quality_score}
                        />
                        <ScoreField
                            name="communication_score"
                            label="Communication"
                            value={evaluation?.communicationScore}
                            error={errors.communication_score}
                        />
                        <ScoreField
                            name="professionalism_score"
                            label="Professionalism"
                            value={evaluation?.professionalismScore}
                            error={errors.professionalism_score}
                        />
                        <ScoreField
                            name="attendance_score"
                            label="Attendance"
                            value={evaluation?.attendanceScore}
                            error={errors.attendance_score}
                        />
                    </div>
                    <TextField
                        name="strengths"
                        label="Strengths"
                        value={evaluation?.strengths}
                        error={errors.strengths}
                        placeholder="What the OJT consistently does well"
                    />
                    <TextField
                        name="improvements"
                        label="Areas for growth"
                        value={evaluation?.improvements}
                        error={errors.improvements}
                        placeholder="Specific, constructive next steps"
                    />
                    <TextField
                        name="comments"
                        label="Additional comments"
                        value={evaluation?.comments}
                        error={errors.comments}
                        placeholder="Optional context or recommendation"
                    />
                    <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                        <Button
                            type="submit"
                            name="action"
                            value="draft"
                            variant="outline"
                            disabled={processing}
                        >
                            {processing ? <Spinner /> : null} Save private draft
                        </Button>
                        <Button
                            type="submit"
                            name="action"
                            value="submitted"
                            disabled={processing}
                        >
                            {processing ? <Spinner /> : <ClipboardCheck />}{' '}
                            Submit & lock
                        </Button>
                    </div>
                </>
            )}
        </Form>
    );
}

function ScoreField({
    name,
    label,
    value,
    error,
}: {
    name: string;
    label: string;
    value?: number | null;
    error?: string;
}) {
    return (
        <Field label={label} error={error}>
            <select
                name={name}
                defaultValue={value ?? ''}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
                <option value="">Not rated</option>
                {[1, 2, 3, 4, 5].map((score) => (
                    <option key={score} value={score}>
                        {score} / 5
                    </option>
                ))}
            </select>
        </Field>
    );
}

function TextField({
    name,
    label,
    value,
    error,
    placeholder,
}: {
    name: string;
    label: string;
    value?: string | null;
    error?: string;
    placeholder: string;
}) {
    return (
        <Field label={label} error={error}>
            <textarea
                name={name}
                defaultValue={value ?? ''}
                placeholder={placeholder}
                rows={3}
                className="min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm transition outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            />
        </Field>
    );
}

function Field({
    label,
    error,
    children,
}: {
    label: string;
    error?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="grid gap-1.5">
            <Label>{label}</Label>
            {children}
            <InputError message={error} />
        </div>
    );
}

function Feedback({ label, value }: { label: string; value: string | null }) {
    return (
        <div>
            <p className="text-sm font-semibold">{label}</p>
            <p className="mt-2 text-sm leading-6 whitespace-pre-wrap text-muted-foreground">
                {value || 'No details provided.'}
            </p>
        </div>
    );
}

function pageLabel(label: string): string {
    return label
        .replace('&laquo;', '‹')
        .replace('&raquo;', '›')
        .replace('Previous', 'Prev');
}

EvaluationIndex.layout = {
    breadcrumbs: [
        { title: 'Performance evaluations', href: evaluationsIndex() },
    ],
};
