"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarDays,
  ClipboardList,
  Repeat,
  Search,
  SearchX,
  Timer,
  TrendingUp,
  UserPlus,
  UserRound,
  UsersRound,
  X,
  Zap,
} from "lucide-react";
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
import { GP_PROGRAMS, type Difficulty, type Program } from "@/lib/fixtures";
import { cn, formatCurrency, formatNumber, formatPercent, getInitials } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Local metadata — fixtures don't carry a creator, so each discipline */
/* is mapped to the coach that owns it.                                */
/* ------------------------------------------------------------------ */

type Category = Program["discipline"];

const CATEGORY_META: Record<Category, { label: string; color: string; creator: string }> = {
  strength: { label: "Strength", color: "#84cc16", creator: "Diego Fernandez" },
  hiit: { label: "HIIT", color: "#f97316", creator: "Alexis Grant" },
  yoga: { label: "Yoga", color: "#8b5cf6", creator: "Meera Patel" },
  mobility: { label: "Mobility", color: "#06b6d4", creator: "Jordan Blake" },
};

const DIFFICULTY_BADGE: Record<Difficulty, { label: string; className: string }> = {
  beginner: { label: "Beginner", className: "gp-badge-success" },
  intermediate: { label: "Intermediate", className: "gp-badge-info" },
  advanced: { label: "Advanced", className: "gp-badge-warning" },
};

const CATEGORIES: Category[] = ["strength", "hiit", "yoga", "mobility"];
const DIFFICULTIES: Difficulty[] = ["beginner", "intermediate", "advanced"];

/** Deterministic mock completion rate so numbers stay stable across renders. */
function completionRate(program: Program): number {
  const n = Number(program.id.slice(1));
  return Math.min(0.98, 0.94 - n * 0.021 + (program.enrolled % 5) * 0.01);
}

function CategoryChip({ category }: { category: Category }) {
  const meta = CATEGORY_META[category];
  return (
    <span className="gp-badge" style={{ backgroundColor: `${meta.color}1f`, color: meta.color }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: meta.color }} />
      {meta.label}
    </span>
  );
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

function ProgramCard({
  program,
  enrolledCount,
  onEnroll,
}: {
  program: Program;
  enrolledCount: number;
  onEnroll: (program: Program) => void;
}) {
  const meta = CATEGORY_META[program.discipline];
  const difficulty = DIFFICULTY_BADGE[program.difficulty];
  const completion = completionRate(program);

  return (
    <div className="gp-card group relative flex flex-col overflow-hidden p-5 transition-shadow hover:shadow-lg">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-1 transition-colors"
        style={{ backgroundColor: meta.color }}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{program.name}</h3>
          <p className="mt-1 flex items-center gap-1 text-xs text-[var(--gp-text-muted)]">
            <UserRound className="h-3 w-3" />
            {meta.creator}
          </p>
        </div>
        <span className={cn("gp-badge shrink-0", difficulty.className)}>{difficulty.label}</span>
      </div>

      <div className="mt-3">
        <CategoryChip category={program.discipline} />
      </div>

      <dl className="mt-4 grid grid-cols-3 gap-2 border-y py-3 text-center" style={{ borderColor: "var(--gp-border)" }}>
        <div>
          <dt className="flex items-center justify-center gap-1 text-[11px] text-[var(--gp-text-muted)]">
            <CalendarDays className="h-3 w-3" />
            Weeks
          </dt>
          <dd className="mt-0.5 text-sm font-bold">{program.durationWeeks}</dd>
        </div>
        <div>
          <dt className="flex items-center justify-center gap-1 text-[11px] text-[var(--gp-text-muted)]">
            <Repeat className="h-3 w-3" />
            / week
          </dt>
          <dd className="mt-0.5 text-sm font-bold">{program.sessionsPerWeek}</dd>
        </div>
        <div>
          <dt className="flex items-center justify-center gap-1 text-[11px] text-[var(--gp-text-muted)]">
            <Timer className="h-3 w-3" />
            Sessions
          </dt>
          <dd className="mt-0.5 text-sm font-bold">
            {program.durationWeeks * program.sessionsPerWeek}
          </dd>
        </div>
      </dl>

      <div className="mt-3 flex items-center justify-between text-xs">
        <span className="flex items-center gap-1 text-[var(--gp-text-muted)]">
          <UsersRound className="h-3.5 w-3.5" />
          <span className="font-semibold text-[var(--gp-text)]">{formatNumber(enrolledCount)}</span> enrolled
        </span>
        <span className="font-semibold text-[#84cc16]">{formatCurrency(program.price)}</span>
      </div>

      <div className="mt-2">
        <div className="flex items-center justify-between text-[11px] text-[var(--gp-text-muted)]">
          <span>Completion</span>
          <span>{formatPercent(completion, 0)}</span>
        </div>
        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-[var(--gp-surface-2)]">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.round(completion * 100)}%`, backgroundColor: meta.color }}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => onEnroll(program)}
        className="gp-btn gp-btn-outline mt-4 w-full group-hover:border-[#84cc16] group-hover:text-[#84cc16]"
      >
        <UserPlus className="h-4 w-4" />
        Enroll member
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ProgramsPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"all" | Category>("all");
  const [difficulty, setDifficulty] = useState<"all" | Difficulty>("all");
  const [enrolledMap, setEnrolledMap] = useState<Record<string, number>>(() =>
    Object.fromEntries(GP_PROGRAMS.map((p) => [p.id, p.enrolled]))
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GP_PROGRAMS.filter((p) => {
      const matchesQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.discipline.toLowerCase().includes(q) ||
        CATEGORY_META[p.discipline].creator.toLowerCase().includes(q);
      const matchesCategory = category === "all" || p.discipline === category;
      const matchesDifficulty = difficulty === "all" || p.difficulty === difficulty;
      return matchesQuery && matchesCategory && matchesDifficulty;
    });
  }, [query, category, difficulty]);

  const stats = useMemo(() => {
    const enrolledValues = GP_PROGRAMS.map((p) => enrolledMap[p.id] ?? p.enrolled);
    const avgEnrollment = enrolledValues.reduce((s, v) => s + v, 0) / GP_PROGRAMS.length;
    const avgCompletion =
      GP_PROGRAMS.reduce((s, p) => s + completionRate(p), 0) / GP_PROGRAMS.length;
    return { avgEnrollment, avgCompletion };
  }, [enrolledMap]);

  const chartData = useMemo(
    () =>
      CATEGORIES.map((c) => ({
        category: CATEGORY_META[c].label,
        enrolled: GP_PROGRAMS.filter((p) => p.discipline === c).reduce(
          (s, p) => s + (enrolledMap[p.id] ?? p.enrolled),
          0
        ),
        color: CATEGORY_META[c].color,
      })),
    [enrolledMap]
  );

  const handleEnroll = (program: Program) => {
    setEnrolledMap((prev) => ({ ...prev, [program.id]: (prev[program.id] ?? program.enrolled) + 1 }));
    toast.success(`Member enrolled in ${program.name}`);
  };

  const reset = () => {
    setQuery("");
    setCategory("all");
    setDifficulty("all");
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Programs</h1>
          <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
            Multi-week training programs — track enrollment, difficulty and completion.
          </p>
        </div>
        <button type="button" className="gp-btn gp-btn-primary">
          <ClipboardList className="h-4 w-4" />
          New program
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<ClipboardList className="h-4 w-4" />}
          label="Programs"
          value={formatNumber(GP_PROGRAMS.length)}
          hint={`${CATEGORIES.length} categories`}
        />
        <StatCard
          icon={<UsersRound className="h-4 w-4" />}
          label="Avg enrollment"
          value={stats.avgEnrollment.toFixed(1)}
          hint="Members per program"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4" />}
          label="Completion rate"
          value={formatPercent(stats.avgCompletion, 0)}
          hint="Programs finished on plan"
        />
        <StatCard
          icon={<Zap className="h-4 w-4" />}
          label="Active enrollments"
          value={formatNumber(Object.values(enrolledMap).reduce((s, v) => s + v, 0))}
          hint="Across all programs"
        />
      </div>

      {/* Enrollment by category */}
      <div className="gp-card">
        <div className="gp-card-header">
          <div>
            <h2 className="gp-card-title">Enrollment by category</h2>
            <p className="text-xs text-[var(--gp-text-muted)]">Where members are spending their weeks</p>
          </div>
        </div>
        <div className="gp-card-body h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.2)" vertical={false} />
              <XAxis dataKey="category" tick={{ fontSize: 11, fill: "#94a3b8" }} tickLine={false} axisLine={false} />
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
              />
              <Bar dataKey="enrolled" radius={[6, 6, 0, 0]}>
                {chartData.map((d) => (
                  <Cell key={d.category} fill={d.color} />
                ))}
              </Bar>
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
            placeholder="Search programs or creators…"
            className="gp-input pl-9"
            aria-label="Search programs"
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
            value={category}
            onChange={(e) => setCategory(e.target.value as "all" | Category)}
            className="gp-input w-auto"
            aria-label="Filter by category"
          >
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_META[c].label}
              </option>
            ))}
          </select>
          <select
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value as "all" | Difficulty)}
            className="gp-input w-auto"
            aria-label="Filter by difficulty"
          >
            <option value="all">All difficulties</option>
            {DIFFICULTIES.map((d) => (
              <option key={d} value={d}>
                {DIFFICULTY_BADGE[d].label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Program grid */}
      {filtered.length === 0 ? (
        <div className="gp-card flex flex-col items-center justify-center gap-3 p-12 text-center">
          <SearchX className="h-8 w-8 text-[var(--gp-text-muted)]" />
          <p className="text-sm font-medium">No programs match your filters</p>
          <p className="text-xs text-[var(--gp-text-muted)]">Try a different category or difficulty.</p>
          <button type="button" onClick={reset} className="gp-btn gp-btn-outline mt-1">
            Reset filters
          </button>
        </div>
      ) : (
        <motion.div layout className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {filtered.map((program, i) => (
            <motion.div
              key={program.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.3 }}
            >
              <ProgramCard
                program={program}
                enrolledCount={enrolledMap[program.id] ?? program.enrolled}
                onEnroll={handleEnroll}
              />
            </motion.div>
          ))}
        </motion.div>
      )}

      <p className="text-center text-xs text-[var(--gp-text-muted)]">
        Showing {filtered.length} of {GP_PROGRAMS.length} programs
      </p>
    </div>
  );
}
