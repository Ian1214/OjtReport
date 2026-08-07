import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { index as reportsIndex } from '@/routes/reports';
import type { User } from '@/types';

type DtrReport = {
    id: number;
    report_date: string;
    time_in: string;
    time_out: string;
    total_hours: string;
    attendance_status: 'on_time' | 'late' | null;
    late_minutes: number | null;
};

type Props = {
    reports: DtrReport[];
    totalHours: number;
};

export default function Dtr({ reports, totalHours }: Props) {
    const { auth } = usePage<{ auth: { user: User } }>().props;

    return (
        <>
            <Head title="Daily Time Record" />

            <main className="min-h-svh bg-muted/30 p-4 sm:p-8 print:bg-white print:p-0">
                <div className="mx-auto max-w-5xl rounded-xl border bg-card p-6 text-card-foreground shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
                    <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center print:hidden">
                        <Button variant="outline" asChild>
                            <Link href={reportsIndex()}>
                                <ArrowLeft />
                                Back to reports
                            </Link>
                        </Button>
                        <Button type="button" onClick={() => window.print()}>
                            <Printer />
                            Print DTR
                        </Button>
                    </div>

                    <header className="border-b pb-6 text-center">
                        <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
                            OJT Daily Time Record
                        </p>
                        <h1 className="mt-2 text-2xl font-semibold">
                            Daily Time Record
                        </h1>
                    </header>

                    <section className="grid gap-3 py-6 text-sm sm:grid-cols-2">
                        <DtrDetail label="Name" value={auth.user.name} />
                        <DtrDetail
                            label="Student ID"
                            value={auth.user.student_id ?? 'Not assigned'}
                        />
                        <DtrDetail
                            label="OJT Position / Department"
                            value={`${auth.user.position} / ${auth.user.department}`}
                        />
                        <DtrDetail
                            label="Company"
                            value={auth.user.company ?? 'Not set'}
                        />
                    </section>

                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-sm">
                            <thead>
                                <tr className="border-y bg-muted/40">
                                    <th className="px-3 py-3 font-semibold">
                                        Date
                                    </th>
                                    <th className="px-3 py-3 font-semibold">
                                        Time In
                                    </th>
                                    <th className="px-3 py-3 font-semibold">
                                        Time Out
                                    </th>
                                    <th className="px-3 py-3 font-semibold">
                                        Arrival
                                    </th>
                                    <th className="px-3 py-3 text-right font-semibold">
                                        Total Hours
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {reports.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={5}
                                            className="px-3 py-10 text-center text-muted-foreground"
                                        >
                                            No daily reports have been
                                            submitted.
                                        </td>
                                    </tr>
                                ) : (
                                    reports.map((report) => (
                                        <tr
                                            key={report.id}
                                            className="border-b"
                                        >
                                            <td className="px-3 py-3">
                                                {formatDate(report.report_date)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {formatTime(report.time_in)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {formatTime(report.time_out)}
                                            </td>
                                            <td className="px-3 py-3">
                                                {report.attendance_status === 'late'
                                                    ? `Late (${report.late_minutes ?? 0} min)`
                                                    : report.attendance_status === 'on_time'
                                                      ? 'On time'
                                                      : '—'}
                                            </td>
                                            <td className="px-3 py-3 text-right">
                                                {report.total_hours}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                            <tfoot>
                                <tr className="border-t-2">
                                    <td
                                        colSpan={4}
                                        className="px-3 py-4 text-right font-semibold"
                                    >
                                        Total completed hours
                                    </td>
                                    <td className="px-3 py-4 text-right font-semibold">
                                        {Number(totalHours).toFixed(2)}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>

                    <div className="mt-16 grid gap-12 text-sm sm:grid-cols-2">
                        <SignatureLine
                            name={auth.user.name}
                            label="Student signature"
                        />
                        <SignatureLine
                            name={auth.user.supervisor_name ?? 'Not assigned'}
                            label="Supervisor signature"
                        />
                    </div>
                </div>
            </main>
        </>
    );
}

function DtrDetail({ label, value }: { label: string; value: string }) {
    return (
        <p>
            <span className="font-semibold">{label}: </span>
            {value}
        </p>
    );
}

function SignatureLine({ name, label }: { name: string; label: string }) {
    return (
        <div className="border-t pt-2 text-center">
            <p className="font-medium">{name}</p>
            <p className="mt-1 text-muted-foreground">{label}</p>
        </div>
    );
}

function formatDate(date: string): string {
    return new Intl.DateTimeFormat('en', {
        dateStyle: 'medium',
    }).format(new Date(`${date.slice(0, 10)}T00:00:00`));
}

function formatTime(time: string): string {
    const [hours = 0, minutes = 0] = time.split(':').map(Number);

    return new Intl.DateTimeFormat('en-PH', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    }).format(new Date(2000, 0, 1, hours, minutes));
}
