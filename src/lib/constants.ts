export const APP_NAME = "GymPulse";
export const APP_TAGLINE = "Gym & fitness studio management";

export type NavItem = {
  label: string;
  href: string;
  icon: string; // lucide icon name resolved by the sidebar
  badge?: string;
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export const SIDEBAR_NAV: NavSection[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard" },
      { label: "Reports", href: "/reports", icon: "BarChart3" },
    ],
  },
  {
    title: "Growth",
    items: [
      { label: "Leads", href: "/leads", icon: "UserPlus", badge: "10" },
      { label: "Members", href: "/members", icon: "Users", badge: "18" },
    ],
  },
  {
    title: "Programming",
    items: [
      { label: "Classes", href: "/classes", icon: "Dumbbell" },
      { label: "Schedule", href: "/schedule", icon: "CalendarDays" },
      { label: "Trainers", href: "/trainers", icon: "BadgeCheck" },
      { label: "Programs", href: "/programs", icon: "ClipboardList" },
    ],
  },
  {
    title: "Front Desk",
    items: [
      { label: "Attendance", href: "/attendance", icon: "ScanLine" },
      { label: "POS", href: "/pos", icon: "ShoppingCart" },
      { label: "Billing", href: "/billing", icon: "CreditCard" },
    ],
  },
  {
    title: "System",
    items: [
      { label: "Settings", href: "/settings", icon: "Settings" },
    ],
  },
];

export const MEMBER_STATUS = ["active", "past_due", "frozen", "cancelled"] as const;
export const LEAD_STATUS = ["new", "contacted", "trial", "booked", "closed"] as const;
export const INVOICE_STATUS = ["paid", "due", "overdue", "refunded"] as const;
