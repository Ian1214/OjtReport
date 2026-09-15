import { Form, Head } from '@inertiajs/react';
import {
    BellRing,
    Building2,
    Clock3,
    FileBadge,
    GraduationCap,
    HardDrive,
    Save,
    ShieldCheck,
} from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { update } from '@/actions/App/Http/Controllers/Settings/OrganizationSettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit as organizationSettings } from '@/routes/organization-settings';

type SettingValue = boolean | number | string;

type Props = {
    organizationType: 'company' | 'school';
    organization: {
        name: string;
        legalName?: string | null;
        logoUrl: string | null;
        address: string | null;
        contactEmail: string | null;
        contactPhone: string | null;
        authorizedSignatoryName?: string | null;
        authorizedSignatoryTitle?: string | null;
        settings: Record<string, SettingValue>;
    };
};

export default function OrganizationSettings({
    organizationType,
    organization,
}: Props) {
    const isCompany = organizationType === 'company';
    const setting = (key: string) => organization.settings[key];

    return (
        <>
            <Head title={`${isCompany ? 'Company' : 'School'} settings`} />

            <Form
                {...update.form()}
                options={{ preserveScroll: true }}
                className="space-y-8"
            >
                {({ errors, processing, recentlySuccessful }) => (
                    <>
                        <SettingsSection
                            icon={isCompany ? Building2 : GraduationCap}
                            title={`${isCompany ? 'Company' : 'School'} identity`}
                            description="Official details used across records, invitations, and printable documents."
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <Field
                                    label="Display name"
                                    name="name"
                                    defaultValue={organization.name}
                                    error={errors.name}
                                />
                                {isCompany && (
                                    <Field
                                        label="Legal name"
                                        name="legal_name"
                                        defaultValue={
                                            organization.legalName ?? ''
                                        }
                                        error={errors.legal_name}
                                    />
                                )}
                                <Field
                                    label="Contact email"
                                    name="contact_email"
                                    type="email"
                                    defaultValue={
                                        organization.contactEmail ?? ''
                                    }
                                    error={errors.contact_email}
                                />
                                <Field
                                    label="Contact phone"
                                    name="contact_phone"
                                    defaultValue={
                                        organization.contactPhone ?? ''
                                    }
                                    error={errors.contact_phone}
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="address">Office address</Label>
                                <textarea
                                    id="address"
                                    name="address"
                                    defaultValue={organization.address ?? ''}
                                    rows={3}
                                    className="min-h-24 rounded-md border border-input bg-background px-3 py-2 text-sm"
                                />
                                <InputError message={errors.address} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="logo">Organization logo</Label>
                                <div className="flex flex-col gap-3 rounded-2xl border border-border/75 bg-background/40 p-4 sm:flex-row sm:items-center">
                                    {organization.logoUrl ? (
                                        <img
                                            src={organization.logoUrl}
                                            alt="Current organization logo"
                                            className="size-16 rounded-xl border object-contain p-1"
                                        />
                                    ) : (
                                        <div className="grid size-16 place-items-center rounded-xl border bg-muted text-muted-foreground">
                                            <Building2 />
                                        </div>
                                    )}
                                    <Input
                                        id="logo"
                                        name="logo"
                                        type="file"
                                        accept="image/png,image/jpeg,image/webp"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    PNG, JPG, or WebP up to 2 MB.
                                </p>
                                <InputError message={errors.logo} />
                            </div>
                            {isCompany && (
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field
                                        label="Authorized signatory"
                                        name="authorized_signatory_name"
                                        defaultValue={
                                            organization.authorizedSignatoryName ??
                                            ''
                                        }
                                        error={errors.authorized_signatory_name}
                                    />
                                    <Field
                                        label="Signatory title"
                                        name="authorized_signatory_title"
                                        defaultValue={
                                            organization.authorizedSignatoryTitle ??
                                            ''
                                        }
                                        error={
                                            errors.authorized_signatory_title
                                        }
                                    />
                                </div>
                            )}
                        </SettingsSection>

                        {isCompany ? (
                            <>
                                <SettingsSection
                                    icon={Clock3}
                                    title="Attendance safeguards"
                                    description="Set boundaries and break rules applied to attendance records."
                                >
                                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                        <Field
                                            label="Break starts"
                                            name="break_start_time"
                                            type="time"
                                            defaultValue={String(
                                                setting('break_start_time'),
                                            )}
                                            error={errors.break_start_time}
                                        />
                                        <Field
                                            label="Break ends"
                                            name="break_end_time"
                                            type="time"
                                            defaultValue={String(
                                                setting('break_end_time'),
                                            )}
                                            error={errors.break_end_time}
                                        />
                                        <Field
                                            label="Break deduction (minutes)"
                                            name="break_minutes"
                                            type="number"
                                            defaultValue={String(
                                                setting('break_minutes'),
                                            )}
                                            error={errors.break_minutes}
                                        />
                                        <Field
                                            label="Earliest time in"
                                            name="earliest_time_in"
                                            type="time"
                                            defaultValue={String(
                                                setting('earliest_time_in'),
                                            )}
                                            error={errors.earliest_time_in}
                                        />
                                        <Field
                                            label="Latest time out"
                                            name="latest_time_out"
                                            type="time"
                                            defaultValue={String(
                                                setting('latest_time_out'),
                                            )}
                                            error={errors.latest_time_out}
                                        />
                                    </div>
                                    <Toggle
                                        name="overtime_requires_approval"
                                        title="Require overtime approval"
                                        defaultChecked={Boolean(
                                            setting(
                                                'overtime_requires_approval',
                                            ),
                                        )}
                                    />
                                    <Toggle
                                        name="holiday_attendance_allowed"
                                        title="Allow attendance on company holidays"
                                        defaultChecked={Boolean(
                                            setting(
                                                'holiday_attendance_allowed',
                                            ),
                                        )}
                                    />
                                </SettingsSection>

                                <SettingsSection
                                    icon={BellRing}
                                    title="Notification routing"
                                    description="Control company-wide delivery windows and escalations."
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Digest delivery time"
                                            name="digest_time"
                                            type="time"
                                            defaultValue={String(
                                                setting('digest_time'),
                                            )}
                                            error={errors.digest_time}
                                        />
                                        <Field
                                            label="Escalation recipient"
                                            name="escalation_email"
                                            type="email"
                                            defaultValue={String(
                                                setting('escalation_email'),
                                            )}
                                            error={errors.escalation_email}
                                        />
                                        <Field
                                            label="Quiet hours start"
                                            name="quiet_hours_start"
                                            type="time"
                                            defaultValue={String(
                                                setting('quiet_hours_start'),
                                            )}
                                            error={errors.quiet_hours_start}
                                        />
                                        <Field
                                            label="Quiet hours end"
                                            name="quiet_hours_end"
                                            type="time"
                                            defaultValue={String(
                                                setting('quiet_hours_end'),
                                            )}
                                            error={errors.quiet_hours_end}
                                        />
                                    </div>
                                    <Toggle
                                        name="email_notifications"
                                        title="Enable company workflow emails"
                                        defaultChecked={Boolean(
                                            setting('email_notifications'),
                                        )}
                                    />
                                </SettingsSection>

                                <SettingsSection
                                    icon={HardDrive}
                                    title="Privacy and retention"
                                    description="Define how long operational evidence remains available before scheduled cleanup."
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Message retention (days)"
                                            name="message_retention_days"
                                            type="number"
                                            defaultValue={String(
                                                setting(
                                                    'message_retention_days',
                                                ),
                                            )}
                                            error={
                                                errors.message_retention_days
                                            }
                                        />
                                        <Field
                                            label="Location retention (days)"
                                            name="location_retention_days"
                                            type="number"
                                            defaultValue={String(
                                                setting(
                                                    'location_retention_days',
                                                ),
                                            )}
                                            error={
                                                errors.location_retention_days
                                            }
                                        />
                                        <Field
                                            label="Audit retention (days)"
                                            name="audit_retention_days"
                                            type="number"
                                            defaultValue={String(
                                                setting('audit_retention_days'),
                                            )}
                                            error={errors.audit_retention_days}
                                        />
                                        <Field
                                            label="Archive recovery window (days)"
                                            name="archive_grace_days"
                                            type="number"
                                            defaultValue={String(
                                                setting('archive_grace_days'),
                                            )}
                                            error={errors.archive_grace_days}
                                        />
                                    </div>
                                </SettingsSection>

                                <SettingsSection
                                    icon={FileBadge}
                                    title="Templates and OJT defaults"
                                    description="Pre-fill common account and verified-document values."
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Default required hours"
                                            name="default_required_hours"
                                            type="number"
                                            defaultValue={String(
                                                setting(
                                                    'default_required_hours',
                                                ),
                                            )}
                                            error={
                                                errors.default_required_hours
                                            }
                                        />
                                        <Field
                                            label="Default year level"
                                            name="default_year_level"
                                            type="number"
                                            defaultValue={String(
                                                setting('default_year_level'),
                                            )}
                                            error={errors.default_year_level}
                                        />
                                        <Field
                                            label="Default program"
                                            name="default_program"
                                            defaultValue={String(
                                                setting('default_program'),
                                            )}
                                            error={errors.default_program}
                                        />
                                        <Field
                                            label="Certificate number prefix"
                                            name="certificate_number_prefix"
                                            defaultValue={String(
                                                setting(
                                                    'certificate_number_prefix',
                                                ),
                                            )}
                                            error={
                                                errors.certificate_number_prefix
                                            }
                                        />
                                    </div>
                                    <p className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3 text-sm text-muted-foreground">
                                        Electronic signatures remain required
                                        for finalized DTRs and completion
                                        certificates.
                                    </p>
                                </SettingsSection>

                                <SettingsSection
                                    icon={ShieldCheck}
                                    title="Workspace security"
                                    description="Set tenant-level session, staff-domain, and MFA controls. Invitation validity is managed by the platform administrator."
                                >
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        <Field
                                            label="Session timeout (minutes)"
                                            name="session_timeout_minutes"
                                            type="number"
                                            defaultValue={String(
                                                setting(
                                                    'session_timeout_minutes',
                                                ),
                                            )}
                                            error={
                                                errors.session_timeout_minutes
                                            }
                                        />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="allowed_email_domains">
                                            Allowed staff email domains
                                        </Label>
                                        <Input
                                            id="allowed_email_domains"
                                            name="allowed_email_domains"
                                            defaultValue={String(
                                                setting(
                                                    'allowed_email_domains',
                                                ),
                                            )}
                                            placeholder="example.com, subsidiary.org"
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Leave blank to allow any valid email
                                            domain.
                                        </p>
                                        <InputError
                                            message={
                                                errors.allowed_email_domains
                                            }
                                        />
                                    </div>
                                    <Toggle
                                        name="require_admin_mfa"
                                        title="Require MFA for company administrators"
                                        defaultChecked={Boolean(
                                            setting('require_admin_mfa'),
                                        )}
                                    />
                                    <Toggle
                                        name="require_supervisor_mfa"
                                        title="Require MFA for supervisors"
                                        defaultChecked={Boolean(
                                            setting('require_supervisor_mfa'),
                                        )}
                                    />
                                </SettingsSection>
                            </>
                        ) : (
                            <SettingsSection
                                icon={BellRing}
                                title="School oversight defaults"
                                description="Configure coordinator alerts and reusable academic requirements."
                            >
                                <div className="grid gap-4 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="digest_frequency">
                                            Digest frequency
                                        </Label>
                                        <select
                                            id="digest_frequency"
                                            name="digest_frequency"
                                            defaultValue={String(
                                                setting('digest_frequency'),
                                            )}
                                            className="h-10 rounded-md border bg-background px-3 text-sm"
                                        >
                                            <option value="disabled">
                                                Disabled
                                            </option>
                                            <option value="daily">Daily</option>
                                            <option value="weekly">
                                                Weekly
                                            </option>
                                        </select>
                                    </div>
                                    <Field
                                        label="Evaluation template name"
                                        name="evaluation_template_name"
                                        defaultValue={String(
                                            setting('evaluation_template_name'),
                                        )}
                                        error={errors.evaluation_template_name}
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label htmlFor="required_document_labels">
                                        Required document labels
                                    </Label>
                                    <textarea
                                        id="required_document_labels"
                                        name="required_document_labels"
                                        defaultValue={String(
                                            setting('required_document_labels'),
                                        )}
                                        rows={4}
                                        className="rounded-md border bg-background px-3 py-2 text-sm"
                                        placeholder="MOA, Endorsement letter, Final evaluation"
                                    />
                                </div>
                                <Toggle
                                    name="email_progress_alerts"
                                    title="Email student progress alerts"
                                    defaultChecked={Boolean(
                                        setting('email_progress_alerts'),
                                    )}
                                />
                                <Toggle
                                    name="email_completion_alerts"
                                    title="Email completion and certificate alerts"
                                    defaultChecked={Boolean(
                                        setting('email_completion_alerts'),
                                    )}
                                />
                            </SettingsSection>
                        )}

                        <div className="sticky bottom-3 flex items-center justify-end gap-3 rounded-2xl border bg-card/95 p-3 shadow-lg backdrop-blur">
                            {recentlySuccessful && (
                                <span className="text-sm font-medium text-emerald-500">
                                    Settings saved
                                </span>
                            )}
                            <Button type="submit" disabled={processing}>
                                <Save />
                                {processing ? 'Saving…' : 'Save settings'}
                            </Button>
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

function SettingsSection({
    icon: Icon,
    title,
    description,
    children,
}: PropsWithChildren<{
    icon: typeof Building2;
    title: string;
    description: string;
}>) {
    return (
        <section className="space-y-5 border-b border-border/70 pb-8 last:border-0">
            <div className="flex gap-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/20 bg-primary/8 text-primary">
                    <Icon className="size-5" />
                </div>
                <Heading
                    variant="small"
                    title={title}
                    description={description}
                />
            </div>
            {children}
        </section>
    );
}

function Field({
    label,
    name,
    type = 'text',
    defaultValue,
    error,
}: {
    label: string;
    name: string;
    type?: string;
    defaultValue: string;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={name}>{label}</Label>
            <Input
                id={name}
                name={name}
                type={type}
                defaultValue={defaultValue}
            />
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
            className="flex cursor-pointer items-center justify-between gap-4 rounded-xl border bg-background/45 p-4"
        >
            <span className="text-sm font-medium">{title}</span>
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

OrganizationSettings.layout = {
    breadcrumbs: [
        { title: 'Settings', href: organizationSettings() },
        { title: 'Organization', href: organizationSettings() },
    ],
};
