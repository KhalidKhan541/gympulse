"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  Package,
  PackageX,
  Search,
  SearchX,
  ShoppingBag,
  ShoppingCart,
  Store,
  TrendingUp,
  Trophy,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { GP_POS_PRODUCTS, type PosProduct } from "@/lib/fixtures";
import { cn, formatCurrency, formatNumber } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Local metadata                                                      */
/* ------------------------------------------------------------------ */

type Category = PosProduct["category"];

const CATEGORY_META: Record<Category, { label: string; color: string }> = {
  supplement: { label: "Supplements", color: "#84cc16" },
  apparel: { label: "Apparel", color: "#8b5cf6" },
  accessory: { label: "Accessories", color: "#0ea5e9" },
  drink: { label: "Drinks", color: "#f59e0b" },
};

const CATEGORIES: Category[] = ["supplement", "apparel", "accessory", "drink"];
const MAX_STOCK = 60;
const LOW_STOCK_THRESHOLD = 10;

function stockTone(stock: number): { bar: string; label: string } {
  if (stock === 0) return { bar: "bg-red-500", label: "Out of stock" };
  if (stock < LOW_STOCK_THRESHOLD) return { bar: "bg-red-500", label: "Low stock" };
  if (stock < LOW_STOCK_THRESHOLD * 2) return { bar: "bg-amber-500", label: "Restocking soon" };
  return { bar: "bg-[#84cc16]", label: "In stock" };
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

function ProductCard({ product, onSell }: { product: PosProduct; onSell: (p: PosProduct) => void }) {
  const meta = CATEGORY_META[product.category];
  const tone = stockTone(product.stock);
  const pct = Math.min(100, Math.round((product.stock / MAX_STOCK) * 100));
  const out = product.stock === 0;

  return (
    <div className="gp-card group relative flex flex-col overflow-hidden p-5 transition-shadow hover:shadow-lg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1"
        style={{ backgroundColor: meta.color }}
      />
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{product.name}</h3>
          <span className="gp-badge mt-1.5" style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}>
            {meta.label}
          </span>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold">{formatCurrency(product.price)}</p>
          <p className="text-[11px] text-[var(--gp-text-muted)]">{formatNumber(product.sold)} sold</p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex items-center justify-between text-[11px]">
          <span className={cn("font-medium", out ? "text-[var(--gp-danger)]" : "text-[var(--gp-text-muted)]")}>
            {tone.label}
          </span>
          <span className="font-semibold">{product.stock} left</span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[var(--gp-surface-2)]">
          <div
            className={cn("h-full rounded-full transition-all", tone.bar)}
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onSell(product)}
        disabled={out}
        className={cn(
          "gp-btn mt-4 w-full",
          out ? "gp-btn-outline opacity-60" : "gp-btn-primary"
        )}
      >
        <ShoppingCart className="h-4 w-4" />
        {out ? "Sold out" : "Quick sell"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function PosPage() {
  const [products, setProducts] = useState<PosProduct[]>(GP_POS_PRODUCTS);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
      const matchesCategory = category === "all" || p.category === category;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, category]);

  const stats = useMemo(() => {
    const todaySales = products.reduce((s, p) => s + p.price * p.sold, 0);
    const lowStock = products.filter((p) => p.stock < LOW_STOCK_THRESHOLD).length;
    const topSeller = products.reduce((best, p) => (p.sold > best.sold ? p : best), products[0]);
    const inventoryValue = products.reduce((s, p) => s + p.price * p.stock, 0);
    return { todaySales, lowStock, topSeller, inventoryValue };
  }, [products]);

  const chartData = useMemo(
    () =>
      [...products]
        .sort((a, b) => b.price * b.sold - a.price * a.sold)
        .map((p) => ({
          name: p.name.length > 14 ? `${p.name.slice(0, 13)}…` : p.name,
          revenue: Math.round(p.price * p.sold),
          fill: CATEGORY_META[p.category].color,
        })),
    [products]
  );

  const handleSell = (product: PosProduct) => {
    if (product.stock === 0) {
      toast.error(`${product.name} is out of stock`);
      return;
    }
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, stock: p.stock - 1, sold: p.sold + 1 } : p))
    );
    toast.success(`Sold ${product.name} — ${formatCurrency(product.price)}`);
  };

  const reset = () => {
    setQuery("");
    setCategory("all");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Point of Sale</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            Front-desk retail — quick sell, stock levels and daily performance.
          </p>
        </div>
        <button
          type="button"
          className="gp-btn gp-btn-primary"
          onClick={() => toast.success("Register Z-report generated")}
        >
          <Store className="h-4 w-4" />
          Close register
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ShoppingBag className="h-4 w-4" />}
          label="Today's sales"
          value={formatCurrency(stats.todaySales)}
          hint={`${formatNumber(products.reduce((s, p) => s + p.sold, 0))} items sold`}
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4" />}
          label="Low stock"
          value={formatNumber(stats.lowStock)}
          hint={`Under ${LOW_STOCK_THRESHOLD} units remaining`}
        />
        <StatCard
          icon={<Trophy className="h-4 w-4" />}
          label="Top seller"
          value={stats.topSeller.name}
          hint={`${stats.topSeller.sold} sold · ${formatCurrency(stats.topSeller.price)}`}
        />
        <StatCard
          icon={<Package className="h-4 w-4" />}
          label="Inventory value"
          value={formatCurrency(stats.inventoryValue)}
          hint="At current retail price"
        />
      </div>

      {/* Sales by product */}
      <div className="gp-card">
        <div className="gp-card-header">
          <div>
            <h2 className="gp-card-title">Sales by product</h2>
            <p className="text-xs text-[var(--gp-text-muted)]">Revenue generated per item</p>
          </div>
          <span className="gp-badge gp-badge-primary">
            <TrendingUp className="h-3 w-3" />
            All categories
          </span>
        </div>
        <div className="gp-card-body h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -8, bottom: 24 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 9, fill: "#94a3b8" }}
                tickLine={false}
                axisLine={false}
                interval={0}
                angle={-24}
                textAnchor="end"
                height={56}
              />
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
                formatter={(value: number | string) => [formatCurrency(Number(value)), "Revenue"]}
              />
              <Bar dataKey="revenue" radius={[6, 6, 0, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.name} fill={d.fill} />
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
            placeholder="Search products…"
            className="gp-input pl-9"
            aria-label="Search products"
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
          {(["all", ...CATEGORIES] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={cn(
                "gp-btn px-3 py-1.5 text-xs",
                category === c ? "gp-btn-primary" : "gp-btn-ghost"
              )}
            >
              {c === "all" ? "All" : CATEGORY_META[c].label}
            </button>
          ))}
        </div>
      </div>

      {/* Product grid */}
      {filtered.length === 0 ? (
        <div className="gp-card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <SearchX className="h-8 w-8 text-[var(--gp-text-muted)]" />
          <p className="text-sm font-medium">No products match your filters</p>
          <p className="text-xs text-[var(--gp-text-muted)]">Try a different name or category.</p>
          <button type="button" onClick={reset} className="gp-btn gp-btn-outline mt-1">
            Reset filters
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {filtered.map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03, duration: 0.25 }}
            >
              <ProductCard product={product} onSell={handleSell} />
            </motion.div>
          ))}
        </motion.div>
      )}

      {stats.lowStock > 0 && (
        <div className="gp-card flex items-center gap-3 border-amber-300/60 bg-amber-50 p-4 dark:bg-amber-950/20">
          <PackageX className="h-5 w-5 shrink-0 text-amber-600" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            {stats.lowStock} product{stats.lowStock > 1 ? "s are" : " is"} running low — restock before the weekend rush.
          </p>
        </div>
      )}
    </div>
  );
}
