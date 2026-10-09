"use client";

import type { ReactNode } from "react";
import { Dumbbell, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_NAME } from "@/lib/constants";
import { useSidebar } from "@/contexts/SidebarContext";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";

export default function DashboardShell({ children }: { children: ReactNode }) {
  const { collapsed } = useSidebar();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Skip link — first focusable element on the page. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[70] focus:rounded-lg focus:bg-primary-500 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-lg"
      >
        Skip to main content
      </a>

      <Sidebar />

      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding] duration-300",
          collapsed ? "lg:pl-20" : "lg:pl-64"
        )}
      >
        <TopBar />

        <main
          id="main-content"
          tabIndex={-1}
          className="flex-1 px-4 py-6 focus:outline-none lg:px-8"
        >
          {children}
        </main>

        <footer className="border-t border-slate-200 px-4 py-5 lg:px-8 dark:border-slate-800">
          <div className="flex flex-col items-center justify-between gap-3 text-xs text-slate-500 sm:flex-row dark:text-slate-400">
            <p className="flex items-center gap-1.5">
              <Dumbbell className="h-3.5 w-3.5 text-primary-500" aria-hidden="true" />
              <span className="font-medium text-slate-600 dark:text-slate-300">
                {APP_NAME}
              </span>
              <span aria-hidden="true">·</span>
              <span>Gym management, at full intensity.</span>
            </p>
            <p className="flex items-center gap-1">
              Built with
              <Heart className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
              for gym operators
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
