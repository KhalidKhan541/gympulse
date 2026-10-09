"use client";

import Link from "next/link";
import { MotionConfig, motion } from "framer-motion";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  BarChart3,
  CalendarDays,
  Check,
  ClipboardList,
  CreditCard,
  Dumbbell,
  Menu,
  ScanLine,
  ShoppingBag,
  Star,
  Users,
  UserPlus,
  X,
} from "lucide-react";
import { useState } from "react";

/* ----------------------------- Motion helpers ----------------------------- */

const reveal = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
} as const;

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
} as const;

function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={reveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-80px" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------- Navigation ------------------------------- */

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Testimonials", href: "#testimonials" },
];

function LandingNav() {
  const [open, setOpen] = useState(false);
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <nav className="mx-4 mt-4 flex max-w-6xl items-center justify-between rounded-2xl border border-white/10 bg-white/70 px-5 py-3 shadow-lg shadow-black/5 backdrop-blur-xl sm:mx-auto dark:bg-[#0f130a]/70">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gp-500 text-[#10160a]">
            <Dumbbell className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Gym<span className="text-gp-600 dark:text-gp-400">Pulse</span>
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-zinc-600 transition hover:text-gp-600 dark:text-zinc-300 dark:hover:text-gp-400"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/dashboard"
            className="text-sm font-medium text-zinc-600 transition hover:text-gp-600 dark:text-zinc-300 dark:hover:text-gp-400"
          >
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-xl bg-gp-500 px-4 py-2 text-sm font-semibold text-[#10160a] transition hover:bg-gp-400"
          >
            Start free
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5 md:hidden"
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </nav>

      {open && (
        <div className="mx-4 mt-2 rounded-2xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-[#0f130a] md:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/5"
              >
                {link.label}
              </a>
            ))}
            <Link
              href="/dashboard"
              className="mt-2 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gp-500 px-4 py-2 text-sm font-semibold text-[#10160a]"
            >
              Start free
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

/* ---------------------------------- Data ---------------------------------- */

const FEATURES = [
  {
    icon: Users,
    title: "Members",
    body: "Full member roster with plans, status, renewals, health flags and visit history at a glance.",
  },
  {
    icon: UserPlus,
    title: "Leads",
    body: "Track every prospect from first touch to booked tour with lead scoring and follow-ups.",
  },
  {
    icon: Dumbbell,
    title: "Classes",
    body: "Manage class capacity, intensity and enrollment — spot at-capacity sessions instantly.",
  },
  {
    icon: CalendarDays,
    title: "Scheduling",
    body: "Week-view scheduling for classes, trainers and rooms without double bookings.",
  },
  {
    icon: BadgeCheck,
    title: "Trainers",
    body: "Trainer profiles, certifications, weekly hours, client loads and ratings.",
  },
  {
    icon: ClipboardList,
    title: "Programs",
    body: "Sell multi-week programs with pricing, difficulty tiers and enrollment tracking.",
  },
  {
    icon: ScanLine,
    title: "Attendance",
    body: "Front-desk check-ins, no-shows and class attendance trends in real time.",
  },
  {
    icon: ShoppingBag,
    title: "POS & Billing",
    body: "Ring up supplements and apparel, issue invoices and chase overdue payments.",
  },
];

const PRICING = [
  {
    name: "Starter",
    price: "$49",
    period: "/mo",
    blurb: "For single-location gyms getting off spreadsheets.",
    features: [
      "Up to 300 members",
      "Members, leads & check-ins",
      "Class scheduling",
      "Email support",
    ],
    cta: "Start free trial",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "$99",
    period: "/mo",
    blurb: "For growing studios that sell programs and POS.",
    features: [
      "Up to 1,500 members",
      "Everything in Starter",
      "POS, billing & invoicing",
      "Programs & trainer management",
      "Priority support",
    ],
    cta: "Start free trial",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "$249",
    period: "/mo",
    blurb: "For multi-location groups with custom workflows.",
    features: [
      "Unlimited members",
      "Everything in Pro",
      "Multi-location dashboard",
      "Custom integrations & SSO",
      "Dedicated success manager",
    ],
    cta: "Talk to sales",
    highlighted: false,
  },
];

const TESTIMONIALS = [
  {
    quote:
      "We cut front-desk admin in half. Check-ins, billing and class capacity finally live in one place — my managers actually enjoy opening the dashboard.",
    name: "Priya Desai",
    role: "Owner, IronWorks Fitness — 2 locations",
  },
  {
    quote:
      "Lead scoring paid for GymPulse in the first month. We stopped losing walk-ins and our trial-to-member conversion is up 34%.",
    name: "Marcus Hale",
    role: "GM, Apex Strength Club",
  },
  {
    quote:
      "The POS and billing flow just works. Overdue invoices get chased automatically and I can see revenue MTD from my phone.",
    name: "Sofia Reyes",
    role: "Director, Pulse Yoga Collective",
  },
];

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: ["Features", "Pricing", "Changelog", "Roadmap"],
  },
  {
    title: "Company",
    links: ["About", "Blog", "Careers", "Contact"],
  },
  {
    title: "Resources",
    links: ["Documentation", "API reference", "Community", "Status"],
  },
  {
    title: "Legal",
    links: ["Privacy", "Terms", "Security", "Cookies"],
  },
];

/* --------------------------------- Page ---------------------------------- */

export default function LandingPage() {
  return (
    <MotionConfig reducedMotion="user">
      <div className="min-h-screen bg-white text-zinc-900 dark:bg-[#0a0d06] dark:text-zinc-100">
        <LandingNav />

        {/* Hero */}
        <section className="relative overflow-hidden pb-24 pt-40 sm:pt-44">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(132,204,22,0.18),transparent_55%)]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(rgba(132,204,22,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(132,204,22,0.8)_1px,transparent_1px)] [background-size:56px_56px] [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
          />
          <div className="relative mx-auto max-w-6xl px-4 text-center">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-gp-500/30 bg-gp-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-gp-700 dark:text-gp-300">
                <Activity className="h-3.5 w-3.5" aria-hidden />
                All systems lifting
              </span>
            </Reveal>
            <Reveal>
              <h1 className="mx-auto mt-6 max-w-3xl text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
                Run your gym like{" "}
                <span className="bg-gradient-to-r from-gp-600 via-gp-400 to-gp-600 bg-clip-text text-transparent">
                  clockwork
                </span>
              </h1>
            </Reveal>
            <Reveal>
              <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                GymPulse unifies members, leads, classes, scheduling, trainers,
                programs, attendance, POS and billing — so you can spend less
                time on admin and more time on the floor.
              </p>
            </Reveal>
            <Reveal>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-gp-500 px-7 py-3.5 text-base font-semibold text-[#10160a] shadow-lg shadow-gp-500/25 transition hover:bg-gp-400"
                >
                  Start free 14-day trial
                  <ArrowRight className="h-5 w-5" aria-hidden />
                </Link>
                <a
                  href="#features"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-300 px-7 py-3.5 text-base font-semibold text-zinc-700 transition hover:border-gp-500 hover:text-gp-600 dark:border-zinc-700 dark:text-zinc-200 dark:hover:border-gp-500 dark:hover:text-gp-400"
                >
                  See features
                </a>
              </div>
            </Reveal>
            <Reveal>
              <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-500">
                No credit card required · Cancel anytime
              </p>
            </Reveal>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-gp-600 dark:text-gp-400">
                Everything in one place
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                One dashboard for the whole operation
              </h2>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Eight connected modules that share the same member record — no
                exports, no double entry, no missed follow-ups.
              </p>
            </Reveal>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
            >
              {FEATURES.map((feature) => (
                <motion.div
                  key={feature.title}
                  variants={reveal}
                  className="group rounded-2xl border border-zinc-200 bg-white p-6 transition hover:-translate-y-1 hover:border-gp-500/40 hover:shadow-xl hover:shadow-gp-500/5 dark:border-zinc-800 dark:bg-[#0f130a]"
                >
                  <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gp-500/12 text-gp-600 transition group-hover:bg-gp-500 group-hover:text-[#10160a] dark:text-gp-400">
                    <feature.icon className="h-6 w-6" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                    {feature.body}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-24">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-gp-600 dark:text-gp-400">
                Pricing
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Plans that scale with your floor
              </h2>
              <p className="mt-4 text-zinc-600 dark:text-zinc-400">
                Every plan includes a 14-day free trial. Upgrade, downgrade or
                cancel anytime.
              </p>
            </Reveal>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="mt-14 grid gap-6 lg:grid-cols-3"
            >
              {PRICING.map((tier) => (
                <motion.div
                  key={tier.name}
                  variants={reveal}
                  className={
                    tier.highlighted
                      ? "relative rounded-2xl border-2 border-gp-500 bg-gradient-to-b from-gp-500/8 to-transparent p-8 shadow-xl shadow-gp-500/10"
                      : "rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-[#0f130a]"
                  }
                >
                  {tier.highlighted && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gp-500 px-3 py-1 text-xs font-bold uppercase tracking-wide text-[#10160a]">
                      Most popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold">{tier.name}</h3>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {tier.blurb}
                  </p>
                  <p className="mt-6 flex items-baseline gap-1">
                    <span className="text-5xl font-extrabold tracking-tight">
                      {tier.price}
                    </span>
                    <span className="text-sm font-medium text-zinc-500">
                      {tier.period}
                    </span>
                  </p>
                  <ul className="mt-6 space-y-3">
                    {tier.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm">
                        <Check
                          className="mt-0.5 h-4 w-4 shrink-0 text-gp-600 dark:text-gp-400"
                          aria-hidden
                        />
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href="/dashboard"
                    className={
                      tier.highlighted
                        ? "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gp-500 px-5 py-3 text-sm font-semibold text-[#10160a] transition hover:bg-gp-400"
                        : "mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-300 px-5 py-3 text-sm font-semibold transition hover:border-gp-500 hover:text-gp-600 dark:border-zinc-700 dark:hover:border-gp-500 dark:hover:text-gp-400"
                    }
                  >
                    {tier.cta}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-24">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal className="mx-auto max-w-2xl text-center">
              <p className="text-sm font-semibold uppercase tracking-wider text-gp-600 dark:text-gp-400">
                Loved by operators
              </p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
                Gyms that run on GymPulse
              </h2>
            </Reveal>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="mt-14 grid gap-6 lg:grid-cols-3"
            >
              {TESTIMONIALS.map((t) => (
                <motion.figure
                  key={t.name}
                  variants={reveal}
                  className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-7 dark:border-zinc-800 dark:bg-[#0f130a]"
                >
                  <div
                    className="flex gap-1 text-gp-500"
                    aria-label="5 out of 5 stars"
                  >
                    {[0, 1, 2, 3, 4].map((i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 fill-current"
                        aria-hidden
                      />
                    ))}
                  </div>
                  <blockquote className="mt-4 flex-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    &ldquo;{t.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-6 border-t border-zinc-200 pt-4 dark:border-zinc-800">
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="mt-0.5 text-xs text-zinc-500">{t.role}</p>
                  </figcaption>
                </motion.figure>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA band */}
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4">
            <Reveal>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-gp-600 via-gp-500 to-lime-400 px-8 py-16 text-center sm:px-16">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-10 [background-image:linear-gradient(rgba(0,0,0,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.7)_1px,transparent_1px)] [background-size:40px_40px]"
                />
                <div className="relative">
                  <h2 className="mx-auto max-w-2xl text-3xl font-extrabold tracking-tight text-[#0d1305] sm:text-4xl">
                    Your members deserve a front desk that never drops the bar
                  </h2>
                  <p className="mx-auto mt-4 max-w-xl text-base font-medium text-[#1a2408]/80">
                    Set up GymPulse in an afternoon. Import your members, connect
                    Stripe and start billing today.
                  </p>
                  <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-xl bg-[#0d1305] px-7 py-3.5 text-sm font-semibold text-gp-300 transition hover:bg-black"
                    >
                      Start free trial
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    </Link>
                    <Link
                      href="/dashboard"
                      className="inline-flex items-center gap-2 rounded-xl border border-[#0d1305]/25 bg-white/40 px-7 py-3.5 text-sm font-semibold text-[#0d1305] backdrop-blur transition hover:bg-white/60"
                    >
                      Book a demo
                      <BarChart3 className="h-4 w-4" aria-hidden />
                    </Link>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-zinc-200 py-16 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid gap-10 lg:grid-cols-5">
              <div className="lg:col-span-1">
                <Link href="/" className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gp-500 text-[#10160a]">
                    <Dumbbell className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="text-lg font-extrabold tracking-tight">
                    Gym<span className="text-gp-600 dark:text-gp-400">Pulse</span>
                  </span>
                </Link>
                <p className="mt-4 text-sm leading-relaxed text-zinc-500">
                  Gym & fitness studio management that runs like clockwork.
                </p>
                <p className="mt-6 flex items-center gap-1.5 text-xs text-zinc-500">
                  <CreditCard className="h-3.5 w-3.5 text-gp-500" aria-hidden />
                  Secure payments powered by Stripe
                </p>
              </div>

              {FOOTER_COLUMNS.map((col) => (
                <nav key={col.title} aria-label={col.title}>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-white">
                    {col.title}
                  </h3>
                  <ul className="mt-4 space-y-2.5">
                    {col.links.map((label) => (
                      <li key={label}>
                        <a
                          href="#"
                          className="text-sm text-zinc-500 transition hover:text-gp-600 dark:hover:text-gp-400"
                        >
                          {label}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              ))}
            </div>

            <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-zinc-200 pt-8 text-xs text-zinc-500 dark:border-zinc-800 sm:flex-row">
              <p>© 2026 GymPulse. All rights reserved.</p>
              <p className="flex items-center gap-1.5">
                <ScanLine className="h-3.5 w-3.5 text-gp-500" aria-hidden />
                Built for gyms that hate paperwork
              </p>
            </div>
          </div>
        </footer>
      </div>
    </MotionConfig>
  );
}
