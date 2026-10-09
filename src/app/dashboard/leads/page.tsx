"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle2,
  Mail,
  Phone,
  Search,
  TrendingUp,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Card, { CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import MetricCard from "@/components/ui/MetricCard";
import Badge, { type BadgeVariant } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import {
  GP_LEADS,
  LEAD_STATUS,
  type Lead,
  type LeadStatus,
} from "@/lib/fixtures";
import { cn, formatCurrency, formatNumber, formatPercent } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Demo-time helpers — fixture "today" keeps server/client renders      */
/* identical (no hydration drift).                                      */
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
/* Enrichment — fixtures don't carry lead-created dates, trial history  */
/* or deal values, so we keep small local maps keyed by lead id.        */
/* ------------------------------------------------------------------ */

const ADDED_AT: Record<string, string> = {
  l01: "2026-10-06",
  l02: "2026-09-30",
  l03: "2026-09-28",
  l04: "2026-10-05",
  l05: "2026-10-07",
  l06: "2026-09-25",
  l07: "2026-09-24",
  l08: "2026-09-20",
  l09: "2026-10-04",
  l10: "2026-09-22",
};

/** Leads that reached a trial, mapped to whether they actually showed up. */
const TRIAL_ATTENDED: Record<string, boolean> = {
  l03: true,
  l04: true,
  l06: true,
  l08: false,
  l09: true,
};

const EST_BASE: Record<LeadStatus, number> = {
  new: 349,
  contacted: 499,
  trial: 749,
  booked: 1299,
  closed: 0,
};

function estimatedValue(lead: Lead): number {
  if (lead.status === "closed") return 0;
  const scaled = EST_BASE[lead.status] * (0.75 + lead.score / 200);
  return Math.round(scaled / 10) * 10;
}

const STATUS_VARIANT: Record<LeadStatus, BadgeVariant> = {
  new: "info",
  contacted: "secondary",
  trial: "warning",
  booked: "gp",
  closed: "danger",
};

const STATUS_LABEL: Record<LeadStatus, string> = {
  new: "New",
  contacted: "Contacted",
  trial: "Trial",
  booked: "Booked",
  closed: "Closed",
};

const STATUS_COLOR: Record<LeadStatus, string> = {
  new: "#0ea5e9",
  contacted: "#94a3b8",
  trial: "#f59e0b",
  booked: "#84cc16",
  closed: "#ef4444",
};

function scoreTone(score: number): string {
  if (score >= 80) return "bg-primary-500";
  if (score >= 60) return "bg-amber-500";
  return "bg-slate-400";
}

function followUpMeta(lead: Lead): { label: string; variant: BadgeVariant } {
  if (lead.status === "closed") return { label: "—", variant: "secondary" };
  const d = daysUntil(lead.followUp);
  if (d < 0) return { label: `Overdue ${Math.abs(d)}d`, variant: "danger" };
  if (d === 0) return { label: "Today", variant: "warning" };
  if (d === 1) return { label: "Tomorrow", variant: "warning" };
  return { label: `In ${d} days`, variant: "secondary" };
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function LeadsPage() {
  const [query, setQuery] = useState("");
  const [source, setSource] = useState("all");
  const [status, setStatus] = useState("all");
  const [converted, setConverted] = useState<Set<string>>(() => new Set());

  const sources = useMemo(
    () => Array.from(new Set(GP_LEADS.map((l) => l.source))),
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = GP_LEADS.filter((l) => {
      const matchesQuery =
        !q ||
        l.name.toLowerCase().includes(q) ||
        l.email.toLowerCase().includes(q) ||
        l.phone.toLowerCase().includes(q) ||
        l.notes.toLowerCase().includes(q);
      const matchesSource = source === "all" || l.source === source;
      const matchesStatus = status === "all" || l.status === status;
      return matchesQuery && matchesSource && matchesStatus;
    });
    // Most urgent follow-ups first; closed leads sink to the bottom.
    return rows.sort((a, b) => {
      if (a.status === "closed" && b.status !== "closed") return 1;
      if (b.status === "closed" && a.status !== "closed") return -1;
      return a.followUp.localeCompare(b.followUp);
    });
  }, [query, source, status]);

  const stats = useMemo(() => {
    const weekAgo = new Date(parseDateOnly(TODAY_ISO).getTime() - 7 * 86_400_000);
    const twoWeeksAgo = new Date(parseDateOnly(TODAY_ISO).getTime() - 14 * 86_400_000);

    const addedThisWeek = GP_LEADS.filter(
      (l) => parseDateOnly(ADDED_AT[l.id]) >= weekAgo
    ).length;
    const addedLastWeek = GP_LEADS.filter((l) => {
      const added = parseDateOnly(ADDED_AT[l.id]);
      return added >= twoWeeksAgo && added < weekAgo;
    }).length;

    const booked = GP_LEADS.filter((l) => l.status === "booked").length;
    const lost = GP_LEADS.filter((l) => l.status === "closed").length;
    const conversion = booked / GP_LEADS.length;

    const trials = Object.keys(TRIAL_ATTENDED);
    const showUps = trials.filter((id) => TRIAL_ATTENDED[id]).length;

    const pipeline = GP_LEADS.filter((l) => l.status !== "closed").reduce(
      (sum, l) => sum + estimatedValue(l),
      0
    );

    return {
      addedThisWeek,
      addedDelta:
        addedLastWeek === 0
          ? 0
          : Number(
              (((addedThisWeek - addedLastWeek) / addedLastWeek) * 100).toFixed(0)
            ),
      booked,
      lost,
      conversion,
      trials: trials.length,
      showUps,
      showUpRate: showUps / trials.length,
      pipeline,
    };
  }, []);

  const sourceChart = useMemo(() => {
    return sources.map((s) => {
      const row: Record<string, string | number> = { source: s };
      for (const st of LEAD_STATUS) {
        row[st] = GP_LEADS.filter((l) => l.source === s && l.status === st).length;
      }
      return row;
    });
  }, [sources]);

  const handleConvert = (lead: Lead) => {
    setConverted((prev) => {
      const next = new Set(prev);
      next.add(lead.id);
      return next;
    });
    toast.success(`${lead.name} converted to a member`);
  };

  const reset = () => {
    setQuery("");
    setSource("all");
    setStatus("all");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            Pipeline, follow-ups and conversions — {GP_LEADS.length} leads in play.
          </p>
        </div>
        <span className="gp-badge gp-badge-primary self-start sm:self-auto">
          <Users className="h-3 w-3" />
          {formatCurrency(stats.pipeline)} open pipeline
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <MetricCard
          title="New this week"
          value={formatNumber(stats.addedThisWeek)}
          delta={stats.addedDelta}
          changeLabel="vs last week"
          hint="Leads added Oct 2–8"
          icon={<UserPlus className="h-5 w-5" />}
          iconTone="lime"
        />
        <MetricCard
          title="Conversion rate"
          value={formatPercent(stats.conversion, 0)}
          subvalue={`${stats.booked} booked · ${stats.lost} lost`}
          hint="Lead → membership"
          icon={<TrendingUp className="h-5 w-5" />}
          iconTone="emerald"
        />
        <MetricCard
          title="Trial show-ups"
          value={formatPercent(stats.showUpRate, 0)}
          subvalue={`${stats.showUps} of ${stats.trials} trials attended`}
          hint="Last 30 days"
          icon={<CheckCircle2 className="h-5 w-5" />}
          iconTone="sky"
        />
      </div>

      {/* Source chart */}
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle>Leads by source</CardTitle>
            <p className="mt-1 text-xs text-[var(--gp-text-muted)]">
              Volume per channel, split by pipeline stage
            </p>
          </div>
          <div className="hidden flex-wrap items-center gap-2 sm:flex">
            {LEAD_STATUS.map((st) => (
              <span
                key={st}
                className="flex items-center gap-1 text-[11px] font-medium text-[var(--gp-text-muted)]"
              >
                <span
                  className="h-2.5 w-2.5 rounded-sm"
                  style={{ backgroundColor: STATUS_COLOR[st] }}
                  aria-hidden
                />
                {STATUS_LABEL[st]}
              </span>
            ))}
          </div>
        </CardHeader>
        <CardContent className="px-2 pb-4 pt-3 sm:px-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={sourceChart}
                margin={{ top: 8, right: 8, left: -18, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="rgba(148,163,184,0.2)"
                  vertical={false}
                />
                <XAxis
                  dataKey="source"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
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
                  formatter={(value: any, name: any) => [
                    `${value} lead${Number(value) === 1 ? "" : "s"}`,
                    STATUS_LABEL[String(name) as LeadStatus] ?? String(name),
                  ]}
                />
                {LEAD_STATUS.map((st) => (
                  <Bar
                    key={st}
                    dataKey={st}
                    stackId="leads"
                    fill={STATUS_COLOR[st]}
                    radius={st === "closed" ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
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
            placeholder="Search name, email, phone or notes…"
            className="gp-input pl-9"
            aria-label="Search leads"
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
          {["all", ...sources].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSource(s)}
              className={cn(
                "gp-btn px-3 py-1.5 text-xs",
                source === s ? "gp-btn-primary" : "gp-btn-ghost"
              )}
            >
              {s === "all" ? "All sources" : s}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["all", ...LEAD_STATUS] as const).map((s) => (
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

      {/* Lead table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="gp-table min-w-[980px]">
            <thead>
              <tr>
                <th>Lead</th>
                <th>Source</th>
                <th>Score</th>
                <th>Status</th>
                <th>Follow-up</th>
                <th className="text-right">Est. value</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((lead) => {
                const follow = followUpMeta(lead);
                const value = estimatedValue(lead);
                const isConverted = converted.has(lead.id);
                return (
                  <tr key={lead.id} className={isConverted ? "bg-primary-500/5" : undefined}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={lead.name} size="sm" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{lead.name}</span>
                            {isConverted && (
                              <Badge variant="gp" size="sm">Member</Badge>
                            )}
                          </div>
                          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-[var(--gp-text-muted)]">
                            <span className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {lead.email}
                            </span>
                            <span className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {lead.phone}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <Badge variant="default" size="md">{lead.source}</Badge>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[var(--gp-surface-2)]">
                          <div
                            className={cn("h-full rounded-full", scoreTone(lead.score))}
                            style={{ width: `${lead.score}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold tabular-nums">{lead.score}</span>
                      </div>
                    </td>
                    <td>
                      <Badge variant={STATUS_VARIANT[lead.status]} size="md" dot>
                        {STATUS_LABEL[lead.status]}
                      </Badge>
                    </td>
                    <td>
                      <div className="flex flex-col gap-1">
                        <Badge variant={follow.variant} size="sm">{follow.label}</Badge>
                        <span className="text-xs text-[var(--gp-text-muted)]">
                          {lead.followUp}
                        </span>
                      </div>
                    </td>
                    <td className="text-right font-semibold tabular-nums">
                      {value > 0 ? formatCurrency(value) : "—"}
                    </td>
                    <td className="text-right">
                      {lead.status === "closed" ? (
                        <span className="text-xs text-[var(--gp-text-muted)]">Closed</span>
                      ) : isConverted ? (
                        <Button variant="outline" size="sm" disabled>
                          Converted ✓
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          leftIcon={<UserPlus className="h-3.5 w-3.5" />}
                          onClick={() => handleConvert(lead)}
                        >
                          Convert
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7}>
                    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
                      <Search className="h-8 w-8 text-[var(--gp-text-muted)]" />
                      <p className="text-sm font-medium">No leads match your filters</p>
                      <p className="text-xs text-[var(--gp-text-muted)]">
                        Try a different source, status or search term.
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
            Showing {filtered.length} of {GP_LEADS.length} leads
          </span>
          <span>
            {converted.size} converted in this session
          </span>
        </div>
      </Card>
    </div>
  );
}
