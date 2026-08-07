import { usePasskeyRegister } from '@laravel/passkeys/react';
import { ExternalLink, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { edit as securitySettings } from '@/routes/security';

type Props = {
    onSuccess: () => void;
    passkeyOrigin?: string;
    passkeyRelyingPartyId?: string;
};

export default function PasskeyRegistration({
    onSuccess,
    passkeyOrigin,
    passkeyRelyingPartyId,
}: Props) {
    const [name, setName] = useState(() => {
        const ua = navigator.userAgent;

        const browser = [
            { pattern: /Edg|Edge/, name: 'Edge' },
            { pattern: /OPR|Opera|OPiOS/, name: 'Opera' },
            { pattern: /Firefox|FxiOS/, name: 'Firefox' },
            { pattern: /Chrome|CriOS/, name: 'Chrome' },
            { pattern: /Safari/, name: 'Safari' },
        ].find(({ pattern }) => pattern.test(ua))?.name;

        const os = [
            { pattern: /iPhone/, name: 'iPhone' },
            { pattern: /iPad|Macintosh(?=.*Mobile)/, name: 'iPad' },
            { pattern: /Android/, name: 'Android' },
            { pattern: /Mac/, name: 'Mac' },
            { pattern: /Windows/, name: 'Windows' },
        ].find(({ pattern }) => pattern.test(ua))?.name;

        return [browser, os].filter(Boolean).join(' on ') || '';
    });

    const [showForm, setShowForm] = useState(false);
    const { register, isLoading, error, isSupported } = usePasskeyRegister({
        onSuccess: () => {
            setName('');
            setShowForm(false);
            onSuccess();
        },
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim()) {
            return;
        }

        await register(name);
    };

    const handleCancel = () => {
        setShowForm(false);
        setName('');
    };

    const currentOrigin = window.location.origin;
    const currentHostname = window.location.hostname;
    const hasOriginMismatch = Boolean(
        passkeyOrigin && currentOrigin !== passkeyOrigin,
    );
    const hasRelyingPartyMismatch = Boolean(
        passkeyRelyingPartyId &&
        currentHostname !== passkeyRelyingPartyId &&
        !currentHostname.endsWith(`.${passkeyRelyingPartyId}`),
    );
    const isEmbeddedBrowser = /FB_IAB|Instagram|; wv\)/i.test(
        navigator.userAgent,
    );
    const configuredSecurityUrl = passkeyOrigin
        ? new URL(securitySettings.url(), passkeyOrigin).toString()
        : null;
    const normalizedError = error?.toLowerCase() ?? '';
    const displayError =
        normalizedError.includes('cancel') ||
        normalizedError.includes('notallowederror')
            ? 'The phone cancelled or blocked the passkey prompt. Open this page in Chrome or Safari, make sure screen lock is enabled, and keep the prompt open until it completes.'
            : error;

    if (hasOriginMismatch || hasRelyingPartyMismatch) {
        return (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 size-5 shrink-0" />
                    <div className="space-y-2">
                        <p className="font-medium">
                            Open the configured address to use passkeys
                        </p>
                        <p className="text-amber-700 dark:text-amber-300">
                            This page is open at {currentOrigin}, but passkeys
                            are configured for {passkeyOrigin}. WebAuthn blocks
                            registration when these addresses differ.
                        </p>
                        {configuredSecurityUrl && (
                            <a
                                href={configuredSecurityUrl}
                                className="inline-flex max-w-full items-center gap-2 font-medium underline underline-offset-4"
                            >
                                <span className="break-all">
                                    Open the correct security page
                                </span>
                                <ExternalLink className="size-4 shrink-0" />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (isEmbeddedBrowser) {
        return (
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-800 dark:text-amber-200">
                <div className="flex items-start gap-3">
                    <TriangleAlert className="mt-0.5 size-5 shrink-0" />
                    <div className="space-y-1">
                        <p className="font-medium">
                            Open this page in Chrome or Safari
                        </p>
                        <p className="text-amber-700 dark:text-amber-300">
                            Passkey setup is not reliable inside Facebook,
                            Messenger, Instagram, or another in-app browser.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (!isSupported) {
        return (
            <div className="text-sm text-muted-foreground">
                Passkeys are not supported in this browser.
            </div>
        );
    }

    if (!showForm) {
        return (
            <Button variant="outline" onClick={() => setShowForm(true)}>
                Add passkey
            </Button>
        );
    }

    return (
        <form
            onSubmit={handleSubmit}
            className="space-y-4 rounded-lg border border-border bg-muted/50 p-4"
        >
            <div className="grid gap-2">
                <Label htmlFor="passkey-name">Passkey name</Label>
                <Input
                    id="passkey-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., MacBook Pro, iPhone"
                    className="mt-1 block w-full border-foreground/20"
                    autoFocus
                />
                <p className="text-xs text-muted-foreground">
                    A name helps you identify this passkey later.
                </p>
            </div>

            {displayError && <InputError message={displayError} />}

            <div className="flex gap-2">
                <Button type="submit" disabled={isLoading || !name.trim()}>
                    {isLoading ? 'Registering...' : 'Register passkey'}
                </Button>
                <Button type="button" variant="ghost" onClick={handleCancel}>
                    Cancel
                </Button>
            </div>
        </form>
    );
}
