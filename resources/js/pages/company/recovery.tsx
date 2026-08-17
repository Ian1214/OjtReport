import { Form, Head } from '@inertiajs/react';
import { ArchiveRestore, FileArchive, RotateCcw, Trash2 } from 'lucide-react';
import {
    destroy,
    restore,
} from '@/actions/App/Http/Controllers/Company/RecoveryCenterController';
import { DashboardHero, EmptyState } from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';

type RecordItem = {
    id: number;
    type: 'report' | 'document' | 'evaluation' | 'dtr';
    label: string;
    reason: string | null;
    deletedAt: string | null;
};

export default function RecoveryCenter({ records }: { records: RecordItem[] }) {
    return (
        <>
            <Head title="Recovery center" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Protected record recovery"
                    title="Recovery center"
                    description="Restore recently removed reports, documents, evaluations, and DTR periods. Permanent deletion requires password confirmation and remains in the audit trail."
                />
                {records.length === 0 ? (
                    <EmptyState
                        icon={ArchiveRestore}
                        title="Recovery center is clear"
                        description="Deleted operational records will appear here instead of disappearing immediately."
                    />
                ) : (
                    <section className="grid gap-3">
                        {records.map((record) => (
                            <article
                                key={`${record.type}-${record.id}`}
                                className="grid gap-4 rounded-2xl border border-primary/15 bg-card/85 p-4 sm:grid-cols-[auto_1fr_auto] sm:items-center"
                            >
                                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                                    <FileArchive className="size-5" />
                                </span>
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <p className="font-semibold">
                                            {record.label}
                                        </p>
                                        <Badge
                                            variant="outline"
                                            className="capitalize"
                                        >
                                            {record.type}
                                        </Badge>
                                    </div>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {record.reason ??
                                            'No deletion reason supplied'}{' '}
                                        ·{' '}
                                        {record.deletedAt
                                            ? new Date(
                                                  record.deletedAt,
                                              ).toLocaleString()
                                            : 'Unknown time'}
                                    </p>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    <Form
                                        {...restore.form({
                                            recordType: record.type,
                                            recordId: record.id,
                                        })}
                                    >
                                        {({ processing }) => (
                                            <Button
                                                disabled={processing}
                                                variant="outline"
                                            >
                                                {processing ? (
                                                    <Spinner />
                                                ) : (
                                                    <RotateCcw />
                                                )}{' '}
                                                Restore
                                            </Button>
                                        )}
                                    </Form>
                                    <Form
                                        {...destroy.form({
                                            recordType: record.type,
                                            recordId: record.id,
                                        })}
                                    >
                                        {({ processing }) => (
                                            <Button
                                                disabled={processing}
                                                variant="outline"
                                                className="text-destructive"
                                            >
                                                {processing ? (
                                                    <Spinner />
                                                ) : (
                                                    <Trash2 />
                                                )}{' '}
                                                Delete forever
                                            </Button>
                                        )}
                                    </Form>
                                </div>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </>
    );
}
