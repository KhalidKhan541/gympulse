"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CreditCard,
  LogOut,
  Menu,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sun,
  UserRound,
} from "lucide-react";
import { cn, formatRelative } from "@/lib/utils";
import { GP_ATTENDANCE } from "@/lib/fixtures";
import { useSidebar } from "@/contexts/SidebarContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useNotifications } from "@/contexts/NotificationContext";
import Avatar from "@/components/ui/Avatar";

const ACCOUNT_NAME = "Dana Whitfield";
const ACCOUNT_ROLE = "Owner";

function useOutsideClick(
  ref: React.RefObject<HTMLElement | null>,
  open: boolean,
  close: () => void
) {
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: MouseEvent | TouchEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, open, close]);
}

const NOTIF_TONE: Record<string, string> = {
  info: "bg-sky-500",
  success: "bg-green-500",
  warning: "bg-amber-500",
  danger: "bg-red-500",
};

export default function TopBar() {
  const { collapsed, toggle, setMobileOpen } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const { notifications, unreadCount, open, markAllAsRead } = useNotifications();

  const searchRef = useRef<HTMLInputElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const accountRef = useRef<HTMLDivElement>(null);
  const [bellOpen, setBellOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  // Resolve after mount to avoid SSR hydration mismatch on the shortcut label.
  const [isMac, setIsMac] = useState(true);
  useEffect(() => {
    setIsMac(/Mac|iP(hone|ad)/.test(navigator.platform));
  }, []);

  const closeBell = useCallback(() => setBellOpen(false), []);
  const closeAccount = useCallback(() => setAccountOpen(false), []);
  useOutsideClick(bellRef, bellOpen, closeBell);
  useOutsideClick(accountRef, accountOpen, closeAccount);

  // Cmd/Ctrl + K focuses search.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchRef.current?.focus();
        searchRef.current?.select();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // "Today" relative to the fixture dataset: latest date present in attendance.
  const todayCheckIns = useMemo(() => {
    const latest = GP_ATTENDANCE.map((r) => r.date).sort().pop();
    return GP_ATTENDANCE.filter(
      (r) => r.date === latest && r.status === "checked_in"
    ).length;
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/80 px-4 backdrop-blur-md lg:gap-3 lg:px-6 dark:border-slate-800 dark:bg-slate-900/80">
      {/* Mobile menu */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:hidden dark:text-slate-400 dark:hover:bg-slate-800"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      {/* Desktop collapse toggle */}
      <button
        type="button"
        onClick={toggle}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        className="hidden rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 lg:inline-flex dark:text-slate-400 dark:hover:bg-slate-800"
      >
        {collapsed ? (
          <PanelLeftOpen className="h-5 w-5" aria-hidden="true" />
        ) : (
          <PanelLeftClose className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {/* Search */}
      <div className="relative min-w-0 flex-1 max-w-md">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          ref={searchRef}
          type="search"
          placeholder="Search members, classes, invoices…"
          aria-label="Search"
          className={cn(
            "h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-16 text-sm text-slate-900 placeholder:text-slate-400",
            "focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/30",
            "dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:placeholder:text-slate-500"
          )}
        />
        <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-400 sm:block dark:border-slate-600 dark:bg-slate-700 dark:text-slate-400">
          {isMac ? "⌘" : "Ctrl"}+K
        </kbd>
      </div>

      {/* Front-desk status pill */}
      <div className="hidden items-center gap-2 rounded-full border border-primary-500/30 bg-primary-500/10 px-3 py-1.5 xl:flex dark:border-primary-400/30 dark:bg-primary-500/15">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary-500 opacity-75" aria-hidden="true" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-primary-500" aria-hidden="true" />
        </span>
        <span className="text-xs font-semibold text-primary-700 dark:text-primary-300">
          {todayCheckIns} checked in today
        </span>
      </div>

      {/* Theme toggle */}
      <button
        type="button"
        onClick={toggleTheme}
        aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
      >
        {theme === "dark" ? (
          <Sun className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Moon className="h-5 w-5" aria-hidden="true" />
        )}
      </button>

      {/* Notifications */}
      <div ref={bellRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setBellOpen((v) => !v);
            setAccountOpen(false);
          }}
          aria-label={
            unreadCount > 0
              ? `Notifications (${unreadCount} unread)`
              : "Notifications"
          }
          aria-expanded={bellOpen}
          aria-haspopup="true"
          className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800"
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {bellOpen && (
          <div
            role="menu"
            aria-label="Notifications"
            className="absolute right-0 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                Notifications
              </p>
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={unreadCount === 0}
                className="inline-flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 disabled:opacity-50 dark:text-primary-400"
              >
                <CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />
                Mark all read
              </button>
            </div>
            <ul className="max-h-80 overflow-y-auto py-1">
              {notifications.length === 0 && (
                <li className="px-4 py-8 text-center text-sm text-slate-500">
                  You&apos;re all caught up.
                </li>
              )}
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => open(n.id)}
                    className={cn(
                      "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60",
                      !n.read && "bg-primary-500/5"
                    )}
                  >
                    <span
                      className={cn(
                        "mt-1.5 h-2 w-2 shrink-0 rounded-full",
                        NOTIF_TONE[n.type] ?? "bg-slate-400"
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0">
                      <span className={cn(
                        "block truncate text-sm text-slate-900 dark:text-slate-100",
                        !n.read && "font-semibold"
                      )}>
                        {n.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">
                        {n.body}
                      </span>
                      <span className="mt-1 block text-[10px] text-slate-400 dark:text-slate-500">
                        {formatRelative(n.createdAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Account menu */}
      <div ref={accountRef} className="relative">
        <button
          type="button"
          onClick={() => {
            setAccountOpen((v) => !v);
            setBellOpen(false);
          }}
          aria-label="Account menu"
          aria-expanded={accountOpen}
          aria-haspopup="true"
          className="flex items-center gap-2 rounded-lg p-1 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <Avatar name={ACCOUNT_NAME} size="sm" presence="online" />
          <span className="hidden text-left xl:block">
            <span className="block text-sm font-medium leading-none text-slate-900 dark:text-slate-100">
              {ACCOUNT_NAME}
            </span>
            <span className="mt-0.5 block text-[11px] text-slate-500 dark:text-slate-400">
              {ACCOUNT_ROLE}
            </span>
          </span>
        </button>

        {accountOpen && (
          <div
            role="menu"
            aria-label="Account"
            className="absolute right-0 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-xl dark:border-slate-700 dark:bg-slate-900"
          >
            <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
              <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                {ACCOUNT_NAME}
              </p>
              <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                dana@gympulse.fit
              </p>
            </div>
            <Link
              href="/dashboard/settings"
              role="menuitem"
              onClick={closeAccount}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <UserRound className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Profile
            </Link>
            <Link
              href="/dashboard/billing"
              role="menuitem"
              onClick={closeAccount}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <CreditCard className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Billing
            </Link>
            <Link
              href="/dashboard/settings"
              role="menuitem"
              onClick={closeAccount}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              <Settings className="h-4 w-4 text-slate-400" aria-hidden="true" />
              Settings
            </Link>
            <div className="my-1 border-t border-slate-100 dark:border-slate-800" />
            <button
              type="button"
              role="menuitem"
              onClick={closeAccount}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sign out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
