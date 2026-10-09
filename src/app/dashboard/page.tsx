"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  CalendarClock,
  CreditCard,
  DollarSign,
  Gauge,
  ScanLine,
  Sparkles,
  UserPlus,
  Users,
} from "lucide-react";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  GP_ATTENDANCE,
  GP_CLASSES,
  GP_INVOICES,
  GP_KPI,
  GP_LEADS,
  GP_MEMBERS,
  GP_TRAINERS,
  type Lead,
} from "@/lib/fixtures";
import {
  cn,
  formatCurrency,
  formatDate,
  formatNumber,
  formatPercent,
} from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Date helpers — the demo runs on fixture time so the page renders    */
/* identically on server and client (no hydration mismatches).         */
/* ------------------------------------------------------------------ */

const MONTH_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];
const MONTH_FULL = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const DOW_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DOW_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
/** Week order used by schedule strings ("Mon/Wed/Fri …"). */
const DOW_ORDER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Latest date in the attendance feed = "today" for the demo. */
const TODAY_ISO = GP_ATTENDANCE.reduce(
  (latest, r) => (r.date > latest ? r.date : latest),
  GP_ATTENDANCE[0].date
);
const [T_Y, T_M, T_D] = TODAY_ISO.split("-").map(Number);
const TODAY = new Date(T_Y, T_M - 1, T_D);
/** Demo "now": 9 AM on the latest feed day (morning stand-up view). */
const NOW = new Date(T_Y, T_M - 1, T_D, 9, 0);

function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

/** Whole days between two `YYYY-MM-DD` strings (positive when `iso` is later). */
function daysUntil(iso: string): number {
  return Math.round((parseDateOnly(iso).getTime() - TODAY.getTime()) / 86_400_000);
}

function hhmmToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function fmtClock(totalMinutes: number): string {
  const h24 = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  const suffix = h24 >= 12 ? "PM" : "AM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${h}:${String(mins).padStart(2, "0")} ${suffix}`;
}

/** "Today" / "Tomorrow" / "Fri, Oct 10" — computed from local date parts only. */
function dayChip(date: Date): string {
  const dayOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diff = Math.round((dayOnly - TODAY.getTime()) / 86_400_000);
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  if (diff === -1) return "Yesterday";
  return `${DOW_SHORT[date.getDay()]}, ${MONTH_SHORT[date.getMonth()]} ${date.getDate()}`;
}

/** "Today, 7:00 PM" / "Yesterday, 6:02 AM" / "Oct 1, 2026". */
function relLabel(dateIso: string, time?: string | null): string {
  const clock = time ? fmtClock(hhmmToMinutes(time)) : null;
  const diff = daysUntil(dateIso);
  if (diff === 0) return clock ? `Today, ${clock}` : "Today";
  if (diff === -1) return clock ? `Yesterday, ${clock}` : "Yesterday";
  return `${formatDate(dateIso)}${clock ? `, ${clock}` : ""}`;
}

/* ----------------------- Schedule parsing -------------------------- */

function toMinutes(time: string): number {
  const m = time.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!m) return 0;
  const hour = Number(m[1]) % 12;
  return (hour + (/pm/i.test(m[3]) ? 12 : 0)) * 60 + Number(m[2]);
}

function parseSchedule(schedule: string): { days: string[]; time: string; minutes: number } {
  const m = schedule.match(/^([A-Za-z/]+)\s+(.+)$/);
  const days = (m?.[1] ?? "").split("/").filter(Boolean);
  const time = (m?.[2] ?? "6:00 AM").trim();
  return { days, time, minutes: toMinutes(time) };
}

/** Next datetime a recurring schedule string fires, at or after `from`. */
function nextOccurrence(schedule: string, from: Date): Date {
  const { days, minutes } = parseSchedule(schedule);
  const fromDay = from.getDay();
  const fromMinutes = from.getHours() * 60 + from.getMinutes();
  let best: Date | null = null;

  for (const day of days) {
    const target = (DOW_ORDER.indexOf(day) + 1) % 7; // Mon -> 1 … Sun -> 0
    const diff = (target - fromDay + 7) % 7;
    const isToday = diff === 0;
    const passed = isToday && minutes <= fromMinutes;
    const offset = passed ? diff + 7 : diff;
    const candidate = new Date(
      from.getFullYear(), from.getMonth(), from.getDate() + offset,
      Math.floor(minutes / 60), minutes % 60
    );
    if (!best || candidate.getTime() < best.getTime()) best = candidate;
  }
  return best ?? new Date(from.getTime() + 7 * 86_400_000);
}

/* ----------------------- Feed / badges ----------------------------- */

type FeedKind = "checkin" | "payment" | "overdue" | "lead" | "trial";

interface FeedEvent {
  date: string;
  time: string | null;
  kind: FeedKind;
  text: string;
  sub: string;
}

const FEED_ICON: Record<FeedKind, React.ReactNode> = {
  checkin: <ScanLine className="h-3.5 w-3.5" />,
  payment: <CreditCard className="h-3.5 w-3.5" />,
  overdue: <AlertTriangle className="h-3.5 w-3.5" />,
  lead: <UserPlus className="h-3.5 w-3.5" />,
  trial: <Sparkles className="h-3.5 w-3.5" />,
};

const FEED_TONE: Record<FeedKind, string> = {
  checkin: "bg-primary-500/15 text-primary-600 dark:text-primary-400",
  payment: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  overdue: "bg-red-500/15 text-red-600 dark:text-red-400",
  lead: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  trial: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
};

const LEAD_STATUS_VARIANT: Record<Lead["status"], BadgeVariant> = {
  new: "info",
  contacted: "secondary",
  trial: "warning",
  booked: "gp",
  closed: "danger",
};

const LEAD_STATUS_LABEL: Record<Lead["status"], string> = {
  new: "New",
  contacted: "Contacted",
  trial: "Trial",
  booked: "Booked",
  closed: "Closed",
};

function followUpChip(lead: Lead): { label: string; variant: BadgeVariant } {
  if (lead.status === "closed") return { label: "Closed", variant: "secondary" };
  const d = daysUntil(lead.followUp);
  if (d < 0) return { label: `${Math.abs(d)}d overdue`, variant: "danger" };
  if (d === 0) return { label: "Due today", variant: "warning" };
  if (d === 1) return { label: "Tomorrow", variant: "warning" };
  return { label: `In ${d} days`, variant: "secondary" };
}

function scoreTone(score: number): string {
  if (score >= 80) return "bg-primary-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-slate-400";
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function DashboardPage() {
  /* ------------------------- KPI metrics --------------------------- */
  const metrics = useMemo(() => {
    const last = GP_KPI[GP_KPI.length - 1];
    const prev = GP_KPI[GP_KPI.length - 2];
    const daysElapsed = T_D; // 1-based day of month for the demo "today"
    const checkinPace = Math.round(last.checkins / daysElapsed);

    const enrolled = GP_CLASSES.reduce((s, c) => s + c.enrolled, 0);
    const capacity = GP_CLASSES.reduce((s, c) => s + c.capacity, 0);
    const nearCapacity = GP_CLASSES.filter((c) => c.enrolled / c.capacity >= 0.9).length;

    return {
      members: last.members,
      membersDelta: Number((((last.members - prev.members) / prev.members) * 100).toFixed(1)),
      capacityPct: Math.round((last.members / 500) * 100),
      checkinPace,
      checkinsMtd: last.checkins,
      revenue: last.revenue,
      revenueDelta: Number((((last.revenue - prev.revenue) / prev.revenue) * 100).toFixed(1)),
      fillRate: enrolled / capacity,
      enrolled,
      capacity,
      nearCapacity,
    };
  }, []);

  /* ------------------------- Charts data --------------------------- */
  const kpiSeries = useMemo(
    () =>
      GP_KPI.map((k) => {
        const [y, m] = k.month.split("-").map(Number);
        return {
          label: `${MONTH_SHORT[m - 1]} '${String(y).slice(2)}`,
          revenue: k.revenue,
          checkins: k.checkins,
        };
      }),
    []
  );

  const planMix = useMemo(() => {
    const counts = new Map<string, number>();
    for (const m of GP_MEMBERS) counts.set(m.plan, (counts.get(m.plan) ?? 0) + 1);
    const palette = ["#84cc16", "#0ea5e9", "#f59e0b", "#8b5cf6"];
    return Array.from(counts, ([name, value], i) => ({
      name,
      value,
      fill: palette[i % palette.length],
    }));
  }, []);

  const planTotal = planMix.reduce((s, p) => s + p.value, 0);

  /* ------------------- Upcoming classes / leads -------------------- */
  const upcoming = useMemo(
    () =>
      GP_CLASSES.map((cls) => ({ cls, at: nextOccurrence(cls.schedule, NOW) }))
        .sort((a, b) => a.at.getTime() - b.at.getTime())
        .slice(0, 5),
    []
  );

  const trainerById = useMemo(
    () => new Map(GP_TRAINERS.map((t) => [t.id, t])),
    []
  );

  const recentLeads = useMemo(
    () => [...GP_LEADS].sort((a, b) => a.followUp.localeCompare(b.followUp)).slice(0, 5),
    []
  );

  const activity = useMemo(() => {
    const events: FeedEvent[] = [];

    for (const a of GP_ATTENDANCE) {
      if (a.status !== "checked_in") continue;
      events.push({
        date: a.date,
        time: a.time,
        kind: "checkin",
        text: `${a.memberName} checked in`,
        sub: a.className ?? "Open gym floor",
      });
    }
    for (const inv of GP_INVOICES) {
      if (inv.status === "paid") {
        events.push({
          date: inv.date,
          time: null,
          kind: "payment",
          text: `Payment received · ${inv.id}`,
          sub: `${inv.memberName} — ${formatCurrency(inv.amount)}`,
        });
      } else if (inv.status === "overdue") {
        events.push({
          date: inv.date,
          time: null,
          kind: "overdue",
          text: `Invoice overdue · ${inv.id}`,
          sub: `${inv.memberName} — ${formatCurrency(inv.amount)}`,
        });
      }
    }
    for (const l of GP_LEADS) {
      if (l.status === "booked") {
        events.push({
          date: TODAY_ISO,
          time: null,
          kind: "lead",
          text: `${l.name} booked a tour`,
          sub: `${l.source} · score ${l.score}`,
        });
      } else if (l.status === "trial") {
        events.push({
          date: TODAY_ISO,
          time: null,
          kind: "trial",
          text: `${l.name} completed a trial`,
          sub: `${l.source} · score ${l.score}`,
        });
      }
    }

    events.sort((a, b) =>
      `${b.date}T${b.time ?? "00:00"}`.localeCompare(`${a.date}T${a.time ?? "00:00"}`)
    );
    return events.slice(0, 7);
  }, []);

  const headerDate = `${DOW_FULL[TODAY.getDay()]}, ${MONTH_FULL[TODAY.getMonth()]} ${TODAY.getDate()}, ${TODAY.getFullYear()}`;

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            {headerDate} · GymPulse HQ at a glance
          </p>
        </div>
        <Button leftIcon={<UserPlus className="h-4 w-4" />}>Add member</Button>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Active members"
          value={formatNumber(metrics.members)}
          delta={metrics.membersDelta}
          changeLabel="vs September"
          hint={`${metrics.capacityPct}% of 500 capacity`}
          icon={<Users className="h-5 w-5" />}
          iconTone="lime"
        />
        <MetricCard
          title="Today's check-ins"
          value={formatNumber(metrics.checkinPace)}
          subvalue={`${formatNumber(metrics.checkinsMtd)} check-ins MTD`}
          hint={`${T_D}-day pace · front desk scans`}
          icon={<ScanLine className="h-5 w-5" />}
          iconTone="sky"
        />
        <MetricCard
          title="Monthly revenue"
          value={formatCurrency(metrics.revenue)}
          delta={metrics.revenueDelta}
          changeLabel="vs September"
          hint="12-month high"
          icon={<DollarSign className="h-5 w-5" />}
          iconTone="emerald"
        />
        <MetricCard
          title="Class fill rate"
          value={formatPercent(metrics.fillRate, 1)}
          subvalue={`${formatNumber(metrics.enrolled)} of ${formatNumber(metrics.capacity)} spots booked`}
          hint={`${metrics.nearCapacity} classes ≥ 90% full`}
          icon={<Gauge className="h-5 w-5" />}
          iconTone="amber"
        />
      </div>

      {/* Revenue vs check-ins + plan mix */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Revenue vs check-ins</CardTitle>
              <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
                Trailing 12 months · {GP_KPI.length} periods
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--gp-text-muted)]">
                <span className="h-2.5 w-2.5 rounded-sm bg-[#84cc16]" aria-hidden />
                Revenue
              </span>
              <span className="flex items-center gap-1.5 text-xs font-medium text-[var(--gp-text-muted)]">
                <span className="h-2.5 w-2.5 rounded-sm bg-sky-500" aria-hidden />
                Check-ins
              </span>
            </div>
          </CardHeader>
          <CardContent className="px-2 pb-4 pt-2 sm:px-4">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={kpiSeries}
                  margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="gpRevenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#84cc16" stopOpacity={0.45} />
                      <stop offset="95%" stopColor="#84cc16" stopOpacity={0.02} />
                    </linearGradient>
                    <linearGradient id="gpCheckinsFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="rgba(148,163,184,0.2)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tickFormatter={(v: number) => `$${Math.round(v / 1000)}k`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tickFormatter={(v: number) => `${(v / 1000).toFixed(1)}k`}
                  />
                  <Tooltip
                    cursor={{ stroke: "rgba(132,204,22,0.5)", strokeWidth: 1 }}
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #374151",
                      borderRadius: 8,
                      color: "#f9fafb",
                      fontSize: 12,
                    }}
                    formatter={(value: any, name: any) => {
                      const isRevenue = String(name) === "revenue";
                      return [
                        isRevenue ? formatCurrency(Number(value)) : formatNumber(Number(value)),
                        isRevenue ? "Revenue" : "Check-ins",
                      ];
                    }}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="revenue"
                    stroke="#84cc16"
                    strokeWidth={2.5}
                    fill="url(#gpRevenueFill)"
                    activeDot={{ r: 4 }}
                  />
                  <Area
                    yAxisId="right"
                    type="monotone"
                    dataKey="checkins"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    fill="url(#gpCheckinsFill)"
                    activeDot={{ r: 4 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Plan mix</CardTitle>
            <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
              {planTotal} members on the roster
            </p>
          </CardHeader>
          <CardContent>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={planMix}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={52}
                    outerRadius={78}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {planMix.map((p) => (
                      <Cell key={p.name} fill={p.fill} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid #374151",
                      borderRadius: 8,
                      color: "#f9fafb",
                      fontSize: 12,
                    }}
                    formatter={(value: any, name: any) => [
                      `${value} members`,
                      String(name),
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="mt-3 space-y-2">
              {planMix.map((p) => (
                <li key={p.name} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: p.fill }}
                    aria-hidden
                  />
                  <span className="min-w-0 flex-1 truncate text-[var(--gp-text)]">{p.name}</span>
                  <span className="font-semibold tabular-nums">{p.value}</span>
                  <span className="w-10 text-right text-xs tabular-nums text-[var(--gp-text-muted)]">
                    {formatPercent(p.value / planTotal, 0)}
                  </span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming / leads / activity */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Upcoming classes */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Upcoming classes</CardTitle>
            <Badge variant="gp" size="sm">
              <CalendarClock className="h-3 w-3" />
              Next up
            </Badge>
          </CardHeader>
          <ul className="divide-y px-2 pb-2" style={{ borderColor: "var(--gp-border)" }}>
            {upcoming.map(({ cls, at }) => {
              const trainer = trainerById.get(cls.trainerId);
              const fill = Math.min(1, cls.enrolled / cls.capacity);
              const full = cls.enrolled >= cls.capacity;
              return (
                <li key={cls.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="w-16 shrink-0 text-center">
                    <p className="text-[11px] font-medium uppercase tracking-wide text-[var(--gp-text-muted)]">
                      {dayChip(at)}
                    </p>
                    <p className="text-sm font-bold tabular-nums">
                      {fmtClock(at.getHours() * 60 + at.getMinutes())}
                    </p>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{cls.name}</p>
                    <p className="truncate text-xs text-[var(--gp-text-muted)]">
                      {trainer?.name ?? "Unassigned"} · {cls.durationMin}m
                    </p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--gp-surface-2)]">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            full ? "bg-red-500" : fill >= 0.9 ? "bg-amber-500" : "bg-[#84cc16]"
                          )}
                          style={{ width: `${fill * 100}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-medium tabular-nums text-[var(--gp-text-muted)]">
                        {cls.enrolled}/{cls.capacity}
                      </span>
                    </div>
                  </div>
                  <Avatar name={trainer?.name ?? "?"} size="sm" />
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Recent leads */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Recent leads</CardTitle>
            <Badge variant="secondary" size="sm">
              {GP_LEADS.filter((l) => l.status !== "closed").length} open
            </Badge>
          </CardHeader>
          <ul className="divide-y px-2 pb-2" style={{ borderColor: "var(--gp-border)" }}>
            {recentLeads.map((lead) => {
              const chip = followUpChip(lead);
              return (
                <li key={lead.id} className="flex items-center gap-3 px-4 py-3">
                  <Avatar name={lead.name} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="truncate text-sm font-semibold">{lead.name}</p>
                      <Badge variant="default" size="sm">{lead.source}</Badge>
                    </div>
                    <div className="mt-1 flex items-center gap-2">
                      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--gp-surface-2)]">
                        <div
                          className={cn("h-full rounded-full", scoreTone(lead.score))}
                          style={{ width: `${lead.score}%` }}
                        />
                      </div>
                      <span className="text-[11px] tabular-nums text-[var(--gp-text-muted)]">
                        {lead.score} score
                      </span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <Badge variant={LEAD_STATUS_VARIANT[lead.status]} size="sm">
                      {LEAD_STATUS_LABEL[lead.status]}
                    </Badge>
                    <Badge variant={chip.variant} size="sm">{chip.label}</Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>

        {/* Activity feed */}
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Activity feed</CardTitle>
            <Badge variant="secondary" size="sm">Latest {activity.length}</Badge>
          </CardHeader>
          <ul className="divide-y px-2 pb-2" style={{ borderColor: "var(--gp-border)" }}>
            {activity.map((event, i) => (
              <li key={`${event.kind}-${event.date}-${event.time ?? ""}-${i}`} className="flex gap-3 px-4 py-3">
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                    FEED_TONE[event.kind]
                  )}
                  aria-hidden
                >
                  {FEED_ICON[event.kind]}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{event.text}</p>
                  <p className="truncate text-xs text-[var(--gp-text-muted)]">{event.sub}</p>
                </div>
                <span className="shrink-0 whitespace-nowrap text-[11px] text-[var(--gp-text-muted)]">
                  {relLabel(event.date, event.time)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
