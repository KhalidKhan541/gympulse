"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  BadgeCheck,
  CalendarDays,
  ClipboardList,
  CreditCard,
  Dumbbell,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  ScanLine,
  Settings,
  ShoppingCart,
  UserPlus,
  Users,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { cn, formatNumber } from "@/lib/utils";
import { APP_NAME, SIDEBAR_NAV } from "@/lib/constants";
import { GP_ATTENDANCE, GP_MEMBERS, GP_SETTINGS } from "@/lib/fixtures";
import { useSidebar } from "@/contexts/SidebarContext";

/** Map SIDEBAR_NAV icon names -> lucide components. */
const ICONS: Record<string, LucideIcon> = {
  LayoutDashboard,
  BarChart3,
  UserPlus,
  Users,
  Dumbbell,
  CalendarDays,
  BadgeCheck,
  ClipboardList,
  ScanLine,
  ShoppingCart,
  CreditCard,
  Settings,
};

/** Re-root a nav href (" /members" -> "/dashboard/members"; "/dashboard" stays). */
export function reRootHref(href: string): string {
  if (href === "/dashboard") return "/dashboard";
  return `/dashboard${href}`;
}

/** Match by final path segment: "/dashboard/members" <-> "/members". */
function isActivePath(pathname: string, href: string): boolean {
  const pathSeg = pathname.split("/").filter(Boolean).pop() ?? "";
  const hrefSeg = href.split("/").filter(Boolean).pop() ?? "";
  if (!pathSeg || !hrefSeg) return false;
  return pathSeg === hrefSeg;
}

/* ------------------------- Membership pulse widget ------------------------ */

function MembershipPulse({ compact = false }: { compact?: boolean }) {
  const activeMembers = useMemo(
    () => GP_MEMBERS.filter((m) => m.status === "active").length,
    []
  );
  const todayCheckIns = useMemo(() => {
    const dates = GP_ATTENDANCE.map((r) => r.date).sort();
    const latest = dates[dates.length - 1];
    return GP_ATTENDANCE.filter(
      (r) => r.date === latest && r.status === "checked_in"
    ).length;
  }, []);

  const capacity = GP_SETTINGS.profile.capacity;
  const fill = Math.min(activeMembers / capacity, 1);

  if (compact) {
    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    return (
      <div
        className="relative mx-auto grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-primary-500 to-lime-400"
        title={`${activeMembers} active members · ${todayCheckIns} check-ins today`}
      >
        <svg viewBox="0 0 36 36" className="h-9 w-9 -rotate-90">
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.35)"
            strokeWidth="3.5"
          />
          <circle
            cx="18"
            cy="18"
            r={radius}
            fill="none"
            stroke="#ffffff"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={`${circumference * fill} ${circumference}`}
          />
        </svg>
        <span className="absolute text-[10px] font-bold text-white">
          {activeMembers}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-gradient-to-br from-primary-500 to-lime-400 p-4 text-white shadow-md">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-white/80">
        <Zap className="h-3.5 w-3.5" aria-hidden="true" />
        Live pulse
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <p className="text-2xl font-bold leading-none">
            {formatNumber(activeMembers)}
          </p>
          <p className="mt-1 text-[11px] text-white/80">Active members</p>
        </div>
        <div>
          <p className="text-2xl font-bold leading-none">
            {formatNumber(todayCheckIns)}
          </p>
          <p className="mt-1 text-[11px] text-white/80">Check-ins today</p>
        </div>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/30">
        <div
          className="h-full rounded-full bg-white transition-all duration-500"
          style={{ width: `${Math.round(fill * 100)}%` }}
          role="progressbar"
          aria-valuenow={activeMembers}
          aria-valuemin={0}
          aria-valuemax={capacity}
          aria-label="Active members versus capacity"
        />
      </div>
      <p className="mt-1.5 text-[10px] text-white/75">
        {Math.round(fill * 100)}% of {capacity} capacity
      </p>
    </div>
  );
}

/* --------------------------------- Nav list -------------------------------- */

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { collapsed } = useSidebar();

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4" aria-label="Main navigation">
      {SIDEBAR_NAV.map((section) => (
        <div key={section.title}>
          {!collapsed && (
            <p className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
              {section.title}
            </p>
          )}
          <ul className="space-y-1">
            {section.items.map((item) => {
              const href = reRootHref(item.href);
              const active = isActivePath(pathname, href);
              const Icon = ICONS[item.icon] ?? LayoutDashboard;
              return (
                <li key={item.href}>
                  <Link
                    href={href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-primary-500/10 text-primary-700 dark:bg-primary-500/15 dark:text-primary-300"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
                    )}
                  >
                    {active && (
                      <span
                        aria-hidden="true"
                        className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-primary-500"
                      />
                    )}
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-colors",
                        active
                          ? "text-primary-600 dark:text-primary-400"
                          : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300"
                      )}
                      aria-hidden="true"
                    />
                    {!collapsed && (
                      <>
                        <span className="flex-1 truncate">{item.label}</span>
                        {item.badge && (
                          <span
                            className={cn(
                              "ml-auto inline-flex min-w-[1.25rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                              active
                                ? "bg-primary-500 text-white"
                                : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                            )}
                          >
                            {item.badge}
                          </span>
                        )}
                      </>
                    )}
                    {collapsed && item.badge && (
                      <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-primary-500" aria-hidden="true" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/* --------------------------------- Sidebar --------------------------------- */

export default function Sidebar() {
  const { collapsed, mobileOpen, toggle, setMobileOpen } = useSidebar();
  const closeBtnRef = useRef<HTMLButtonElement>(null);

  // Escape closes the mobile drawer; move focus into it on open.
  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    closeBtnRef.current?.focus();
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [mobileOpen, setMobileOpen]);

  const brandMark = (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary-500 to-lime-400 text-white shadow-sm">
      <Dumbbell className="h-5 w-5" aria-hidden="true" />
    </span>
  );

  return (
    <>
      {/* Desktop rail */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-slate-200 bg-white transition-[width] duration-300 lg:flex dark:border-slate-800 dark:bg-slate-900",
          collapsed ? "w-20" : "w-64"
        )}
        aria-label="Sidebar"
      >
        <div
          className={cn(
            "flex h-16 shrink-0 items-center border-b border-slate-200 px-4 dark:border-slate-800",
            collapsed && "justify-center px-0"
          )}
        >
          <Link
            href="/dashboard"
            className={cn(
              "flex items-center gap-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-lg",
              collapsed && "justify-center"
            )}
          >
            {brandMark}
            {!collapsed && (
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                {APP_NAME}
              </span>
            )}
          </Link>
        </div>

        <NavList />

        <div className="border-t border-slate-200 p-3 dark:border-slate-800">
          {collapsed ? (
            <div className="flex justify-center pb-2">
              <MembershipPulse compact />
            </div>
          ) : (
            <MembershipPulse />
          )}
          <button
            type="button"
            onClick={toggle}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={cn(
              "mt-3 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
              collapsed && "justify-center px-0"
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
            ) : (
              <>
                <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
                <span>Collapse</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile drawer + scrim */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div
            className={cn(
              "absolute inset-y-0 left-0 flex w-64 flex-col bg-white shadow-2xl dark:bg-slate-900",
              "animate-in"
            )}
          >
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-slate-200 px-4 dark:border-slate-800">
              <Link href="/dashboard" className="flex items-center gap-3">
                {brandMark}
                <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  {APP_NAME}
                </span>
              </Link>
              <button
                ref={closeBtnRef}
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <NavList onNavigate={() => setMobileOpen(false)} />

            <div className="border-t border-slate-200 p-3 dark:border-slate-800">
              <MembershipPulse />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
