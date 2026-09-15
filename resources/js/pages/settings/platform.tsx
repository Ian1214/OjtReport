import { Form, Head } from '@inertiajs/react';
import { Database, Save, ShieldCheck, UsersRound } from 'lucide-react';
import { update } from '@/actions/App/Http/Controllers/Settings/PlatformSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit as platformSettings } from '@/routes/platform-settings';

type Policy = {
    company_registration_enabled: boolean;
    default_storage_limit_mb: number;
    default_user_limit: number;
    invitation_expiry_days: number;
    backup_retention_days: number;
    health_alert_email: string;
    support_email: string;
    maintenance_contact: string;
    require_company_admin_mfa: boolean;
};

export default function PlatformSettings({ policy }: { policy: Policy }) {
    return (
        <>
            <Head title="Platform policy" />
            <Form
                {...update.form()}
                options={{ preserveScroll: true }}
                className="space-y-8"
            >
                {({ errors, processing, recentlySuccessful }) => (
                    <>
                        <section className="space-y-5">
                            <Heading
                                variant="small"
                                title="Tenant access"
                                description="Control public onboarding and safe defaults for every new company."
                            />
                            <Toggle
                                name="company_registration_enabled"
                                title="Allow public company registration"
                                defaultChecked={
                                    policy.company_registration_enabled
                                }
                            />
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Default user limit"
                                    name="default_user_limit"
                                    value={policy.default_user_limit}
                                    error={errors.default_user_limit}
                                />
                                <Field
                                    label="Default storage limit (MB)"
                                    name="default_storage_limit_mb"
                                    value={policy.default_storage_limit_mb}
                                    error={errors.default_storage_limit_mb}
                                />
                                <Field
                                    label="Invitation validity (days)"
                                    name="invitation_expiry_days"
                                    value={policy.invitation_expiry_days}
                                    error={errors.invitation_expiry_days}
                                />
                            </div>
                        </section>
                        <section className="space-y-5 border-t pt-8">
                            <div className="flex gap-3">
                                <Database className="size-5 text-primary" />
                                <Heading
                                    variant="small"
                                    title="Reliability defaults"
                                    description="Set retention and alert destinations for platform operations."
                                />
                            </div>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Backup retention (days)"
                                    name="backup_retention_days"
                                    value={policy.backup_retention_days}
                                    error={errors.backup_retention_days}
                                />
                                <TextField
                                    label="Health alert email"
                                    name="health_alert_email"
                                    value={policy.health_alert_email}
                                    error={errors.health_alert_email}
                                />
                                <TextField
                                    label="Support email"
                                    name="support_email"
                                    value={policy.support_email}
                                    error={errors.support_email}
                                />
                                <TextField
                                    label="Maintenance contact"
                                    name="maintenance_contact"
                                    value={policy.maintenance_contact}
                                    error={errors.maintenance_contact}
                                />
                            </div>
                        </section>
                        <section className="space-y-5 border-t pt-8">
                            <div className="flex gap-3">
                                <ShieldCheck className="size-5 text-primary" />
                                <Heading
                                    variant="small"
                                    title="Security baseline"
                                    description="Raise minimum protection for newly administered company workspaces."
                                />
                            </div>
                            <Toggle
                                name="require_company_admin_mfa"
                                title="Require MFA for company administrators"
                                defaultChecked={
                                    policy.require_company_admin_mfa
                                }
                            />
                        </section>
                        <div className="flex items-center justify-end gap-3 border-t pt-6">
                            {recentlySuccessful && (
                                <span className="text-sm text-emerald-500">
                                    Policy saved
                                </span>
                            )}
                            <Button type="submit" disabled={processing}>
                                <Save />
                                {processing
                                    ? 'Saving…'
                                    : 'Save platform policy'}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

function Field({
    label,
    name,
    value,
    error,
}: {
    label: string;
    name: string;
    value: number;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} type="number" defaultValue={value} />
            <InputError message={error} />
        </div>
    );
}
function TextField({
    label,
    name,
    value,
    error,
}: {
    label: string;
    name: string;
    value: string;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input id={name} name={name} defaultValue={value} />
            <InputError message={error} />
        </div>
    );
}
function Toggle({
    name,
    title,
    defaultChecked,
}: {
    name: string;
    title: string;
    defaultChecked: boolean;
}) {
    return (
        <label
            htmlFor={name}
            className="flex items-center justify-between gap-4 rounded-xl border bg-background/45 p-4"
        >
            <span className="flex items-center gap-2 text-sm font-medium">
                <UsersRound className="size-4 text-primary" />
                {title}
            </span>
            <span>
                <input type="hidden" name={name} value="0" />
                <Checkbox
                    id={name}
                    name={name}
                    value="1"
                    defaultChecked={defaultChecked}
                />
            </span>
        </label>
    );
}

PlatformSettings.layout = {
    breadcrumbs: [
        { title: 'Settings', href: platformSettings() },
        { title: 'Platform policy', href: platformSettings() },
    ],
};
