"use client";

/* ==================================================================
 * GymPulse — Weekly Class Schedule
 * Time-positioned week grid (Mon–Sun) built from GP_CLASSES, with a
 * day-list view, intensity filters, an hourly load chart and a
 * booking detail panel. Static demo clock keeps SSR/CSR identical.
 * ================================================================== */

import { useMemo, useState } from "react";
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
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Clock,
  Flame,
  Gauge,
  LayoutGrid,
  List,
  Maximize2,
  Timer,
  Users,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import Card, {
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import Badge from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  GP_CLASSES,
  trainerById,
  type GymClass,
  type Intensity,
} from "@/lib/fixtures";
import { cn, formatNumber } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Static demo clock — fixed label avoids hydration drift.             */
/* ------------------------------------------------------------------ */

const WEEK_LABEL = "Oct 5 – 11, 2026";

const DAYS = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
] as const;
type Day = (typeof DAYS)[number];

const DAY_FULL: Record<Day, string> = {
  Mon: "Monday",
  Tue: "Tuesday",
  Wed: "Wednesday",
  Thu: "Thursday",
  Fri: "Friday",
  Sat: "Saturday",
  Sun: "Sunday",
};

/** Grid window — classes outside 5 AM–10 PM are clamped into view. */
const START_HOUR = 5;
const END_HOUR = 22;
const PX_PER_HOUR = 72;

const ROOMS: Record<string, string> = {
  c01: "Strength Floor",
  c02: "Studio A",
  c03: "Yoga Loft",
  c04: "Mobility Studio",
  c05: "Cycle Room",
  c06: "Studio B",
  c07: "Yoga Loft",
  c08: "Olympic Platform",
  c09: "Studio A",
  c10: "Combat Room",
};

/* ------------------------------------------------------------------ */
/* Schedule parsing                                                    */
/* ------------------------------------------------------------------ */

interface Occurrence {
  key: string;
  cls: GymClass;
  day: Day;
  startMin: number; // minutes from midnight
  endMin: number;
}

const TIME_RE = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;

function parseTimeToMin(raw: string): number {
  const m = TIME_RE.exec(raw.trim());
  if (!m) return 9 * 60;
  let hour = Number(m[1]) % 12;
  const minute = Number(m[2]);
  if (m[3].toUpperCase() === "PM") hour += 12;
  return hour * 60 + minute;
}

/** "Mon/Wed/Fri 6:00 AM" -> { days, startMin } */
function parseSchedule(schedule: string): { days: Day[]; startMin: number } {
  const parts = schedule.trim().split(/\s+/);
  const timeRaw = parts[parts.length - 1] ?? "9:00 AM";
  const dayRaw = parts.slice(0, -1).join(" ");
  const days = dayRaw
    .split("/")
    .map((d) => d.trim().slice(0, 3))
    .filter((d): d is Day =>
      DAYS.includes(d.charAt(0).toUpperCase() + d.slice(1, 3).toLowerCase() as Day)
    )
    .map((d) => (d.charAt(0).toUpperCase() + d.slice(1, 3).toLowerCase()) as Day);
  return { days: days.length ? days : ["Mon"], startMin: parseTimeToMin(timeRaw) };
}

function buildOccurrences(): Occurrence[] {
  const out: Occurrence[] = [];
  for (const cls of GP_CLASSES) {
    const { days, startMin } = parseSchedule(cls.schedule);
    for (const day of days) {
      out.push({
        key: `${cls.id}-${day}`,
        cls,
        day,
        startMin,
        endMin: startMin + cls.durationMin,
      });
    }
  }
  return out;
}

function fmtTime(min: number): string {
  const h24 = Math.floor(min / 60) % 24;
  const m = min % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 || 12;
  return `${h}:${String(m).padStart(2, "0")} ${suffix}`;
}

/* ------------------------------------------------------------------ */
/* Intensity styling                                                   */
/* ------------------------------------------------------------------ */

const INTENSITY_UI: Record<
  Intensity,
  { label: string; chip: "danger" | "warning" | "info"; block: string; dot: string }
> = {
  high: {
    label: "High",
    chip: "danger",
    block:
      "border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/15 border-l-rose-500",
    dot: "bg-rose-500",
  },
  medium: {
    label: "Medium",
    chip: "warning",
    block:
      "border-primary-500/40 bg-primary-500/10 hover:bg-primary-500/15 border-l-primary-500",
    dot: "bg-primary-500",
  },
  low: {
    label: "Low",
    chip: "info",
    block: "border-sky-500/40 bg-sky-500/10 hover:bg-sky-500/15 border-l-sky-500",
    dot: "bg-sky-500",
  },
};

const CHART_COLOR: Record<Intensity, string> = {
  high: "#f43f5e",
  medium: "#84cc16",
  low: "#0ea5e9",
};

/* ================================================================== */
/* Page                                                                */
/* ================================================================== */

export default function SchedulePage() {
  const occurrences = useMemo(() => buildOccurrences(), []);

  const [view, setView] = useState<"week" | "day">("week");
  const [activeDay, setActiveDay] = useState<Day>("Mon");
  const [intensity, setIntensity] = useState<"all" | Intensity>("all");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [booked, setBooked] = useState<Set<string>>(new Set());

  const filtered = useMemo(
    () =>
      intensity === "all"
        ? occurrences
        : occurrences.filter((o) => o.cls.intensity === intensity),
    [occurrences, intensity]
  );

  const dayOccurrences = useMemo(
    () => filtered.filter((o) => o.day === activeDay).sort((a, b) => a.startMin - b.startMin),
    [filtered, activeDay]
  );

  const selected = useMemo(
    () => filtered.find((o) => o.key === selectedKey) ?? null,
    [filtered, selectedKey]
  );

  /* --------------------------- stats --------------------------- */

  const stats = useMemo(() => {
    const sessions = filtered.length;
    const openSlots = filtered.reduce(
      (sum, o) => sum + Math.max(0, o.cls.capacity - o.cls.enrolled),
      0
    );
    const fillRate = filtered.length
      ? Math.round(
          (filtered.reduce((s, o) => s + o.cls.enrolled / o.cls.capacity, 0) /
            filtered.length) *
            100
        )
      : 0;

    const byHour = new Map<number, number>();
    for (const o of filtered) {
      const h = Math.floor(o.startMin / 60);
      byHour.set(h, (byHour.get(h) ?? 0) + 1);
    }
    let peakHour = -1;
    let peakCount = 0;
    for (const [h, c] of byHour) {
      if (c > peakCount) {
        peakCount = c;
        peakHour = h;
      }
    }

    const hourChart = Array.from({ length: END_HOUR - START_HOUR }, (_, i) => {
      const h = START_HOUR + i;
      return { hour: fmtTime(h * 60).replace(":00", ""), sessions: byHour.get(h) ?? 0 };
    });

    return { sessions, openSlots, fillRate, peakHour, peakCount, hourChart };
  }, [filtered]);

  /* ------------------------- interactions ------------------------- */

  const toggleBook = (o: Occurrence) => {
    const cls = o.cls;
    if (cls.enrolled >= cls.capacity && !booked.has(o.key)) {
      toast.error(`${cls.name} is full — join the waitlist instead`);
      return;
    }
    setBooked((prev) => {
      const next = new Set(prev);
      if (next.has(o.key)) {
        next.delete(o.key);
        toast.success(`Drop-in released for ${cls.name} (${DAY_FULL[o.day]})`);
      } else {
        next.add(o.key);
        toast.success(`Drop-in booked: ${cls.name} — ${DAY_FULL[o.day]} ${fmtTime(o.startMin)}`);
      }
      return next;
    });
  };

  const openDetail = (o: Occurrence) => setSelectedKey(o.key);
  const closeDetail = () => setSelectedKey(null);

  /* --------------------------------------------------------------- */

  const gridHeight = (END_HOUR - START_HOUR) * PX_PER_HOUR;

  return (
    <div className="space-y-6">
      {/* ------------------------- header ------------------------- */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            Weekly class timetable · {WEEK_LABEL}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-[var(--gp-border)] bg-[var(--gp-surface)] p-1">
            <button
              type="button"
              onClick={() => setView("week")}
              aria-pressed={view === "week"}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "week"
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" aria-hidden />
              Week
            </button>
            <button
              type="button"
              onClick={() => setView("day")}
              aria-pressed={view === "day"}
              className={cn(
                "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                view === "day"
                  ? "bg-primary-500 text-white shadow-sm"
                  : "text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
              )}
            >
              <List className="h-3.5 w-3.5" aria-hidden />
              Day
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------- stats ------------------------- */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Sessions this week"
          value={formatNumber(stats.sessions)}
          subvalue={`${filtered.length ? new Set(filtered.map((o) => o.cls.id)).size : 0} unique classes`}
          icon={<CalendarDays className="h-5 w-5" aria-hidden />}
          iconTone="lime"
        />
        <MetricCard
          title="Peak hour"
          value={stats.peakHour >= 0 ? fmtTime(stats.peakHour * 60) : "—"}
          subvalue={
            stats.peakHour >= 0 ? `${stats.peakCount} sessions on the hour` : "No sessions"
          }
          icon={<Flame className="h-5 w-5" aria-hidden />}
          iconTone="rose"
        />
        <MetricCard
          title="Open slots"
          value={formatNumber(stats.openSlots)}
          subvalue="Across all scheduled classes"
          icon={<Users className="h-5 w-5" aria-hidden />}
          iconTone="sky"
        />
        <MetricCard
          title="Avg fill rate"
          value={`${stats.fillRate}%`}
          subvalue="Enrolled vs capacity"
          icon={<Gauge className="h-5 w-5" aria-hidden />}
          iconTone="amber"
        />
      </div>

      {/* --------------------- intensity filter --------------------- */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-[var(--gp-text-muted)]">
          Intensity:
        </span>
        {(["all", "low", "medium", "high"] as const).map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => setIntensity(i)}
            className={cn(
              "gp-btn px-3 py-1.5 text-xs capitalize",
              intensity === i ? "gp-btn-primary" : "gp-btn-ghost"
            )}
          >
            {i === "all" ? "All levels" : i}
          </button>
        ))}
      </div>

      {/* ----------------------- day switcher ---------------------- */}
      {view === "day" && (
        <div className="flex flex-wrap gap-2">
          {DAYS.map((d) => {
            const count = filtered.filter((o) => o.day === d).length;
            return (
              <button
                key={d}
                type="button"
                onClick={() => setActiveDay(d)}
                aria-pressed={activeDay === d}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium transition-colors",
                  activeDay === d
                    ? "border-primary-500/50 bg-primary-500/10 text-primary-600 dark:text-primary-400"
                    : "border-[var(--gp-border)] bg-[var(--gp-surface)] text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
                )}
              >
                {DAY_FULL[d]}
                <span
                  className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                    activeDay === d
                      ? "bg-primary-500 text-white"
                      : "bg-[var(--gp-bg)] text-[var(--gp-text-muted)]"
                  )}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ------------------------ main + side ---------------------- */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* -------------------- schedule surface ------------------- */}
        <div className="xl:col-span-2">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <div>
                <CardTitle>
                  {view === "week" ? "Week grid" : `${DAY_FULL[activeDay]} sessions`}
                </CardTitle>
                <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
                  {view === "week"
                    ? "Click any session for details and drop-in booking"
                    : `${dayOccurrences.length} session${dayOccurrences.length === 1 ? "" : "s"} scheduled`}
                </p>
              </div>
              <div className="hidden items-center gap-3 sm:flex">
                {(Object.keys(INTENSITY_UI) as Intensity[]).map((i) => (
                  <span
                    key={i}
                    className="flex items-center gap-1 text-[11px] font-medium text-[var(--gp-text-muted)]"
                  >
                    <span className={cn("h-2 w-2 rounded-full", INTENSITY_UI[i].dot)} aria-hidden />
                    {INTENSITY_UI[i].label}
                  </span>
                ))}
              </div>
            </CardHeader>

            <CardContent>
              {view === "week" ? (
                /* ---------------------- week grid ------------------- */
                <div className="overflow-x-auto">
                  <div className="min-w-[760px]">
                    {/* day header row */}
                    <div className="grid grid-cols-[52px_repeat(7,1fr)] border-b border-[var(--gp-border)] pb-2">
                      <div aria-hidden />
                      {DAYS.map((d) => {
                        const count = filtered.filter((o) => o.day === d).length;
                        return (
                          <div key={d} className="px-1.5 text-center">
                            <div className="text-xs font-semibold">{d}</div>
                            <div className="text-[10px] text-[var(--gp-text-muted)]">
                              {count} session{count === 1 ? "" : "s"}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* time grid */}
                    <div className="relative grid grid-cols-[52px_repeat(7,1fr)]">
                      {/* time gutter */}
                      <div className="relative" style={{ height: gridHeight }}>
                        {Array.from(
                          { length: END_HOUR - START_HOUR },
                          (_, i) => (
                            <div
                              key={i}
                              className="absolute right-2 -translate-y-1/2 text-[10px] font-medium text-[var(--gp-text-muted)]"
                              style={{ top: i * PX_PER_HOUR }}
                            >
                              {fmtTime((START_HOUR + i) * 60).replace(":00", "")}
                            </div>
                          )
                        )}
                      </div>

                      {/* day columns */}
                      {DAYS.map((d) => (
                        <div
                          key={d}
                          className="relative border-l border-[var(--gp-border)]"
                          style={{ height: gridHeight }}
                        >
                          {/* hour lines */}
                          {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
                            <div
                              key={i}
                              className="absolute inset-x-0 border-t border-dashed border-[var(--gp-border)]/60"
                              style={{ top: i * PX_PER_HOUR }}
                              aria-hidden
                            />
                          ))}

                          {/* blocks */}
                          {filtered
                            .filter((o) => o.day === d)
                            .map((o) => {
                              const top =
                                ((Math.max(o.startMin, START_HOUR * 60) - START_HOUR * 60) /
                                  60) *
                                PX_PER_HOUR;
                              const height = Math.max(
                                46,
                                ((Math.min(o.endMin, END_HOUR * 60) -
                                  Math.max(o.startMin, START_HOUR * 60)) /
                                  60) *
                                  PX_PER_HOUR
                              );
                              const full = o.cls.enrolled >= o.cls.capacity;
                              const isSelected = selectedKey === o.key;
                              const isBooked = booked.has(o.key);
                              return (
                                <button
                                  key={o.key}
                                  type="button"
                                  onClick={() => openDetail(o)}
                                  aria-label={`${o.cls.name}, ${DAY_FULL[o.day]} ${fmtTime(o.startMin)}`}
                                  className={cn(
                                    "absolute inset-x-1 overflow-hidden rounded-md border border-l-4 px-2 py-1.5 text-left transition-all",
                                    "focus:outline-none focus:ring-2 focus:ring-primary-500/50",
                                    INTENSITY_UI[o.cls.intensity].block,
                                    isSelected && "ring-2 ring-primary-500/60",
                                    isBooked && "ring-1 ring-primary-400"
                                  )}
                                  style={{ top, height }}
                                >
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="truncate text-[11px] font-semibold leading-tight">
                                      {o.cls.name}
                                    </span>
                                    {isBooked && (
                                      <CheckCircle2
                                        className="h-3 w-3 shrink-0 text-primary-500"
                                        aria-label="Booked"
                                      />
                                    )}
                                  </div>
                                  <div className="mt-0.5 text-[10px] text-[var(--gp-text-muted)]">
                                    {fmtTime(o.startMin)}
                                    {height > 56 && ` · ${o.cls.durationMin}m`}
                                  </div>
                                  {height > 72 && (
                                    <div className="mt-1.5 flex items-center gap-1.5">
                                      <span
                                        className={cn(
                                          "h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--gp-bg)]"
                                        )}
                                        aria-hidden
                                      >
                                        <span
                                          className={cn(
                                            "block h-full rounded-full",
                                            full ? "bg-rose-500" : "bg-primary-500"
                                          )}
                                          style={{
                                            width: `${Math.min(100, Math.round((o.cls.enrolled / o.cls.capacity) * 100))}%`,
                                          }}
                                        />
                                      </span>
                                      <span className="text-[10px] font-medium text-[var(--gp-text-muted)]">
                                        {o.cls.enrolled}/{o.cls.capacity}
                                      </span>
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* ---------------------- day list ------------------- */
                <ul className="divide-y divide-[var(--gp-border)]">
                  {dayOccurrences.length === 0 && (
                    <li className="py-10 text-center text-sm text-[var(--gp-text-muted)]">
                      No sessions on {DAY_FULL[activeDay]} with this filter.
                    </li>
                  )}
                  {dayOccurrences.map((o) => {
                    const trainer = trainerById(o.cls.trainerId);
                    const pct = Math.min(
                      100,
                      Math.round((o.cls.enrolled / o.cls.capacity) * 100)
                    );
                    const full = o.cls.enrolled >= o.cls.capacity;
                    const isSelected = selectedKey === o.key;
                    return (
                      <li key={o.key}>
                        <button
                          type="button"
                          onClick={() => openDetail(o)}
                          className={cn(
                            "flex w-full items-center gap-4 px-2 py-3.5 text-left transition-colors hover:bg-[var(--gp-bg)]/60",
                            isSelected && "bg-primary-500/5"
                          )}
                        >
                          <div className="w-24 shrink-0">
                            <div className="text-sm font-semibold">
                              {fmtTime(o.startMin)}
                            </div>
                            <div className="text-xs text-[var(--gp-text-muted)]">
                              {o.cls.durationMin} min
                            </div>
                          </div>
                          <span
                            className={cn(
                              "h-9 w-1 shrink-0 rounded-full",
                              INTENSITY_UI[o.cls.intensity].dot
                            )}
                            aria-hidden
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="truncate text-sm font-medium">
                                {o.cls.name}
                              </span>
                              <Badge variant={INTENSITY_UI[o.cls.intensity].chip} size="sm">
                                {INTENSITY_UI[o.cls.intensity].label}
                              </Badge>
                              {booked.has(o.key) && (
                                <Badge variant="gp" size="sm">
                                  Drop-in
                                </Badge>
                              )}
                            </div>
                            <div className="mt-1 flex items-center gap-2 text-xs text-[var(--gp-text-muted)]">
                              {trainer && <Avatar name={trainer.name} size="xs" />}
                              <span className="truncate">{trainer?.name}</span>
                              <span aria-hidden>·</span>
                              <span>{ROOMS[o.cls.id] ?? "Studio"}</span>
                            </div>
                          </div>
                          <div className="hidden w-32 shrink-0 sm:block">
                            <div className="flex justify-between text-[11px] text-[var(--gp-text-muted)]">
                              <span>{pct}% full</span>
                              <span>
                                {o.cls.enrolled}/{o.cls.capacity}
                              </span>
                            </div>
                            <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-[var(--gp-bg)]">
                              <span
                                className={cn(
                                  "block h-full rounded-full",
                                  full ? "bg-rose-500" : "bg-primary-500"
                                )}
                                style={{ width: `${pct}%` }}
                              />
                            </span>
                          </div>
                          <ChevronRight
                            className="h-4 w-4 shrink-0 text-[var(--gp-text-muted)]"
                            aria-hidden
                          />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ------------------------- side rail ---------------------- */}
        <div className="space-y-6">
          {/* detail panel */}
          {selected ? (
            <Card variant="elevated">
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle>{selected.cls.name}</CardTitle>
                    <Badge variant={INTENSITY_UI[selected.cls.intensity].chip} size="sm">
                      {INTENSITY_UI[selected.cls.intensity].label}
                    </Badge>
                  </div>
                  <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
                    {DAY_FULL[selected.day]} · {fmtTime(selected.startMin)} –{" "}
                    {fmtTime(selected.endMin)} · {selected.cls.durationMin} min
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeDetail}
                  aria-label="Close session details"
                  className="rounded-md p-1 text-[var(--gp-text-muted)] transition-colors hover:bg-[var(--gp-bg)] hover:text-[var(--gp-text)]"
                >
                  <X className="h-4 w-4" aria-hidden />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const trainer = trainerById(selected.cls.trainerId);
                  const pct = Math.min(
                    100,
                    Math.round((selected.cls.enrolled / selected.cls.capacity) * 100)
                  );
                  const full = selected.cls.enrolled >= selected.cls.capacity;
                  return (
                    <>
                      {trainer && (
                        <div className="flex items-center gap-3 rounded-lg border border-[var(--gp-border)] bg-[var(--gp-bg)]/60 p-3">
                          <Avatar name={trainer.name} size="md" />
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">
                              {trainer.name}
                            </div>
                            <div className="truncate text-xs text-[var(--gp-text-muted)]">
                              {trainer.specialty} · ★ {trainer.rating.toFixed(1)}
                            </div>
                          </div>
                        </div>
                      )}

                      <dl className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <dt className="text-xs text-[var(--gp-text-muted)]">Room</dt>
                          <dd className="mt-0.5 font-medium">
                            {ROOMS[selected.cls.id] ?? "Studio"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[var(--gp-text-muted)]">Duration</dt>
                          <dd className="mt-0.5 flex items-center gap-1 font-medium">
                            <Timer className="h-3.5 w-3.5 text-[var(--gp-text-muted)]" aria-hidden />
                            {selected.cls.durationMin} min
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[var(--gp-text-muted)]">Start</dt>
                          <dd className="mt-0.5 flex items-center gap-1 font-medium">
                            <Clock className="h-3.5 w-3.5 text-[var(--gp-text-muted)]" aria-hidden />
                            {fmtTime(selected.startMin)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs text-[var(--gp-text-muted)]">Repeats</dt>
                          <dd className="mt-0.5 font-medium">{selected.cls.schedule}</dd>
                        </div>
                      </dl>

                      <div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--gp-text-muted)]">Enrollment</span>
                          <span className={cn("font-semibold", full ? "text-rose-500" : "text-primary-600 dark:text-primary-400")}>
                            {selected.cls.enrolled}/{selected.cls.capacity} · {pct}%
                          </span>
                        </div>
                        <span className="mt-1.5 block h-2 overflow-hidden rounded-full bg-[var(--gp-bg)]">
                          <span
                            className={cn("block h-full rounded-full", full ? "bg-rose-500" : "bg-primary-500")}
                            style={{ width: `${pct}%` }}
                          />
                        </span>
                        {full && (
                          <p className="mt-1.5 text-xs font-medium text-rose-500">
                            At capacity — drop-ins join the waitlist.
                          </p>
                        )}
                      </div>

                      <Button
                        variant={booked.has(selected.key) ? "outline" : "primary"}
                        className="w-full"
                        onClick={() => toggleBook(selected)}
                      >
                        {booked.has(selected.key)
                          ? "Release drop-in"
                          : full
                            ? "Join waitlist"
                            : "Book drop-in"}
                      </Button>
                    </>
                  );
                })()}
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-10 text-center">
                <Maximize2
                  className="mx-auto h-8 w-8 text-[var(--gp-text-muted)]"
                  aria-hidden
                />
                <p className="mt-3 text-sm font-medium">No session selected</p>
                <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
                  Click a block in the grid or a row in the day list to preview
                  details and book a drop-in.
                </p>
              </CardContent>
            </Card>
          )}

          {/* hourly load chart */}
          <Card>
            <CardHeader>
              <CardTitle>Sessions by hour</CardTitle>
              <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
                When the floor is busiest this week
              </p>
            </CardHeader>
            <CardContent className="px-2 pb-4 pt-2 sm:px-4">
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={stats.hourChart}
                    margin={{ top: 4, right: 8, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="rgba(148,163,184,0.2)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="hour"
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis
                      allowDecimals={false}
                      tick={{ fontSize: 10, fill: "#94a3b8" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "rgba(132,204,22,0.08)" }}
                      contentStyle={{
                        background: "var(--gp-surface, #fff)",
                        border: "1px solid var(--gp-border, #e2e8f0)",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(value) => [`${value} sessions`, "Scheduled"]}
                    />
                    <Bar dataKey="sessions" radius={[4, 4, 0, 0]}>
                      {stats.hourChart.map((entry, i) => (
                        <Cell
                          key={i}
                          fill={
                            entry.sessions === stats.peakCount && stats.peakCount > 0
                              ? CHART_COLOR.high
                              : "#84cc16"
                          }
                          fillOpacity={0.85}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
