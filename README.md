# GymPulse

**Run your gym like clockwork.** GymPulse is a full-stack gym & fitness studio
management platform — members, leads, classes, scheduling, trainers, programs,
attendance, POS and billing in one fast, dark-mode-first dashboard.

Built with **Next.js 14 (App Router)**, **TypeScript**, **Tailwind CSS** and
**framer-motion**. Demo data is seeded from typed fixtures, so the whole product
is explorable with zero backend setup.

---

## Features

Every feature maps to a real dashboard route under `src/app/dashboard/`:

| Feature | Route | Dashboard directory | What it does |
| --- | --- | --- | --- |
| **Members** | `/dashboard/members` | `src/app/dashboard/members/` | Roster with plans, status, renewals, health flags and per-member attendance. |
| **Leads** | `/dashboard/leads` | `src/app/dashboard/leads/` | Lead pipeline (new → contacted → trial → booked → closed) with scoring and follow-ups. |
| **Classes** | `/dashboard/classes` | `src/app/dashboard/classes/` | Class catalog with capacity, intensity, trainer assignment and enrollment. |
| **Scheduling** | `/dashboard/schedule` | `src/app/dashboard/schedule/` | Week-view timetable for classes, trainers and rooms. |
| **Trainers** | `/dashboard/trainers` | `src/app/dashboard/trainers/` | Trainer profiles, certifications, ratings, weekly hours and client loads. |
| **Programs** | `/dashboard/programs` | `src/app/dashboard/programs/` | Multi-week paid programs with difficulty tiers and enrollment tracking. |
| **Attendance** | `/dashboard/attendance` | `src/app/dashboard/attendance/` | Front-desk check-ins, no-shows and class attendance history. |
| **POS & Billing** | `/dashboard/pos`, `/dashboard/billing` | `src/app/dashboard/pos/`, `src/app/dashboard/billing/` | Sell supplements & apparel, issue invoices, chase overdue payments. |
| **Settings** | `/dashboard/settings` | `src/app/dashboard/settings/` | 5-section settings: gym profile, appearance (live theme/accent preview), billing, notifications matrix, integrations & staff roles — with a dirty-diff save bar. |
| **Reports** | `/dashboard/reports` | `src/app/dashboard/reports/` | 12-month KPI trends: revenue, members, check-ins, churn. |

## Tech stack

- **Framework**: [Next.js 14](https://nextjs.org) (App Router, React Server + Client Components)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS with `--gp-*` design tokens, `gp-*` component classes and CSS-variable dark mode (`dark` class strategy)
- **Motion**: framer-motion (`MotionConfig reducedMotion="user"`)
- **Icons**: lucide-react
- **Toasts**: react-hot-toast
- **Charts**: recharts
- **Utilities**: clsx + tailwind-merge (`cn`), class-variance-authority, date-fns

## Quick start

```bash
npm install
npm run dev        # http://localhost:3000
```

Open `/` for the landing page, `/dashboard` for the app.

### Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |

## Project tree

```
gympulse/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # Root layout — providers, Toaster, Inter, theme init script
│   │   ├── page.tsx                # Landing page (hero, features, pricing, testimonials, CTA)
│   │   ├── not-found.tsx           # Self-contained 404
│   │   ├── globals.css             # --gp-* tokens, gp-* component classes
│   │   ├── api/
│   │   │   └── health/route.ts     # GET /api/health
│   │   └── dashboard/
│   │       ├── members/            # Members roster
│   │       ├── leads/              # Lead pipeline
│   │       ├── classes/            # Class catalog
│   │       ├── schedule/           # Weekly timetable
│   │       ├── trainers/           # Trainer profiles
│   │       ├── programs/           # Paid programs
│   │       ├── attendance/         # Check-ins & attendance
│   │       ├── pos/                # Point of sale
│   │       ├── billing/            # Invoices & payments
│   │       ├── reports/            # KPI charts
│   │       └── settings/           # 5-section settings page
│   ├── components/
│   │   ├── ui/                     # Avatar, Badge, Button, Card, MetricCard, Tabs, …
│   │   └── dashboard/              # Dashboard shells & shared feature components
│   ├── contexts/
│   │   ├── ThemeContext.tsx        # Light/dark theme (localStorage)
│   │   ├── SidebarContext.tsx      # Collapsed/mobile sidebar state
│   │   └── NotificationContext.tsx # In-app notification center
│   └── lib/
│       ├── constants.ts            # App name, sidebar nav, status vocabularies
│       ├── fixtures.ts             # GP_* typed demo dataset (members, leads, …, GP_SETTINGS)
│       └── utils.ts                # cn() helper
├── tailwind.config.ts              # gp/primary lime palette, animations
├── postcss.config.js
├── next.config.js
└── package.json
```

## Routes

| Route | Description |
| --- | --- |
| `/` | Marketing landing page |
| `/dashboard` | Operations overview (KPIs, charts, activity) |
| `/dashboard/members` | Member management |
| `/dashboard/leads` | Lead pipeline |
| `/dashboard/classes` | Class catalog |
| `/dashboard/schedule` | Weekly schedule |
| `/dashboard/trainers` | Trainer profiles |
| `/dashboard/programs` | Program builder |
| `/dashboard/attendance` | Check-in log |
| `/dashboard/pos` | Point of sale |
| `/dashboard/billing` | Invoices & payments |
| `/dashboard/reports` | Reports & analytics |
| `/dashboard/settings` | Gym settings |
| `/api/health` | Health probe (JSON: status, uptime, version, runtime) — `force-dynamic`, `no-store` |

## Theming

- **Design tokens**: CSS variables `--gp-primary`, `--gp-bg`, `--gp-surface`,
  `--gp-border`, `--gp-text`, `--gp-success/warning/danger/info`, etc. defined in
  `src/app/globals.css` (with a `.dark` override block).
- **Component classes**: `gp-card`, `gp-btn`, `gp-btn-primary`, `gp-badge`,
  `gp-input`, `gp-table`, `gp-skeleton` — all token-driven.
- **Palette**: lime (`gp-50` … `gp-950`, default `#84cc16` light / `#a3e635` dark),
  mirrored under Tailwind's `primary` color namespace.
- **Theme persistence**: the root layout injects a pre-hydration script that
  reads `localStorage["gp-theme"]` (falling back to the legacy
  `gympulse-theme` key) and toggles the `dark` class before first paint —
  no flash of wrong theme. `ThemeContext` keeps it in sync afterwards.
- **Live preview**: the Settings → Appearance section swaps `--gp-primary`
  (lime accent swatches) and theme mode instantly via context.

## Fixtures note

All demo data lives in `src/lib/fixtures.ts` as typed constants —
`GP_MEMBERS` (18), `GP_LEADS` (10), `GP_CLASSES` (10), `GP_TRAINERS` (8),
`GP_PROGRAMS` (8), `GP_ATTENDANCE` (24), `GP_POS_PRODUCTS` (10),
`GP_INVOICES` (12), `GP_KPI` (12 months) and `GP_SETTINGS`. Everything is
in-memory; swap the imports for API calls to go live.

## License

[MIT](./LICENSE) © 2026 KhalidKhan541
