import { Head, Link } from '@inertiajs/react';
import { ArrowRight, CheckCircle2, ListTodo } from 'lucide-react';
import { DashboardHero, EmptyState } from '@/components/dashboard-ui';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

type ActionItem = {
    title: string;
    count: number;
    href: string;
    priority: number;
};

export default function ActionCenter({ items }: { items: ActionItem[] }) {
    const pending = items.filter((item) => item.count > 0);

    return (
        <>
            <Head title="Action center" />
            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow="Priority workspace"
                    title="Action center"
                    description="One focused queue for decisions and records that need your attention, ordered by operational priority."
                />
                {pending.length === 0 ? (
                    <EmptyState
                        icon={CheckCircle2}
                        title="You are all caught up"
                        description="There are no outstanding actions assigned to your role."
                    />
                ) : (
                    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                        {pending.map((item) => (
                            <article
                                key={item.title}
                                className="flex min-h-48 flex-col rounded-3xl border border-primary/15 bg-card/85 p-5 shadow-sm"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <span className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
                                        <ListTodo className="size-5" />
                                    </span>
                                    <Badge>{item.count} pending</Badge>
                                </div>
                                <h2 className="mt-6 text-lg font-semibold">
                                    {item.title}
                                </h2>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Review and complete these items from their
                                    protected workflow.
                                </p>
                                <Button
                                    asChild
                                    variant="outline"
                                    className="mt-auto self-start"
                                >
                                    <Link href={item.href}>
                                        {'Open queue'} <ArrowRight />
                                    </Link>
                                </Button>
                            </article>
                        ))}
                    </section>
                )}
            </div>
        </>
    );
}
