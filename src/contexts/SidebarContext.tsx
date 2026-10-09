"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

interface SidebarContextValue {
  collapsed: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  setCollapsed: (collapsed: boolean) => void;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextValue | undefined>(undefined);

const STORAGE_KEY = "gympulse-sidebar-collapsed";

export function GpSidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsedState] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === "true") {
      setCollapsedState(true);
    }
  }, []);

  const setCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next);
    window.localStorage.setItem(STORAGE_KEY, String(next));
  }, []);

  const toggle = useCallback(() => {
    setCollapsedState((prev) => {
      const next = !prev;
      window.localStorage.setItem(STORAGE_KEY, String(next));
      return next;
    });
  }, []);

  // Close the mobile drawer on resize to desktop.
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const handler = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const value = useMemo(
    () => ({ collapsed, mobileOpen, toggle, setCollapsed, setMobileOpen }),
    [collapsed, mobileOpen, toggle, setCollapsed]
  );

  return (
    <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
  );
}

export function useSidebar(): SidebarContextValue {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within GpSidebarProvider");
  return ctx;
}

/** Alias for consistency with other providers. */
export const SidebarProvider = GpSidebarProvider;
