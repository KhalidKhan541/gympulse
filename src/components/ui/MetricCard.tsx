import type { ReactNode } from "react";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import Card from "@/components/ui/Card";

export type IconTone =
  | "lime"
  | "emerald"
  | "sky"
  | "amber"
  | "rose"
  | "violet"
  | "slate";

export type DeltaTone = "auto" | "up" | "down" | "flat";

const ICON_TONES: Record<IconTone, string> = {
  lime: "bg-primary-500/15 text-primary-600 dark:text-primary-400",
  emerald: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
  sky: "bg-sky-500/15 text-sky-600 dark:text-sky-400",
  amber: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
  rose: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
  violet: "bg-violet-500/15 text-violet-600 dark:text-violet-400",
  slate: "bg-slate-500/15 text-slate-600 dark:text-slate-400",
};

const DELTA_PILL: Record<"up" | "down" | "flat", string> = {
  up: "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400",
  down: "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
  flat: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
};

export interface MetricCardProps {
  /** Small label above the value. */
  title: ReactNode;
  /** Big display value (string/number/pre-formatted node). */
  value: ReactNode;
  /** Secondary line under the value, e.g. a target or comparison. */
  subvalue?: ReactNode;
  /** Tiny helper text at the bottom of the card. */
  hint?: ReactNode;
  /** Icon rendered in the top-right tile. */
  icon?: ReactNode;
  iconTone?: IconTone;
  /** Signed change value rendered as a pill, e.g. 12.4 -> "+12.4%". */
  delta?: number;
  /** Controls pill color/icon; "auto" derives from the delta sign. */
  deltaTone?: DeltaTone;
  /** Custom pill text — overrides `delta` when provided. */
  change?: string;
  /** Label shown next to the pill, e.g. "vs last month". */
  changeLabel?: string;
  loading?: boolean;
  className?: string;
}

function resolveTone(delta: number, tone: DeltaTone): "up" | "down" | "flat" {
  if (tone !== "auto") return tone;
  if (delta > 0) return "up";
  if (delta < 0) return "down";
  return "flat";
}

export default function MetricCard({
  title,
  value,
  subvalue,
  hint,
  icon,
  iconTone = "lime",
  delta,
  deltaTone = "auto",
  change,
  changeLabel,
  loading = false,
  className,
}: MetricCardProps) {
  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)} aria-hidden="true">
        <div className="flex items-start justify-between p-6 pb-0">
          <div className="space-y-2">
            <div className="h-3 w-20 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-8 w-28 rounded bg-slate-200 dark:bg-slate-800" />
            <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-800" />
          </div>
          <div className="h-11 w-11 rounded-xl bg-slate-200 dark:bg-slate-800" />
        </div>
        <div className="p-6 pt-4">
          <div className="h-3 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        </div>
      </Card>
    );
  }

  const pillText =
    change ??
    (typeof delta === "number"
      ? `${delta > 0 ? "+" : ""}${Number.isInteger(delta) ? delta : delta.toFixed(1)}%`
      : undefined);

  const tone =
    typeof delta === "number" ? resolveTone(delta, deltaTone) : deltaTone === "auto" ? "flat" : deltaTone;
  const ToneIcon =
    tone === "up" ? TrendingUp : tone === "down" ? TrendingDown : Minus;

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <div className="flex items-start justify-between gap-4 p-6 pb-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">
            {title}
          </p>
          <p className="mt-1.5 truncate text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {value}
          </p>
          {subvalue && (
            <p className="mt-1 truncate text-sm text-slate-500 dark:text-slate-400">
              {subvalue}
            </p>
          )}
        </div>
        {icon && (
          <span
            className={cn(
              "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl [&>svg]:h-5 [&>svg]:w-5",
              ICON_TONES[iconTone]
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
      </div>
      {(pillText || changeLabel || hint) && (
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-6 pb-5 pt-2">
          {pillText && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold",
                DELTA_PILL[tone]
              )}
            >
              <ToneIcon className="h-3 w-3" aria-hidden="true" />
              {pillText}
            </span>
          )}
          {changeLabel && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {changeLabel}
            </span>
          )}
          {hint && (
            <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
              {hint}
            </span>
          )}
        </div>
      )}
    </Card>
  );
}
