import { Form, Head } from '@inertiajs/react';
import { Building2, ShieldAlert, UsersRound } from 'lucide-react';
import { DashboardHero, StatusBadge } from '@/components/dashboard-ui';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { update } from '@/routes/platform/tenants';

type Company = {
    id: number;
    name: string;
    status: 'active' | 'suspended' | 'archived';
    reason: string | null;
    suspendedAt: string | null;
    users: number;
    activeUsers: number;
    ojts: number;
    createdAt: string | null;
};

type Props = {
    companies: { data: Company[] };
};

export default function PlatformTenants({ companies }: Props) {
    return (
        <>
            <Head title="Tenant controls" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Platform administration"
                    title="Company access controls"
                    description="Manage workspace availability using aggregate account information only. Private tenant records remain inaccessible."
                />
                <section className="grid gap-4 lg:grid-cols-2">
                    {companies.data.map((company) => (
                        <article
                            key={company.id}
                            className="rounded-3xl border border-primary/15 bg-card/90 p-5 shadow-sm"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="flex gap-3">
                                    <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                        <Building2 className="size-5" />
                                    </span>
                                    <div>
                                        <h2 className="font-semibold">
                                            {company.name}
                                        </h2>
                                        <p className="text-xs text-muted-foreground">
                                            Joined{' '}
                                            {company.createdAt
                                                ? new Date(
                                                      company.createdAt,
                                                  ).toLocaleDateString()
                                                : '—'}
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge
                                    status={
                                        company.status === 'active'
                                            ? 'online'
                                            : 'pending'
                                    }
                                    label={company.status}
                                />
                            </div>
                            <div className="mt-5 grid grid-cols-3 gap-2 rounded-2xl border bg-muted/20 p-3 text-center">
                                <div>
                                    <p className="text-lg font-semibold">
                                        {company.users}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Users
                                    </p>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">
                                        {company.activeUsers}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        Active
                                    </p>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">
                                        {company.ojts}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        OJTs
                                    </p>
                                </div>
                            </div>
                            {company.reason && (
                                <p className="mt-3 flex gap-2 rounded-xl bg-amber-500/10 p-3 text-sm text-amber-700 dark:text-amber-300">
                                    <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                                    {company.reason}
                                </p>
                            )}
                            <Form
                                {...update.form(company.id)}
                                className="mt-4 grid gap-3 sm:grid-cols-[170px_1fr_auto]"
                            >
                                {({ processing, errors }) => (
                                    <>
                                        <select
                                            name="status"
                                            defaultValue={company.status}
                                            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
                                        >
                                            <option value="active">
                                                Active
                                            </option>
                                            <option value="suspended">
                                                Suspended
                                            </option>
                                            <option value="archived">
                                                Archived
                                            </option>
                                        </select>
                                        <Input
                                            name="reason"
                                            defaultValue={company.reason ?? ''}
                                            placeholder="Reason required when restricted"
                                        />
                                        <Button disabled={processing}>
                                            {processing ? (
                                                <Spinner />
                                            ) : (
                                                <UsersRound />
                                            )}{' '}
                                            Save
                                        </Button>
                                        {(errors.status || errors.reason) && (
                                            <p className="text-sm text-destructive sm:col-span-3">
                                                {errors.status ?? errors.reason}
                                            </p>
                                        )}
                                    </>
                                )}
                            </Form>
                        </article>
                    ))}
                </section>
            </div>
        </>
    );
}
