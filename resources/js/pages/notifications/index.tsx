import { Form, Head, Link } from '@inertiajs/react';
import { Bell, Check, CheckCheck, FileText } from 'lucide-react';
import {
    markAllRead,
    markRead,
} from '@/actions/App/Http/Controllers/NotificationController';
import { DashboardHero } from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { index as correctionsIndex } from '@/routes/attendance-corrections';
import { index as notificationsIndex } from '@/routes/notifications';
import { index as reportsIndex } from '@/routes/reports';

type NotificationData = {
    report_id?: number;
    report_date?: string;
    status?: 'approved' | 'rejected';
    reviewer_name?: string;
    rejection_reason?: string | null;
    correction_id?: number;
    title?: string;
    message?: string;
};

type NotificationItem = {
    id: string;
    data: NotificationData;
    readAt: string | null;
    createdAt: string;
};

type Props = {
    unreadCount: number;
    notifications: {
        data: NotificationItem[];
        current_page: number;
        last_page: number;
        total: number;
        prev_page_url: string | null;
        next_page_url: string | null;
    };
};

export default function NotificationIndex({
    notifications,
    unreadCount,
}: Props) {
    return (
        <>
            <Head title="Notifications" />

            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Activity center"
                    title="Notifications"
                    description="Stay updated when daily reports are approved or returned for correction."
                    actions={
                        unreadCount > 0 ? (
                            <Form {...markAllRead.form()}>
                                {({ processing }) => (
                                    <Button
                                        type="submit"
                                        variant="outline"
                                        disabled={processing}
                                    >
                                        {processing ? (
                                            <Spinner />
                                        ) : (
                                            <CheckCheck />
                                        )}
                                        Mark all as read
                                    </Button>
                                )}
                            </Form>
                        ) : undefined
                    }
                />

                <section className="grid gap-3">
                    {notifications.data.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
                                <Bell className="size-8 text-muted-foreground" />
                                <p className="font-medium">
                                    No notifications yet
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    Report review updates will appear here.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        notifications.data.map((notification) => (
                            <NotificationCard
                                key={notification.id}
                                notification={notification}
                            />
                        ))
                    )}
                </section>

                {(notifications.prev_page_url ||
                    notifications.next_page_url) && (
                    <div className="flex items-center justify-between gap-3">
                        <Button
                            variant="outline"
                            disabled={!notifications.prev_page_url}
                            asChild={Boolean(notifications.prev_page_url)}
                        >
                            {notifications.prev_page_url ? (
                                <Link href={notifications.prev_page_url}>
                                    Previous
                                </Link>
                            ) : (
                                <span>Previous</span>
                            )}
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            Page {notifications.current_page} of{' '}
                            {notifications.last_page}
                        </span>
                        <Button
                            variant="outline"
                            disabled={!notifications.next_page_url}
                            asChild={Boolean(notifications.next_page_url)}
                        >
                            {notifications.next_page_url ? (
                                <Link href={notifications.next_page_url}>
                                    Next
                                </Link>
                            ) : (
                                <span>Next</span>
                            )}
                        </Button>
                    </div>
                )}
            </div>
        </>
    );
}

function NotificationCard({
    notification,
}: {
    notification: NotificationItem;
}) {
    const isApproved = notification.data.status === 'approved';
    const isUnread = notification.readAt === null;
    const isCorrection = notification.data.correction_id !== undefined;

    return (
        <Card
            className={
                isUnread
                    ? 'rounded-2xl border-primary/30 bg-primary/4'
                    : 'rounded-2xl'
            }
        >
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex min-w-0 gap-3">
                    <div
                        className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
                            isApproved
                                ? 'bg-emerald-500/10 text-emerald-600'
                                : 'bg-amber-500/10 text-amber-600'
                        }`}
                    >
                        {isApproved ? <CheckCheck /> : <FileText />}
                    </div>
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <p className="font-semibold">
                                {notification.data.title ??
                                    `Report ${isApproved ? 'approved' : 'returned'}`}
                            </p>
                            {isUnread && <Badge>New</Badge>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                            {notification.data.message ?? (
                                <>
                                    Your report for{' '}
                                    {notification.data.report_date
                                        ? formatDate(
                                              notification.data.report_date,
                                          )
                                        : 'the selected date'}{' '}
                                    was {isApproved ? 'approved' : 'returned'}
                                    by{' '}
                                    {notification.data.reviewer_name ??
                                        'your company administrator'}
                                    .
                                </>
                            )}
                        </p>
                        {notification.data.rejection_reason && (
                            <p className="mt-2 rounded-lg border border-amber-500/25 bg-amber-500/5 p-3 text-sm">
                                <span className="font-medium">
                                    Correction needed:{' '}
                                </span>
                                {notification.data.rejection_reason}
                            </p>
                        )}
                        <p className="mt-2 text-xs text-muted-foreground">
                            {formatDateTime(notification.createdAt)}
                        </p>
                    </div>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                    <Button variant="outline" size="sm" asChild>
                        <Link
                            href={
                                isCorrection
                                    ? correctionsIndex()
                                    : reportsIndex()
                            }
                        >
                            {isCorrection ? 'Open corrections' : 'Open reports'}
                        </Link>
                    </Button>
                    {isUnread && (
                        <Form {...markRead.form(notification.id)}>
                            {({ processing }) => (
                                <Button
                                    type="submit"
                                    variant="ghost"
                                    size="sm"
                                    disabled={processing}
                                >
                                    {processing ? <Spinner /> : <Check />}
                                    Mark read
                                </Button>
                            )}
                        </Form>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-PH', { dateStyle: 'long' }).format(
        new Date(`${value.slice(0, 10)}T00:00:00`),
    );
}

function formatDateTime(value: string): string {
    return new Intl.DateTimeFormat('en-PH', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value));
}

NotificationIndex.layout = {
    breadcrumbs: [{ title: 'Notifications', href: notificationsIndex() }],
};
