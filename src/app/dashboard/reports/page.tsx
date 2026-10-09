"use client";

import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import {
  FileDown,
  Printer,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { GP_KPI, type MonthlyKpi } from "@/lib/fixtures";
import { cn, formatNumber, formatPercent } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Config                                                              */
/* ------------------------------------------------------------------ */

const RANGES = [
  { id: "7d", label: "7 days" },
  { id: "30d", label: "30 days" },
  { id: "90d", label: "90 days" },
  { id: "12m", label: "12 months" },
] as const;
type RangeId = (typeof RANGES)[number]["id"];

const TABS = [
  { id: "revenue", label: "Revenue", color: "#84cc16" },
  { id: "membership", label: "Membership", color: "#8b5cf6" },
  { id: "attendance", label: "Attendance", color: "#0ea5e9" },
  { id: "classes", label: "Classes", color: "#f59e0b" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthLabel(month: string): string {
  const [year, mo] = month.split("-");
  return `${MONTH_LABELS[Number(mo) - 1]} '${year.slice(2)}`;
}

/** Scale the last month into a 7-day window so the preset drives real numbers. */
function sliceKpi(range: RangeId): MonthlyKpi[] {
  if (range === "12m") return GP_KPI;
  if (range === "90d") return GP_KPI.slice(-3);
  if (range === "30d") return GP_KPI.slice(-1);
  const last = GP_KPI[GP_KPI.length - 1];
  const factor = 7 / 30;
  return [
    {
      ...last,
      revenue: Math.round(last.revenue * factor),
      checkins: Math.round(last.checkins * factor),
      classes: Math.round(last.classes * factor),
      newLeads: Math.round(last.newLeads * factor),
    },
  ];
}

/** First-half vs second-half delta; null when the slice is too small. */
function halfDelta(values: number[]): number | null {
  if (values.length < 2) return null;
  const mid = Math.floor(values.length / 2);
  const first = values.slice(0, mid).reduce((s, v) => s + v, 0);
  const last = values.slice(values.length - mid).reduce((s, v) => s + v, 0);
  if (!first) return null;
  return (last - first) / first;
}

const money = (v: number) => `$${formatNumber(v, true)}`;

/* ------------------------------------------------------------------ */
/* Shared pieces                                                       */
/* ------------------------------------------------------------------ */

type Metric = { label: string; value: string; hint: string; delta?: number | null };
type TableRow = { label: string; values: string[]; raw: (string | number)[]; share: number };

type TabData = {
  metrics: Metric[];
  chart: {
    kind: "area" | "line" | "bar";
    data: Array<Record<string, string | number>>;
    dataKey: string;
    formatter: (v: number | string) => [string, string];
  };
  table: { columns: string[]; rows: TableRow[] };
  csvHeader: string[];
  csvRows: (string | number)[][];
};

function Delta({ value }: { value: number | null | undefined }) {
  if (value == null || !Number.isFinite(value)) return null;
  const up = value >= 0;
  return (
    <span className={cn("gp-badge text-[10px] font-semibold", up ? "gp-badge-success" : "gp-badge-danger")}>
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {formatPercent(Math.abs(value), 1)}
    </span>
  );
}

function MetricCard({ metric }: { metric: Metric }) {
  return (
    <div className="gp-card animate-fade-up p-5">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--gp-text-muted)]">
          {metric.label}
        </p>
        <Delta value={metric.delta} />
      </div>
      <p className="mt-2 text-2xl font-bold tracking-tight">{metric.value}</p>
      <p className="mt-1 text-xs text-[var(--gp-text-muted)]">{metric.hint}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Tab builders                                                        */
/* ------------------------------------------------------------------ */

function buildTab(tab: TabId, data: MonthlyKpi[], range: RangeId): TabData {
  const n = data.length;
  const bucket = range === "7d" ? "day" : "month";

  if (tab === "revenue") {
    const values = data.map((d) => d.revenue);
    const total = values.reduce((s, v) => s + v, 0);
    const bestIdx = values.indexOf(Math.max(...values));
    return {
      metrics: [
        { label: "Total revenue", value: money(total), hint: `Last ${n} ${bucket}${n > 1 ? "s" : ""}`, delta: halfDelta(values) },
        { label: `Avg / ${bucket}`, value: money(Math.round(total / n)), hint: "Mean across the period" },
        { label: "Best period", value: money(values[bestIdx]), hint: monthLabel(data[bestIdx].month) },
        {
          label: "Growth",
          value: n > 1 ? formatPercent((values[n - 1] - values[0]) / values[0], 1) : "—",
          hint: "First → last in range",
          delta: n > 1 ? (values[n - 1] - values[0]) / values[0] : null,
        },
      ],
      chart: {
        kind: "area",
        data: data.map((d) => ({ label: monthLabel(d.month), revenue: d.revenue })),
        dataKey: "revenue",
        formatter: (v) => [money(Number(v)), "Revenue"],
      },
      table: {
        columns: ["Period", "Revenue", "Share"],
        rows: data.map((d) => ({
          label: monthLabel(d.month),
          values: [money(d.revenue), formatPercent(d.revenue / total, 1)],
          raw: [monthLabel(d.month), d.revenue, (d.revenue / total) * 100],
          share: d.revenue / total,
        })),
      },
      csvHeader: ["Period", "Revenue (USD)", "Share (%)"],
      csvRows: data.map((d) => [monthLabel(d.month), d.revenue, ((d.revenue / total) * 100).toFixed(1)]),
    };
  }

  if (tab === "membership") {
    const members = data.map((d) => d.members);
    const leads = data.map((d) => d.newLeads);
    const totalLeads = leads.reduce((s, v) => s + v, 0);
    const avgChurn = data.reduce((s, d) => s + d.churn, 0) / n;
    return {
      metrics: [
        {
          label: "Active members",
          value: formatNumber(members[n - 1]),
          hint: "Current book size",
          delta: n > 1 ? (members[n - 1] - members[0]) / members[0] : null,
        },
        {
          label: "Member growth",
          value: `${members[n - 1] - members[0] >= 0 ? "+" : ""}${formatNumber(members[n - 1] - members[0])}`,
          hint: "Net change in range",
        },
        { label: "Avg churn", value: formatPercent(avgChurn, 1), hint: "Monthly attrition", delta: -avgChurn },
        { label: "New leads", value: formatNumber(totalLeads), hint: "Top of funnel captured" },
      ],
      chart: {
        kind: "line",
        data: data.map((d) => ({ label: monthLabel(d.month), members: d.members })),
        dataKey: "members",
        formatter: (v) => [formatNumber(Number(v)), "Members"],
      },
      table: {
        columns: ["Period", "Members", "New leads", "Churn", "Lead share"],
        rows: data.map((d) => ({
          label: monthLabel(d.month),
          values: [
            formatNumber(d.members),
            formatNumber(d.newLeads),
            formatPercent(d.churn, 1),
            formatPercent(d.newLeads / totalLeads, 1),
          ],
          raw: [monthLabel(d.month), d.members, d.newLeads, (d.churn * 100).toFixed(1), ((d.newLeads / totalLeads) * 100).toFixed(1)],
          share: d.newLeads / totalLeads,
        })),
      },
      csvHeader: ["Period", "Members", "New leads", "Churn (%)", "Lead share (%)"],
      csvRows: data.map((d) => [
        monthLabel(d.month),
        d.members,
        d.newLeads,
        (d.churn * 100).toFixed(1),
        ((d.newLeads / totalLeads) * 100).toFixed(1),
      ]),
    };
  }

  if (tab === "attendance") {
    const values = data.map((d) => d.checkins);
    const total = values.reduce((s, v) => s + v, 0);
    const peakIdx = values.indexOf(Math.max(...values));
    const last = data[n - 1];
    return {
      metrics: [
        { label: "Total check-ins", value: formatNumber(total), hint: `Last ${n} ${bucket}${n > 1 ? "s" : ""}`, delta: halfDelta(values) },
        { label: `Avg / ${bucket}`, value: formatNumber(Math.round(total / n)), hint: "Footfall per period" },
        { label: "Peak period", value: formatNumber(values[peakIdx]), hint: monthLabel(data[peakIdx].month) },
        {
          label: "Visits / member",
          value: (last.checkins / last.members).toFixed(1),
          hint: "Avg monthly frequency",
        },
      ],
      chart: {
        kind: "bar",
        data: data.map((d) => ({ label: monthLabel(d.month), checkins: d.checkins })),
        dataKey: "checkins",
        formatter: (v) => [formatNumber(Number(v)), "Check-ins"],
      },
      table: {
        columns: ["Period", "Check-ins", "Visits / member", "Share"],
        rows: data.map((d) => ({
          label: monthLabel(d.month),
          values: [formatNumber(d.checkins), (d.checkins / d.members).toFixed(1), formatPercent(d.checkins / total, 1)],
          raw: [monthLabel(d.month), d.checkins, (d.checkins / d.members).toFixed(1), ((d.checkins / total) * 100).toFixed(1)],
          share: d.checkins / total,
        })),
      },
      csvHeader: ["Period", "Check-ins", "Visits per member", "Share (%)"],
      csvRows: data.map((d) => [
        monthLabel(d.month),
        d.checkins,
        (d.checkins / d.members).toFixed(1),
        ((d.checkins / total) * 100).toFixed(1),
      ]),
    };
  }

  // classes
  const values = data.map((d) => d.classes);
  const total = values.reduce((s, v) => s + v, 0);
  const busyIdx = values.indexOf(Math.max(...values));
  const last = data[n - 1];
  return {
    metrics: [
      { label: "Total classes", value: formatNumber(total), hint: `Last ${n} ${bucket}${n > 1 ? "s" : ""}`, delta: halfDelta(values) },
      { label: `Avg / ${bucket}`, value: (total / n).toFixed(1), hint: "Sessions on the schedule" },
      { label: "Busiest period", value: formatNumber(values[busyIdx]), hint: monthLabel(data[busyIdx].month) },
      {
        label: "Classes / 100 members",
        value: ((last.classes / last.members) * 100).toFixed(1),
        hint: "Schedule density",
      },
    ],
    chart: {
      kind: "bar",
      data: data.map((d) => ({ label: monthLabel(d.month), classes: d.classes })),
      dataKey: "classes",
      formatter: (v) => [formatNumber(Number(v)), "Classes"],
    },
    table: {
      columns: ["Period", "Classes", "Per 100 members", "Share"],
      rows: data.map((d) => ({
        label: monthLabel(d.month),
        values: [
          formatNumber(d.classes),
          ((d.classes / d.members) * 100).toFixed(1),
          formatPercent(d.classes / total, 1),
        ],
        raw: [
          monthLabel(d.month),
          d.classes,
          ((d.classes / d.members) * 100).toFixed(1),
          ((d.classes / total) * 100).toFixed(1),
        ],
        share: d.classes / total,
      })),
    },
    csvHeader: ["Period", "Classes", "Per 100 members", "Share (%)"],
    csvRows: data.map((d) => [
      monthLabel(d.month),
      d.classes,
      ((d.classes / d.members) * 100).toFixed(1),
      ((d.classes / total) * 100).toFixed(1),
    ]),
  };
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ReportsPage() {
  const [tab, setTab] = useState<TabId>("revenue");
  const [range, setRange] = useState<RangeId>("30d");
  const [showPrintBanner, setShowPrintBanner] = useState(true);

  const kpi = useMemo(() => sliceKpi(range), [range]);
  const tabData = useMemo(() => buildTab(tab, kpi, range), [tab, kpi, range]);
  const activeTabMeta = TABS.find((t) => t.id === tab)!;
  const rangeLabel = RANGES.find((r) => r.id === range)!.label;

  const handleExportCsv = () => {
    const escape = (cell: string | number) => {
      const s = String(cell);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const csv = [tabData.csvHeader, ...tabData.csvRows]
      .map((row) => row.map(escape).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `gympulse-${tab}-${range}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV export downloaded");
  };

  const handlePrint = () => {
    toast("Opening print dialog — choose “Save as PDF”", { icon: "🖨️" });
    window.print();
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Print banner (hidden when printing) */}
      {showPrintBanner && (
        <div className="gp-card print:hidden flex items-center gap-3 border-[#84cc16]/40 bg-[#84cc16]/5 p-4">
          <Printer className="h-5 w-5 shrink-0 text-[#84cc16]" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">
              Exporting the {activeTabMeta.label} report — {rangeLabel}
            </p>
            <p className="text-xs text-[var(--gp-text-muted)]">
              The print dialog opens with charts and tables; choose “Save as PDF” as the destination.
            </p>
          </div>
          <button type="button" onClick={handlePrint} className="gp-btn gp-btn-primary shrink-0">
            <Printer className="h-4 w-4" />
            Print now
          </button>
          <button
            type="button"
            onClick={() => setShowPrintBanner(false)}
            className="gp-btn gp-btn-ghost shrink-0"
            aria-label="Dismiss print banner"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            Revenue, membership, attendance and class performance from your KPI history.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Range presets */}
          <div className="flex rounded-lg border p-0.5" style={{ borderColor: "var(--gp-border)" }}>
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setRange(r.id)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  range === r.id
                    ? "bg-[#84cc16] text-white"
                    : "text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <button type="button" onClick={handleExportCsv} className="gp-btn gp-btn-outline">
            <FileDown className="h-4 w-4" />
            CSV
          </button>
          <button
            type="button"
            onClick={() => {
              setShowPrintBanner(true);
              handlePrint();
            }}
            className="gp-btn gp-btn-primary"
          >
            <Printer className="h-4 w-4" />
            PDF
          </button>
        </div>
      </div>

      {/* Underline tabs */}
      <div className="border-b" style={{ borderColor: "var(--gp-border)" }}>
        <nav className="-mb-px flex gap-6 overflow-x-auto" aria-label="Report tabs">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? "page" : undefined}
              className={cn(
                "whitespace-nowrap border-b-2 px-1 pb-3 text-sm font-medium transition-colors",
                tab === t.id
                  ? "border-[#84cc16] text-[#84cc16]"
                  : "border-transparent text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Metric cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tabData.metrics.map((m) => (
          <MetricCard key={m.label} metric={m} />
        ))}
      </div>

      {/* Chart */}
      <div className="gp-card">
        <div className="gp-card-header">
          <div>
            <h2 className="gp-card-title">{activeTabMeta.label} trend</h2>
            <p className="text-xs text-[var(--gp-text-muted)]">Range: {rangeLabel}</p>
          </div>
          <span className="gp-badge" style={{ backgroundColor: `${activeTabMeta.color}1f`, color: activeTabMeta.color }}>
            {tabData.chart.data.length} point{tabData.chart.data.length > 1 ? "s" : ""}
          </span>
        </div>
        <div className="gp-card-body h-72">
          <ResponsiveContainer width="100%" height="100%">
            {tabData.chart.kind === "area" ? (
              <AreaChart data={tabData.chart.data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <defs>
                  <linearGradient id="gpArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={activeTabMeta.color} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={activeTabMeta.color} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ stroke: "rgba(132,204,22,0.4)" }}
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#f9fafb",
                    fontSize: 12,
                  }}
                  formatter={tabData.chart.formatter}
                />
                <Area
                  type="monotone"
                  dataKey={tabData.chart.dataKey}
                  stroke={activeTabMeta.color}
                  strokeWidth={2}
                  fill="url(#gpArea)"
                />
              </AreaChart>
            ) : tabData.chart.kind === "line" ? (
              <LineChart data={tabData.chart.data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ stroke: "rgba(132,204,22,0.4)" }}
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#f9fafb",
                    fontSize: 12,
                  }}
                  formatter={tabData.chart.formatter}
                />
                <Line
                  type="monotone"
                  dataKey={tabData.chart.dataKey}
                  stroke={activeTabMeta.color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: activeTabMeta.color, strokeWidth: 0 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            ) : (
              <BarChart data={tabData.chart.data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
                <Tooltip
                  cursor={{ fill: "rgba(132,204,22,0.08)" }}
                  contentStyle={{
                    background: "#111827",
                    border: "1px solid #374151",
                    borderRadius: 8,
                    color: "#f9fafb",
                    fontSize: 12,
                  }}
                  formatter={tabData.chart.formatter}
                />
                <Bar
                  dataKey={tabData.chart.dataKey}
                  fill={activeTabMeta.color}
                  radius={[6, 6, 0, 0]}
                  maxBarSize={48}
                />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary table with share bars */}
      <div className="gp-card overflow-hidden">
        <div className="gp-card-header">
          <div>
            <h2 className="gp-card-title">{activeTabMeta.label} breakdown</h2>
            <p className="text-xs text-[var(--gp-text-muted)]">Per-period values and share of total</p>
          </div>
          <button type="button" onClick={handleExportCsv} className="gp-btn gp-btn-ghost text-xs">
            <FileDown className="h-3.5 w-3.5" />
            Export CSV
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="gp-table">
            <thead>
              <tr>
                {tabData.table.columns.map((c) => (
                  <th key={c}>{c}</th>
                ))}
                <th className="w-40">Distribution</th>
              </tr>
            </thead>
            <tbody>
              {tabData.table.rows.map((row) => (
                <tr key={row.label}>
                  <td className="font-medium">{row.label}</td>
                  {row.values.map((v, i) => (
                    <td key={i} className="tabular-nums">
                      {v}
                    </td>
                  ))}
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[var(--gp-surface-2)]">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.max(2, Math.round(row.share * 100))}%`,
                            backgroundColor: activeTabMeta.color,
                          }}
                        />
                      </div>
                      <span className="w-10 text-right text-[11px] text-[var(--gp-text-muted)]">
                        {formatPercent(row.share, 0)}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 text-xs text-[var(--gp-text-muted)]">
          Data source: GP_KPI · {tabData.table.rows.length} period{tabData.table.rows.length > 1 ? "s" : ""} in range
        </div>
      </div>
    </div>
  );
}
