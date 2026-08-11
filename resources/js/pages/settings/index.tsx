import { Head, Link, usePage } from '@inertiajs/react';
import {
    BellRing,
    CheckCircle2,
    ChevronRight,
    Fingerprint,
    KeyRound,
    MailCheck,
    Palette,
    ShieldCheck,
    UserRound,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { edit as editAppearance } from '@/routes/appearance';
import { edit as editPreferences } from '@/routes/preferences';
import { edit as editProfile } from '@/routes/profile';
import { edit as editSecurity } from '@/routes/security';
import { index as settingsIndex } from '@/routes/settings';
import type { Auth, UserPreferences } from '@/types';

type Props = {
    auth: Auth;
    security: {
        emailVerified: boolean;
        twoFactorEnabled: boolean;
        passkeyCount: number;
    };
    preferences: UserPreferences;
};

export default function SettingsIndex({ security, preferences }: Props) {
    const { auth } = usePage<Props>().props;
    const securityScore = [
        security.emailVerified,
        security.twoFactorEnabled || security.passkeyCount > 0,
    ].filter(Boolean).length;

    return (
        <>
            <Head title="Settings overview" />

            <div className="space-y-7">
                <div>
                    <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                        System profile
                    </p>
                    <h2 className="mt-2 text-xl font-semibold tracking-tight">
                        Your workspace at a glance
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Review the controls that protect your account and shape
                        your daily experience.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                    <StatusMetric
                        icon={MailCheck}
                        label="Email"
                        value={
                            security.emailVerified
                                ? 'Verified'
                                : 'Action needed'
                        }
                        healthy={security.emailVerified}
                    />
                    <StatusMetric
                        icon={KeyRound}
                        label="Extra security"
                        value={
                            security.twoFactorEnabled
                                ? '2FA active'
                                : security.passkeyCount > 0
                                  ? `${security.passkeyCount} passkey${security.passkeyCount === 1 ? '' : 's'}`
                                  : 'Not configured'
                        }
                        healthy={
                            security.twoFactorEnabled ||
                            security.passkeyCount > 0
                        }
                    />
                    <StatusMetric
                        icon={ShieldCheck}
                        label="Protection level"
                        value={securityScore === 2 ? 'Strong' : 'Standard'}
                        healthy={securityScore === 2}
                    />
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <SettingsCard
                        href={editProfile()}
                        icon={UserRound}
                        title="Profile identity"
                        description={`${auth.user.name} · ${auth.user.email}`}
                    />
                    <SettingsCard
                        href={editSecurity()}
                        icon={Fingerprint}
                        title="Security & access"
                        description="Password, authenticator, passkeys, and recovery"
                    />
                    <SettingsCard
                        href={editPreferences()}
                        icon={BellRing}
                        title="Alerts & preferences"
                        description={`${preferences.interface_density === 'compact' ? 'Compact' : 'Comfortable'} layout · ${auth.user.timezone}`}
                    />
                    <SettingsCard
                        href={editAppearance()}
                        icon={Palette}
                        title="Visual appearance"
                        description="Light, dark, or system-controlled theme"
                    />
                </div>

                <div className="flex items-start gap-3 rounded-2xl border border-primary/15 bg-primary/6 p-4">
                    <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" />
                    <div>
                        <p className="text-sm font-semibold">
                            Always protected
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted-foreground">
                            Password, account-creation, and other critical
                            security notices cannot be disabled.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}

function StatusMetric({
    icon: Icon,
    label,
    value,
    healthy,
}: {
    icon: LucideIcon;
    label: string;
    value: string;
    healthy: boolean;
}) {
    return (
        <Card className="gap-0 py-0">
            <CardContent className="flex items-center gap-3 p-4">
                <div
                    className={`grid size-10 shrink-0 place-items-center rounded-xl border ${healthy ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-500' : 'border-amber-500/20 bg-amber-500/10 text-amber-500'}`}
                >
                    <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className="truncate text-sm font-semibold">{value}</p>
                </div>
            </CardContent>
        </Card>
    );
}

function SettingsCard({
    href,
    icon: Icon,
    title,
    description,
}: {
    href: ReturnType<typeof editProfile>;
    icon: LucideIcon;
    title: string;
    description: string;
}) {
    return (
        <Link
            href={href}
            prefetch
            className="group block rounded-2xl outline-none"
        >
            <Card className="h-full gap-0 py-0 group-focus-visible:border-primary/60 group-focus-visible:ring-3 group-focus-visible:ring-primary/15">
                <CardContent className="flex h-full items-center gap-4 p-4 sm:p-5">
                    <div className="grid size-11 shrink-0 place-items-center rounded-xl border border-primary/15 bg-primary/8 text-primary transition-colors group-hover:bg-primary/14">
                        <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <h3 className="font-semibold">{title}</h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-5 text-muted-foreground">
                            {description}
                        </p>
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform motion-safe:group-hover:translate-x-0.5" />
                </CardContent>
            </Card>
        </Link>
    );
}

SettingsIndex.layout = {
    breadcrumbs: [{ title: 'Settings', href: settingsIndex() }],
};
