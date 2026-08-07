import { Form, Head, Link, usePage, usePoll } from '@inertiajs/react';
import {
    ArrowLeft,
    Check,
    CheckCheck,
    MessageCircle,
    Paperclip,
    Pencil,
    Send,
    Trash2,
    UserRound,
    X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
    destroy,
    store,
    update,
} from '@/actions/App/Http/Controllers/DirectMessageController';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
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
import { Spinner } from '@/components/ui/spinner';
import {
    index as messagesIndex,
    show as showMessages,
} from '@/routes/messages';
import type { User } from '@/types';

type Contact = {
    id: number;
    name: string;
    role: 'supervisor' | 'ojt';
    position: string | null;
    department: string | null;
    isOnline: boolean;
    lastSeenAt: string | null;
    unreadCount: number;
};

type Message = {
    id: number;
    body: string | null;
    imageUrl: string | null;
    isMine: boolean;
    canEdit: boolean;
    isRead: boolean;
    editedAt: string | null;
    sentAt: string | null;
};

type Props = {
    contacts: Contact[];
    participant: Contact | null;
    messages: Message[];
};

export default function Messages({ contacts, participant, messages }: Props) {
    const { auth } = usePage<{ auth: { user: User } }>().props;
    const bottomRef = useRef<HTMLDivElement>(null);
    const [editingMessageId, setEditingMessageId] = useState<number | null>(
        null,
    );

    usePoll(
        10_000,
        { only: ['messages', 'contacts', 'participant', 'navigation'] },
        { mode: 'rest' },
    );

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages.length, participant?.id]);

    return (
        <>
            <Head title="Messages" />
            <div className="flex min-h-0 flex-1 flex-col bg-muted/20 p-3 sm:p-4 md:p-6">
                <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 overflow-hidden rounded-3xl border bg-card/95 shadow-[0_24px_70px_-42px_rgb(0_0_0_/_0.75)]">
                    <aside
                        className={`${participant ? 'hidden md:flex' : 'flex'} w-full shrink-0 flex-col border-r md:w-80`}
                    >
                        <div className="border-b p-5">
                            <p className="text-xs font-semibold tracking-[0.16em] text-primary uppercase">
                                Private workspace
                            </p>
                            <h1 className="mt-1 text-2xl font-semibold">
                                Messages
                            </h1>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {auth.user.role === 'supervisor'
                                    ? 'Chat with your assigned OJTs.'
                                    : 'Chat directly with your supervisor.'}
                            </p>
                        </div>

                        <nav className="flex-1 space-y-2 overflow-y-auto p-3">
                            {contacts.length === 0 ? (
                                <div className="rounded-2xl border border-dashed p-6 text-center">
                                    <UserRound className="mx-auto size-7 text-muted-foreground" />
                                    <p className="mt-3 text-sm font-medium">
                                        No contact available
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        A company administrator must assign the
                                        supervisor first.
                                    </p>
                                </div>
                            ) : (
                                contacts.map((contact) => (
                                    <Link
                                        key={contact.id}
                                        href={showMessages(contact.id)}
                                        className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${participant?.id === contact.id ? 'border-primary/30 bg-primary/8' : 'border-transparent hover:border-border hover:bg-muted/50'}`}
                                    >
                                        <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                                            {initials(contact.name)}
                                            <span
                                                className={`absolute right-0 bottom-0 size-3 rounded-full border-2 border-card ${contact.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/45'}`}
                                                aria-label={
                                                    contact.isOnline
                                                        ? 'Online'
                                                        : 'Offline'
                                                }
                                            />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block truncate text-sm font-semibold">
                                                {contact.name}
                                            </span>
                                            <span className="block truncate text-xs text-muted-foreground">
                                                {presenceLabel(contact)} ·{' '}
                                                {contact.role === 'supervisor'
                                                    ? 'Supervisor'
                                                    : (contact.position ??
                                                      'OJT Intern')}
                                            </span>
                                        </span>
                                        {contact.unreadCount > 0 && (
                                            <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-bold text-primary-foreground">
                                                {contact.unreadCount > 99
                                                    ? '99+'
                                                    : contact.unreadCount}
                                            </span>
                                        )}
                                    </Link>
                                ))
                            )}
                        </nav>
                    </aside>

                    <main
                        className={`${participant ? 'flex' : 'hidden md:flex'} min-w-0 flex-1 flex-col`}
                    >
                        {participant === null ? (
                            <div className="grid flex-1 place-items-center p-8 text-center">
                                <div>
                                    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                                        <MessageCircle className="size-7" />
                                    </span>
                                    <h2 className="mt-4 text-lg font-semibold">
                                        Select a conversation
                                    </h2>
                                    <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                                        Choose an assigned OJT or supervisor to
                                        view your private conversation.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <header className="flex items-center gap-3 border-b p-3 sm:p-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        asChild
                                        className="md:hidden"
                                    >
                                        <Link
                                            href={messagesIndex()}
                                            aria-label="Back to conversations"
                                        >
                                            <ArrowLeft />
                                        </Link>
                                    </Button>
                                    <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 font-semibold text-primary">
                                        {initials(participant.name)}
                                        <span
                                            className={`absolute right-0 bottom-0 size-3 rounded-full border-2 border-card ${participant.isOnline ? 'bg-emerald-500' : 'bg-muted-foreground/45'}`}
                                        />
                                    </span>
                                    <div className="min-w-0">
                                        <h2 className="truncate font-semibold">
                                            {participant.name}
                                        </h2>
                                        <p className="truncate text-xs text-muted-foreground">
                                            {presenceLabel(participant)} ·{' '}
                                            {participant.role === 'supervisor'
                                                ? 'Assigned supervisor'
                                                : `${participant.position ?? 'OJT Intern'}${participant.department ? ` · ${participant.department}` : ''}`}
                                        </p>
                                    </div>
                                </header>

                                <div className="flex min-h-72 flex-1 flex-col gap-3 overflow-y-auto bg-[radial-gradient(circle_at_top,color-mix(in_oklab,var(--primary)_5%,transparent),transparent_36%)] p-4 sm:p-6">
                                    {messages.length === 0 ? (
                                        <div className="m-auto max-w-sm text-center text-sm text-muted-foreground">
                                            No messages yet. Start the
                                            conversation about tasks, schedules,
                                            or OJT concerns.
                                        </div>
                                    ) : (
                                        messages.map((message) => (
                                            <article
                                                key={message.id}
                                                className={`group max-w-[88%] rounded-2xl px-3 py-3 text-sm shadow-sm sm:max-w-[75%] sm:px-4 ${message.isMine ? 'ml-auto rounded-br-md bg-primary text-primary-foreground' : 'mr-auto rounded-bl-md border bg-background'}`}
                                            >
                                                {message.imageUrl && (
                                                    <a
                                                        href={message.imageUrl}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="mb-2 block overflow-hidden rounded-xl bg-black/10"
                                                    >
                                                        <img
                                                            src={
                                                                message.imageUrl
                                                            }
                                                            alt="Shared chat attachment"
                                                            loading="lazy"
                                                            className="max-h-80 w-full object-contain"
                                                        />
                                                    </a>
                                                )}

                                                {editingMessageId ===
                                                message.id ? (
                                                    <Form
                                                        {...update.form(
                                                            message.id,
                                                        )}
                                                        onSuccess={() =>
                                                            setEditingMessageId(
                                                                null,
                                                            )
                                                        }
                                                        className="grid gap-2"
                                                    >
                                                        {({
                                                            errors,
                                                            processing,
                                                        }) => (
                                                            <>
                                                                <textarea
                                                                    name="body"
                                                                    maxLength={
                                                                        4000
                                                                    }
                                                                    rows={3}
                                                                    defaultValue={
                                                                        message.body ??
                                                                        ''
                                                                    }
                                                                    autoFocus
                                                                    className="min-h-20 rounded-lg border border-primary-foreground/30 bg-background px-3 py-2 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
                                                                />
                                                                <InputError
                                                                    message={
                                                                        errors.body
                                                                    }
                                                                />
                                                                <div className="flex justify-end gap-2">
                                                                    <Button
                                                                        type="button"
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        onClick={() =>
                                                                            setEditingMessageId(
                                                                                null,
                                                                            )
                                                                        }
                                                                    >
                                                                        <X />
                                                                        Cancel
                                                                    </Button>
                                                                    <Button
                                                                        type="submit"
                                                                        size="sm"
                                                                        disabled={
                                                                            processing
                                                                        }
                                                                    >
                                                                        {processing && (
                                                                            <Spinner />
                                                                        )}
                                                                        Save
                                                                    </Button>
                                                                </div>
                                                            </>
                                                        )}
                                                    </Form>
                                                ) : (
                                                    message.body && (
                                                        <p className="break-words whitespace-pre-wrap">
                                                            {message.body}
                                                        </p>
                                                    )
                                                )}

                                                {editingMessageId !==
                                                    message.id && (
                                                    <div className="mt-1.5 flex items-center justify-end gap-1">
                                                        <time
                                                            className={`text-[11px] ${message.isMine ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}
                                                        >
                                                            {formatTime(
                                                                message.sentAt,
                                                            )}
                                                            {message.editedAt &&
                                                                ' · edited'}
                                                        </time>
                                                        {message.isMine &&
                                                            (message.isRead ? (
                                                                <CheckCheck
                                                                    className="size-3.5 text-sky-200"
                                                                    aria-label="Read"
                                                                />
                                                            ) : (
                                                                <Check
                                                                    className="size-3.5"
                                                                    aria-label="Sent"
                                                                />
                                                            ))}
                                                        {message.isMine && (
                                                            <>
                                                                {message.canEdit && (
                                                                    <Button
                                                                        type="button"
                                                                        size="icon"
                                                                        variant="ghost"
                                                                        className="size-7 text-current opacity-80 hover:bg-white/10 hover:text-current"
                                                                        aria-label="Edit message"
                                                                        onClick={() =>
                                                                            setEditingMessageId(
                                                                                message.id,
                                                                            )
                                                                        }
                                                                    >
                                                                        <Pencil className="size-3.5" />
                                                                    </Button>
                                                                )}
                                                                <DeleteMessageDialog
                                                                    message={
                                                                        message
                                                                    }
                                                                />
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </article>
                                        ))
                                    )}
                                    <div ref={bottomRef} />
                                </div>

                                <Form
                                    {...store.form(participant.id)}
                                    resetOnSuccess
                                    className="border-t bg-background/90 p-3 sm:p-4"
                                >
                                    {({ errors, processing, progress }) => (
                                        <>
                                            <div className="flex items-end gap-2">
                                                <label className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl border border-input bg-background text-muted-foreground transition-colors hover:border-primary/30 hover:text-primary">
                                                    <Paperclip className="size-4" />
                                                    <span className="sr-only">
                                                        Attach an image
                                                    </span>
                                                    <input
                                                        type="file"
                                                        name="image"
                                                        accept="image/jpeg,image/png,image/gif,image/webp,image/bmp"
                                                        className="sr-only"
                                                    />
                                                </label>
                                                <textarea
                                                    name="body"
                                                    maxLength={4000}
                                                    rows={2}
                                                    aria-label="Message"
                                                    placeholder={`Message ${participant.name}`}
                                                    className="max-h-36 min-h-11 flex-1 resize-y rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                                                />
                                                <Button
                                                    type="submit"
                                                    size="icon"
                                                    disabled={processing}
                                                    aria-label="Send message"
                                                >
                                                    {processing ? (
                                                        <Spinner />
                                                    ) : (
                                                        <Send />
                                                    )}
                                                </Button>
                                            </div>
                                            <InputError
                                                message={errors.body}
                                                className="mt-2"
                                            />
                                            <InputError
                                                message={errors.image}
                                                className="mt-2"
                                            />
                                            {progress && (
                                                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                                                    <div
                                                        className="h-full rounded-full bg-primary transition-all"
                                                        style={{
                                                            width: `${progress.percentage}%`,
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        </>
                                    )}
                                </Form>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}

function DeleteMessageDialog({ message }: { message: Message }) {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="size-7 text-current opacity-80 hover:bg-white/10 hover:text-current"
                    aria-label="Delete message"
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </DialogTrigger>
            <DialogContent className="overflow-hidden p-0 sm:max-w-md">
                <DialogHeader className="gap-3 p-6 pb-0 text-left">
                    <span className="grid size-11 place-items-center rounded-2xl border border-destructive/20 bg-destructive/10 text-destructive shadow-sm">
                        <Trash2 className="size-5" aria-hidden="true" />
                    </span>
                    <div className="grid gap-2">
                        <DialogTitle>Delete this message?</DialogTitle>
                        <DialogDescription>
                            This action cannot be undone. The message
                            {message.imageUrl
                                ? ' and its attached image'
                                : ''}{' '}
                            will be permanently removed.
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="mx-6 rounded-xl border bg-muted/35 p-3">
                    <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                        Message preview
                    </p>
                    <p className="mt-1.5 line-clamp-3 text-sm break-words text-foreground">
                        {message.body ?? 'Image attachment'}
                    </p>
                </div>

                <Form
                    {...destroy.form(message.id)}
                    onSuccess={() => setOpen(false)}
                >
                    {({ processing }) => (
                        <DialogFooter className="border-t bg-muted/25 p-4 sm:px-6">
                            <DialogClose asChild>
                                <Button
                                    type="button"
                                    variant="secondary"
                                    disabled={processing}
                                >
                                    Cancel
                                </Button>
                            </DialogClose>
                            <Button
                                type="submit"
                                variant="destructive"
                                disabled={processing}
                            >
                                {processing ? <Spinner /> : <Trash2 />}
                                {processing ? 'Deleting…' : 'Delete message'}
                            </Button>
                        </DialogFooter>
                    )}
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function initials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join('')
        .toUpperCase();
}

function presenceLabel(contact: Contact): string {
    if (contact.isOnline) {
        return 'Online';
    }

    if (contact.lastSeenAt === null) {
        return 'Offline';
    }

    const elapsedMinutes = Math.max(
        1,
        Math.floor(
            (Date.now() - new Date(contact.lastSeenAt).getTime()) / 60_000,
        ),
    );

    if (elapsedMinutes < 60) {
        return `Active ${elapsedMinutes}m ago`;
    }

    const elapsedHours = Math.floor(elapsedMinutes / 60);

    if (elapsedHours < 24) {
        return `Active ${elapsedHours}h ago`;
    }

    return 'Offline';
}

function formatTime(value: string | null): string {
    if (value === null) {
        return '';
    }

    return new Intl.DateTimeFormat('en', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(value));
}

Messages.layout = {
    breadcrumbs: [{ title: 'Messages', href: messagesIndex() }],
};
