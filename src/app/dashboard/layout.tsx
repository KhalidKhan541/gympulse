import type { Metadata } from "next";
import DashboardShell from "@/components/layout/DashboardShell";

export const metadata: Metadata = {
  title: {
    absolute: "Dashboard · GymPulse",
  },
  robots: {
    index: false,
    follow: false,
  },
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Providers (theme/sidebar/notifications/toast) are mounted in the root layout.
  return <DashboardShell>{children}</DashboardShell>;
}
