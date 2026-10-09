"use client";

import { Fragment, useMemo, useState } from "react";
import {
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import {
  Activity,
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CreditCard,
  HeartPulse,
  Mail,
  Phone,
  Search,
  Snowflake,
  UserRound,
  Users,
  X,
} from "lucide-react";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import {
  GP_ATTENDANCE,
  GP_INVOICES,
  GP_MEMBERS,
  type Member,
  type MemberStatus,
} from "@/lib/fixtures";
import { cn, formatDate, formatNumber } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Demo-time helpers                                                    */
/* ------------------------------------------------------------------ */

const TODAY_ISO = "2026-10-08";

function parseDateOnly(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function daysUntil(iso: string): number {
  return Math.round(
    (parseDateOnly(iso).getTime() - parseDateOnly(TODAY_ISO).getTime()) / 86_400_000
  );
}

/* ------------------------------------------------------------------ */
/* Badge maps                                                           */
/* ------------------------------------------------------------------ */

const STATUS_ORDER: MemberStatus[] = ["past_due", "active", "frozen", "cancelled"];

const STATUS_LABEL: Record<MemberStatus, string> = {
  active: "Active",
  past_due: "Past due",
  frozen: "Frozen",
  cancelled: "Cancelled",
};

const STATUS_VARIANT: Record<MemberStatus, BadgeVariant> = {
  active: "success",
  past_due: "danger",
  frozen: "info",
  cancelled: "secondary",
};

const STATUS_COLOR: Record<MemberStatus, string> = {
  active: "#84cc16",
  past_due: "#ef4444",
  frozen: "#0ea5e9",
  cancelled: "#94a3b8",
};

const PLAN_VARIANT: Record<string, BadgeVariant> = {
  "Elite Annual": "gp",
  "Pro Monthly": "info",
  "Basic Monthly": "secondary",
};

const INVOICE_VARIANT: Record<string, BadgeVariant> = {
  paid: "success",
  due: "warning",
  overdue: "danger",
  refunded: "secondary",
};

const ATTENDANCE_TARGET = 24; // visits/month considered "fully engaged"

/* ------------------------------------------------------------------ */
/* Row helpers                                                          */
/* ------------------------------------------------------------------ */

function renewalMeta(member: Member): {
  label: string;
  variant: BadgeVariant;
  note: string;
} {
  const date = formatDate(member.renewal);
  if (member.status === "cancelled") {
    return { label: "Ended", variant: "secondary", note: date };
  }
  const d = daysUntil(member.renewal);
  if (d < 0) {
    return { label: `${Math.abs(d)}d overdue`, variant: "danger", note: date };
  }
  if (member.status === "past_due") {
    return { label: "Payment past due", variant: "danger", note: `Renews ${date}` };
  }
  if (d <= 14) {
    return { label: `Renews in ${d}d`, variant: "warning", note: date };
  }
  return { label: `Renews in ${d}d`, variant: "secondary", note: date };
}

function attendanceTone(count: number): string {
  if (count >= 16) return "bg-primary-500";
  if (count >= 8) return "bg-amber-500";
  return "bg-slate-400";
}

/* ------------------------------------------------------------------ */
/* Detail panel                                                         */
/* ------------------------------------------------------------------ */

function MemberDetail({ member }: { member: Member }) {
  const visits = GP_ATTENDANCE.filter((a) => a.memberId === member.id);
  const invoices = GP_INVOICES.filter((i) => i.memberName === member.name);

  return (
    <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
      {/* Contact */}
      <div className="rounded-xl border p-4" style={{ borderColor: "var(--gp-border)" }}>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
          <UserRound className="h-3.5 w-3.5" />
          Contact
        </p>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-xs text-[var(--gp-text-muted)]">Email</dt>
            <dd className="flex items-center gap-1.5 break-all font-medium">
              <Mail className="h-3.5 w-3.5 shrink-0 text-[var(--gp-text-muted)]" />
              {member.email}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--gp-text-muted)]">Phone</dt>
            <dd className="flex items-center gap-1.5 font-medium">
              <Phone className="h-3.5 w-3.5 shrink-0 text-[var(--gp-text-muted)]" />
              {member.phone}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-[var(--gp-text-muted)]">Member since</dt>
            <dd className="flex items-center gap-1.5 font-medium">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 text-[var(--gp-text-muted)]" />
              {formatDate(member.joined)}
            </dd>
          </div>
        </dl>
      </div>

      {/* Health flags */}
      <div className="rounded-xl border p-4" style={{ borderColor: "var(--gp-border)" }}>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
          <HeartPulse className="h-3.5 w-3.5" />
          Health flags
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {member.healthFlags.injuryRisk ? (
            <Badge variant="danger" size="sm" dot>Injury risk</Badge>
          ) : (
            <Badge variant="success" size="sm" dot>No injury flags</Badge>
          )}
          <Badge
            variant={member.healthFlags.cleared ? "success" : "danger"}
            size="sm"
          >
            {member.healthFlags.cleared ? "Cleared to train" : "Not cleared"}
          </Badge>
        </div>
        <p className="mt-3 text-sm text-[var(--gp-text-muted)]">
          {member.healthFlags.notes ?? "No medical notes on file."}
        </p>
      </div>

      {/* Recent attendance */}
      <div className="rounded-xl border p-4" style={{ borderColor: "var(--gp-border)" }}>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
          <Activity className="h-3.5 w-3.5" />
          Recent attendance
        </p>
        {visits.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--gp-text-muted)]">No visits in the last week.</p>
        ) : (
          <ul className="mt-2 divide-y">
            {visits.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{v.className ?? "Open gym floor"}</p>
                  <p className="text-xs text-[var(--gp-text-muted)]">
                    {formatDate(v.date)} · {v.time}
                  </p>
                </div>
                <Badge
                  variant={
                    v.status === "checked_in"
                      ? "success"
                      : v.status === "no_show"
                        ? "danger"
                        : "secondary"
                  }
                  size="sm"
                >
                  {v.status === "checked_in" ? "Checked in" : v.status === "no_show" ? "No-show" : "Cancelled"}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Invoices */}
      <div className="rounded-xl border p-4" style={{ borderColor: "var(--gp-border)" }}>
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
          <CreditCard className="h-3.5 w-3.5" />
          Invoices
        </p>
        {invoices.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--gp-text-muted)]">No invoices on file.</p>
        ) : (
          <ul className="mt-2 divide-y">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-2 py-2 text-sm">
                <div className="min-w-0">
                  <p className="truncate font-medium">{inv.id}</p>
                  <p className="truncate text-xs text-[var(--gp-text-muted)]">
                    {formatDate(inv.date)} · {inv.description}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-1">
                  <span className="text-sm font-semibold tabular-nums">
                    ${inv.amount.toFixed(2)}
                  </span>
                  <Badge variant={INVOICE_VARIANT[inv.status]} size="sm">
                    {inv.status}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                 */
/* ------------------------------------------------------------------ */

export default function MembersPage() {
  const [query, setQuery] = useState("");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState("all");
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());

  const plans = useMemo(
    () => Array.from(new Set(GP_MEMBERS.map((m) => m.plan))),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = GP_MEMBERS.filter((m) => {
      const matchesQuery =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.plan.toLowerCase().includes(q);
      const matchesPlan = plan === "all" || m.plan === plan;
      const matchesStatus = status === "all" || m.status === status;
      return matchesQuery && matchesPlan && matchesStatus;
    });
    // Members needing attention float to the top.
    return rows.sort((a, b) => {
      const rank = (m: Member) => STATUS_ORDER.indexOf(m.status);
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      return a.name.localeCompare(b.name);
    });
  }, [query, plan, status]);

  const stats = useMemo(() => {
    const count = (s: MemberStatus) => GP_MEMBERS.filter((m) => m.status === s).length;
    const outstanding = GP_INVOICES.filter((i) => i.status === "overdue").reduce(
      (sum, i) => sum + i.amount,
      0
    );
    const elitePlans = new Set(GP_MEMBERS.map((m) => m.plan)).size;
    return {
      total: GP_MEMBERS.length,
      active: count("active"),
      activePct: count("active") / GP_MEMBERS.length,
      pastDue: count("past_due"),
      frozen: count("frozen"),
      outstanding,
      elitePlans,
    };
  }, []);

  const statusMix = useMemo(
    () =>
      STATUS_ORDER.map((s) => ({
        name: STATUS_LABEL[s],
        key: s,
        value: GP_MEMBERS.filter((m) => m.status === s).length,
        fill: STATUS_COLOR[s],
      })).filter((d) => d.value > 0),
    []
  );

  const toggleRow = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const reset = () => {
    setQuery("");
    setPlan("all");
    setStatus("all");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Members</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            Roster, renewals and attendance — click a row for the full profile.
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Total members"
          value={formatNumber(stats.total)}
          hint={`${stats.elitePlans} plans in use`}
          icon={<Users className="h-5 w-5" />}
          iconTone="lime"
        />
        <MetricCard
          title="Active"
          value={formatNumber(stats.active)}
          subvalue={`${Math.round(stats.activePct * 100)}% of the roster`}
          hint="Billing in good standing"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconTone="emerald"
        />
        <MetricCard
          title="Past due"
          value={formatNumber(stats.pastDue)}
          subvalue={`$${stats.outstanding.toFixed(2)} outstanding`}
          hint="Needs a payment nudge"
          icon={<AlertTriangle className="h-5 w-5" />}
          iconTone="rose"
        />
        <MetricCard
          title="Frozen"
          value={formatNumber(stats.frozen)}
          hint="1 resumes in December"
          icon={<Snowflake className="h-5 w-5" />}
          iconTone="sky"
        />
      </div>

      {/* Status donut */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Membership status</CardTitle>
            <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
              Distribution across the {stats.total}-member roster
            </p>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
            <div className="relative h-56 w-56 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusMix}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={58}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {statusMix.map((s) => (
                      <Cell key={s.key} fill={s.fill} />
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
              <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-bold tabular-nums">{stats.total}</span>
                <span className="text-[11px] uppercase tracking-wide text-[var(--gp-text-muted)]">
                  Members
                </span>
              </div>
            </div>
            <ul className="w-full max-w-xs space-y-2.5">
              {statusMix.map((s) => (
                <li key={s.key} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: s.fill }}
                    aria-hidden
                  />
                  <span className="flex-1">{s.name}</span>
                  <span className="font-semibold tabular-nums">{s.value}</span>
                  <span className="w-10 text-right text-xs tabular-nums text-[var(--gp-text-muted)]">
                    {Math.round((s.value / stats.total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--gp-text-muted)]" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name, email, phone or plan…"
            className="gp-input pl-9"
            aria-label="Search members"
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
          {["all", ...plans].map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlan(p)}
              className={cn(
                "gp-btn px-3 py-1.5 text-xs",
                plan === p ? "gp-btn-primary" : "gp-btn-ghost"
              )}
            >
              {p === "all" ? "All plans" : p}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...STATUS_ORDER] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={cn(
                "gp-btn px-3 py-1.5 text-xs",
                status === s ? "gp-btn-primary" : "gp-btn-ghost"
              )}
            >
              {s === "all" ? "All statuses" : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      {/* Member table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="gp-table min-w-[980px]">
            <thead>
              <tr>
                <th>Member</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Renewal</th>
                <th>Attendance</th>
                <th aria-label="Expand" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((member) => {
                const isOpen = expanded.has(member.id);
                const renewal = renewalMeta(member);
                const visits = GP_ATTENDANCE.filter((a) => a.memberId === member.id);
                return (
                  <Fragment key={member.id}>
                    <tr
                      onClick={() => toggleRow(member.id)}
                      className="cursor-pointer"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={member.name} size="sm" />
                          <div className="min-w-0">
                            <span className="font-semibold">{member.name}</span>
                            <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--gp-text-muted)]">
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {member.email}
                              </span>
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={PLAN_VARIANT[member.plan] ?? "default"} size="md">
                          {member.plan}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={STATUS_VARIANT[member.status]} size="md" dot>
                          {STATUS_LABEL[member.status]}
                        </Badge>
                      </td>
                      <td className="whitespace-nowrap text-[var(--gp-text-muted)]">
                        {formatDate(member.joined)}
                      </td>
                      <td>
                        <div className="flex flex-col gap-1">
                          <Badge variant={renewal.variant} size="sm">{renewal.label}</Badge>
                          <span className="text-xs text-[var(--gp-text-muted)]">
                            {renewal.note}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-[var(--gp-surface-2)]">
                            <div
                              className={cn(
                                "h-full rounded-full",
                                attendanceTone(member.attendanceThisMonth)
                              )}
                              style={{
                                width: `${Math.min(100, (member.attendanceThisMonth / ATTENDANCE_TARGET) * 100)}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-semibold tabular-nums">
                            {member.attendanceThisMonth}
                          </span>
                          <span className="text-[11px] text-[var(--gp-text-muted)]">
                            /{ATTENDANCE_TARGET}
                          </span>
                        </div>
                      </td>
                      <td className="text-right">
                        <span
                          className={cn(
                            "inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--gp-text-muted)] transition-transform",
                            isOpen && "rotate-180 bg-[var(--gp-surface-2)]"
                          )}
                          aria-hidden
                        >
                          <ChevronDown className="h-4 w-4" />
                        </span>
                      </td>
                    </tr>
                    {isOpen && (
                      <tr>
                        <td colSpan={7} className="bg-[var(--gp-surface-2)]/40 p-0">
                          <MemberDetail member={member} />
                          <p className="px-5 pb-4 text-[11px] text-[var(--gp-text-muted)]">
                            Last {visits.length} visit{visits.length === 1 ? "" : "s"} in the
                            attendance log · {visits.filter((v) => v.status === "checked_in").length} checked in
                          </p>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                      <Search className="h-8 w-8 text-[var(--gp-text-muted)]" />
                      <p className="text-sm font-medium">No members match your filters</p>
                      <p className="text-xs text-[var(--gp-text-muted)]">
                        Try another plan, status or search term.
                      </p>
                      <button type="button" onClick={reset} className="gp-btn gp-btn-outline mt-1">
                        Reset filters
                      </button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div
          className="flex flex-wrap items-center justify-between gap-2 border-t px-5 py-3 text-xs text-[var(--gp-text-muted)]"
          style={{ borderColor: "var(--gp-border)" }}
        >
          <span>
            Showing {filtered.length} of {GP_MEMBERS.length} members
          </span>
          <span>{expanded.size} profile{expanded.size === 1 ? "" : "s"} expanded</span>
        </div>
      </Card>
    </div>
  );
}
