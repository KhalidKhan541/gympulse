"use client";

import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useId,
  useMemo,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

export type TabsVariant = "pill" | "underline";

interface TabsContextValue {
  value: string;
  setValue: (value: string) => void;
  baseId: string;
  variant: TabsVariant;
}

const TabsContext = createContext<TabsContextValue | undefined>(undefined);

function useTabsContext(component: string): TabsContextValue {
  const ctx = useContext(TabsContext);
  if (!ctx) throw new Error(`<${component}> must be used within <Tabs>`);
  return ctx;
}

export interface TabsProps {
  /** Controlled active tab value. */
  value?: string;
  /** Uncontrolled initial value. */
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  variant?: TabsVariant;
  className?: string;
  children: ReactNode;
}

export function Tabs({
  value,
  defaultValue = "",
  onValueChange,
  variant = "pill",
  className,
  children,
}: TabsProps) {
  const baseId = useId();
  const [internal, setInternal] = useState(defaultValue);
  const isControlled = value !== undefined;
  const activeValue = isControlled ? value : internal;

  const setValue = useCallback(
    (next: string) => {
      if (!isControlled) setInternal(next);
      onValueChange?.(next);
    },
    [isControlled, onValueChange]
  );

  const ctx = useMemo(
    () => ({ value: activeValue, setValue, baseId, variant }),
    [activeValue, setValue, baseId, variant]
  );

  return (
    <TabsContext.Provider value={ctx}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

export interface TabsListProps {
  className?: string;
  children: ReactNode;
  "aria-label"?: string;
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ className, children, ...props }, ref) => {
    const { variant, setValue } = useTabsContext("TabsList");

    const onKeyDown = useCallback(
      (event: KeyboardEvent<HTMLDivElement>) => {
        const triggers = Array.from(
          event.currentTarget.querySelectorAll<HTMLButtonElement>(
            'button[role="tab"]:not([disabled])'
          )
        );
        if (triggers.length === 0) return;

        const currentIndex = triggers.findIndex(
          (t) => t === document.activeElement
        );
        if (currentIndex === -1) return;

        let nextIndex: number;
        switch (event.key) {
          case "ArrowRight":
          case "ArrowDown":
            nextIndex = (currentIndex + 1) % triggers.length;
            break;
          case "ArrowLeft":
          case "ArrowUp":
            nextIndex = (currentIndex - 1 + triggers.length) % triggers.length;
            break;
          case "Home":
            nextIndex = 0;
            break;
          case "End":
            nextIndex = triggers.length - 1;
            break;
          default:
            return;
        }

        event.preventDefault();
        const next = triggers[nextIndex];
        next.focus();
        const nextValue = next.dataset.value;
        if (nextValue !== undefined) setValue(nextValue);
      },
      [setValue]
    );

    return (
      <div
        ref={ref}
        role="tablist"
        aria-orientation="horizontal"
        onKeyDown={onKeyDown}
        className={cn(
          "inline-flex items-center gap-1",
          variant === "pill" && "rounded-full bg-slate-100 p-1 dark:bg-slate-800",
          variant === "underline" &&
            "w-full border-b border-slate-200 dark:border-slate-800",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsList.displayName = "TabsList";

export interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  disabled?: boolean;
  className?: string;
}

export const TabsTrigger = forwardRef<HTMLButtonElement, TabsTriggerProps>(
  ({ value, children, disabled = false, className }, ref) => {
    const { value: activeValue, setValue, baseId, variant } =
      useTabsContext("TabsTrigger");

    const isActive = activeValue === value;

    return (
      <button
        ref={ref}
        type="button"
        role="tab"
        id={`${baseId}-tab-${value}`}
        aria-selected={isActive}
        aria-controls={`${baseId}-panel-${value}`}
        tabIndex={isActive ? 0 : -1}
        disabled={disabled}
        data-value={value}
        onClick={() => setValue(value)}
        className={cn(
          "inline-flex items-center justify-center whitespace-nowrap rounded-full text-sm font-medium transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
          "disabled:pointer-events-none disabled:opacity-50",
          variant === "pill" &&
            cn(
              "px-4 py-1.5",
              isActive
                ? "bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            ),
          variant === "underline" &&
            cn(
              "-mb-px border-b-2 px-4 py-2.5",
              isActive
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:text-slate-400 dark:hover:border-slate-600 dark:hover:text-slate-200"
            ),
          className
        )}
      >
        {children}
      </button>
    );
  }
);
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
  /** Keep mounted while hidden (preserves scroll/state). */
  forceMount?: boolean;
}

export function TabsContent({
  value,
  children,
  className,
  forceMount = false,
}: TabsContentProps) {
  const { value: activeValue, baseId } = useTabsContext("TabsContent");
  const isActive = activeValue === value;

  if (!isActive && !forceMount) return null;

  return (
    <div
      role="tabpanel"
      id={`${baseId}-panel-${value}`}
      aria-labelledby={`${baseId}-tab-${value}`}
      tabIndex={0}
      hidden={!isActive}
      className={cn(
        "mt-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2",
        className
      )}
    >
      {children}
    </div>
  );
}

export default Tabs;
