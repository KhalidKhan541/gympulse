"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  CalendarClock,
  CalendarDays,
  Clock,
  LayoutGrid,
  List,
  MapPin,
  MessageSquare,
  Ticket,
  X,
} from "lucide-react";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { GP_CLASSES, GP_TRAINERS, type Intensity } from "@/lib/fixtures";
import { cn, formatDate, formatDuration, formatNumber } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Demo time — the schedule always renders the fixture week so server   */
/* and client agree (no hydration drift).                              */
/* ------------------------------------------------------------------ */

const TODAY_ISO = "2026-10-08";
const [T_Y, T_M, T_D] = TODAY_ISO.split("-").map(Number);
const TODAY = new Date(T_Y, T_M - 1, T_D);
/** 0 = Monday … 6 = Sunday. */
const TODAY_WEEK_IDX = (TODAY.getDay() + 6) % 7;
const WEEK_START = new Date(T_Y, T_M - 1, T_D - TODAY_WEEK_IDX);

const DOW_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DOW_FULL = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const WEEK_DAYS = Array.from({ length: 7 }, (_, i) =>
  new Date(WEEK_START.getFullYear(), WEEK_START.getMonth(), WEEK_START.getDate() + i)
);

/* ------------------------- Time axis ------------------------------- */

const DAY_START = 5 * 60; // 5:00 AM
const DAY_END = 22 * 60; // 10:00 PM
const HOUR_H = 70; // px per hour
const GRID_H = ((DAY_END - DAY_START) / 60) * HOUR_H;
const HOURS = Array.from({ length: (DAY_END - DAY_START) / 60 + 1 }, (_, i) => 5 + i);

function fmtClock(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(mins).padStart(2, "0")} ${suffix}`;
}

function fmtHour(hour: number): string {
  const suffix = hour >= 12 ? "PM" : "AM";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${suffix}`;
}

/* ------------------------- Schedule parsing ------------------------ */

function toMinutes(time: string): number {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  const hour = Number(m[1]) % 12;
  return (hour + (/pm/i.test(m[3]) ? 12 : 0)) * 60 + Number(m[2]);
}

function parseSchedule(schedule: string): { days: string[]; minutes: number } {
  const m = schedule.match(/^([A-Za-z/]+)\s+(.+)$/);
  const days = (m?.[1] ?? "").split("/").filter(Boolean);
  return { days, minutes: toMinutes((m?.[2] ?? "6:00 AM").trim()) };
}

/* ------------------------- Sessions -------------------------------- */

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

interface Session {
  id: string;
  classId: string;
  name: string;
  dayIdx: number; // 0 = Mon … 6 = Sun
  start: number; // minutes from midnight
  duration: number;
  trainerId: string;
  room: string;
  enrolled: number;
  capacity: number;
  intensity: Intensity;
}

const SESSIONS: Session[] = GP_CLASSES.flatMap((cls) => {
  const { days, minutes } = parseSchedule(cls.schedule);
  return days.map((day) => {
    const dayIdx = DOW_ORDER.indexOf(day);
    return {
      id: `${cls.id}-${dayIdx}`,
      classId: cls.id,
      name: cls.name,
      dayIdx,
      start: minutes,
      duration: cls.durationMin,
      trainerId: cls.trainerId,
      room: ROOMS[cls.id] ?? "TBD",
      enrolled: cls.enrolled,
      capacity: cls.capacity,
      intensity: cls.intensity,
    };
  });
}).filter((s) => s.dayIdx >= 0);

/**
 * Side-by-side placement for overlapping sessions: cluster sessions that
 * intersect, then greedily assign columns within each cluster.
 */
function buildLayout(sessions: Session[]): Map<string, { col: number; cols: number }> {
  const sorted = [...sessions].sort((a, b) => a.start - b.start || b.duration - a.duration);
  const placed = new Map<string, { col: number; cols: number }>();

  let cluster: Session[] = [];
  let clusterEnd = -1;

  const flush = () => {
    if (cluster.length === 0) return;
    const colEnds: number[] = [];
    const colOf = new Map<string, number>();
    for (const s of cluster) {
      let col = colEnds.findIndex((end) => end <= s.start);
      if (col === -1) {
        col = colEnds.length;
        colEnds.push(0);
      }
      colEnds[col] = s.start + s.duration;
      colOf.set(s.id, col);
    }
    for (const s of cluster) {
      placed.set(s.id, { col: colOf.get(s.id) ?? 0, cols: colEnds.length });
    }
    cluster = [];
    clusterEnd = -1;
  };

  for (const s of sorted) {
    if (cluster.length > 0 && s.start >= clusterEnd) flush();
    cluster.push(s);
    clusterEnd = Math.max(clusterEnd, s.start + s.duration);
  }
  flush();
  return placed;
}

const LAYOUT = buildLayout(SESSIONS);

const INTENSITY_LABEL: Record<Intensity, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const INTENSITY_VARIANT: Record<Intensity, BadgeVariant> = {
  low: "gp",
  medium: "warning",
  high: "danger",
};

const BLOCK_STYLE: Record<Intensity, string> = {
  low: "border-l-[#84cc16] bg-[#84cc16]/15 hover:bg-[#84cc16]/25",
  medium: "border-l-amber-500 bg-amber-500/15 hover:bg-amber-500/25",
  high: "border-l-rose-500 bg-rose-500/15 hover:bg-rose-500/25",
};

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function SchedulePage() {
  const [view, setView] = useState<"week" | "day">("week");
  const [dayIdx, setDayIdx] = useState(TODAY_WEEK_IDX);
  const [selected, setSelected] = useState<Session | null>(null);

  const trainerById = useMemo(
    () => new Map(GP_TRAINERS.map((t) => [t.id, t])),
    []
  );

  const stats = useMemo(() => {
    const hourCounts = new Map<number, number>();
    for (const s of SESSIONS) {
      const hour = Math.floor(s.start / 60);
      hourCounts.set(hour, (hourCounts.get(hour) ?? 0) + 1);
    }
    const [peakHour, peakCount] = Array.from(hourCounts.entries()).sort(
      (a, b) => b[1] - a[1] || a[0] - b[0]
    )[0];

    const openSlots = SESSIONS.reduce(
      (sum, s) => sum + Math.max(0, s.capacity - s.enrolled),
      0
    );
    const openSessions = SESSIONS.filter((s) => s.enrolled < s.capacity).length;
    const formats = new Set(SESSIONS.map((s) => s.classId)).size;

    return {
      sessions: SESSIONS.length,
      formats,
      peakHour: fmtHour(peakHour),
      peakCount,
      openSlots,
      openSessions,
    };
  }, []);

  const weekLabel = `${formatDate(WEEK_DAYS[0], "MMM d")} – ${formatDate(
    WEEK_DAYS[6],
    "MMM d, yyyy"
  )}`;

  const visibleDays = view === "week" ? WEEK_DAYS.map((_, i) => i) : [dayIdx];

  const detailTrainer = selected ? trainerById.get(selected.trainerId) : undefined;
  const detailDay = selected ? DOW_FULL[selected.dayIdx] : "";
  const spotsLeft = selected ? Math.max(0, selected.capacity - selected.enrolled) : 0;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            {weekLabel} · {stats.sessions} sessions across {stats.formats} formats
          </p>
        </div>
        <div
          className="inline-flex self-start rounded-full bg-slate-100 p-1 sm:self-auto dark:bg-slate-800"
          role="group"
          aria-label="Schedule view"
        >
          <button
            type="button"
            onClick={() => setView("week")}
            aria-pressed={view === "week"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              view === "week"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" />
            Week
          </button>
          <button
            type="button"
            onClick={() => setView("day")}
            aria-pressed={view === "day"}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-medium transition-colors",
              view === "day"
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            )}
          >
            <List className="h-3.5 w-3.5" />
            Day
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="Sessions this week"
          value={formatNumber(stats.sessions)}
          subvalue={`${stats.formats} unique formats`}
          hint="Mon–Sun · repeating weekly"
          icon={<CalendarDays className="h-5 w-5" />}
          iconTone="lime"
        />
        <MetricCard
          title="Peak hour"
          value={stats.peakHour}
          subvalue={`${stats.peakCount} sessions start in this hour`}
          hint="Busiest coaching block"
          icon={<Clock className="h-5 w-5" />}
          iconTone="amber"
        />
        <MetricCard
          title="Open slots"
          value={formatNumber(stats.openSlots)}
          subvalue={`Across ${stats.openSessions} sessions with space`}
          hint="Bookable right now"
          icon={<Ticket className="h-5 w-5" />}
          iconTone="sky"
        />
      </div>

      {/* Day picker (day view) + legend */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        {view === "day" ? (
          <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Pick a day">
            {DOW_ORDER.map((d, i) => (
              <button
                key={d}
                type="button"
                role="tab"
                aria-selected={dayIdx === i}
                onClick={() => setDayIdx(i)}
                className={cn(
                  "gp-btn px-3 py-1.5 text-xs",
                  dayIdx === i ? "gp-btn-primary" : "gp-btn-ghost"
                )}
              >
                {d} {formatDate(WEEK_DAYS[i], "MMM d")}
                {i === TODAY_WEEK_IDX && (
                  <span className="ml-1 rounded-full bg-current/20 px-1.5 py-px text-[9px] font-bold uppercase">
                    today
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-[var(--gp-text-muted)]">
            <CalendarClock className="mr-1.5 inline h-4 w-4 align-[-2px]" />
            Click any block to open session details
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[var(--gp-text-muted)]">
          {(["low", "medium", "high"] as const).map((i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span
                className={cn("h-3 w-3 rounded-sm border-l-2", BLOCK_STYLE[i])}
                aria-hidden
              />
              {INTENSITY_LABEL[i]} intensity
            </span>
          ))}
        </div>
      </div>

      {/* Grid + detail panel */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[860px] p-4">
                {/* Day headers */}
                <div
                  className="grid gap-px"
                  style={{
                    gridTemplateColumns: `56px repeat(${visibleDays.length}, minmax(0,1fr))`,
                  }}
                >
                  <div aria-hidden />
                  {visibleDays.map((i) => {
                    const isToday = i === TODAY_WEEK_IDX;
                    return (
                      <div
                        key={i}
                        className={cn(
                          "rounded-t-lg px-2 py-2 text-center",
                          isToday && "bg-primary-500/10"
                        )}
                      >
                        <p
                          className={cn(
                            "text-[11px] font-semibold uppercase tracking-wider",
                            isToday
                              ? "text-primary-600 dark:text-primary-400"
                              : "text-[var(--gp-text-muted)]"
                          )}
                        >
                          {DOW_ORDER[i]}
                        </p>
                        <p className="text-sm font-bold tabular-nums">
                          {formatDate(WEEK_DAYS[i], "MMM d")}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Time grid */}
                <div
                  className="grid gap-px"
                  style={{
                    gridTemplateColumns: `56px repeat(${visibleDays.length}, minmax(0,1fr))`,
                  }}
                >
                  {/* Gutter */}
                  <div className="relative" style={{ height: GRID_H }}>
                    {HOURS.map((h) => (
                      <span
                        key={h}
                        className="absolute right-2 -translate-y-1/2 text-[10px] font-medium tabular-nums text-[var(--gp-text-muted)]"
                        style={{ top: ((h * 60 - DAY_START) / 60) * HOUR_H }}
                      >
                        {fmtHour(h)}
                      </span>
                    ))}
                  </div>

                  {/* Day columns */}
                  {visibleDays.map((i) => {
                    const daySessions = SESSIONS.filter((s) => s.dayIdx === i);
                    return (
                      <div
                        key={i}
                        className={cn(
                          "relative rounded-md",
                          i === TODAY_WEEK_IDX && "bg-primary-500/[0.04]"
                        )}
                        style={{ height: GRID_H }}
                      >
                        {HOURS.map((h) => (
                          <div
                            key={h}
                            className="absolute inset-x-0 border-t border-slate-200/70 dark:border-slate-800"
                            style={{ top: ((h * 60 - DAY_START) / 60) * HOUR_H }}
                            aria-hidden
                          />
                        ))}

                        {daySessions.map((s) => {
                          const place = LAYOUT.get(s.id) ?? { col: 0, cols: 1 };
                          const trainer = trainerById.get(s.trainerId);
                          const compact = s.duration < 45;
                          const isSelected = selected?.id === s.id;
                          const full = s.enrolled >= s.capacity;
                          return (
                            <button
                              key={s.id}
                              type="button"
                              onClick={() => setSelected(s)}
                              aria-label={`${s.name}, ${DOW_FULL[s.dayIdx]} at ${fmtClock(s.start)}`}
                              className={cn(
                                "absolute overflow-hidden rounded-md border-l-4 px-2 py-1 text-left transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                                BLOCK_STYLE[s.intensity],
                                isSelected && "ring-2 ring-primary-500 shadow-md"
                              )}
                              style={{
                                top: ((s.start - DAY_START) / 60) * HOUR_H,
                                height: Math.max(34, (s.duration / 60) * HOUR_H - 3),
                                left: `calc(${(place.col * 100) / place.cols}% + 3px)`,
                                width: `calc(${100 / place.cols}% - 6px)`,
                              }}
                            >
                              <p className="truncate text-[10px] font-semibold tabular-nums opacity-70">
                                {fmtClock(s.start)}
                              </p>
                              <p className="truncate text-xs font-bold leading-tight">
                                {s.name}
                              </p>
                              {!compact && (
                                <>
                                  <p className="truncate text-[10px] opacity-80">
                                    {trainer?.name.split(" ")[0] ?? "—"} · {s.room}
                                  </p>
                                  <p
                                    className={cn(
                                      "truncate text-[10px] font-semibold tabular-nums",
                                      full && "text-red-600 dark:text-red-400"
                                    )}
                                  >
                                    {s.enrolled}/{s.capacity} booked
                                  </p>
                                </>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Detail panel */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          {selected ? (
            <Card>
              <CardHeader className="flex-row items-start justify-between gap-2">
                <div>
                  <Badge variant={INTENSITY_VARIANT[selected.intensity]} size="sm">
                    {INTENSITY_LABEL[selected.intensity]} intensity
                  </Badge>
                  <CardTitle className="mt-2">{selected.name}</CardTitle>
                  <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
                    {detailDay}, {formatDate(WEEK_DAYS[selected.dayIdx])}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded-full p-1.5 text-[var(--gp-text-muted)] transition-colors hover:bg-[var(--gp-surface-2)] hover:text-[var(--gp-text)]"
                  aria-label="Close session details"
                >
                  <X className="h-4 w-4" />
                </button>
              </CardHeader>
              <CardContent className="space-y-4">
                <dl className="space-y-2.5 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-1.5 text-xs text-[var(--gp-text-muted)]">
                      <Clock className="h-3.5 w-3.5" />
                      Time
                    </dt>
                    <dd className="font-semibold tabular-nums">
                      {fmtClock(selected.start)} –{" "}
                      {fmtClock(selected.start + selected.duration)}
                      <span className="ml-2 text-xs font-normal text-[var(--gp-text-muted)]">
                        {formatDuration(selected.duration)}
                      </span>
                    </dd>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <dt className="flex items-center gap-1.5 text-xs text-[var(--gp-text-muted)]">
                      <MapPin className="h-3.5 w-3.5" />
                      Room
                    </dt>
                    <dd className="font-semibold">{selected.room}</dd>
                  </div>
                </dl>

                <div
                  className="flex items-center gap-3 rounded-lg border p-3"
                  style={{ borderColor: "var(--gp-border)" }}
                >
                  <Avatar name={detailTrainer?.name ?? "?"} size="md" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {detailTrainer?.name ?? "Unassigned"}
                    </p>
                    <p className="truncate text-xs text-[var(--gp-text-muted)]">
                      {detailTrainer?.specialty ?? ""}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold">
                      {selected.enrolled}/{selected.capacity} booked
                    </span>
                    <span
                      className={cn(
                        "font-medium",
                        spotsLeft === 0
                          ? "text-red-600 dark:text-red-400"
                          : "text-[var(--gp-text-muted)]"
                      )}
                    >
                      {spotsLeft === 0
                        ? "Class full"
                        : `${spotsLeft} spot${spotsLeft === 1 ? "" : "s"} left`}
                    </span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-[var(--gp-surface-2)]">
                    <div
                      className={cn(
                        "h-full rounded-full",
                        spotsLeft === 0
                          ? "bg-red-500"
                          : selected.enrolled / selected.capacity >= 0.9
                            ? "bg-amber-500"
                            : "bg-[#84cc16]"
                      )}
                      style={{
                        width: `${Math.min(100, (selected.enrolled / selected.capacity) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <Button
                  className="w-full"
                  leftIcon={<MessageSquare className="h-4 w-4" />}
                  onClick={() =>
                    toast.success(
                      `Reminder sent to ${selected.enrolled} members · ${selected.name}`
                    )
                  }
                >
                  Message roster
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                <CalendarClock className="h-8 w-8 text-[var(--gp-text-muted)]" />
                <p className="text-sm font-medium">No session selected</p>
                <p className="text-xs text-[var(--gp-text-muted)]">
                  Click a block in the grid to see time, trainer, room and enrollment.
                </p>
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </div>
  );
}
