"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import toast from "react-hot-toast";
import {
  Building2,
  Palette,
  CreditCard,
  Bell,
  Plug,
  Save,
  Undo2,
  Check,
} from "lucide-react";
import { GP_SETTINGS } from "@/lib/fixtures";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Card, {
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";

/* ------------------------------ Settings model ------------------------------ */

interface SettingsState {
  profile: {
    name: string;
    address: string;
    phone: string;
    email: string;
    timezone: string;
    capacity: number;
    openTime: string;
    closeTime: string;
    plans: { basicMonthly: number; proMonthly: number; eliteAnnual: number };
  };
  appearance: {
    accent: string;
    density: "comfortable" | "compact";
    radius: number;
  };
  billing: {
    currency: string;
    paymentMethods: {
      card: boolean;
      cash: boolean;
      bankTransfer: boolean;
      applePay: boolean;
    };
    lateFeePercent: number;
    graceDays: number;
    billingDay: number;
    autoCharge: boolean;
    trialDays: number;
  };
  notifications: {
    channels: {
      email: boolean;
      sms: boolean;
      push: boolean;
      slack: boolean;
    };
    events: {
      newMember: boolean;
      paymentOverdue: boolean;
      paymentReceived: boolean;
      classAtCapacity: boolean;
      classCancelled: boolean;
      newLead: boolean;
      lowStock: boolean;
      weeklyDigest: boolean;
    };
    quietHours: string;
  };
  integrations: {
    pos: boolean;
    posTerminal: string;
    wearables: { whoop: boolean; fitbit: boolean; appleHealth: boolean };
    stripe: boolean;
    stripeConnectedAccount: string;
    staffRoles: Array<{ role: string; members: number; permissions: string }>;
  };
}

const ACCENT_SWATCHES = [
  { name: "Lime", value: "#84cc16" },
  { name: "Volt", value: "#a3e635" },
  { name: "Sprout", value: "#bef264" },
  { name: "Moss", value: "#65a30d" },
];

function buildInitialState(): SettingsState {
  return {
    profile: {
      name: GP_SETTINGS.profile.name,
      address: GP_SETTINGS.profile.location,
      phone: GP_SETTINGS.profile.phone,
      email: GP_SETTINGS.profile.email,
      timezone: GP_SETTINGS.profile.timezone,
      capacity: GP_SETTINGS.profile.capacity,
      openTime: "05:00",
      closeTime: "23:00",
      plans: { basicMonthly: 49, proMonthly: 89, eliteAnnual: 1299 },
    },
    appearance: {
      accent: GP_SETTINGS.branding.primaryColor,
      density: "comfortable",
      radius: 12,
    },
    billing: {
      currency: GP_SETTINGS.billing.currency,
      paymentMethods: {
        card: true,
        cash: true,
        bankTransfer: false,
        applePay: true,
      },
      lateFeePercent: GP_SETTINGS.billing.lateFeePercent,
      graceDays: 5,
      billingDay: 1,
      autoCharge: GP_SETTINGS.billing.autoCharge,
      trialDays: GP_SETTINGS.billing.trialDays,
    },
    notifications: {
      channels: { email: true, sms: false, push: true, slack: false },
      events: {
        newMember: true,
        paymentOverdue: true,
        paymentReceived: true,
        classAtCapacity: true,
        classCancelled: true,
        newLead: false,
        lowStock: true,
        weeklyDigest: false,
      },
      quietHours: GP_SETTINGS.notifications.quietHours,
    },
    integrations: {
      pos: true,
      posTerminal: "Square Reader (2nd gen)",
      wearables: { whoop: false, fitbit: false, appleHealth: true },
      stripe: GP_SETTINGS.integrations.stripe,
      stripeConnectedAccount: "acct_1PfX2kGymPulse",
      staffRoles: GP_SETTINGS.staffRoles.map((r) => ({ ...r })),
    },
  };
}

/* --------------------------------- Diffing -------------------------------- */

type DiffEntry = { path: string; before: string; after: string };

function collectDiffs(
  saved: unknown,
  draft: unknown,
  prefix = "",
  out: DiffEntry[] = []
): DiffEntry[] {
  if (Object.is(saved, draft)) return out;
  const bothObjects =
    typeof saved === "object" &&
    typeof draft === "object" &&
    saved !== null &&
    draft !== null;
  if (!bothObjects) {
    out.push({
      path: prefix || "root",
      before: JSON.stringify(saved),
      after: JSON.stringify(draft),
    });
    return out;
  }
  const keys = new Set([
    ...Object.keys(saved as Record<string, unknown>),
    ...Object.keys(draft as Record<string, unknown>),
  ]);
  for (const key of keys) {
    collectDiffs(
      (saved as Record<string, unknown>)[key],
      (draft as Record<string, unknown>)[key],
      prefix ? `${prefix}.${key}` : key,
      out
    );
  }
  return out;
}

/* ------------------------------ Small primitives ---------------------------- */

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs text-[var(--gp-text-muted)]">
          {hint}
        </span>
      )}
    </label>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-6 w-11 shrink-0 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gp-primary)] focus-visible:ring-offset-2",
        checked ? "bg-[var(--gp-primary)]" : "bg-[var(--gp-border)]"
      )}
    >
      <span
        className={cn(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
          checked ? "translate-x-[22px]" : "translate-x-0.5"
        )}
        aria-hidden
      />
    </button>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[var(--gp-text)]">{label}</p>
        {description && (
          <p className="mt-0.5 text-xs text-[var(--gp-text-muted)]">
            {description}
          </p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} label={label} />
    </div>
  );
}

/* -------------------------------- Sections -------------------------------- */

const SECTIONS = [
  { id: "profile", label: "Gym profile", icon: Building2 },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "billing", label: "Billing", icon: CreditCard },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "integrations", label: "Integrations & staff", icon: Plug },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [saved, setSaved] = useState<SettingsState>(buildInitialState);
  const [draft, setDraft] = useState<SettingsState>(buildInitialState);
  const [activeSection, setActiveSection] = useState<SectionId>("profile");
  const [saving, setSaving] = useState(false);

  const diffs = useMemo(() => collectDiffs(saved, draft), [saved, draft]);
  const isDirty = diffs.length > 0;

  const patch = useCallback(
    <K extends keyof SettingsState>(
      section: K,
      updater: (prev: SettingsState[K]) => SettingsState[K]
    ) => {
      setDraft((prev) => ({ ...prev, [section]: updater(prev[section]) }));
    },
    []
  );

  // Live preview of the lime accent — applied to the design tokens directly.
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--gp-primary", draft.appearance.accent);
    return () => {
      root.style.removeProperty("--gp-primary");
    };
  }, [draft.appearance.accent]);

  // Scroll-spy for the sticky sidebar.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActiveSection(visible.target.id as SectionId);
      },
      { rootMargin: "-120px 0px -60% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const handleSave = () => {
    if (!isDirty) return;
    setSaving(true);
    // Simulated persist — the demo stores the snapshot in component state.
    window.setTimeout(() => {
      setSaved(draft);
      setSaving(false);
      toast.success("Settings saved");
    }, 450);
  };

  const handleDiscard = () => {
    setDraft(saved);
    toast("Changes discarded", { icon: "↩️" });
  };

  const p = draft.profile;
  const b = draft.billing;
  const n = draft.notifications;
  const i = draft.integrations;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-[var(--gp-text)]">
          Settings
        </h1>
        <p className="mt-1 text-sm text-[var(--gp-text-muted)]">
          Configure your gym&apos;s profile, billing, notifications and
          integrations.
        </p>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
        {/* Sticky sidebar */}
        <nav
          aria-label="Settings sections"
          className="lg:sticky lg:top-6 lg:w-60 lg:shrink-0"
        >
          <ul className="flex gap-1 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible lg:pb-0">
            {SECTIONS.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <li key={section.id} className="shrink-0">
                  <a
                    href={`#${section.id}`}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-[color-mix(in_srgb,var(--gp-primary)_14%,transparent)] text-[var(--gp-primary)]"
                        : "text-[var(--gp-text-muted)] hover:bg-[var(--gp-surface-2)] hover:text-[var(--gp-text)]"
                    )}
                  >
                    <section.icon className="h-4 w-4" aria-hidden />
                    {section.label}
                  </a>
                </li>
              );
            })}
          </ul>

          {/* Dirty summary */}
          {isDirty && (
            <div className="mt-4 hidden rounded-xl border border-amber-300/50 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10 lg:block">
              <p className="text-xs font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                {diffs.length} unsaved change{diffs.length === 1 ? "" : "s"}
              </p>
              <ul className="mt-2 space-y-1.5">
                {diffs.slice(0, 8).map((d) => (
                  <li
                    key={d.path}
                    className="truncate font-mono text-[11px] text-amber-800 dark:text-amber-300"
                    title={d.path}
                  >
                    • {d.path}
                  </li>
                ))}
                {diffs.length > 8 && (
                  <li className="text-[11px] text-amber-700/80 dark:text-amber-400/80">
                    + {diffs.length - 8} more…
                  </li>
                )}
              </ul>
            </div>
          )}
        </nav>

        {/* Sections */}
        <div className="min-w-0 flex-1 space-y-8 pb-24">
          {/* ---------------- 1. Gym profile ---------------- */}
          <section id="profile" className="scroll-mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[var(--gp-primary)]" aria-hidden />
                  <CardTitle>Gym profile</CardTitle>
                </div>
                <CardDescription>
                  Public details shown on invoices, emails and the member app.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Gym name">
                    <input
                      className="gp-input"
                      value={p.name}
                      onChange={(e) =>
                        patch("profile", (prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Phone">
                    <input
                      className="gp-input"
                      value={p.phone}
                      onChange={(e) =>
                        patch("profile", (prev) => ({
                          ...prev,
                          phone: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <Field label="Address">
                  <input
                    className="gp-input"
                    value={p.address}
                    onChange={(e) =>
                      patch("profile", (prev) => ({
                        ...prev,
                        address: e.target.value,
                      }))
                    }
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Front desk email">
                    <input
                      type="email"
                      className="gp-input"
                      value={p.email}
                      onChange={(e) =>
                        patch("profile", (prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Timezone">
                    <input
                      className="gp-input"
                      value={p.timezone}
                      onChange={(e) =>
                        patch("profile", (prev) => ({
                          ...prev,
                          timezone: e.target.value,
                        }))
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Opens">
                    <input
                      type="time"
                      className="gp-input"
                      value={p.openTime}
                      onChange={(e) =>
                        patch("profile", (prev) => ({
                          ...prev,
                          openTime: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Closes">
                    <input
                      type="time"
                      className="gp-input"
                      value={p.closeTime}
                      onChange={(e) =>
                        patch("profile", (prev) => ({
                          ...prev,
                          closeTime: e.target.value,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Max capacity" hint="Fire-code member cap">
                    <input
                      type="number"
                      className="gp-input"
                      value={p.capacity}
                      onChange={(e) =>
                        patch("profile", (prev) => ({
                          ...prev,
                          capacity: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </Field>
                </div>
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
                    Plan names & prices
                  </p>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {(
                      [
                        ["basicMonthly", "Basic Monthly"],
                        ["proMonthly", "Pro Monthly"],
                        ["eliteAnnual", "Elite Annual"],
                      ] as const
                    ).map(([key, label]) => (
                      <div
                        key={key}
                        className="rounded-xl border border-[var(--gp-border)] bg-[var(--gp-surface-2)] p-3"
                      >
                        <p className="text-xs font-medium text-[var(--gp-text-muted)]">
                          {label}
                        </p>
                        <div className="mt-1 flex items-center gap-1.5">
                          <span className="text-sm font-semibold text-[var(--gp-text)]">
                            $
                          </span>
                          <input
                            type="number"
                            className="gp-input !px-2 !py-1"
                            value={p.plans[key]}
                            onChange={(e) =>
                              patch("profile", (prev) => ({
                                ...prev,
                                plans: {
                                  ...prev.plans,
                                  [key]: Number(e.target.value) || 0,
                                },
                              }))
                            }
                          />
                          <span className="text-xs text-[var(--gp-text-muted)]">
                            {key === "eliteAnnual" ? "/yr" : "/mo"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ---------------- 2. Appearance ---------------- */}
          <section id="appearance" className="scroll-mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Palette className="h-4 w-4 text-[var(--gp-primary)]" aria-hidden />
                  <CardTitle>Appearance</CardTitle>
                </div>
                <CardDescription>
                  Theme and accent changes preview live as you edit.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
                    Theme mode
                  </p>
                  <div className="inline-flex rounded-lg border border-[var(--gp-border)] p-1">
                    {(["light", "dark"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setTheme(mode)}
                        className={cn(
                          "rounded-md px-4 py-1.5 text-sm font-medium capitalize transition",
                          theme === mode
                            ? "bg-[var(--gp-primary)] text-white shadow-sm dark:text-[#10160a]"
                            : "text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
                        )}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                  <p className="mt-2 text-xs text-[var(--gp-text-muted)]">
                    Current mode: <strong className="capitalize">{theme}</strong>{" "}
                    — persisted to localStorage.
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
                    Accent color
                  </p>
                  <div className="flex flex-wrap items-center gap-3">
                    {ACCENT_SWATCHES.map((swatch) => (
                      <button
                        key={swatch.value}
                        type="button"
                        onClick={() =>
                          patch("appearance", (prev) => ({
                            ...prev,
                            accent: swatch.value,
                          }))
                        }
                        aria-label={`Accent ${swatch.name}`}
                        className={cn(
                          "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition",
                          draft.appearance.accent === swatch.value
                            ? "border-[var(--gp-primary)] text-[var(--gp-text)]"
                            : "border-[var(--gp-border)] text-[var(--gp-text-muted)] hover:text-[var(--gp-text)]"
                        )}
                      >
                        <span
                          className="h-5 w-5 rounded-full"
                          style={{ backgroundColor: swatch.value }}
                          aria-hidden
                        />
                        {swatch.name}
                        {draft.appearance.accent === swatch.value && (
                          <Check
                            className="h-3.5 w-3.5 text-[var(--gp-primary)]"
                            aria-hidden
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Density">
                    <select
                      className="gp-input"
                      value={draft.appearance.density}
                      onChange={(e) =>
                        patch("appearance", (prev) => ({
                          ...prev,
                          density: e.target.value as "comfortable" | "compact",
                        }))
                      }
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </Field>
                  <Field label="Corner radius" hint={`${draft.appearance.radius}px`}>
                    <input
                      type="range"
                      min={0}
                      max={20}
                      step={2}
                      className="mt-2 w-full accent-[var(--gp-primary)]"
                      value={draft.appearance.radius}
                      onChange={(e) =>
                        patch("appearance", (prev) => ({
                          ...prev,
                          radius: Number(e.target.value),
                        }))
                      }
                    />
                  </Field>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ---------------- 3. Billing ---------------- */}
          <section id="billing" className="scroll-mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-[var(--gp-primary)]" aria-hidden />
                  <CardTitle>Billing</CardTitle>
                </div>
                <CardDescription>
                  Prices, payment methods, late fees and the monthly billing
                  cycle.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Currency">
                    <select
                      className="gp-input"
                      value={b.currency}
                      onChange={(e) =>
                        patch("billing", (prev) => ({
                          ...prev,
                          currency: e.target.value,
                        }))
                      }
                    >
                      {["USD", "EUR", "GBP", "CAD", "AUD"].map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Late fee %" hint="Applied after grace period">
                    <input
                      type="number"
                      step={0.5}
                      className="gp-input"
                      value={b.lateFeePercent}
                      onChange={(e) =>
                        patch("billing", (prev) => ({
                          ...prev,
                          lateFeePercent: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </Field>
                  <Field label="Grace days">
                    <input
                      type="number"
                      className="gp-input"
                      value={b.graceDays}
                      onChange={(e) =>
                        patch("billing", (prev) => ({
                          ...prev,
                          graceDays: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-3">
                  <Field label="Billing day of month">
                    <input
                      type="number"
                      min={1}
                      max={28}
                      className="gp-input"
                      value={b.billingDay}
                      onChange={(e) =>
                        patch("billing", (prev) => ({
                          ...prev,
                          billingDay: Math.min(
                            28,
                            Math.max(1, Number(e.target.value) || 1)
                          ),
                        }))
                      }
                    />
                  </Field>
                  <Field label="Free trial days">
                    <input
                      type="number"
                      className="gp-input"
                      value={b.trialDays}
                      onChange={(e) =>
                        patch("billing", (prev) => ({
                          ...prev,
                          trialDays: Number(e.target.value) || 0,
                        }))
                      }
                    />
                  </Field>
                </div>

                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
                    Payment methods
                  </p>
                  <div className="divide-y divide-[var(--gp-border)]">
                    <ToggleRow
                      label="Card (Visa, Mastercard, Amex)"
                      checked={b.paymentMethods.card}
                      onChange={(v) =>
                        patch("billing", (prev) => ({
                          ...prev,
                          paymentMethods: { ...prev.paymentMethods, card: v },
                        }))
                      }
                    />
                    <ToggleRow
                      label="Cash at front desk"
                      checked={b.paymentMethods.cash}
                      onChange={(v) =>
                        patch("billing", (prev) => ({
                          ...prev,
                          paymentMethods: { ...prev.paymentMethods, cash: v },
                        }))
                      }
                    />
                    <ToggleRow
                      label="Bank transfer (ACH)"
                      description="3–5 business days to settle"
                      checked={b.paymentMethods.bankTransfer}
                      onChange={(v) =>
                        patch("billing", (prev) => ({
                          ...prev,
                          paymentMethods: {
                            ...prev.paymentMethods,
                            bankTransfer: v,
                          },
                        }))
                      }
                    />
                    <ToggleRow
                      label="Apple Pay / Google Pay"
                      checked={b.paymentMethods.applePay}
                      onChange={(v) =>
                        patch("billing", (prev) => ({
                          ...prev,
                          paymentMethods: { ...prev.paymentMethods, applePay: v },
                        }))
                      }
                    />
                    <ToggleRow
                      label="Auto-charge renewals"
                      description="Charge saved cards on the billing day"
                      checked={b.autoCharge}
                      onChange={(v) =>
                        patch("billing", (prev) => ({ ...prev, autoCharge: v }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* ---------------- 4. Notifications ---------------- */}
          <section id="notifications" className="scroll-mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4 text-[var(--gp-primary)]" aria-hidden />
                  <CardTitle>Notifications</CardTitle>
                </div>
                <CardDescription>
                  Choose which events fire on which channels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
                      Channels
                    </p>
                    <div className="divide-y divide-[var(--gp-border)]">
                      <ToggleRow
                        label="Email"
                        checked={n.channels.email}
                        onChange={(v) =>
                          patch("notifications", (prev) => ({
                            ...prev,
                            channels: { ...prev.channels, email: v },
                          }))
                        }
                      />
                      <ToggleRow
                        label="SMS"
                        description="US only — carrier rates apply"
                        checked={n.channels.sms}
                        onChange={(v) =>
                          patch("notifications", (prev) => ({
                            ...prev,
                            channels: { ...prev.channels, sms: v },
                          }))
                        }
                      />
                      <ToggleRow
                        label="Push (web)"
                        checked={n.channels.push}
                        onChange={(v) =>
                          patch("notifications", (prev) => ({
                            ...prev,
                            channels: { ...prev.channels, push: v },
                          }))
                        }
                      />
                      <ToggleRow
                        label="Slack"
                        checked={n.channels.slack}
                        onChange={(v) =>
                          patch("notifications", (prev) => ({
                            ...prev,
                            channels: { ...prev.channels, slack: v },
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
                      Events
                    </p>
                    <div className="divide-y divide-[var(--gp-border)]">
                      {(
                        [
                          ["newMember", "New member joins"],
                          ["paymentOverdue", "Payment overdue"],
                          ["paymentReceived", "Payment received"],
                          ["classAtCapacity", "Class at capacity"],
                          ["classCancelled", "Class cancelled"],
                          ["newLead", "New lead created"],
                          ["lowStock", "POS low stock"],
                          ["weeklyDigest", "Weekly KPI digest"],
                        ] as const
                      ).map(([key, label]) => (
                        <ToggleRow
                          key={key}
                          label={label}
                          checked={n.events[key]}
                          onChange={(v) =>
                            patch("notifications", (prev) => ({
                              ...prev,
                              events: { ...prev.events, [key]: v },
                            }))
                          }
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <Field
                  label="Quiet hours"
                  hint="Non-urgent alerts are batched during this window."
                >
                  <input
                    className="gp-input sm:max-w-[240px]"
                    value={n.quietHours}
                    onChange={(e) =>
                      patch("notifications", (prev) => ({
                        ...prev,
                        quietHours: e.target.value,
                      }))
                    }
                  />
                </Field>
              </CardContent>
            </Card>
          </section>

          {/* ---------------- 5. Integrations & staff ---------------- */}
          <section id="integrations" className="scroll-mt-6">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Plug className="h-4 w-4 text-[var(--gp-primary)]" aria-hidden />
                  <CardTitle>Integrations &amp; staff</CardTitle>
                </div>
                <CardDescription>
                  POS hardware, wearables, Stripe and staff role permissions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="divide-y divide-[var(--gp-border)]">
                  <ToggleRow
                    label="POS terminal"
                    description={i.posTerminal}
                    checked={i.pos}
                    onChange={(v) =>
                      patch("integrations", (prev) => ({ ...prev, pos: v }))
                    }
                  />
                  <ToggleRow
                    label="Stripe payments"
                    description={`Connected account: ${i.stripeConnectedAccount}`}
                    checked={i.stripe}
                    onChange={(v) =>
                      patch("integrations", (prev) => ({ ...prev, stripe: v }))
                    }
                  />
                  <ToggleRow
                    label="WHOOP"
                    description="Recovery & strain into member profiles"
                    checked={i.wearables.whoop}
                    onChange={(v) =>
                      patch("integrations", (prev) => ({
                        ...prev,
                        wearables: { ...prev.wearables, whoop: v },
                      }))
                    }
                  />
                  <ToggleRow
                    label="Fitbit"
                    checked={i.wearables.fitbit}
                    onChange={(v) =>
                      patch("integrations", (prev) => ({
                        ...prev,
                        wearables: { ...prev.wearables, fitbit: v },
                      }))
                    }
                  />
                  <ToggleRow
                    label="Apple Health"
                    checked={i.wearables.appleHealth}
                    onChange={(v) =>
                      patch("integrations", (prev) => ({
                        ...prev,
                        wearables: { ...prev.wearables, appleHealth: v },
                      }))
                    }
                  />
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--gp-text-muted)]">
                    Staff roles
                  </p>
                  <div className="overflow-x-auto rounded-xl border border-[var(--gp-border)]">
                    <table className="gp-table">
                      <thead>
                        <tr>
                          <th>Role</th>
                          <th>People</th>
                          <th>Permissions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {i.staffRoles.map((role) => (
                          <tr key={role.role}>
                            <td className="font-medium">{role.role}</td>
                            <td>
                              <Badge variant="gp">{role.members}</Badge>
                            </td>
                            <td className="text-[var(--gp-text-muted)]">
                              {role.permissions}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-2 text-xs text-[var(--gp-text-muted)]">
                    Role edits are managed per-user from the Members area.
                  </p>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Raw dirty diff (JSON.stringify comparison) */}
          {isDirty && (
            <Card>
              <CardHeader>
                <CardTitle>Pending diff</CardTitle>
                <CardDescription>
                  JSON.stringify comparison of the draft against the last saved
                  snapshot.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {diffs.map((d) => (
                    <li
                      key={d.path}
                      className="rounded-lg bg-[var(--gp-surface-2)] px-3 py-2 font-mono text-xs"
                    >
                      <span className="font-semibold text-[var(--gp-text)]">
                        {d.path}
                      </span>
                      <span className="text-[var(--gp-danger)] line-through">
                        {" "}
                        {d.before}{" "}
                      </span>
                      <span className="text-[var(--gp-success)]">→ {d.after}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Sticky Save / Discard bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t bg-[var(--gp-surface)]/90 backdrop-blur transition-transform duration-200",
          "border-[var(--gp-border)] shadow-[0_-4px_16px_rgba(0,0,0,0.06)]",
          isDirty ? "translate-y-0" : "translate-y-full"
        )}
        role="region"
        aria-label="Unsaved settings changes"
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <p className="text-sm text-[var(--gp-text-muted)]">
            <span className="font-semibold text-[var(--gp-text)]">
              {diffs.length}
            </span>{" "}
            unsaved change{diffs.length === 1 ? "" : "s"}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              leftIcon={<Undo2 className="h-4 w-4" />}
              onClick={handleDiscard}
            >
              Discard
            </Button>
            <Button
              variant="primary"
              loading={saving}
              leftIcon={<Save className="h-4 w-4" />}
              onClick={handleSave}
            >
              Save changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
