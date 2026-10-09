"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  CalendarX2,
  Clock,
  QrCode,
  ScanLine,
  Search,
  SearchX,
  UserCheck,
  UserX,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  GP_ATTENDANCE,
  GP_CLASSES,
  GP_MEMBERS,
  type AttendanceRecord,
} from "@/lib/fixtures";
import { cn, formatDate, formatNumber, getInitials } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Derived "late" status — a check-in more than 5 minutes after the    */
/* class start (parsed from the class schedule) counts as late.        */
/* ------------------------------------------------------------------ */

type DisplayStatus = "checked_in" | "late" | "no_show" | "cancelled";

const CLASS_START_MIN: Record<string, number | null> = Object.fromEntries(
  GP_CLASSES.map((c): [string, number | null] => [c.name, parseScheduleStart(c.schedule)])
);

function parseScheduleStart(schedule: string): number | null {
  const match = schedule.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
  if (!match) return null;
  let hours = parseInt(match[1], 10) % 12;
  if (match[3].toUpperCase() === "PM") hours += 12;
  return hours * 60 + parseInt(match[2], 10);
}

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function displayStatus(record: AttendanceRecord): DisplayStatus {
  if (record.status !== "checked_in") return record.status;
  const start = record.className ? CLASS_START_MIN[record.className] : null;
  if (start != null && timeToMinutes(record.time) > start + 5) return "late";
  return "checked_in";
}

function hourLabel(hour: number): string {
  const suffix = hour < 12 ? "a" : "p";
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h}${suffix}`;
}

const STATUS_BADGE: Record<DisplayStatus, { label: string; className: string; icon: React.ReactNode }> = {
  checked_in: { label: "Checked in", className: "gp-badge-success", icon: <UserCheck className="h-3 w-3" /> },
  late: { label: "Late", className: "gp-badge-warning", icon: <Clock className="h-3 w-3" /> },
  no_show: { label: "No show", className: "gp-badge-danger", icon: <UserX className="h-3 w-3" /> },
  cancelled: { label: "Cancelled", className: "gp-badge-neutral", icon: <CalendarX2 className="h-3 w-3" /> },
};

const AVATAR_TONES = [
  "from-[#84cc16] to-[#65a30d]",
  "from-sky-500 to-cyan-600",
  "from-violet-500 to-purple-600",
  "from-amber-500 to-orange-600",
  "from-rose-500 to-pink-600",
];

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

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function AttendancePage() {
  // Demo "today" = latest date present in the fixture data.
  const today = useMemo(
    () => GP_ATTENDANCE.reduce((max, r) => (r.date > max ? r.date : max), ""),
    []
  );

  const [liveRecords, setLiveRecords] = useState<AttendanceRecord[]>([]);
  const [query, setQuery] = useState("");
  const [className, setClassName] = useState("all");
  const [status, setStatus] = useState<"all" | DisplayStatus>("all");

  const allRecords = useMemo(() => [...liveRecords, ...GP_ATTENDANCE], [liveRecords]);

  const classOptions = useMemo(
    () =>
      Array.from(new Set(GP_ATTENDANCE.map((r) => r.className)))
        .filter((c): c is string => c !== null)
        .sort(),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRecords.filter((r) => {
      const matchesQuery =
        !q || r.memberName.toLowerCase().includes(q) || (r.className ?? "open gym").toLowerCase().includes(q);
      const matchesClass = className === "all" || r.className === className;
      const matchesStatus = status === "all" || displayStatus(r) === status;
      return matchesQuery && matchesClass && matchesStatus;
    });
  }, [allRecords, query, className, status]);

  const stats = useMemo(() => {
    const todays = allRecords.filter((r) => r.date === today);
    const checkinsToday = todays.filter((r) => {
      const s = displayStatus(r);
      return s === "checked_in" || s === "late";
    }).length;
    const noShows = allRecords.filter((r) => r.status === "no_show").length;
    const noShowRate = allRecords.length ? noShows / allRecords.length : 0;

    const byHour = new Map<number, number>();
    for (const r of allRecords) {
      if (r.status === "no_show") continue;
      const hour = Math.floor(timeToMinutes(r.time) / 60);
      byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
    }
    let peakHour = 0;
    let peakCount = 0;
    byHour.forEach((count, hour) => {
      if (count > peakCount) {
        peakCount = count;
        peakHour = hour;
      }
    });
    return { checkinsToday, noShowRate, peakHour, peakCount };
  }, [allRecords, today]);

  const hourlyData = useMemo(() => {
    const byHour = new Map<number, number>();
    for (const r of allRecords) {
      if (r.status === "no_show") continue;
      const hour = Math.floor(timeToMinutes(r.time) / 60);
      byHour.set(hour, (byHour.get(hour) ?? 0) + 1);
    }
    return Array.from(byHour.entries())
      .sort(([a], [b]) => a - b)
      .map(([hour, count]) => ({ hour: hourLabel(hour), count }));
  }, [allRecords]);

  const handleLiveCheckIn = () => {
    const member = GP_MEMBERS[Math.floor(Math.random() * GP_MEMBERS.length)];
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    const record: AttendanceRecord = {
      id: `live-${now.getTime()}`,
      memberId: member.id,
      memberName: member.name,
      className: null,
      time,
      date: today,
      status: "checked_in",
    };
    setLiveRecords((prev) => [record, ...prev]);
    toast(`${member.name} checked in at ${time}`, { icon: "✅" });
  };

  const reset = () => {
    setQuery("");
    setClassName("all");
    setStatus("all");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            Live check-in feed — {formatDate(today, "EEEE, MMM d, yyyy")}.
          </p>
        </div>
        <button type="button" onClick={handleLiveCheckIn} className="gp-btn gp-btn-primary">
          <ScanLine className="h-4 w-4" />
          Live check-in
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<QrCode className="h-4 w-4" />}
          label="Today's check-ins"
          value={formatNumber(stats.checkinsToday)}
          hint={`Across ${new Set(allRecords.filter((r) => r.date === today).map((r) => r.memberId)).size} members`}
        />
        <StatCard
          icon={<UserX className="h-4 w-4" />}
          label="No-show rate"
          value={`${(stats.noShowRate * 100).toFixed(1)}%`}
          hint="Booked but never arrived"
        />
        <StatCard
          icon={<Clock className="h-4 w-4" />}
          label="Peak hour"
          value={hourLabel(stats.peakHour)}
          hint={`${stats.peakCount} visits on the floor`}
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Late arrivals"
          value={formatNumber(allRecords.filter((r) => displayStatus(r) === "late").length)}
          hint="More than 5 min after start"
        />
      </div>

      {/* Hourly chart */}
      <div className="gp-card">
        <div className="gp-card-header">
          <div>
            <h2 className="gp-card-title">Hourly check-ins</h2>
            <p className="text-xs text-[var(--gp-text-muted)]">Floor traffic across the last 7 days</p>
          </div>
          <span className="gp-badge gp-badge-primary">
            <Clock className="h-3 w-3" />
            By hour
          </span>
        </div>
        <div className="gp-card-body h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hourlyData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
              <XAxis dataKey="hour" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} allowDecimals={false} />
              <Tooltip
                cursor={{ fill: "rgba(132,204,22,0.08)" }}
                contentStyle={{
                  background: "#111827",
                  border: "1px solid #374151",
                  borderRadius: 8,
                  color: "#f9fafb",
                  fontSize: 12,
                }}
              />
              <Bar dataKey="count" name="Check-ins" fill="#84cc16" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gp-text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search member or class…"
            className="gp-input pl-9"
            aria-label="Search check-ins"
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
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            className="gp-input w-auto"
            aria-label="Filter by class"
          >
            <option value="all">All classes</option>
            {classOptions.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as "all" | DisplayStatus)}
            className="gp-input w-auto"
            aria-label="Filter by status"
          >
            <option value="all">All statuses</option>
            <option value="checked_in">Checked in</option>
            <option value="late">Late</option>
            <option value="no_show">No show</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Feed / table */}
      {filtered.length === 0 ? (
        <div className="gp-card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <SearchX className="h-8 w-8 text-[var(--gp-text-muted)]" />
          <p className="text-sm font-medium">No check-ins match your filters</p>
          <p className="text-xs text-[var(--gp-text-muted)]">Try another member, class or status.</p>
          <button type="button" onClick={reset} className="gp-btn gp-btn-outline mt-1">
            Reset filters
          </button>
        </div>
      ) : (
        <div className="gp-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="gp-table">
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Class</th>
                  <th>Check-in</th>
                  <th>Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((record, i) => {
                  const s = displayStatus(record);
                  const badge = STATUS_BADGE[s];
                  const tone = AVATAR_TONES[i % AVATAR_TONES.length];
                  return (
                    <motion.tr
                      key={record.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i, 12) * 0.02 }}
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-[11px] font-bold text-white",
                              tone
                            )}
                          >
                            {getInitials(record.memberName)}
                          </span>
                          <span className="font-medium">{record.memberName}</span>
                        </div>
                      </td>
                      <td className="text-[var(--gp-text-muted)]">{record.className ?? "Open gym floor"}</td>
                      <td className="font-mono text-xs">{record.time}</td>
                      <td className="text-[var(--gp-text-muted)]">{formatDate(record.date)}</td>
                      <td>
                        <span className={cn("gp-badge", badge.className)}>
                          {badge.icon}
                          {badge.label}
                        </span>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-xs text-[var(--gp-text-muted)]">
            <span>
              Showing {filtered.length} of {allRecords.length} check-ins
            </span>
            <span>Tap “Live check-in” to simulate a front-desk scan</span>
          </div>
        </div>
      )}
    </div>
  );
}
