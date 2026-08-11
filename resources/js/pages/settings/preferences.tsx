import { Form, Head } from '@inertiajs/react';
import {
    Accessibility,
    BellRing,
    CalendarDays,
    Clock3,
    LayoutPanelTop,
    ShieldCheck,
} from 'lucide-react';
import PreferenceController from '@/actions/App/Http/Controllers/Settings/PreferenceController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { edit as editPreferences } from '@/routes/preferences';
import type { UserPreferences } from '@/types';

type Props = {
    preferences: UserPreferences;
    timezone: string;
    options: {
        timezones: string[];
        dateFormats: Record<UserPreferences['date_format'], string>;
        densities: Record<UserPreferences['interface_density'], string>;
    };
};

export default function Preferences({ preferences, timezone, options }: Props) {
    return (
        <>
            <Head title="Workspace preferences" />

            <Form
                {...PreferenceController.update.form()}
                options={{ preserveScroll: true }}
                className="space-y-8"
            >
                {({ errors, processing, recentlySuccessful }) => (
                    <>
                        <section className="space-y-5">
                            <Heading
                                variant="small"
                                title="Regional display"
                                description="Choose how dates and local time appear in your workspace"
                            />

                            <div className="grid gap-4 sm:grid-cols-2">
                                <SelectField
                                    id="timezone"
                                    name="timezone"
                                    label="Timezone"
                                    icon={Clock3}
                                    defaultValue={timezone}
                                    options={Object.fromEntries(
                                        options.timezones.map((timezone) => [
                                            timezone,
                                            timezone.replace('_', ' '),
                                        ]),
                                    )}
                                    error={errors.timezone}
                                />
                                <SelectField
                                    id="date_format"
                                    name="date_format"
                                    label="Date format"
                                    icon={CalendarDays}
                                    defaultValue={preferences.date_format}
                                    options={options.dateFormats}
                                    error={errors.date_format}
                                />
                            </div>
                        </section>

                        <section className="space-y-4 border-t border-border/70 pt-8">
                            <Heading
                                variant="small"
                                title="Interface experience"
                                description="Tune the command center for comfort and accessibility"
                            />

                            <SelectField
                                id="interface_density"
                                name="interface_density"
                                label="Information density"
                                icon={LayoutPanelTop}
                                defaultValue={preferences.interface_density}
                                options={options.densities}
                                error={errors.interface_density}
                            />

                            <PreferenceToggle
                                name="reduce_motion"
                                icon={Accessibility}
                                title="Reduce interface motion"
                                description="Minimizes decorative animation and movement throughout the application."
                                defaultChecked={preferences.reduce_motion}
                            />
                            <PreferenceToggle
                                name="high_contrast"
                                icon={ShieldCheck}
                                title="Enhanced contrast"
                                description="Strengthens borders and secondary text for easier scanning."
                                defaultChecked={preferences.high_contrast}
                            />
                        </section>

                        <section className="space-y-4 border-t border-border/70 pt-8">
                            <Heading
                                variant="small"
                                title="Notification controls"
                                description="Choose which workflow updates appear in your notification center"
                            />

                            <PreferenceToggle
                                name="report_updates"
                                icon={BellRing}
                                title="Daily report decisions"
                                description="Receive an alert when a submitted report is approved or returned."
                                defaultChecked={preferences.report_updates}
                            />
                            <PreferenceToggle
                                name="attendance_updates"
                                icon={Clock3}
                                title="Time-correction updates"
                                description="Receive status changes for attendance correction requests."
                                defaultChecked={preferences.attendance_updates}
                            />

                            <div className="rounded-2xl border border-primary/15 bg-primary/6 p-4 text-sm leading-6 text-muted-foreground">
                                Security, password, and account-access notices
                                are always enabled so important protection
                                messages are never missed.
                            </div>
                        </section>

                        <div className="flex flex-wrap items-center gap-3 border-t border-border/70 pt-6">
                            <Button type="submit" disabled={processing}>
                                {processing
                                    ? 'Saving preferences…'
                                    : 'Save preferences'}
                            </Button>
                            {recentlySuccessful && (
                                <span className="text-sm font-medium text-emerald-500">
                                    Preferences synchronized
                                </span>
                            )}
                        </div>
                    </>
                )}
            </Form>
        </>
    );
}

function SelectField({
    id,
    name,
    label,
    icon: Icon,
    defaultValue,
    options,
    error,
}: {
    id: string;
    name: string;
    label: string;
    icon: typeof Clock3;
    defaultValue: string;
    options: Record<string, string>;
    error?: string;
}) {
    return (
        <div className="grid gap-2">
            <Label htmlFor={id} className="flex items-center gap-2">
                <Icon className="size-4 text-primary" />
                {label}
            </Label>
            <Select name={name} defaultValue={defaultValue}>
                <SelectTrigger id={id} className="w-full">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {Object.entries(options).map(([value, optionLabel]) => (
                        <SelectItem key={value} value={value}>
                            {optionLabel}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <InputError message={error} />
        </div>
    );
}

function PreferenceToggle({
    name,
    icon: Icon,
    title,
    description,
    defaultChecked,
}: {
    name: keyof Pick<
        UserPreferences,
        | 'reduce_motion'
        | 'high_contrast'
        | 'report_updates'
        | 'attendance_updates'
    >;
    icon: typeof Accessibility;
    title: string;
    description: string;
    defaultChecked: boolean;
}) {
    return (
        <label
            htmlFor={name}
            className="flex cursor-pointer items-start gap-4 rounded-2xl border border-border/75 bg-background/45 p-4 transition-colors hover:border-primary/25 hover:bg-primary/4"
        >
            <input type="hidden" name={name} value="0" />
            <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/8 text-primary">
                <Icon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-1 text-sm leading-5 text-muted-foreground">
                    {description}
                </p>
            </div>
            <Checkbox
                id={name}
                name={name}
                value="1"
                defaultChecked={defaultChecked}
                className="mt-1 size-5"
            />
        </label>
    );
}

Preferences.layout = {
    breadcrumbs: [
        { title: 'Settings', href: editPreferences() },
        { title: 'Preferences', href: editPreferences() },
    ],
};
