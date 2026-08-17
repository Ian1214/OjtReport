import { Form, Head } from '@inertiajs/react';
import {
    GraduationCap,
    Link2,
    Mail,
    MailCheck,
    RefreshCw,
    School,
    UsersRound,
} from 'lucide-react';
import { update } from '@/actions/App/Http/Controllers/Company/SchoolAccessController';
import {
    resend,
    store,
} from '@/actions/App/Http/Controllers/Company/SchoolCoordinatorController';
import { DashboardHero, EmptyState } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { index as schoolAccess } from '@/routes/company/school-access';

type SchoolOption = {
    id: number;
    name: string;
    coordinator: {
        id: number;
        name: string;
        email: string;
    } | null;
};

type Ojt = {
    id: number;
    name: string;
    studentId: string | null;
    schoolId: number | null;
    schoolName: string | null;
};

export default function SchoolAccess({
    schools,
    ojts,
}: {
    schools: SchoolOption[];
    ojts: Ojt[];
}) {
    return (
        <>
            <Head title="School access" />
            <div className="flex flex-1 flex-col gap-6 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_8%,transparent),transparent_44%)] p-4 sm:p-6">
                <DashboardHero
                    eyebrow="Academic coordination"
                    title="School access"
                    description="Invite a school coordinator, then explicitly connect OJTs to that school. Coordinators receive read-only access to verified internship records."
                />

                <div className="grid items-start gap-6 xl:grid-cols-[24rem_minmax(0,1fr)]">
                    <div className="grid min-w-0 gap-6">
                        <Card className="border-primary/15 bg-card/90">
                            <CardHeader>
                                <div className="flex items-center gap-3">
                                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                                        <School className="size-5" />
                                    </span>
                                    <div>
                                        <CardTitle>
                                            Create school access
                                        </CardTitle>
                                        <p className="mt-1 text-sm text-muted-foreground">
                                            A secure setup link is sent by
                                            email.
                                        </p>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <Form
                                    {...store.form()}
                                    resetOnSuccess
                                    className="grid gap-4"
                                >
                                    {({ errors, processing }) => (
                                        <>
                                            <Field
                                                label="School name"
                                                name="school_name"
                                                error={errors.school_name}
                                                placeholder="Example State University"
                                            />
                                            <Field
                                                label="Coordinator name"
                                                name="name"
                                                error={errors.name}
                                                placeholder="Maria Santos"
                                            />
                                            <Field
                                                label="Coordinator email"
                                                name="email"
                                                type="email"
                                                error={errors.email}
                                                placeholder="coordinator@school.edu"
                                            />
                                            <Button
                                                disabled={processing}
                                                className="w-full"
                                            >
                                                {processing ? (
                                                    <Spinner />
                                                ) : (
                                                    <Mail />
                                                )}
                                                Send secure invitation
                                            </Button>
                                        </>
                                    )}
                                </Form>
                            </CardContent>
                        </Card>

                        <CoordinatorInvitations schools={schools} />
                    </div>

                    <Card className="border-primary/15 bg-card/90">
                        <CardHeader>
                            <CardTitle>Student access assignments</CardTitle>
                            <p className="text-sm text-muted-foreground">
                                A coordinator can only see OJTs explicitly
                                assigned to their school.
                            </p>
                        </CardHeader>
                        <CardContent className="grid gap-3">
                            {ojts.length === 0 ? (
                                <EmptyState
                                    icon={UsersRound}
                                    title="No OJTs yet"
                                    description="Create an OJT account before assigning school access."
                                    compact
                                />
                            ) : (
                                ojts.map((ojt) => (
                                    <Form
                                        key={ojt.id}
                                        {...update.form(ojt.id)}
                                        className="grid min-w-0 gap-4 rounded-2xl border bg-muted/20 p-4 lg:grid-cols-[minmax(12rem,0.8fr)_minmax(0,1.4fr)_auto] lg:items-end"
                                    >
                                        {({
                                            errors,
                                            processing,
                                            recentlySuccessful,
                                        }) => (
                                            <>
                                                <div className="min-w-0">
                                                    <p className="font-semibold">
                                                        {ojt.name}
                                                    </p>
                                                    <p className="mt-1 text-xs wrap-break-word text-muted-foreground">
                                                        {ojt.studentId ??
                                                            'No student ID'}{' '}
                                                        ·{' '}
                                                        {ojt.schoolName ??
                                                            'No school access'}
                                                    </p>
                                                </div>
                                                <div className="grid min-w-0 gap-1.5">
                                                    <Label
                                                        htmlFor={`school-${ojt.id}`}
                                                    >
                                                        Assigned school
                                                    </Label>
                                                    <select
                                                        id={`school-${ojt.id}`}
                                                        name="school_id"
                                                        defaultValue={
                                                            ojt.schoolId ?? ''
                                                        }
                                                        className="h-11 w-full max-w-full min-w-0 truncate rounded-md border border-input bg-background px-3 text-sm"
                                                    >
                                                        <option value="">
                                                            No school access
                                                        </option>
                                                        {schools.map(
                                                            (school) => (
                                                                <option
                                                                    key={
                                                                        school.id
                                                                    }
                                                                    value={
                                                                        school.id
                                                                    }
                                                                >
                                                                    {
                                                                        school.name
                                                                    }
                                                                </option>
                                                            ),
                                                        )}
                                                    </select>
                                                    <InputError
                                                        message={
                                                            errors.school_id
                                                        }
                                                    />
                                                </div>
                                                <Button
                                                    type="submit"
                                                    variant="outline"
                                                    className="h-11 w-full whitespace-nowrap lg:w-auto"
                                                    disabled={processing}
                                                >
                                                    {processing ? (
                                                        <Spinner />
                                                    ) : recentlySuccessful ? (
                                                        <Link2 />
                                                    ) : (
                                                        <GraduationCap />
                                                    )}
                                                    {recentlySuccessful
                                                        ? 'Saved'
                                                        : 'Save access'}
                                                </Button>
                                            </>
                                        )}
                                    </Form>
                                ))
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </>
    );
}

function CoordinatorInvitations({ schools }: { schools: SchoolOption[] }) {
    if (schools.length === 0) {
        return null;
    }

    return (
        <section className="grid gap-3">
            <div>
                <h2 className="text-lg font-semibold">School invitations</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                    Resend a fresh account setup link if the coordinator did not
                    receive or can no longer use the original email.
                </p>
            </div>
            <div className="grid gap-3">
                {schools.map((school) => (
                    <Card
                        key={school.id}
                        className="border-primary/15 bg-card/90"
                    >
                        <CardContent className="grid gap-4 p-4 sm:p-5">
                            <div className="min-w-0">
                                <p className="font-semibold">{school.name}</p>
                                {school.coordinator ? (
                                    <div className="mt-2">
                                        <p className="text-sm font-medium">
                                            {school.coordinator.name}
                                        </p>
                                        <p className="text-xs break-all text-muted-foreground">
                                            {school.coordinator.email}
                                        </p>
                                    </div>
                                ) : (
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        Assign one of your OJTs to this school
                                        before resending its invitation.
                                    </p>
                                )}
                            </div>

                            {school.coordinator && (
                                <Form
                                    {...resend.form(school.coordinator.id)}
                                    className="w-full"
                                >
                                    {({
                                        errors,
                                        processing,
                                        recentlySuccessful,
                                    }) => (
                                        <div className="grid gap-2">
                                            <Button
                                                type="submit"
                                                variant="outline"
                                                className="min-h-11 w-full"
                                                disabled={processing}
                                            >
                                                {processing ? (
                                                    <Spinner />
                                                ) : recentlySuccessful ? (
                                                    <MailCheck />
                                                ) : (
                                                    <RefreshCw />
                                                )}
                                                {processing
                                                    ? 'Sending…'
                                                    : recentlySuccessful
                                                      ? 'Invitation sent'
                                                      : 'Resend invitation'}
                                            </Button>
                                            <InputError
                                                message={errors.invitation}
                                            />
                                        </div>
                                    )}
                                </Form>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </section>
    );
}

function Field({
    label,
    name,
    type = 'text',
    error,
    placeholder,
}: {
    label: string;
    name: string;
    type?: string;
    error?: string;
    placeholder: string;
}) {
    return (
        <div className="grid gap-1.5">
            <Label htmlFor={name}>{label}</Label>
            <Input
                id={name}
                name={name}
                type={type}
                placeholder={placeholder}
            />
            <InputError message={error} />
        </div>
    );
}

SchoolAccess.layout = {
    breadcrumbs: [{ title: 'School access', href: schoolAccess() }],
};
