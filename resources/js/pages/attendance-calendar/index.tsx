import { Form, Head, Link } from '@inertiajs/react';
import {
    CalendarCheck2,
    CalendarDays,
    ChevronLeft,
    ChevronRight,
    Clock3,
    Plus,
    Sparkles,
    Trash2,
} from 'lucide-react';
import {
    destroy as destroyHoliday,
    store as storeHoliday,
} from '@/actions/App/Http/Controllers/Company/CompanyHolidayController';
import { DashboardHero, MetricCard } from '@/components/dashboard-ui';
import InputError from '@/components/input-error';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { index as attendanceCalendar } from '@/routes/attendance-calendar';

type Attendance = {
    id: number;
    date: string;
    timeIn: string | null;
    timeOut: string | null;
    hours: number;
    approvalStatus: 'pending' | 'approved' | 'rejected';
    punctuality: 'on_time' | 'late' | null;
};

type Holiday = { id: number; date: string; name: string };
type ApprovedLeave = {
    id: number;
    type: string;
    startDate: string;
    endDate: string;
};

type Props = {
    month: string;
    timezone: string;
    workDays: number[];
    canManageHolidays: boolean;
    attendance: Attendance[];
    holidays: Holiday[];
    approvedLeave: ApprovedLeave[];
};

const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AttendanceCalendar({
    month,
    timezone,
    workDays,
    canManageHolidays,
    attendance,
    holidays,
    approvedLeave,
}: Props) {
    const days = calendarDays(month);
    const attendanceByDate = new Map(
        attendance.map((record) => [record.date, record]),
    );
    const holidayByDate = new Map(
        holidays.map((holiday) => [holiday.date, holiday]),
    );
    const approvedHours = attendance
        .filter((record) => record.approvalStatus === 'approved')
        .reduce((sum, record) => sum + record.hours, 0);

    return (
        <>
            <Head title="Attendance calendar" />
            <div className="flex flex-1 flex-col gap-6 bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--primary)_9%,transparent),transparent_44%)] p-4 sm:p-6">
                <DashboardHero
                    eyebrow="Work calendar"
                    title="Attendance calendar"
                    description={
                        canManageHolidays
                            ? `Set company holidays and review scheduled workdays. Calendar dates follow ${timezone}.`
                            : `See your present days, punctuality, approved leave, and company holidays. Calendar dates follow ${timezone}.`
                    }
                    actions={
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="icon"
                                asChild
                                aria-label="Previous month"
                            >
                                <Link
                                    href={attendanceCalendar({
                                        query: { month: shiftMonth(month, -1) },
                                    })}
                                >
                                    <ChevronLeft />
                                </Link>
                            </Button>
                            <Badge
                                variant="secondary"
                                className="min-w-36 justify-center py-2 text-sm"
                            >
                                {formatMonth(month)}
                            </Badge>
                            <Button
                                variant="outline"
                                size="icon"
                                asChild
                                aria-label="Next month"
                            >
                                <Link
                                    href={attendanceCalendar({
                                        query: { month: shiftMonth(month, 1) },
                                    })}
                                >
                                    <ChevronRight />
                                </Link>
                            </Button>
                        </div>
                    }
                />

                {!canManageHolidays && (
                    <section className="grid gap-3 sm:grid-cols-3">
                        <MetricCard
                            icon={CalendarCheck2}
                            label="Days present"
                            value={attendance.length}
                            detail="Attendance records this month"
                            accent="success"
                        />
                        <MetricCard
                            icon={Clock3}
                            label="Approved hours"
                            value={approvedHours.toFixed(2)}
                            detail="Counted toward your requirement"
                        />
                        <MetricCard
                            icon={Sparkles}
                            label="Company holidays"
                            value={holidays.length}
                            detail="Non-working days this month"
                        />
                    </section>
                )}

                <div
                    className={`grid items-start gap-6 ${canManageHolidays ? 'xl:grid-cols-[minmax(0,1fr)_22rem]' : ''}`}
                >
                    <Card className="overflow-hidden rounded-3xl border-primary/10 bg-card/90">
                        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3 border-b">
                            <div>
                                <CardTitle>{formatMonth(month)}</CardTitle>
                                <p className="mt-1 text-sm text-muted-foreground">
                                    Tap or hover over a day to review its
                                    details.
                                </p>
                            </div>
                            <CalendarLegend />
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="grid grid-cols-7 border-b bg-muted/35">
                                {weekDays.map((day) => (
                                    <div
                                        key={day}
                                        className="px-1 py-3 text-center text-[10px] font-semibold tracking-wide text-muted-foreground uppercase sm:text-xs"
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7">
                                {days.map((day, index) => {
                                    if (day === null) {
                                        return (
                                            <div
                                                key={`blank-${index}`}
                                                className="min-h-20 border-r border-b bg-muted/10 sm:min-h-28"
                                                aria-hidden="true"
                                            />
                                        );
                                    }

                                    const record = attendanceByDate.get(
                                        day.date,
                                    );
                                    const holiday = holidayByDate.get(day.date);
                                    const leave = approvedLeave.find(
                                        (item) =>
                                            item.startDate <= day.date &&
                                            item.endDate >= day.date,
                                    );
                                    const isWorkDay = workDays.includes(
                                        day.isoWeekDay,
                                    );

                                    return (
                                        <CalendarDay
                                            key={day.date}
                                            day={day}
                                            record={record}
                                            holiday={holiday}
                                            leave={leave}
                                            isWorkDay={isWorkDay}
                                            isToday={
                                                day.date ===
                                                todayInTimezone(timezone)
                                            }
                                        />
                                    );
                                })}
                            </div>
                        </CardContent>
                    </Card>

                    {canManageHolidays && (
                        <HolidayManager month={month} holidays={holidays} />
                    )}
                </div>
            </div>
        </>
    );
}

function CalendarDay({
    day,
    record,
    holiday,
    leave,
    isWorkDay,
    isToday,
}: {
    day: CalendarDate;
    record?: Attendance;
    holiday?: Holiday;
    leave?: ApprovedLeave;
    isWorkDay: boolean;
    isToday: boolean;
}) {
    return (
        <div
            className={`group relative min-h-20 min-w-0 border-r border-b p-1.5 transition-colors sm:min-h-28 sm:p-2.5 ${!isWorkDay ? 'bg-muted/20' : 'hover:bg-primary/4'}`}
        >
            <div className="flex items-center justify-between gap-1">
                <span
                    className={`grid size-7 place-items-center rounded-full text-xs font-semibold sm:size-8 sm:text-sm ${isToday ? 'bg-primary text-primary-foreground shadow-[0_0_18px_color-mix(in_oklab,var(--primary)_55%,transparent)]' : ''}`}
                >
                    {day.day}
                </span>
                {record?.punctuality === 'late' && (
                    <span className="hidden rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-bold text-red-600 sm:inline">
                        LATE
                    </span>
                )}
            </div>
            <div className="mt-1.5 grid gap-1">
                {holiday && (
                    <EventPill
                        tone="holiday"
                        compactLabel="H"
                        label={holiday.name}
                    />
                )}
                {leave && (
                    <EventPill
                        tone="leave"
                        compactLabel="L"
                        label={`Approved ${leave.type}`}
                    />
                )}
                {record && (
                    <EventPill
                        tone={
                            record.approvalStatus === 'approved'
                                ? 'present'
                                : record.approvalStatus === 'rejected'
                                  ? 'rejected'
                                  : 'pending'
                        }
                        compactLabel="P"
                        label={`Present · ${formatTime(record.timeIn)}`}
                    />
                )}
            </div>
            {(record || holiday || leave) && (
                <div className="pointer-events-none absolute right-1 left-1 z-20 mt-2 hidden rounded-xl border bg-popover p-3 text-xs text-popover-foreground shadow-xl group-hover:block sm:right-auto sm:w-52">
                    <p className="font-semibold">{formatDate(day.date)}</p>
                    {holiday && (
                        <p className="mt-1 text-violet-600 dark:text-violet-300">
                            Holiday · {holiday.name}
                        </p>
                    )}
                    {leave && (
                        <p className="mt-1 text-blue-600 dark:text-blue-300">
                            Approved {leave.type}
                        </p>
                    )}
                    {record && (
                        <div className="mt-2 grid gap-1 text-muted-foreground">
                            <p>Time in: {formatTime(record.timeIn)}</p>
                            <p>Time out: {formatTime(record.timeOut)}</p>
                            <p>Hours: {record.hours.toFixed(2)}</p>
                            <p className="capitalize">
                                Review:{' '}
                                {record.approvalStatus === 'rejected'
                                    ? 'needs changes'
                                    : record.approvalStatus}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

function EventPill({
    tone,
    compactLabel,
    label,
}: {
    tone: 'holiday' | 'leave' | 'present' | 'pending' | 'rejected';
    compactLabel: string;
    label: string;
}) {
    const styles = {
        holiday:
            'border-violet-500/20 bg-violet-500/10 text-violet-700 dark:text-violet-300',
        leave: 'border-blue-500/20 bg-blue-500/10 text-blue-700 dark:text-blue-300',
        present:
            'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
        pending:
            'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-300',
        rejected:
            'border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300',
    }[tone];

    return (
        <div
            title={label}
            className={`truncate rounded-md border px-1 py-0.5 text-center text-[9px] font-semibold sm:px-1.5 sm:text-left sm:text-[10px] ${styles}`}
        >
            <span className="sm:hidden">{compactLabel}</span>
            <span className="hidden sm:inline">{label}</span>
        </div>
    );
}

function CalendarLegend() {
    return (
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            <Legend color="bg-emerald-500" label="Present" />
            <Legend color="bg-amber-500" label="Pending" />
            <Legend color="bg-violet-500" label="Holiday" />
            <Legend color="bg-blue-500" label="Leave" />
        </div>
    );
}

function Legend({ color, label }: { color: string; label: string }) {
    return (
        <span className="inline-flex items-center gap-1.5">
            <span className={`size-2 rounded-full ${color}`} />
            {label}
        </span>
    );
}

function HolidayManager({
    month,
    holidays,
}: {
    month: string;
    holidays: Holiday[];
}) {
    return (
        <Card className="rounded-3xl border-primary/10 bg-card/90">
            <CardHeader>
                <div className="flex items-center gap-3">
                    <span className="rounded-xl bg-primary/10 p-2.5 text-primary">
                        <CalendarDays className="size-5" />
                    </span>
                    <div>
                        <CardTitle className="text-base">
                            Company holidays
                        </CardTitle>
                        <p className="mt-1 text-xs text-muted-foreground">
                            OJTs cannot time in on these dates.
                        </p>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <Form
                    {...storeHoliday.form()}
                    resetOnSuccess
                    className="grid gap-3"
                >
                    {({ errors, processing }) => (
                        <>
                            <div className="grid gap-2">
                                <Label htmlFor="holiday_date">Date</Label>
                                <Input
                                    id="holiday_date"
                                    name="holiday_date"
                                    type="date"
                                    min={`${month}-01`}
                                    max={endOfMonth(month)}
                                    required
                                />
                                <InputError message={errors.holiday_date} />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="holiday_name">
                                    Holiday name
                                </Label>
                                <Input
                                    id="holiday_name"
                                    name="name"
                                    maxLength={150}
                                    placeholder="e.g. Founding anniversary"
                                    required
                                />
                                <InputError message={errors.name} />
                            </div>
                            <Button disabled={processing}>
                                {processing ? <Spinner /> : <Plus />} Add
                                holiday
                            </Button>
                        </>
                    )}
                </Form>

                <div className="mt-6 grid gap-2">
                    {holidays.length === 0 ? (
                        <p className="rounded-xl border border-dashed p-5 text-center text-sm text-muted-foreground">
                            No holidays in this month.
                        </p>
                    ) : (
                        holidays.map((holiday) => (
                            <div
                                key={holiday.id}
                                className="flex items-center gap-3 rounded-xl border p-3"
                            >
                                <div className="min-w-0 flex-1">
                                    <p className="truncate text-sm font-medium">
                                        {holiday.name}
                                    </p>
                                    <p className="mt-0.5 text-xs text-muted-foreground">
                                        {formatDate(holiday.date)}
                                    </p>
                                </div>
                                <Form {...destroyHoliday.form(holiday.id)}>
                                    <Button
                                        type="submit"
                                        variant="ghost"
                                        size="icon"
                                        aria-label={`Remove ${holiday.name}`}
                                    >
                                        <Trash2 className="size-4" />
                                    </Button>
                                </Form>
                            </div>
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

type CalendarDate = { date: string; day: number; isoWeekDay: number };

function calendarDays(month: string): Array<CalendarDate | null> {
    const [year, monthNumber] = month.split('-').map(Number);
    const first = new Date(Date.UTC(year, monthNumber - 1, 1));
    const count = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
    const days: Array<CalendarDate | null> = Array(first.getUTCDay()).fill(
        null,
    );

    for (let day = 1; day <= count; day += 1) {
        const date = new Date(Date.UTC(year, monthNumber - 1, day));
        days.push({
            date: `${year}-${String(monthNumber).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
            day,
            isoWeekDay: date.getUTCDay() === 0 ? 7 : date.getUTCDay(),
        });
    }

    while (days.length % 7 !== 0) {
        days.push(null);
    }

    return days;
}

function shiftMonth(month: string, amount: number): string {
    const [year, monthNumber] = month.split('-').map(Number);
    const date = new Date(Date.UTC(year, monthNumber - 1 + amount, 1));

    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function endOfMonth(month: string): string {
    const [year, monthNumber] = month.split('-').map(Number);
    const day = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();

    return `${month}-${day}`;
}

function formatMonth(month: string): string {
    return new Intl.DateTimeFormat('en-US', {
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
    }).format(new Date(`${month}-01T00:00:00Z`));
}

function formatDate(value: string): string {
    return new Intl.DateTimeFormat('en-US', {
        dateStyle: 'medium',
        timeZone: 'UTC',
    }).format(new Date(`${value}T00:00:00Z`));
}

function formatTime(value: string | null): string {
    if (!value) {
        return '—';
    }

    const [hours, minutes] = value.split(':').map(Number);

    return new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
    }).format(new Date(2000, 0, 1, hours, minutes));
}

function todayInTimezone(timezone: string): string {
    const parts = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).formatToParts(new Date());
    const value = Object.fromEntries(
        parts.map((part) => [part.type, part.value]),
    );

    return `${value.year}-${value.month}-${value.day}`;
}
