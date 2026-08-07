import { Form, Head, Link } from '@inertiajs/react';
import { Clock8, ExternalLink, Scale, ShieldCheck } from 'lucide-react';
import { update } from '@/actions/App/Http/Controllers/Company/AttendancePolicyController';
import { DashboardHero } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { terms } from '@/routes';
import { edit as attendancePolicy } from '@/routes/company/attendance-policy';

type Props = {
    company: {
        name: string;
        workStartTime: string;
        lateGraceMinutes: number;
    };
};

export default function AttendancePolicy({ company }: Props) {
    return (
        <>
            <Head title="Attendance policy" />

            <div className="flex flex-1 flex-col gap-6 bg-muted/20 p-4 md:p-6">
                <DashboardHero
                    eyebrow={`${company.name} · Company rules`}
                    title="Attendance policy"
                    description="Set the official daily arrival time. Every new time-in is classified and saved as On time or Late for a clear audit trail."
                />

                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(20rem,.75fr)]">
                    <section className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                        <div className="flex items-start gap-3 border-b pb-5">
                            <div className="rounded-xl bg-primary/10 p-2.5 text-primary">
                                <Clock8 className="size-5" />
                            </div>
                            <div>
                                <h2 className="font-semibold">Official time in</h2>
                                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                                    The server records attendance in Philippine time. A grace period keeps arrivals within the allowed window marked On time.
                                </p>
                            </div>
                        </div>

                        <Form {...update.form()} className="mt-6 grid gap-5">
                            {({ errors, processing, recentlySuccessful }) => (
                                <>
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div className="grid gap-2">
                                            <Label htmlFor="work_start_time">Required arrival time</Label>
                                            <Input id="work_start_time" name="work_start_time" type="time" required defaultValue={company.workStartTime} />
                                            <InputError message={errors.work_start_time} />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="late_grace_minutes">Grace period (minutes)</Label>
                                            <Input id="late_grace_minutes" name="late_grace_minutes" type="number" min="0" max="120" required defaultValue={company.lateGraceMinutes} />
                                            <InputError message={errors.late_grace_minutes} />
                                        </div>
                                    </div>
                                    <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm leading-6 text-muted-foreground">
                                        Example: with an 8:00 AM start and 10-minute grace period, 8:10 AM is On time and 8:11 AM is Late. Existing records keep their original schedule snapshot.
                                    </div>
                                    <div className="flex flex-wrap items-center gap-3">
                                        <Button type="submit" disabled={processing}>
                                            {processing ? <Spinner /> : <ShieldCheck />}
                                            Save attendance policy
                                        </Button>
                                        {recentlySuccessful && <span className="text-sm font-medium text-emerald-600 dark:text-emerald-400">Policy saved</span>}
                                    </div>
                                </>
                            )}
                        </Form>
                    </section>

                    <aside className="rounded-2xl border bg-card p-5 shadow-sm sm:p-6">
                        <Scale className="size-6 text-primary" />
                        <h2 className="mt-4 font-semibold">Company rules</h2>
                        <ul className="mt-3 grid gap-3 text-sm leading-6 text-muted-foreground">
                            <li>• Arrive ready to work by the official time in.</li>
                            <li>• Use Time in only when physically present and ready to begin.</li>
                            <li>• Never ask another person to record attendance for you.</li>
                            <li>• Submit an accurate daily summary after timing out.</li>
                            <li>• Protect company and fellow interns&apos; confidential information.</li>
                            <li>• Follow safety instructions and maintain a respectful workplace.</li>
                        </ul>
                        <Button variant="outline" className="mt-6 w-full" asChild>
                            <Link href={terms()}>
                                Read complete terms
                                <ExternalLink />
                            </Link>
                        </Button>
                    </aside>
                </div>
            </div>
        </>
    );
}

AttendancePolicy.layout = {
    breadcrumbs: [{ title: 'Attendance policy', href: attendancePolicy() }],
};
