"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Clock,
  CreditCard,
  DollarSign,
  RefreshCcw,
  Search,
  SearchX,
  Wallet,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { GP_INVOICES, GP_MEMBERS, type Invoice, type InvoiceStatus } from "@/lib/fixtures";
import { cn, formatCurrency, formatDate, formatNumber } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

const STATUS_META: Record<InvoiceStatus, { label: string; className: string }> = {
  paid: { label: "Paid", className: "gp-badge-success" },
  due: { label: "Due", className: "gp-badge-warning" },
  overdue: { label: "Overdue", className: "gp-badge-danger" },
  refunded: { label: "Refunded", className: "gp-badge-neutral" },
};

const DONUT_COLORS: Record<InvoiceStatus, string> = {
  paid: "#84cc16",
  due: "#f59e0b",
  overdue: "#ef4444",
  refunded: "#94a3b8",
};

/** Monthly equivalent per plan — used to derive MRR from active members. */
const PLAN_MONTHLY: Record<string, number> = {
  "Basic Monthly": 49,
  "Pro Monthly": 89,
  "Elite Annual": 1299 / 12,
};

function daysUntilDue(invoice: Invoice): number {
  return differenceInCalendarDays(parseISO(invoice.date), new Date());
}

/** due invoices past their date behave as overdue everywhere on this page. */
function effectiveStatus(invoice: Invoice): InvoiceStatus {
  if (invoice.status === "due" && daysUntilDue(invoice) < 0) return "overdue";
  return invoice.status;
}

function StatCard({
  icon,
  label,
  value,
  hint,
  danger,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
  danger?: boolean;
}) {
  return (
    <div className="gp-card animate-fade-up p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-[var(--gp-text-muted)]">{label}</p>
          <p className={cn("mt-2 text-2xl font-bold tracking-tight", danger && "text-[var(--gp-danger)]")}>
            {value}
          </p>
          <p className="mt-1 text-xs text-[var(--gp-text-muted)]">{hint}</p>
        </div>
        <span className={cn("gp-badge p-2", danger ? "gp-badge-danger" : "gp-badge-primary")}>{icon}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function BillingPage() {
  const [overrides, setOverrides] = useState<Record<string, InvoiceStatus>>({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | InvoiceStatus>("all");

  const invoices: Invoice[] = useMemo(
    () => GP_INVOICES.map((inv) => (overrides[inv.id] ? { ...inv, status: overrides[inv.id] } : inv)),
    [overrides]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return invoices.filter((inv) => {
      const matchesQuery =
        !q ||
        inv.id.toLowerCase().includes(q) ||
        inv.memberName.toLowerCase().includes(q) ||
        inv.description.toLowerCase().includes(q);
      const matchesStatus = status === "all" || effectiveStatus(inv) === status;
      return matchesQuery && matchesStatus;
    });
  }, [invoices, query, status]);

  const stats = useMemo(() => {
    const collected = invoices
      .filter((i) => i.status === "paid" && i.date.startsWith("2026-10"))
      .reduce((s, i) => s + i.amount, 0);
    const overdue = invoices
      .filter((i) => effectiveStatus(i) === "overdue")
      .reduce((s, i) => s + i.amount, 0);
    const refunds = invoices
      .filter((i) => i.status === "refunded")
      .reduce((s, i) => s + i.amount, 0);
    const mrr = GP_MEMBERS.filter((m) => m.status === "active").reduce(
      (s, m) => s + (PLAN_MONTHLY[m.plan] ?? 0),
      0
    );
    return { collected, overdue, refunds, mrr };
  }, [invoices]);

  const donutData = useMemo(() => {
    const buckets: Record<InvoiceStatus, number> = { paid: 0, due: 0, overdue: 0, refunded: 0 };
    for (const inv of invoices) buckets[effectiveStatus(inv)] += inv.amount;
    return (Object.keys(buckets) as InvoiceStatus[])
      .filter((k) => buckets[k] > 0)
      .map((k) => ({ name: STATUS_META[k].label, value: buckets[k], fill: DONUT_COLORS[k] }));
  }, [invoices]);

  const agingData = useMemo(() => {
    const buckets = { "Current": 0, "1–30 days": 0, "31–60 days": 0, "61–90 days": 0, "90+ days": 0 };
    for (const inv of invoices) {
      const es = effectiveStatus(inv);
      if (es !== "due" && es !== "overdue") continue;
      const overdueDays = Math.max(0, -daysUntilDue(inv));
      if (overdueDays === 0) buckets["Current"] += inv.amount;
      else if (overdueDays <= 30) buckets["1–30 days"] += inv.amount;
      else if (overdueDays <= 60) buckets["31–60 days"] += inv.amount;
      else if (overdueDays <= 90) buckets["61–90 days"] += inv.amount;
      else buckets["90+ days"] += inv.amount;
    }
    return Object.entries(buckets).map(([bucket, amount]) => ({ bucket, amount }));
  }, [invoices]);

  const handleMarkPaid = (invoice: Invoice) => {
    setOverrides((prev) => ({ ...prev, [invoice.id]: "paid" }));
    toast.success(`${invoice.id} marked paid — ${formatCurrency(invoice.amount)}`);
  };

  const handleReminder = (invoice: Invoice) => {
    toast.success(`Reminder sent to ${invoice.memberName}`);
  };

  const reset = () => {
    setQuery("");
    setStatus("all");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Billing</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            Invoices, due-date countdowns and recurring revenue at a glance.
          </p>
        </div>
        <button
          type="button"
          className="gp-btn gp-btn-primary"
          onClick={() => toast.success("Billing run queued for all due invoices")}
        >
          <CreditCard className="h-4 w-4" />
          Run billing
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Wallet className="h-4 w-4" />}
          label="Collected this month"
          value={formatCurrency(stats.collected)}
          hint="Paid invoices in October"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Overdue"
          value={formatCurrency(stats.overdue)}
          hint="Needs a reminder today"
          danger
        />
        <StatCard
          icon={<RefreshCcw className="h-4 w-4" />}
          label="Refunds"
          value={formatCurrency(stats.refunds)}
          hint="Cancellation refunds"
        />
        <StatCard
          icon={<DollarSign className="h-4 w-4" />}
          label="MRR"
          value={formatCurrency(stats.mrr)}
          hint="From active plans"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="gp-card lg:col-span-3">
          <div className="gp-card-header">
            <div>
              <h2 className="gp-card-title">Aging buckets</h2>
              <p className="text-xs text-[var(--gp-text-muted)]">Outstanding balances by days overdue</p>
            </div>
          </div>
          <div className="gp-card-body h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={agingData} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
                <XAxis dataKey="bucket" tick={{ fontSize: 10, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
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
                  formatter={(value: number | string) => [formatCurrency(Number(value)), "Outstanding"]}
                />
                <Bar dataKey="amount" fill="#ef4444" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="gp-card lg:col-span-2">
          <div className="gp-card-header">
            <div>
              <h2 className="gp-card-title">Invoice status</h2>
              <p className="text-xs text-[var(--gp-text-muted)]">Share of total invoiced amount</p>
            </div>
          </div>
          <div className="gp-card-body relative h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="88%"
                  paddingAngle={3}
                  strokeWidth={0}
                >
                  {donutData.map((d) => (
                    <Cell key={d.name} fill={d.fill} />
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
                  formatter={(value: number | string) => formatCurrency(Number(value))}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-lg font-bold">
                {formatCurrency(invoices.reduce((s, i) => s + i.amount, 0), "USD").replace(/\.00$/, "")}
              </p>
              <p className="text-[11px] text-[var(--gp-text-muted)]">Total invoiced</p>
            </div>
            <div className="mt-2 flex flex-wrap justify-center gap-x-3 gap-y-1">
              {donutData.map((d) => (
                <span key={d.name} className="flex items-center gap-1 text-[11px] text-[var(--gp-text-muted)]">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: d.fill }} />
                  {d.name}
                </span>
              ))}
            </div>
          </div>
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
            placeholder="Search invoice #, member or description…"
            className="gp-input pl-9"
            aria-label="Search invoices"
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
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "all" | InvoiceStatus)}
          className="gp-input w-auto"
          aria-label="Filter by status"
        >
          <option value="all">All statuses</option>
          <option value="paid">Paid</option>
          <option value="due">Due</option>
          <option value="overdue">Overdue</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="gp-card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <SearchX className="h-8 w-8 text-[var(--gp-text-muted)]" />
          <p className="text-sm font-medium">No invoices match your filters</p>
          <p className="text-xs text-[var(--gp-text-muted)]">Try another invoice number or status.</p>
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
                  <th>Invoice</th>
                  <th>Member</th>
                  <th>Amount</th>
                  <th>Due date</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((invoice, i) => {
                  const es = effectiveStatus(invoice);
                  const badge = STATUS_META[es];
                  const days = daysUntilDue(invoice);
                  const isActionable = es === "due" || es === "overdue";
                  return (
                    <motion.tr
                      key={invoice.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(i, 12) * 0.02 }}
                    >
                      <td>
                        <p className="font-mono text-xs font-semibold">{invoice.id}</p>
                        <p className="mt-0.5 max-w-[220px] truncate text-[11px] text-[var(--gp-text-muted)]">
                          {invoice.description}
                        </p>
                      </td>
                      <td className="font-medium">{invoice.memberName}</td>
                      <td className="font-semibold">{formatCurrency(invoice.amount)}</td>
                      <td>
                        <p className="text-xs">{formatDate(invoice.date)}</p>
                        {es === "overdue" ? (
                          <p className="mt-0.5 text-[11px] font-semibold text-[var(--gp-danger)]">
                            {Math.abs(days)}d overdue
                          </p>
                        ) : es === "due" ? (
                          <p
                            className={cn(
                              "mt-0.5 text-[11px] font-semibold",
                              days < 0 ? "text-[var(--gp-danger)]" : "text-[var(--gp-text-muted)]"
                            )}
                          >
                            {days < 0 ? `${Math.abs(days)}d overdue` : `due in ${days}d`}
                          </p>
                        ) : (
                          <p className="mt-0.5 text-[11px] text-[var(--gp-text-muted)]">
                            {es === "paid" ? "Settled" : "Reversed"}
                          </p>
                        )}
                      </td>
                      <td>
                        <span className={cn("gp-badge", badge.className)}>
                          {es === "paid" && <CheckCircle2 className="h-3 w-3" />}
                          {es === "due" && <Clock className="h-3 w-3" />}
                          {es === "overdue" && <AlertTriangle className="h-3 w-3" />}
                          {es === "refunded" && <RefreshCcw className="h-3 w-3" />}
                          {badge.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex justify-end gap-1.5">
                          {isActionable ? (
                            <>
                              <button
                                type="button"
                                onClick={() => handleReminder(invoice)}
                                className="gp-btn gp-btn-ghost px-2 py-1 text-xs"
                                title="Send payment reminder"
                              >
                                <BellRing className="h-3.5 w-3.5" />
                                Remind
                              </button>
                              <button
                                type="button"
                                onClick={() => handleMarkPaid(invoice)}
                                className="gp-btn gp-btn-primary px-2 py-1 text-xs"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Mark paid
                              </button>
                            </>
                          ) : (
                            <span className="text-[11px] text-[var(--gp-text-muted)]">No actions</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between px-4 py-3 text-xs text-[var(--gp-text-muted)]">
            <span>
              Showing {filtered.length} of {invoices.length} invoices
            </span>
            <span>Total {formatCurrency(filtered.reduce((s, i) => s + i.amount, 0))}</span>
          </div>
        </div>
      )}
    </div>
  );
}
