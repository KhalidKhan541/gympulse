"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CalendarClock,
  CalendarDays,
  Clock,
  Gauge,
  Hourglass,
  MapPin,
  Search,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GP_CLASSES, GP_TRAINERS, type Intensity } from "@/lib/fixtures";
import { cn, formatDuration, formatNumber, formatPercent } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Enrichment — rooms and waitlists aren't part of the class fixtures,  */
/* so they live in small local maps keyed by class id.                  */
/* ------------------------------------------------------------------ */

const ROOMS: Record<string, string> = {
  c01: "Studio A",
  c02: "Studio B",
  c03: "Studio C (mats)",
  c04: "Mobility Studio",
  c05: "Cycle Room",
  c06: "Turf Floor",
  c07: "Studio C (mats)",
  c08: "Platform Room",
  c09: "Turf Floor",
  c10: "Boxing Room",
};

const WAITLIST: Record<string, number> = {
  c02: 4, // HIIT Inferno — full class
  c10: 2, // Boxing Fundamentals — full class
};

const DROP_IN_PRICE = 15;

const INTENSITY_LABEL: Record<Intensity, string> = {
  low: "Low intensity",
  medium: "Medium intensity",
  high: "High intensity",
};

const INTENSITY_VARIANT: Record<Intensity, BadgeVariant> = {
  low: "gp",
  medium: "warning",
  high: "danger",
};

function daysPerWeek(schedule: string): number {
  const days = schedule.split(" ")[0] ?? "";
  return days.split("/").filter(Boolean).length;
}

function fillTone(fill: number, full: boolean): string {
  if (full) return "bg-red-500";
  if (fill >= 0.9) return "bg-amber-500";
  return "bg-[#84cc16]";
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function ClassesPage() {
  const [query, setQuery] = useState("");
  const [intensity, setIntensity] = useState("all");

  const trainerById = useMemo(
    () => new Map(GP_TRAINERS.map((t) => [t.id, t])),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GP_CLASSES.filter((cls) => {
      const trainer = trainerById.get(cls.trainerId);
      const matchesQuery =
        !q ||
        cls.name.toLowerCase().includes(q) ||
        cls.schedule.toLowerCase().includes(q) ||
        (ROOMS[cls.id] ?? "").toLowerCase().includes(q) ||
        (trainer?.name ?? "").toLowerCase().includes(q) ||
        (trainer?.specialty ?? "").toLowerCase().includes(q);
      const matchesIntensity = intensity === "all" || cls.intensity === intensity;
      return matchesQuery && matchesIntensity;
    });
  }, [query, intensity, trainerById]);

  const stats = useMemo(() => {
    const perWeek = GP_CLASSES.reduce((s, c) => s + daysPerWeek(c.schedule), 0);
    const enrolled = GP_CLASSES.reduce((s, c) => s + c.enrolled, 0);
    const capacity = GP_CLASSES.reduce((s, c) => s + c.capacity, 0);
    const waitlisted = Object.values(WAITLIST).reduce((s, n) => s + n, 0);
    const fullClasses = GP_CLASSES.filter((c) => c.enrolled >= c.capacity);
    return {
      perWeek,
      formats: GP_CLASSES.length,
      fillRate: enrolled / capacity,
      enrolled,
      capacity,
      waitlisted,
      fullClasses,
    };
  }, []);

  const fillChart = useMemo(
    () =>
      [...GP_CLASSES]
        .map((cls) => ({
          name: cls.name.split(" ")[0],
          fullName: cls.name,
          enrolled: cls.enrolled,
          capacity: cls.capacity,
          fill: Math.round((cls.enrolled / cls.capacity) * 100),
          full: cls.enrolled >= cls.capacity,
        }))
        .sort((a, b) => b.fill - a.fill),
    []
  );

  const handleDropIn = (cls: (typeof GP_CLASSES)[number]) => {
    const full = cls.enrolled >= cls.capacity;
    const ahead = WAITLIST[cls.id] ?? 0;
    if (full) {
      toast(`${cls.name} is full — added to the waitlist (${ahead} ahead)`, {
        icon: "⏳",
      });
    } else {
      toast.success(
        `Drop-in booked · ${cls.name} — $${DROP_IN_PRICE.toFixed(2)}`
      );
    }
  };

  const reset = () => {
    setQuery("");
    setIntensity("all");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Classes</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            {stats.formats} formats, {stats.perWeek} sessions a week — fill rates at a glance.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Classes per week"
          value={formatNumber(stats.perWeek)}
          subvalue={`${stats.formats} unique formats`}
          hint="Mon–Sun programming"
          icon={<CalendarDays className="h-5 w-5" />}
          iconTone="lime"
        />
        <MetricCard
          title="Avg fill rate"
          value={formatPercent(stats.fillRate, 1)}
          subvalue={`${formatNumber(stats.enrolled)} of ${formatNumber(stats.capacity)} spots booked`}
          hint={`${stats.fullClasses.length} classes at capacity`}
          icon={<Gauge className="h-5 w-5" />}
          iconTone="amber"
        />
        <MetricCard
          title="Waitlisted"
          value={formatNumber(stats.waitlisted)}
          subvalue={`Across ${stats.fullClasses.length} full classes`}
          hint={stats.fullClasses.map((c) => c.name).join(" · ")}
          icon={<Hourglass className="h-5 w-5" />}
          iconTone="sky"
        />
      </div>

      {/* Fill rate chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Fill rate by class</CardTitle>
            <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
              Enrolled vs capacity — full classes in red
            </p>
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-4 pt-3 sm:px-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={fillChart}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.2)"
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-18}
                  textAnchor="end"
                  height={44}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  cursor={{ fill: "rgba(132,204,22,0.08)" }}
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#f9fafb",
                    fontSize: 12,
                  }}
                  formatter={(value: any, _name: any, item: any) => [
                    `${value}% · ${item?.payload?.enrolled}/${item?.payload?.capacity} booked`,
                    item?.payload?.fullName ?? "Fill rate",
                  ]}
                />
                <Bar dataKey="fill" radius={[6, 6, 0, 0]}>
                  {fillChart.map((d) => (
                    <Cell
                      key={d.fullName}
                      fill={d.full ? "#ef4444" : d.fill >= 90 ? "#f59e0b" : "#84cc16"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gp-text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search class, trainer, room or schedule…"
            className="gp-input pl-9"
            aria-label="Search classes"
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
          {(["all", "low", "medium", "high"] as const).map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIntensity(i)}
              className={cn(
                "gp-btn px-3 py-1.5 text-xs",
                intensity === i ? "gp-btn-primary" : "gp-btn-ghost"
              )}
            >
              {i === "all" ? "All intensities" : INTENSITY_LABEL[i]}
            </button>
          ))}
        </div>
      </div>

      {/* Class cards */}
      {filtered.length === 0 ? (
        <div className="gp-card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <Search className="h-8 w-8 text-[var(--gp-text-muted)]" />
          <p className="text-sm font-medium">No classes match your filters</p>
          <p className="text-xs text-[var(--gp-text-muted)]">
            Try another trainer, room or intensity.
          </p>
          <button type="button" onClick={reset} className="gp-btn gp-btn-outline mt-1">
            Reset filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((cls) => {
            const trainer = trainerById.get(cls.trainerId);
            const full = cls.enrolled >= cls.capacity;
            const fill = Math.min(1, cls.enrolled / cls.capacity);
            const spotsLeft = Math.max(0, cls.capacity - cls.enrolled);
            const waitlist = WAITLIST[cls.id] ?? 0;

            return (
              <Card key={cls.id} className="flex flex-col p-5">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold leading-tight">{cls.name}</h3>
                  <Badge variant={INTENSITY_VARIANT[cls.intensity]} size="sm">
                    {INTENSITY_LABEL[cls.intensity]}
                  </Badge>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Avatar name={trainer?.name ?? "?"} size="sm" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {trainer?.name ?? "Unassigned"}
                    </p>
                    <p className="truncate text-xs text-[var(--gp-text-muted)]">
                      {trainer?.specialty ?? ""}
                    </p>
                  </div>
                  {trainer && (
                    <span
                      className="ml-auto flex items-center gap-1 text-xs font-semibold text-amber-500"
                      title={`Trainer rating ${trainer.rating}`}
                    >
                      ★ {trainer.rating.toFixed(1)}
                    </span>
                  )}
                </div>

                <dl className="mt-4 space-y-1.5 text-xs text-[var(--gp-text-muted)]">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-3.5 w-3.5 shrink-0" />
                    <span className="font-medium text-[var(--gp-text)]">{cls.schedule}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    <span>{ROOMS[cls.id] ?? "TBD"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0" />
                    <span>{formatDuration(cls.durationMin)}</span>
                  </div>
                </dl>

                <div className="mt-4 border-t pt-4" style={{ borderColor: "var(--gp-border)" }}>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">
                      {cls.enrolled}/{cls.capacity} enrolled
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        full
                          ? "text-red-600 dark:text-red-400"
                          : spotsLeft <= 3
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-[var(--gp-text-muted)]"
                      )}
                    >
                      {full
                        ? waitlist > 0
                          ? `Full · ${waitlist} waitlisted`
                          : "Full"
                        : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--gp-surface-2)]">
                    <div
                      className={cn("h-full rounded-full transition-all", fillTone(fill, full))}
                      style={{ width: `${fill * 100}%` }}
                    />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--gp-text-muted)]">
                    Drop-in ${DROP_IN_PRICE}
                  </span>
                  <Button
                    variant={full ? "outline" : "primary"}
                    size="sm"
                    leftIcon={<Ticket className="h-3.5 w-3.5" />}
                    onClick={() => handleDropIn(cls)}
                  >
                    {full ? "Join waitlist" : "Book drop-in"}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <p className="text-center text-xs text-[var(--gp-text-muted)]">
        Showing {filtered.length} of {GP_CLASSES.length} classes · trainer load tracked on the
        <span className="mx-1 font-medium text-[var(--gp-text)]">
          <UserRound className="inline h-3 w-3" /> trainers
        </span>
        page
      </p>
    </div>
  );
}
