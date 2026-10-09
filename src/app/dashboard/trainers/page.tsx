"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  CalendarClock,
  Mail,
  Search,
  Star,
  TrendingUp,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GP_TRAINERS, type Trainer } from "@/lib/fixtures";
import { cn, formatCurrency, formatNumber, formatPercent, getInitials } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Enrichment — fixture data doesn't carry rate/availability, so we    */
/* keep a small local map keyed by trainer id.                         */
/* ------------------------------------------------------------------ */

const HOURLY_RATE: Record<string, number> = {
  t01: 85,
  t02: 75,
  t03: 80,
  t04: 70,
  t05: 78,
  t06: 95,
  t07: 65,
  t08: 82,
};

const AVAILABILITY: Record<string, string> = {
  t01: "Mon–Fri · 6a–2p",
  t02: "Tue–Sat · 7a–1p",
  t03: "Mon–Fri · 7a–11a",
  t04: "Mon–Thu · 10a–6p",
  t05: "Tue–Sat · 6a–12p",
  t06: "Wed–Sun · 4p–9p",
  t07: "Mon–Fri · 11a–7p",
  t08: "Tue–Sat · 5p–9p",
};

const CAPACITY_HOURS = 40; // hours/week considered "fully booked"

function specialtyChips(specialty: string): string[] {
  return specialty
    .split(/\s*(?:&|and)\s*/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function loadTone(trainer: Trainer): { label: string; className: string } {
  if (trainer.hoursPerWeek >= 30) return { label: "Limited", className: "gp-badge-warning" };
  if (trainer.hoursPerWeek >= 22) return { label: "Available", className: "gp-badge-success" };
  return { label: "Open slots", className: "gp-badge-primary" };
}

/* ------------------------------------------------------------------ */
/* Small shared pieces                                                 */
/* ------------------------------------------------------------------ */

function Stars({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => {
        const full = rating >= i + 1;
        const half = !full && rating > i;
        return (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              full
                ? "fill-amber-400 text-amber-400"
                : half
                  ? "fill-amber-400/60 text-amber-400"
                  : "text-slate-300 dark:text-slate-600"
            )}
          />
        );
      })}
    </span>
  );
}

function StatCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="gp-card animate-fade-up p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--gp-text-muted)]">{label}</p>
          <p className="mt-2 text-2xl font-bold tracking-tight">{value}</p>
          <p className="mt-1 text-xs text-[var(--gp-text-muted)]">{hint}</p>
        </div>
        <span className="gp-badge-primary gp-badge p-2">{icon}</span>
      </div>
    </div>
  );
}

function TrainerCard({ trainer }: { trainer: Trainer }) {
  const chips = specialtyChips(trainer.specialty);
  const rate = HOURLY_RATE[trainer.id] ?? 75;
  const window = AVAILABILITY[trainer.id] ?? "Mon–Fri";
  const load = loadTone(trainer);
  const utilization = Math.min(100, Math.round((trainer.hoursPerWeek / CAPACITY_HOURS) * 100));

  return (
    <div className="gp-card group relative overflow-hidden p-5 transition-shadow hover:shadow-lg">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-10 -top-10 h-28 w-28 rounded-full bg-[#84cc16]/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100"
      />
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#84cc16] to-[#65a30d] text-sm font-bold text-white">
          {getInitials(trainer.name)}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-sm font-semibold">{trainer.name}</h3>
            <BadgeCheck className="h-4 w-4 shrink-0 text-[#84cc16]" aria-label="Verified trainer" />
          </div>
          <a
            href={`mailto:${trainer.email}`}
            className="mt-0.5 flex items-center gap-1 text-xs text-[var(--gp-text-muted)] hover:text-[#84cc16]"
          >
            <Mail className="h-3 w-3" />
            {trainer.email}
          </a>
        </div>
        <span className={cn("gp-badge shrink-0", load.className)}>{load.label}</span>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {chips.map((chip) => (
          <span key={chip} className="gp-badge gp-badge-primary">
            {chip}
          </span>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {trainer.certifications.map((cert) => (
          <span key={cert} className="gp-badge gp-badge-neutral">
            <BadgeCheck className="h-3 w-3" />
            {cert}
          </span>
        ))}
      </div>

      <div className="mt-4 flex items-center gap-2 border-t pt-4" style={{ borderColor: "var(--gp-border)" }}>
        <Stars rating={trainer.rating} />
        <span className="text-xs font-semibold">{trainer.rating.toFixed(1)}</span>
        <span className="ml-auto text-xs text-[var(--gp-text-muted)]">
          {formatCurrency(rate)}/hr
        </span>
      </div>

      <div className="mt-3 grid grid-cols-3 gap-3 text-center">
        <div>
          <p className="text-sm font-bold">{trainer.clients}</p>
          <p className="text-[11px] text-[var(--gp-text-muted)]">Clients</p>
        </div>
        <div>
          <p className="text-sm font-bold">{trainer.hoursPerWeek}h</p>
          <p className="text-[11px] text-[var(--gp-text-muted)]">This week</p>
        </div>
        <div>
          <p className="text-sm font-bold">{utilization}%</p>
          <p className="text-[11px] text-[var(--gp-text-muted)]">Utilization</p>
        </div>
      </div>

      <div className="mt-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--gp-surface-2)]">
          <div
            className={cn("h-full rounded-full", utilization >= 75 ? "bg-amber-500" : "bg-[#84cc16]")}
            style={{ width: `${utilization}%` }}
          />
        </div>
        <p className="mt-2 flex items-center gap-1 text-[11px] text-[var(--gp-text-muted)]">
          <CalendarClock className="h-3 w-3" />
          {window}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function TrainersPage() {
  const [query, setQuery] = useState("");
  const [specialty, setSpecialty] = useState("all");

  const specialties = useMemo(() => {
    const primaries = new Set(GP_TRAINERS.map((t) => specialtyChips(t.specialty)[0]));
    return Array.from(primaries).sort();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GP_TRAINERS.filter((t) => {
      const matchesQuery =
        !q ||
        t.name.toLowerCase().includes(q) ||
        t.specialty.toLowerCase().includes(q) ||
        t.email.toLowerCase().includes(q) ||
        t.certifications.some((c) => c.toLowerCase().includes(q));
      const matchesSpecialty =
        specialty === "all" || specialtyChips(t.specialty)[0] === specialty;
      return matchesQuery && matchesSpecialty;
    });
  }, [query, specialty]);

  const stats = useMemo(() => {
    const avgRating = GP_TRAINERS.reduce((s, t) => s + t.rating, 0) / GP_TRAINERS.length;
    const clientLoad = GP_TRAINERS.reduce((s, t) => s + t.clients, 0);
    const avgUtilization =
      GP_TRAINERS.reduce((s, t) => s + Math.min(1, t.hoursPerWeek / CAPACITY_HOURS), 0) /
      GP_TRAINERS.length;
    return { avgRating, clientLoad, avgUtilization };
  }, []);

  const chartData = useMemo(
    () =>
      GP_TRAINERS.map((t) => ({
        name: t.name.split(" ")[0],
        utilization: Math.round((t.hoursPerWeek / CAPACITY_HOURS) * 100),
        hours: t.hoursPerWeek,
      })),
    []
  );

  const reset = () => {
    setQuery("");
    setSpecialty("all");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Trainers</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            Coach roster, certifications, client load and weekly availability.
          </p>
        </div>
        <button type="button" className="gp-btn gp-btn-primary">
          <UsersRound className="h-4 w-4" />
          Add trainer
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<UsersRound className="h-4 w-4" />}
          label="Trainers"
          value={formatNumber(GP_TRAINERS.length)}
          hint={`${specialties.length} specialty areas`}
        />
        <StatCard
          icon={<Star className="h-4 w-4" />}
          label="Avg rating"
          value={stats.avgRating.toFixed(2)}
          hint="Across all coaches"
        />
        <StatCard
          icon={<UserRound className="h-4 w-4" />}
          label="Client load"
          value={formatNumber(stats.clientLoad)}
          hint={`~${Math.round(stats.clientLoad / GP_TRAINERS.length)} clients per coach`}
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Avg utilization"
          value={formatPercent(stats.avgUtilization, 0)}
          hint={`Of ${CAPACITY_HOURS}h/week capacity`}
        />
      </div>

      {/* Utilization chart */}
      <div className="gp-card">
        <div className="gp-card-header">
          <div>
            <h2 className="gp-card-title">Weekly utilization</h2>
            <p className="text-xs text-[var(--gp-text-muted)]">Scheduled hours vs {CAPACITY_HOURS}h capacity</p>
          </div>
          <span className="gp-badge gp-badge-primary">
            <Building2 className="h-3 w-3" />
            All coaches
          </span>
        </div>
        <div className="gp-card-body h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis unit="%" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <Tooltip
                cursor={{ fill: "rgba(132,204,22,0.08)" }}
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: 8,
                  color: "#f9fafb",
                  fontSize: 12,
                }}
                formatter={(value: number | string, _name, item) => [
                  `${value}% (${item.payload.hours}h)`,
                  "Utilization",
                ]}
              />
              <Bar dataKey="utilization" radius={[6, 6, 0, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.name} fill={d.utilization >= 75 ? "#f59e0b" : "#84cc16"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gp-text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, specialty or certification…"
            className="gp-input pl-9"
            aria-label="Search trainers"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {["all", ...specialties].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpecialty(s)}
              className={cn(
                "gp-btn px-3 py-1.5 text-xs",
                specialty === s ? "gp-btn-primary" : "gp-btn-ghost"
              )}
            >
              {s === "all" ? "All specialties" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      {filtered.length === 0 ? (
        <div className="gp-card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Search className="h-8 w-8 text-[var(--gp-text-muted)]" />
          <p className="text-sm font-medium">No trainers match your filters</p>
          <p className="text-xs text-[var(--gp-text-muted)]">Try another name or specialty.</p>
          <button type="button" onClick={reset} className="gp-btn gp-btn-outline mt-1">
            Reset filters
          </button>
        </div>
      ) : (
        <motion.div
          layout
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
        >
          {filtered.map((trainer, i) => (
            <motion.div
              key={trainer.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <TrainerCard trainer={trainer} />
            </motion.div>
          ))}
        </motion.div>
      )}

      <p className="text-center text-xs text-[var(--gp-text-muted)]">
        Showing {filtered.length} of {GP_TRAINERS.length} trainers
      </p>
    </div>
  );
}
