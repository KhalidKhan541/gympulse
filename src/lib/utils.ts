import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  isValid,
  parseISO,
} from "date-fns";

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** 1234567 -> "1,234,567" | "1.2K" when compact. */
export function formatNumber(value: number, compact = false): string {
  if (!Number.isFinite(value)) return "0";
  if (compact) {
    return new Intl.NumberFormat("en-US", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US").format(value);
}

/** 1234.5 -> "$1,234.50" */
export function formatCurrency(value: number, currency = "USD"): string {
  if (!Number.isFinite(value)) return "$0.00";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: value % 1 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** 0.1234 -> "12.3%" */
export function formatPercent(value: number, digits = 1): string {
  if (!Number.isFinite(value)) return "0%";
  return `${(value * 100).toFixed(digits).replace(/\.0+$/, "")}%`;
}

/** Nullable-safe date formatting -> "Jan 5, 2026" or "—" */
export function formatDate(
  value: string | Date | null | undefined,
  pattern = "MMM d, yyyy"
): string {
  if (value == null || value === "") return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  return format(date, pattern);
}

/** "2 hours ago" / "Tomorrow" — nullable-safe. */
export function formatRelative(value: string | Date | null | undefined): string {
  if (value == null || value === "") return "—";
  const date = typeof value === "string" ? parseISO(value) : value;
  if (!isValid(date)) return "—";
  if (isToday(date)) return `Today, ${format(date, "h:mm a")}`;
  if (isYesterday(date)) return `Yesterday, ${format(date, "h:mm a")}`;
  return formatDistanceToNow(date, { addSuffix: true });
}

/** "Jane Doe" -> "JD" */
export function getInitials(name: string): string {
  if (!name) return "";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/** 95 -> "1h 35m" | 45 -> "45m" */
export function formatDuration(minutes: number): string {
  if (!Number.isFinite(minutes) || minutes < 0) return "0m";
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours === 0) return `${mins}m`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}m`;
}
