import { Head, Link } from '@inertiajs/react';
import {
    ArrowRight,
    BadgeCheck,
    BarChart3,
    BookOpenCheck,
    BriefcaseBusiness,
    Building2,
    CalendarCheck2,
    Check,
    ClipboardCheck,
    FileCheck2,
    FilePenLine,
    FolderLock,
    GraduationCap,
    HeartPulse,
    Home,
    Info,
    LayoutGrid,
    LogIn,
    MessageCircle,
    QrCode,
    School,
    ServerCog,
    ShieldCheck,
    Sparkles,
    UserCog,
    UserPlus,
    UsersRound,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogoIcon from '@/components/app-logo-icon';
import { login, register, terms } from '@/routes';

const platformCapabilities = [
    {
        icon: CalendarCheck2,
        title: 'Attendance intelligence',
        description:
            'Real-time time in and out, company schedules, late detection, holidays, corrections, QR verification, and privacy-aware location controls.',
        accent: 'text-cyan-300 bg-cyan-300/10 border-cyan-300/20',
        span: 'lg:col-span-2',
        tags: ['Live clock', 'Late detection', 'QR verification'],
    },
    {
        icon: FilePenLine,
        title: 'Reports and signed DTRs',
        description:
            'Daily accomplishment reports move through review into locked DTR periods with student and supervisor signatures.',
        accent: 'text-emerald-300 bg-emerald-300/10 border-emerald-300/20',
        span: '',
        tags: ['Approvals', 'E-signatures', 'Printable DTR'],
    },
    {
        icon: MessageCircle,
        title: 'Tasks and private communication',
        description:
            'Supervisors assign structured tasks while each OJT keeps one focused conversation with the person guiding their placement.',
        accent: 'text-cyan-300 bg-cyan-300/10 border-cyan-300/20',
        span: '',
        tags: ['Task statuses', 'Private chat', 'Image sharing'],
    },
    {
        icon: BookOpenCheck,
        title: 'Learning evidence',
        description:
            'Supervisor tasks, performance evaluations, and school curriculum outcomes become verified competency evidence.',
        accent: 'text-violet-300 bg-violet-300/10 border-violet-300/20',
        span: '',
        tags: ['Task mapping', 'Evaluations', 'Outcomes'],
    },
    {
        icon: BadgeCheck,
        title: 'Portable competency passport',
        description:
            'OJTs can share an expiring, privacy-controlled verification link containing approved hours and demonstrated skills.',
        accent: 'text-yellow-300 bg-yellow-300/10 border-yellow-300/20',
        span: 'lg:col-span-2',
        tags: ['Verified evidence', 'Expiring links', 'Privacy control'],
    },
    {
        icon: FolderLock,
        title: 'Documents and certificates',
        description:
            'Keep MOAs, endorsements, evaluations, completion certificates, and signed records in authorized private storage.',
        accent: 'text-cyan-300 bg-cyan-300/10 border-cyan-300/20',
        span: 'lg:col-span-2',
        tags: ['Document review', 'Certificates', 'Secure access'],
    },
    {
        icon: BarChart3,
        title: 'Analytics and early warnings',
        description:
            'Completion forecasts, missing work, late patterns, and risk signals help teams respond before an internship falls behind.',
        accent: 'text-violet-300 bg-violet-300/10 border-violet-300/20',
        span: '',
        tags: ['Forecasts', 'Risk signals', 'Compliance export'],
    },
    {
        icon: ServerCog,
        title: 'Operational resilience',
        description:
            'Health diagnostics, queue and scheduler heartbeats, backups, audit trails, risk signals, and compliance exports support dependable operations.',
        accent: 'text-emerald-300 bg-emerald-300/10 border-emerald-300/20',
        span: '',
        tags: ['Health checks', 'Audit trail', 'Evidence export'],
    },
];

const trustItems = [
    { icon: FileCheck2, label: 'Approved attendance and reports' },
    { icon: ClipboardCheck, label: 'Supervisor evaluations' },
    { icon: BadgeCheck, label: 'Verifiable competency passports' },
    { icon: QrCode, label: 'QR and consent-based verification' },
    { icon: FolderLock, label: 'Private document authorization' },
    { icon: HeartPulse, label: 'Service health monitoring' },
];

const workspaces = [
    {
        icon: UserCog,
        title: 'Company administrator',
        description:
            'Organize departments, invite accounts, assign supervisors, review reports, manage attendance, and issue verified completion records.',
        action: 'Controls and oversight',
    },
    {
        icon: BriefcaseBusiness,
        title: 'OJT supervisor',
        description:
            'Assign work, communicate privately, evaluate performance, review corrections, and sign verified DTRs and certificates.',
        action: 'Guidance and evaluation',
    },
    {
        icon: GraduationCap,
        title: 'OJT student',
        description:
            'Record attendance, submit daily work, manage tasks and documents, request corrections, and build a verified skills passport.',
        action: 'Simple daily workflow',
    },
    {
        icon: School,
        title: 'School coordinator',
        description:
            'Monitor assigned students across companies, define curriculum outcomes, and verify DTRs, evaluations, certificates, and progress.',
        action: 'Read-only student oversight',
    },
];

const journeySteps = [
    [
        '01',
        'Company setup',
        'Create the organization workspace, departments, policies, holidays, and attendance rules.',
    ],
    [
        '02',
        'Secure invitations',
        'Invite supervisors, OJTs, and school coordinators using real email addresses and protected setup links.',
    ],
    [
        '03',
        'Daily operations',
        'Track attendance, assigned tasks, messages, daily reports, leave, and time corrections.',
    ],
    [
        '04',
        'Review and guidance',
        'Supervisors and administrators approve work, provide feedback, and complete evaluations.',
    ],
    [
        '05',
        'Verified records',
        'Finalize signed DTRs, reviewed documents, completion certificates, and school acknowledgement.',
    ],
    [
        '06',
        'Portable outcomes',
        'Share verified skills and evidence through a privacy-controlled competency passport.',
    ],
];

export default function Welcome() {
    const [isNavigationCompact, setIsNavigationCompact] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsNavigationCompact(window.scrollY > 72);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <Head title="OJT Report Management System" />

            <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">
                {/* Aurora */}

                <div
                    className="pointer-events-none absolute inset-0 z-0"
                    aria-hidden="true"
                >
                    <div className="absolute top-20 -left-56 h-[650px] w-[650px] rounded-full bg-emerald-500/20 blur-[170px]" />

                    <div className="absolute top-40 right-0 h-[550px] w-[550px] rounded-full bg-yellow-400/10 blur-[170px]" />

                    <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-[180px]" />
                </div>

                {/* Grid */}

                <div
                    className="pointer-events-none absolute inset-0 z-0 opacity-[0.04]"
                    aria-hidden="true"
                    style={{
                        backgroundImage:
                            'linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.25) 1px, transparent 1px)',
                        backgroundSize: '42px 42px',
                    }}
                />

                {/* Glow */}

                <div
                    className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,transparent_35%,rgba(3,7,18,.72))]"
                    aria-hidden="true"
                />

                {/* NAVBAR */}

                <header
                    className={`fixed left-1/2 z-50 -translate-x-1/2 transition-[top,width,max-width] duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
                        isNavigationCompact
                            ? 'top-2 w-[calc(100%-1rem)] max-w-[30rem] sm:top-3'
                            : 'top-3 w-[calc(100%-1.5rem)] max-w-7xl sm:top-6 sm:w-[95%]'
                    }`}
                >
                    <div
                        className={`relative flex items-center justify-between gap-1.5 overflow-hidden border backdrop-blur-3xl backdrop-saturate-150 transition-[border-radius,padding,background-color,border-color,box-shadow] duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-reduce:transition-none ${
                            isNavigationCompact
                                ? 'rounded-full border-white/20 bg-slate-950/35 px-2 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,.16),inset_0_-1px_0_rgba(34,211,238,.08),0_14px_45px_rgba(0,0,0,.28),0_0_28px_rgba(34,211,238,.08)]'
                                : 'rounded-2xl border-white/10 bg-[#0b1220]/88 px-4 py-3 shadow-2xl shadow-black/20 sm:px-6 sm:py-4 lg:px-8'
                        }`}
                    >
                        <div
                            aria-hidden="true"
                            className={`pointer-events-none absolute top-0 left-1/2 h-px -translate-x-1/2 bg-gradient-to-r from-transparent via-cyan-300 to-transparent transition-[width,opacity] duration-500 motion-reduce:transition-none ${
                                isNavigationCompact
                                    ? 'w-2/3 opacity-70'
                                    : 'w-0 opacity-0'
                            }`}
                        />
                        <div
                            aria-hidden="true"
                            className={`pointer-events-none absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-cyan-300/4 transition-opacity duration-500 motion-reduce:transition-none ${
                                isNavigationCompact
                                    ? 'opacity-100'
                                    : 'opacity-0'
                            }`}
                        />

                        <a
                            href="#home"
                            aria-label="OJT Report home"
                            title="OJT Report home"
                            className="flex min-w-0 items-center gap-3 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-cyan-300/70"
                        >
                            <span
                                className={`grid shrink-0 place-items-center border border-cyan-300/15 bg-cyan-300/8 shadow-[0_0_24px_rgba(34,211,238,.12)] transition-[width,height,border-radius] duration-500 motion-reduce:transition-none ${
                                    isNavigationCompact
                                        ? 'size-10 rounded-full'
                                        : 'size-10 rounded-xl'
                                }`}
                            >
                                <AppLogoIcon className="size-7" />
                            </span>
                            <div
                                className={`min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-400 motion-reduce:transition-none ${
                                    isNavigationCompact
                                        ? 'max-w-0 -translate-x-2 opacity-0'
                                        : 'max-w-52 translate-x-0 opacity-100'
                                }`}
                            >
                                <h1 className="truncate text-sm font-bold tracking-[.16em] sm:text-base lg:text-lg">
                                    OJT REPORT
                                </h1>

                                <p className="hidden text-[10px] tracking-[.22em] text-slate-400 sm:block">
                                    OPERATIONS HUB
                                </p>
                            </div>
                        </a>

                        <nav
                            aria-label="Landing page navigation"
                            className={`relative hidden items-center text-sm text-slate-300 transition-[gap] duration-500 lg:flex ${
                                isNavigationCompact ? 'gap-2' : 'gap-1 xl:gap-2'
                            }`}
                        >
                            <LandingNavLink
                                href="#home"
                                label="Home"
                                icon={Home}
                                compact={isNavigationCompact}
                            />
                            <LandingNavLink
                                href="#features"
                                label="Features"
                                icon={LayoutGrid}
                                compact={isNavigationCompact}
                            />
                            <LandingNavLink
                                href="#partners"
                                label="Workspaces"
                                icon={Building2}
                                compact={isNavigationCompact}
                            />
                            <LandingNavLink
                                href="#about"
                                label="About"
                                icon={Info}
                                compact={isNavigationCompact}
                            />
                        </nav>

                        <div className="flex shrink-0 gap-2 sm:gap-3">
                            <Link
                                href={register()}
                                aria-label="Register company"
                                title="Register company"
                                className={`group hidden shrink-0 items-center justify-center bg-gradient-to-r from-cyan-300 to-emerald-400 text-sm leading-none font-semibold text-slate-950 shadow-[0_0_24px_rgba(52,211,153,.16)] transition-[width,height,padding,gap,border-radius,transform] duration-500 ease-[cubic-bezier(.22,1,.36,1)] motion-safe:hover:-translate-y-0.5 motion-reduce:transition-none sm:inline-flex ${
                                    isNavigationCompact
                                        ? 'aspect-square size-10 gap-0 rounded-full p-0'
                                        : 'h-11 w-52 gap-2 rounded-xl px-5'
                                }`}
                            >
                                <UserPlus className="block size-4 shrink-0" />
                                <span
                                    className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 motion-reduce:transition-none ${
                                        isNavigationCompact
                                            ? 'max-w-0 opacity-0'
                                            : 'max-w-40 opacity-100'
                                    }`}
                                >
                                    Register company
                                </span>
                            </Link>

                            <Link
                                href={login()}
                                aria-label="Sign in"
                                title="Sign in"
                                className={`group inline-flex shrink-0 items-center justify-center border text-sm leading-none font-semibold backdrop-blur-xl transition-[width,height,padding,gap,border-radius,background-color,border-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] hover:border-cyan-300/30 hover:bg-cyan-300/12 motion-reduce:transition-none ${
                                    isNavigationCompact
                                        ? 'aspect-square size-10 gap-0 rounded-full border-cyan-300/15 bg-cyan-300/8 p-0'
                                        : 'h-11 w-24 gap-2 rounded-xl border-white/12 bg-white/6 px-4 sm:w-28 sm:px-5'
                                }`}
                            >
                                <LogIn className="block size-4 shrink-0" />
                                <span
                                    className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 motion-reduce:transition-none ${
                                        isNavigationCompact
                                            ? 'max-w-0 opacity-0'
                                            : 'max-w-16 opacity-100'
                                    }`}
                                >
                                    Sign in
                                </span>
                            </Link>
                        </div>
                    </div>
                </header>

                {/* HERO */}

                <section
                    id="home"
                    className="relative z-10 mx-auto flex min-h-screen max-w-7xl scroll-mt-32 items-center px-5 pt-36 pb-20 sm:px-8 sm:pt-40 lg:py-44"
                >
                    <div className="grid w-full items-center gap-16 lg:grid-cols-2 lg:gap-20">
                        {/* LEFT */}

                        <div>
                            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-5 py-2 text-sm text-emerald-300">
                                <Sparkles className="h-4 w-4" />
                                Internship Management Platform
                            </div>

                            <h1 className="max-w-3xl text-4xl leading-[1.04] font-black tracking-[-0.045em] sm:text-6xl lg:text-7xl">
                                Run every internship
                                <span className="block bg-gradient-to-r from-emerald-300 via-emerald-500 to-yellow-300 bg-clip-text text-transparent">
                                    with clarity.
                                </span>
                                One secure hub.
                            </h1>

                            <p className="mt-10 max-w-xl text-lg leading-8 text-slate-400">
                                Connect companies, supervisors, OJTs, and school
                                coordinators through attendance, reports,
                                approvals, verified records, and completion
                                tracking in one accessible workspace.
                            </p>

                            <div className="mt-12 flex flex-wrap gap-5">
                                <Link
                                    href={register()}
                                    className="group flex items-center rounded-2xl bg-gradient-to-r from-cyan-300 to-emerald-400 px-7 py-4 font-semibold text-slate-950 shadow-[0_0_32px_rgba(52,211,153,.18)] transition motion-safe:hover:-translate-y-0.5 sm:px-8 sm:py-5 sm:text-lg"
                                >
                                    Register your company
                                    <ArrowRight className="ml-3 h-5 w-5 transition group-hover:translate-x-1" />
                                </Link>

                                <Link
                                    href={login()}
                                    className="rounded-2xl border border-white/10 bg-white/5 px-8 py-5 text-lg font-semibold backdrop-blur-xl transition hover:bg-white/10"
                                >
                                    Sign in to workspace
                                </Link>
                            </div>

                            {/* Stats */}

                            <div className="mt-16 grid gap-5 sm:grid-cols-3">
                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                                    <GraduationCap className="mb-5 h-8 w-8 text-emerald-400" />

                                    <h3 className="text-2xl font-black">4</h3>

                                    <p className="mt-2 text-slate-400">
                                        Connected user roles
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                                    <BriefcaseBusiness className="mb-5 h-8 w-8 text-yellow-300" />

                                    <h3 className="text-2xl font-black">
                                        Live
                                    </h3>

                                    <p className="mt-2 text-slate-400">
                                        Attendance monitoring
                                    </p>
                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
                                    <ShieldCheck className="mb-5 h-8 w-8 text-emerald-400" />

                                    <h3 className="text-2xl font-black">
                                        Verified
                                    </h3>

                                    <p className="mt-2 text-slate-400">
                                        DTRs and certificates
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* RIGHT */}

                        <div className="relative hidden items-center justify-center lg:flex">
                            {/* Floating Card 1 */}

                            <div className="absolute top-24 left-0 z-30 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-2xl">
                                <p className="text-sm text-slate-400">
                                    Rendered Hours
                                </p>

                                <h3 className="mt-2 text-4xl font-black text-emerald-400">
                                    320
                                </h3>

                                <p className="mt-1 text-sm text-slate-500">
                                    +8 Today
                                </p>
                            </div>

                            {/* Floating Card 2 */}

                            <div className="absolute top-10 right-0 z-30 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-2xl">
                                <p className="text-sm text-slate-400">
                                    Attendance
                                </p>

                                <h3 className="mt-2 text-3xl font-black text-yellow-300">
                                    Present
                                </h3>
                            </div>

                            {/* Floating Card 3 */}

                            <div className="absolute right-4 bottom-20 z-30 rounded-3xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur-2xl">
                                <p className="text-sm text-slate-400">
                                    Reports
                                </p>

                                <h3 className="mt-2 text-4xl font-black text-emerald-400">
                                    28
                                </h3>
                            </div>

                            {/* Laptop */}

                            <div className="relative mt-20">
                                <div className="rounded-[34px] border border-white/10 bg-[#111827]/90 p-5 shadow-[0_40px_120px_rgba(16,185,129,.15)] backdrop-blur-3xl">
                                    {/* Top Bar */}

                                    <div className="mb-6 flex items-center justify-between">
                                        <div className="flex gap-2">
                                            <div className="h-3 w-3 rounded-full bg-red-500"></div>
                                            <div className="h-3 w-3 rounded-full bg-yellow-400"></div>
                                            <div className="h-3 w-3 rounded-full bg-emerald-400"></div>
                                        </div>

                                        <span className="text-xs tracking-widest text-slate-500">
                                            OJT DASHBOARD
                                        </span>
                                    </div>

                                    {/* Dashboard */}

                                    <div className="flex gap-5">
                                        {/* Sidebar */}

                                        <div className="w-20 rounded-2xl bg-black/20 p-4">
                                            <div className="space-y-4">
                                                <div className="h-10 rounded-xl bg-emerald-500"></div>

                                                <div className="h-10 rounded-xl bg-white/5"></div>

                                                <div className="h-10 rounded-xl bg-white/5"></div>

                                                <div className="h-10 rounded-xl bg-white/5"></div>

                                                <div className="h-10 rounded-xl bg-white/5"></div>
                                            </div>
                                        </div>

                                        {/* Content */}

                                        <div className="flex-1 space-y-5">
                                            {/* Profile */}

                                            <div className="rounded-2xl border border-white/5 bg-white/5 p-5">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-14 w-14 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600"></div>

                                                        <div>
                                                            <h3 className="font-bold">
                                                                John Student
                                                            </h3>

                                                            <p className="text-sm text-slate-500">
                                                                BS Information
                                                                Technology
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <span className="rounded-full bg-emerald-500/20 px-4 py-2 text-sm text-emerald-400">
                                                        Active
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Statistics */}

                                            <div className="grid grid-cols-3 gap-4">
                                                <div className="rounded-2xl bg-white/5 p-5">
                                                    <p className="text-sm text-slate-500">
                                                        Hours
                                                    </p>

                                                    <h2 className="mt-3 text-4xl font-black">
                                                        320
                                                    </h2>
                                                </div>

                                                <div className="rounded-2xl bg-white/5 p-5">
                                                    <p className="text-sm text-slate-500">
                                                        Reports
                                                    </p>

                                                    <h2 className="mt-3 text-4xl font-black">
                                                        28
                                                    </h2>
                                                </div>

                                                <div className="rounded-2xl bg-white/5 p-5">
                                                    <p className="text-sm text-slate-500">
                                                        Rating
                                                    </p>

                                                    <h2 className="mt-3 text-4xl font-black text-yellow-300">
                                                        A+
                                                    </h2>
                                                </div>
                                            </div>

                                            {/* Analytics */}

                                            <div className="rounded-2xl border border-white/5 bg-white/5 p-6">
                                                <div className="mb-6 flex items-center justify-between">
                                                    <h3 className="font-semibold">
                                                        Weekly Progress
                                                    </h3>

                                                    <span className="text-sm text-emerald-400">
                                                        80%
                                                    </span>
                                                </div>

                                                <div className="flex h-44 items-end justify-between">
                                                    {[
                                                        50, 80, 65, 95, 70, 100,
                                                        90,
                                                    ].map((h, i) => (
                                                        <div
                                                            key={i}
                                                            className="w-8 rounded-full bg-gradient-to-t from-emerald-500 to-emerald-300"
                                                            style={{
                                                                height: `${h}%`,
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Laptop Base */}

                                <div className="mx-auto h-4 w-[88%] rounded-b-full bg-gradient-to-r from-slate-600 via-slate-400 to-slate-600"></div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* ================= FEATURES ================= */}

                <section
                    id="features"
                    className="relative z-10 mx-auto max-w-7xl scroll-mt-32 px-5 py-24 sm:px-8 sm:py-32"
                >
                    <SectionHeading
                        eyebrow="Complete OJT operations"
                        title="Everything connected."
                        accent="Nothing duplicated."
                        description="One workflow turns daily attendance and work into reviewed, signed, school-visible, and portable evidence."
                    />

                    <div className="mt-16 grid auto-rows-fr gap-4 lg:grid-cols-3">
                        {platformCapabilities.map((feature) => {
                            const Icon = feature.icon;

                            return (
                                <article
                                    key={feature.title}
                                    className={`group relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl transition duration-500 hover:-translate-y-1 hover:border-cyan-300/25 hover:bg-white/[0.07] sm:p-8 ${feature.span}`}
                                >
                                    <div className="pointer-events-none absolute -top-24 -right-24 size-52 rounded-full bg-cyan-300/6 blur-3xl transition group-hover:bg-cyan-300/10" />
                                    <div
                                        className={`relative grid size-12 place-items-center rounded-2xl border ${feature.accent}`}
                                    >
                                        <Icon className="size-5" />
                                    </div>
                                    <h3 className="relative mt-6 text-xl font-bold sm:text-2xl">
                                        {feature.title}
                                    </h3>
                                    <p className="relative mt-3 max-w-2xl leading-7 text-slate-400">
                                        {feature.description}
                                    </p>
                                    <div className="relative mt-6 flex flex-wrap gap-2">
                                        {feature.tags.map((tag) => (
                                            <span
                                                key={tag}
                                                className="rounded-full border border-white/8 bg-black/15 px-3 py-1.5 text-xs text-slate-300"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </section>

                {/* ================= CONNECTED WORKSPACES ================= */}

                <section
                    id="partners"
                    className="relative z-10 scroll-mt-32 overflow-hidden py-24 sm:py-32"
                >
                    <div className="pointer-events-none absolute inset-x-0 top-1/3 h-72 bg-cyan-400/5 blur-[130px]" />
                    <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
                        <SectionHeading
                            eyebrow="Four focused workspaces"
                            title="Every person sees"
                            accent="exactly what they need."
                            description="Role-based access keeps the experience simple while protecting company, student, and school information."
                        />

                        <div className="mt-16 grid gap-4 md:grid-cols-2">
                            {workspaces.map((workspace, index) => {
                                const Icon = workspace.icon;

                                return (
                                    <article
                                        key={workspace.title}
                                        className="group rounded-[28px] border border-white/10 bg-slate-950/35 p-6 backdrop-blur-2xl transition duration-500 hover:border-emerald-300/25 sm:p-8"
                                    >
                                        <div className="flex items-start gap-4 sm:gap-5">
                                            <div className="grid size-12 shrink-0 place-items-center rounded-2xl border border-emerald-300/15 bg-emerald-300/8 text-emerald-300 transition group-hover:scale-105 group-hover:border-emerald-300/30">
                                                <Icon className="size-5" />
                                            </div>
                                            <div>
                                                <p className="text-xs font-semibold tracking-[.2em] text-slate-500 uppercase">
                                                    Workspace 0{index + 1}
                                                </p>
                                                <h3 className="mt-2 text-xl font-bold sm:text-2xl">
                                                    {workspace.title}
                                                </h3>
                                            </div>
                                        </div>
                                        <p className="mt-5 leading-7 text-slate-400">
                                            {workspace.description}
                                        </p>
                                        <p className="mt-6 flex items-center gap-2 text-sm font-medium text-emerald-300">
                                            <Check className="size-4" />
                                            {workspace.action}
                                        </p>
                                    </article>
                                );
                            })}
                        </div>
                    </div>
                </section>

                {/* ================= TRUST LAYER ================= */}

                <section className="relative z-10 mx-auto max-w-7xl px-5 py-20 sm:px-8">
                    <div className="overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-cyan-300/8 via-white/[0.035] to-emerald-300/8 p-6 backdrop-blur-xl sm:p-10">
                        <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
                            <div>
                                <span className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-300">
                                    <ShieldCheck className="size-4" />
                                    Built-in trust layer
                                </span>
                                <h2 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
                                    Evidence that can be checked, not just
                                    claimed.
                                </h2>
                                <p className="mt-5 leading-7 text-slate-400">
                                    Approvals, signatures, audit events, school
                                    acknowledgement, and integrity fingerprints
                                    create a traceable internship record.
                                </p>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2">
                                {trustItems.map((item) => {
                                    const Icon = item.icon;

                                    return (
                                        <div
                                            key={item.label}
                                            className="flex items-center gap-3 rounded-2xl border border-white/8 bg-black/15 p-4 text-sm text-slate-300"
                                        >
                                            <Icon className="size-4 shrink-0 text-emerald-300" />
                                            <span>{item.label}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= JOURNEY ================= */}

                <section className="relative z-10 mx-auto max-w-7xl px-5 py-24 sm:px-8 sm:py-32">
                    <SectionHeading
                        eyebrow="A complete internship lifecycle"
                        title="From company setup"
                        accent="to verified outcomes."
                        description="Each stage builds on the last, so hours, decisions, and evidence remain consistent across every workspace."
                    />

                    <div className="relative mt-16 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        <div className="pointer-events-none absolute top-8 right-8 left-8 hidden h-px bg-gradient-to-r from-cyan-300/0 via-cyan-300/35 to-emerald-300/0 xl:block" />
                        {journeySteps.map(([number, title, description]) => (
                            <article
                                key={number}
                                className="relative rounded-[26px] border border-white/10 bg-white/[0.04] p-6 backdrop-blur-xl sm:p-7"
                            >
                                <div className="grid size-12 place-items-center rounded-full border border-cyan-300/25 bg-[#07111e] font-mono text-sm font-bold text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,.12)]">
                                    {number}
                                </div>
                                <h3 className="mt-6 text-xl font-bold">
                                    {title}
                                </h3>
                                <p className="mt-3 leading-7 text-slate-400">
                                    {description}
                                </p>
                            </article>
                        ))}
                    </div>
                </section>

                {/* ================= CTA ================= */}

                <section className="relative z-10 mx-auto max-w-6xl px-5 pb-24 sm:px-8 sm:pb-32">
                    <div className="relative overflow-hidden rounded-[32px] border border-cyan-300/15 bg-gradient-to-br from-cyan-300/12 via-white/5 to-emerald-300/12 p-8 backdrop-blur-xl sm:p-12 lg:rounded-[40px] lg:p-20">
                        <div className="pointer-events-none absolute -top-28 left-1/2 size-80 -translate-x-1/2 rounded-full bg-emerald-300/12 blur-[100px]" />
                        <div className="mx-auto max-w-3xl text-center">
                            <div className="mx-auto grid size-14 place-items-center rounded-2xl border border-emerald-300/20 bg-emerald-300/10 text-emerald-300">
                                <UsersRound className="size-6" />
                            </div>
                            <h2 className="mt-6 text-4xl leading-tight font-black sm:text-5xl lg:text-6xl">
                                Ready to run a clearer OJT program?
                            </h2>

                            <p className="mt-8 text-lg leading-8 text-slate-400">
                                Start with the company workspace, configure your
                                policies, and securely connect supervisors,
                                students, and school coordinators.
                            </p>

                            <div className="mt-12 flex flex-wrap justify-center gap-5">
                                <Link
                                    href={register()}
                                    className="group inline-flex items-center gap-3 rounded-2xl bg-gradient-to-r from-cyan-300 to-emerald-400 px-8 py-4 text-base font-bold text-slate-950 shadow-[0_0_30px_rgba(52,211,153,.15)] transition duration-300 hover:scale-[1.02] sm:px-10 sm:py-5 sm:text-lg"
                                >
                                    Register company
                                    <ArrowRight className="size-5 transition group-hover:translate-x-1" />
                                </Link>

                                <Link
                                    href={login()}
                                    className="rounded-2xl border border-white/12 bg-white/6 px-8 py-4 text-base font-semibold backdrop-blur-xl transition hover:border-cyan-300/25 hover:bg-white/10 sm:px-10 sm:py-5 sm:text-lg"
                                >
                                    Sign in
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ================= FOOTER ================= */}

                <footer
                    id="about"
                    className="relative z-10 scroll-mt-32 border-t border-white/10"
                >
                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-8 py-10 md:flex-row">
                        <div className="max-w-sm text-center md:text-left">
                            <h3 className="text-xl font-bold tracking-[.14em]">
                                OJT REPORT
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                Secure internship operations for companies,
                                supervisors, OJTs, and schools.
                            </p>
                        </div>

                        <div className="text-sm text-slate-500">
                            © 2026 OJT Report. All rights reserved.
                        </div>

                        <div className="flex gap-8 text-sm text-slate-500">
                            <Link
                                href={terms()}
                                className="hover:text-emerald-400"
                            >
                                Terms
                            </Link>

                            <a href="#home" className="hover:text-emerald-400">
                                Back to top
                            </a>
                        </div>
                    </div>
                </footer>
            </div>
        </>
    );
}

function SectionHeading({
    eyebrow,
    title,
    accent,
    description,
}: {
    eyebrow: string;
    title: string;
    accent: string;
    description: string;
}) {
    return (
        <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-300/8 px-4 py-2 text-sm font-medium text-emerald-300">
                <Sparkles className="size-4" />
                {eyebrow}
            </span>
            <h2 className="mt-7 text-4xl leading-tight font-black tracking-tight sm:text-5xl lg:text-6xl">
                {title}{' '}
                <span className="bg-gradient-to-r from-cyan-300 to-emerald-400 bg-clip-text text-transparent">
                    {accent}
                </span>
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-slate-400 sm:text-lg sm:leading-8">
                {description}
            </p>
        </div>
    );
}

function LandingNavLink({
    href,
    label,
    icon: Icon,
    compact,
}: {
    href: string;
    label: string;
    icon: typeof Home;
    compact: boolean;
}) {
    const expandedWidth =
        label === 'Workspaces'
            ? 'w-36'
            : label === 'Features'
              ? 'w-28'
              : 'w-24';

    return (
        <a
            href={href}
            aria-label={label}
            title={label}
            className={`group inline-flex shrink-0 items-center justify-center rounded-full border transition-[width,height,padding,gap,color,background-color,border-color] duration-500 ease-[cubic-bezier(.22,1,.36,1)] outline-none hover:border-cyan-300/25 hover:bg-cyan-300/12 hover:text-emerald-300 focus-visible:border-cyan-300/25 focus-visible:bg-cyan-300/12 focus-visible:text-emerald-300 focus-visible:ring-2 focus-visible:ring-cyan-300/70 motion-reduce:transition-none ${
                compact
                    ? 'aspect-square size-10 gap-0 border-transparent bg-transparent p-0'
                    : `${expandedWidth} min-h-10 gap-2 border-transparent px-3`
            }`}
        >
            <Icon
                className={`size-4 shrink-0 transition-[opacity,transform] duration-300 motion-reduce:transition-none ${
                    compact ? 'scale-100 opacity-100' : 'scale-75 opacity-60'
                }`}
            />
            <span
                className={`overflow-hidden whitespace-nowrap transition-[max-width,opacity] duration-300 motion-reduce:transition-none ${
                    compact ? 'max-w-0 opacity-0' : 'max-w-28 opacity-100'
                }`}
            >
                {label}
            </span>
        </a>
    );
}
