import { Form, Head } from '@inertiajs/react';
import { KeyRound, ShieldCheck, UserPlus, UsersRound } from 'lucide-react';
import {
    store,
    update,
} from '@/actions/App/Http/Controllers/Company/TeamMemberController';
import { DashboardHero, EmptyState } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

type Member = {
    id: number;
    name: string;
    email: string;
    role: 'company_admin' | 'company_staff';
    permissions: string[];
    active: boolean;
    lastSeenAt: string | null;
    createdAt: string | null;
};

type Props = {
    members: Member[];
    permissionOptions: Record<string, string>;
    presets: Record<string, string[]>;
};

export default function Team({ members, permissionOptions, presets }: Props) {
    return (
        <>
            <Head title="Company team" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Access control"
                    title="Company team"
                    description="Invite HR staff and reviewers with only the permissions required for their work. Company data remains isolated from every other tenant."
                />

                <section className="grid gap-5 xl:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.4fr)]">
                    <div className="rounded-3xl border border-primary/15 bg-card/85 p-5 shadow-sm">
                        <div className="mb-5 flex items-start gap-3">
                            <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                                <UserPlus className="size-5" />
                            </span>
                            <div>
                                <h2 className="font-semibold">
                                    Invite a team member
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    A secure account setup link is sent by
                                    email.
                                </p>
                            </div>
                        </div>
                        <Form
                            {...store.form()}
                            resetOnSuccess
                            className="grid gap-4"
                        >
                            {({ errors, processing }) => (
                                <>
                                    <Field
                                        label="Full name"
                                        name="name"
                                        error={errors.name}
                                    />
                                    <Field
                                        label="Work email"
                                        name="email"
                                        type="email"
                                        error={errors.email}
                                    />
                                    <div className="grid gap-2">
                                        <Label htmlFor="preset">
                                            Access preset
                                        </Label>
                                        <select
                                            id="preset"
                                            name="preset"
                                            defaultValue="hr_admin"
                                            className="h-11 rounded-xl border border-input bg-background px-3 text-sm"
                                        >
                                            <option value="hr_admin">
                                                HR administrator
                                            </option>
                                            <option value="attendance_reviewer">
                                                Attendance reviewer
                                            </option>
                                            <option value="document_reviewer">
                                                Document reviewer
                                            </option>
                                            <option value="auditor">
                                                Read-only auditor
                                            </option>
                                            <option value="custom">
                                                Custom permissions below
                                            </option>
                                        </select>
                                    </div>
                                    <PermissionChecklist
                                        options={permissionOptions}
                                        selected={presets.hr_admin ?? []}
                                    />
                                    <Button
                                        disabled={processing}
                                        className="w-full"
                                    >
                                        {processing ? (
                                            <Spinner />
                                        ) : (
                                            <UserPlus />
                                        )}{' '}
                                        Send invitation
                                    </Button>
                                </>
                            )}
                        </Form>
                    </div>

                    <div className="grid content-start gap-4">
                        {members.length === 0 ? (
                            <EmptyState
                                icon={UsersRound}
                                title="No team members"
                                description="Invite the first HR team member to share the workload securely."
                            />
                        ) : (
                            members.map((member) => (
                                <MemberCard
                                    key={member.id}
                                    member={member}
                                    options={permissionOptions}
                                />
                            ))
                        )}
                    </div>
                </section>
            </div>
        </>
    );
}

function MemberCard({
    member,
    options,
}: {
    member: Member;
    options: Record<string, string>;
}) {
    const isOwner = member.role === 'company_admin';

    return (
        <article className="rounded-3xl border border-primary/15 bg-card/85 p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                    <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                        <ShieldCheck className="size-5" />
                    </span>
                    <div>
                        <h2 className="font-semibold">{member.name}</h2>
                        <p className="text-sm text-muted-foreground">
                            {member.email}
                        </p>
                    </div>
                </div>
                <Badge variant={member.active ? 'secondary' : 'destructive'}>
                    {isOwner
                        ? 'Company owner'
                        : member.active
                          ? 'Active'
                          : 'Suspended'}
                </Badge>
            </div>
            {isOwner ? (
                <p className="mt-5 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
                    The company owner has full access and cannot be suspended
                    from this page.
                </p>
            ) : (
                <Form
                    {...update.form(member.id)}
                    options={{ preserveScroll: true }}
                    className="mt-5 grid gap-4"
                >
                    {({ processing, errors }) => (
                        <>
                            <input
                                type="hidden"
                                name="name"
                                value={member.name}
                            />
                            <PermissionChecklist
                                options={options}
                                selected={member.permissions}
                            />
                            <label className="flex items-center gap-3 rounded-xl border p-3 text-sm font-medium">
                                <input
                                    type="hidden"
                                    name="account_active"
                                    value="0"
                                />
                                <Checkbox
                                    name="account_active"
                                    value="1"
                                    defaultChecked={member.active}
                                />{' '}
                                Account is active
                            </label>
                            <InputError
                                message={
                                    errors.permissions ?? errors.account_active
                                }
                            />
                            <Button
                                variant="outline"
                                disabled={processing}
                                className="justify-self-start"
                            >
                                {processing ? <Spinner /> : <KeyRound />} Save
                                access
                            </Button>
                        </>
                    )}
                </Form>
            )}
        </article>
    );
}

function PermissionChecklist({
    options,
    selected,
}: {
    options: Record<string, string>;
    selected: string[];
}) {
    return (
        <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm font-semibold">
                Module permissions
            </legend>
            {Object.entries(options).map(([value, label]) => (
                <label
                    key={value}
                    className="flex items-center gap-3 rounded-xl border border-border/70 p-3 text-sm"
                >
                    <Checkbox
                        name="permissions[]"
                        value={value}
                        defaultChecked={selected.includes(value)}
                    />
                    {label}
                </label>
            ))}
        </fieldset>
    );
}

function Field({
    label,
    name,
    type = 'text',
    error,
}: {
    label: string;
    name: string;
    type?: string;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} type={type} required />
            <InputError message={error} />
        </div>
    );
}
