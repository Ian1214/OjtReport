import { Head, Link } from "@inertiajs/react";
import {
    ArrowRight,
    ShieldCheck,
    GraduationCap,
    BriefcaseBusiness,
    Sparkles,
} from "lucide-react";
import { login } from "@/routes";

export default function Welcome() {
    return (
        <>
            <Head title="OJT Report Management System" />

            <div className="relative min-h-screen overflow-hidden bg-[#030712] text-white">

                {/* Aurora */}

                <div className="absolute inset-0">

                    <div className="absolute -left-56 top-20 h-[650px] w-[650px] rounded-full bg-emerald-500/20 blur-[170px]" />

                    <div className="absolute right-0 top-40 h-[550px] w-[550px] rounded-full bg-yellow-400/10 blur-[170px]" />

                    <div className="absolute bottom-0 left-1/3 h-[500px] w-[500px] rounded-full bg-emerald-400/10 blur-[180px]" />

                </div>

                {/* Grid */}

                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage:
                            "linear-gradient(rgba(255,255,255,.25) 1px, transparent 1px),linear-gradient(90deg,rgba(255,255,255,.25) 1px, transparent 1px)",
                        backgroundSize: "42px 42px",
                    }}
                />

                {/* Glow */}

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent,rgba(3,7,18,.8))]" />

                {/* NAVBAR */}

                <header className="fixed left-1/2 top-6 z-50 w-[95%] max-w-7xl -translate-x-1/2">

                    <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-8 py-5 backdrop-blur-2xl">

                        <div>

                            <h1 className="text-xl font-bold tracking-widest">

                                OJT REPORT

                            </h1>

                            <p className="text-xs tracking-[.25em] text-slate-500">

                                MANAGEMENT SYSTEM

                            </p>

                        </div>

                        <nav className="hidden gap-10 text-sm text-slate-400 lg:flex">

                            <a href="#" className="transition hover:text-emerald-300">
                                Home
                            </a>

                            <a href="#" className="transition hover:text-emerald-300">
                                Features
                            </a>

                            <a href="#" className="transition hover:text-emerald-300">
                                Companies
                            </a>

                            <a href="#" className="transition hover:text-emerald-300">
                                About
                            </a>

                        </nav>

                        <div className="flex gap-3">

                            <Link
                                href="/register"
                                className="rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-6 py-3 font-semibold text-black transition-all duration-300 hover:scale-105"
                            >
                                Register
                            </Link>

                            <Link
                                href={login()}
                                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 font-semibold backdrop-blur-xl transition hover:bg-white/10"
                            >
                                Login
                            </Link>

                        </div>

                    </div>

                </header>

                {/* HERO */}

                <section className="mx-auto flex min-h-screen max-w-7xl items-center px-8">

                    <div className="grid w-full items-center gap-24 lg:grid-cols-2">

                        {/* LEFT */}

                        <div>

                            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-5 py-2 text-sm text-emerald-300">

                                <Sparkles className="h-4 w-4" />

                                Internship Management Platform

                            </div>

                            <h1 className="text-6xl font-black leading-[1.05] lg:text-7xl">

                                Internship

                                <span className="block bg-gradient-to-r from-emerald-300 via-emerald-500 to-yellow-300 bg-clip-text text-transparent">

                                    Made Better.

                                </span>

                                Everything
                                <br />
                                In One Place.

                            </h1>

                            <p className="mt-10 max-w-xl text-lg leading-8 text-slate-400">

                                Submit accomplishment reports,
                                monitor attendance,
                                manage rendered hours,
                                communicate with advisers,
                                and track your internship progress
                                from one modern platform.

                            </p>

                            <div className="mt-12 flex flex-wrap gap-5">

                                <Link
                                    href="/register"
                                    className="group flex items-center rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-400 px-8 py-5 text-lg font-semibold text-black transition-all duration-300 hover:scale-105"
                                >

                                    Get Started

                                    <ArrowRight className="ml-3 h-5 w-5 transition group-hover:translate-x-1" />

                                </Link>

                                <Link
                                    href={login()}
                                    className="rounded-2xl border border-white/10 bg-white/5 px-8 py-5 text-lg font-semibold backdrop-blur-xl transition hover:bg-white/10"
                                >
                                    Login
                                </Link>

                            </div>

                            {/* Stats */}

                            <div className="mt-16 grid gap-5 sm:grid-cols-3">

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

                                    <GraduationCap className="mb-5 h-8 w-8 text-emerald-400" />

                                    <h3 className="text-3xl font-black">

                                        500+

                                    </h3>

                                    <p className="mt-2 text-slate-400">

                                        Students

                                    </p>

                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

                                    <BriefcaseBusiness className="mb-5 h-8 w-8 text-yellow-300" />

                                    <h3 className="text-3xl font-black">

                                        80+

                                    </h3>

                                    <p className="mt-2 text-slate-400">

                                        Companies

                                    </p>

                                </div>

                                <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">

                                    <ShieldCheck className="mb-5 h-8 w-8 text-emerald-400" />

                                    <h3 className="text-3xl font-black">

                                        99%

                                    </h3>

                                    <p className="mt-2 text-slate-400">

                                        Secure

                                    </p>

                                </div>

                            </div>

                        </div>
                        {/* RIGHT */}

                        <div className="relative hidden lg:flex items-center justify-center">

                            {/* Floating Card 1 */}

                            <div className="absolute left-0 top-24 z-30 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl shadow-2xl">

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

                            <div className="absolute right-0 top-10 z-30 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl shadow-2xl">

                                <p className="text-sm text-slate-400">
                                    Attendance
                                </p>

                                <h3 className="mt-2 text-3xl font-black text-yellow-300">
                                    Present
                                </h3>

                            </div>

                            {/* Floating Card 3 */}

                            <div className="absolute right-4 bottom-20 z-30 rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-2xl shadow-2xl">

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
                                                                BS Information Technology
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

                                                    {[50, 80, 65, 95, 70, 100, 90].map((h, i) => (

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

                <section className="relative mx-auto max-w-7xl px-8 py-32">

                    <div className="mx-auto max-w-3xl text-center">

                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-2 text-sm text-emerald-300">
                            Everything You Need
                        </span>

                        <h2 className="mt-8 text-5xl font-black">

                            Built Around
                            <span className="block bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-300 bg-clip-text text-transparent">

                                Student Success

                            </span>

                        </h2>

                        <p className="mt-8 text-lg leading-8 text-slate-400">

                            Every tool you need during your internship,
                            beautifully organized in one platform.

                        </p>

                    </div>

                    <div className="mt-20 grid gap-6 lg:grid-cols-3">

                        {/* BIG CARD */}

                        <div className="group lg:row-span-2 rounded-[34px] border border-white/10 bg-white/5 p-10 backdrop-blur-xl transition duration-500 hover:-translate-y-3 hover:border-emerald-500/40">

                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 text-3xl">

                                📊

                            </div>

                            <h3 className="mt-10 text-3xl font-bold">

                                Internship Analytics

                            </h3>

                            <p className="mt-5 leading-8 text-slate-400">

                                Monitor attendance,
                                rendered hours,
                                adviser approval,
                                evaluations,
                                and internship progress
                                through beautiful analytics.

                            </p>

                            <div className="mt-10 rounded-3xl bg-black/20 p-8">

                                <div className="space-y-5">

                                    {[85, 60, 90, 70, 100].map((height, index) => (

                                        <div
                                            key={index}
                                            className="flex items-center gap-4"
                                        >

                                            <div className="h-2 flex-1 rounded-full bg-slate-700">

                                                <div
                                                    className="h-2 rounded-full bg-gradient-to-r from-emerald-400 to-yellow-300"
                                                    style={{
                                                        width: `${height}%`
                                                    }}
                                                />

                                            </div>

                                            <span className="text-sm text-slate-400">

                                                {height}%

                                            </span>

                                        </div>

                                    ))}

                                </div>

                            </div>

                        </div>

                        {/* CARD */}

                        <div className="rounded-[34px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition duration-500 hover:-translate-y-2">

                            <div className="mb-5 text-5xl">

                                📄

                            </div>

                            <h3 className="text-2xl font-bold">

                                Daily Reports

                            </h3>

                            <p className="mt-4 text-slate-400 leading-7">

                                Submit accomplishment reports with
                                automatic tracking and approval.

                            </p>

                        </div>

                        {/* CARD */}

                        <div className="rounded-[34px] border border-white/10 bg-white/5 p-8 backdrop-blur-xl transition duration-500 hover:-translate-y-2">

                            <div className="mb-5 text-5xl">

                                🏢

                            </div>

                            <h3 className="text-2xl font-bold">

                                Company Monitoring

                            </h3>

                            <p className="mt-4 text-slate-400 leading-7">

                                Connect students,
                                companies,
                                advisers,
                                and coordinators.

                            </p>

                        </div>

                        {/* WIDE */}

                        <div className="lg:col-span-2 rounded-[34px] border border-white/10 bg-gradient-to-r from-emerald-500/10 via-white/5 to-yellow-300/10 p-10 backdrop-blur-xl">

                            <div className="flex flex-col justify-between gap-10 lg:flex-row">

                                <div>

                                    <h3 className="text-3xl font-black">

                                        Everything synchronized.

                                    </h3>

                                    <p className="mt-6 max-w-lg leading-8 text-slate-400">

                                        Student attendance,
                                        adviser approvals,
                                        rendered hours,
                                        weekly accomplishments,
                                        and company evaluations
                                        are available from one dashboard.

                                    </p>

                                </div>

                                <div className="grid grid-cols-2 gap-5">

                                    <div className="rounded-2xl bg-black/20 p-6">

                                        <h2 className="text-4xl font-black text-emerald-400">

                                            320

                                        </h2>

                                        <p className="mt-2 text-slate-400">

                                            Hours

                                        </p>

                                    </div>

                                    <div className="rounded-2xl bg-black/20 p-6">

                                        <h2 className="text-4xl font-black text-yellow-300">

                                            28

                                        </h2>

                                        <p className="mt-2 text-slate-400">

                                            Reports

                                        </p>

                                    </div>

                                    <div className="rounded-2xl bg-black/20 p-6">

                                        <h2 className="text-4xl font-black text-emerald-400">

                                            98%

                                        </h2>

                                        <p className="mt-2 text-slate-400">

                                            Attendance

                                        </p>

                                    </div>

                                    <div className="rounded-2xl bg-black/20 p-6">

                                        <h2 className="text-4xl font-black text-yellow-300">

                                            A+

                                        </h2>

                                        <p className="mt-2 text-slate-400">

                                            Rating

                                        </p>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </div>

                </section>
                {/* ================= TRUSTED ================= */}

                <section className="relative overflow-hidden py-24">

                    <div className="mx-auto max-w-7xl px-8">

                        <div className="text-center">

                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-5 py-2 text-sm text-emerald-300">

                                Trusted Platform

                            </span>

                            <h2 className="mt-8 text-5xl font-black">

                                Built For
                                <span className="block bg-gradient-to-r from-emerald-400 to-yellow-300 bg-clip-text text-transparent">

                                    Universities & Companies

                                </span>

                            </h2>

                        </div>

                        <div className="mt-16 flex flex-wrap justify-center gap-6">

                            {[
                                "Tech Solutions",
                                "IT Department",
                                "Partner Companies",
                                "Industry Mentors",
                            ].map((company) => (

                                <div
                                    key={company}
                                    className="rounded-full border border-white/10 bg-white/5 px-8 py-4 text-slate-300 backdrop-blur-xl transition duration-300 hover:border-emerald-400 hover:bg-white/10"
                                >
                                    {company}
                                </div>

                            ))}

                        </div>

                    </div>

                </section>

                {/* ================= TIMELINE ================= */}

                <section className="mx-auto max-w-7xl px-8 py-32">

                    <div className="text-center">

                        <span className="rounded-full border border-yellow-400/20 bg-yellow-400/10 px-5 py-2 text-sm text-yellow-300">

                            Internship Journey

                        </span>

                        <h2 className="mt-8 text-5xl font-black">

                            From Registration
                            <br />
                            To Graduation

                        </h2>

                    </div>

                    <div className="relative mt-24">

                        <div className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-gradient-to-b from-emerald-500 via-yellow-300 to-emerald-500"></div>

                        {[
                            {
                                title: "Create Account",
                                desc: "Register your internship profile.",
                            },
                            {
                                title: "Submit Daily Reports",
                                desc: "Record accomplishments and attendance.",
                            },
                            {
                                title: "Supervisor Evaluation",
                                desc: "Receive feedback from your company.",
                            },
                            {
                                title: "Complete Hours",
                                desc: "Reach your required internship hours.",
                            },
                            {
                                title: "Internship Completed",
                                desc: "Ready for graduation.",
                            },
                        ].map((step, index) => (

                            <div
                                key={step.title}
                                className={`mb-16 flex items-center ${index % 2 === 0
                                        ? "justify-start"
                                        : "justify-end"
                                    }`}
                            >

                                <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">

                                    <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-yellow-300 font-bold text-black">

                                        {index + 1}

                                    </div>

                                    <h3 className="text-2xl font-bold">

                                        {step.title}

                                    </h3>

                                    <p className="mt-4 leading-7 text-slate-400">

                                        {step.desc}

                                    </p>

                                </div>

                            </div>

                        ))}

                    </div>

                </section>

                {/* ================= CTA ================= */}

                <section className="mx-auto max-w-6xl px-8 pb-32">

                    <div className="overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-emerald-500/15 via-white/5 to-yellow-300/10 p-20 backdrop-blur-xl">

                        <div className="mx-auto max-w-3xl text-center">

                            <h2 className="text-6xl font-black leading-tight">

                                Ready To Start
                                <br />
                                Your Internship?

                            </h2>

                            <p className="mt-8 text-lg leading-8 text-slate-400">

                                Join the OJT Report Management System and manage
                                your internship with one modern platform.

                            </p>

                            <div className="mt-12 flex flex-wrap justify-center gap-5">

                                <Link
                                    href="/register"
                                    className="rounded-2xl bg-gradient-to-r from-emerald-400 to-yellow-300 px-10 py-5 text-lg font-bold text-black transition duration-300 hover:scale-105"
                                >
                                    Create Account
                                </Link>

                                <Link
                                    href={login()}
                                    className="rounded-2xl border border-white/10 bg-white/5 px-10 py-5 text-lg font-semibold backdrop-blur-xl transition hover:bg-white/10"
                                >
                                    Login
                                </Link>

                            </div>

                        </div>

                    </div>

                </section>

                {/* ================= FOOTER ================= */}

                <footer className="border-t border-white/10">

                    <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 px-8 py-10 md:flex-row">

                        <div>

                            <h3 className="text-xl font-bold">

                                OJT REPORT

                            </h3>

                            <p className="mt-2 text-sm text-slate-500">

                                Internship Management System

                            </p>

                        </div>

                        <div className="text-sm text-slate-500">

                            © 2026 Notre Dame of Marbel University

                        </div>

                        <div className="flex gap-8 text-sm text-slate-500">

                            <a href="#" className="hover:text-emerald-400">
                                Privacy
                            </a>

                            <a href="#" className="hover:text-emerald-400">
                                Terms
                            </a>

                            <a href="#" className="hover:text-emerald-400">
                                Contact
                            </a>

                        </div>

                    </div>

                </footer>

            </div>
        </>
    );
}