import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SidebarProvider } from "@/contexts/SidebarContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GymPulse — Gym & Fitness Studio Management",
  description:
    "Run your gym like clockwork. GymPulse brings members, leads, classes, scheduling, trainers, programs, attendance, POS and billing into one fast dashboard.",
  keywords: [
    "gym management software",
    "fitness studio management",
    "gym CRM",
    "class scheduling",
    "gym POS",
    "membership billing",
  ],
  applicationName: "GymPulse",
  openGraph: {
    type: "website",
    siteName: "GymPulse",
    title: "GymPulse — Gym & Fitness Studio Management",
    description:
      "Members, leads, classes, scheduling, trainers, programs, attendance, POS & billing — one clockwork dashboard for your gym.",
    url: "https://gympulse.fit",
  },
  twitter: {
    card: "summary_large_image",
    title: "GymPulse — Gym & Fitness Studio Management",
    description:
      "Run your gym like clockwork. Members, leads, classes, scheduling, POS & billing in one dashboard.",
  },
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#84cc16",
  width: "device-width",
  initialScale: 1,
};

/**
 * Apply the stored theme (dark class) before hydration to avoid a flash of
 * the wrong theme. Reads `gp-theme` first, falling back to the legacy
 * `gympulse-theme` key used by ThemeContext.
 */
const themeInitScript = `(function(){try{var t=localStorage.getItem("gp-theme")||localStorage.getItem("gympulse-theme");if(t==="dark"||(!t&&window.matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}else{document.documentElement.classList.remove("dark");document.documentElement.style.colorScheme="light";}}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased bg-white text-zinc-900 dark:bg-[#0b0d09] dark:text-zinc-100`}
      >
        <ThemeProvider>
          <SidebarProvider>
            <NotificationProvider>
              {children}
              <Toaster
                position="top-right"
                toastOptions={{
                  className:
                    "!bg-white !text-zinc-900 !shadow-lg dark:!bg-[#16190f] dark:!text-zinc-100",
                  success: {
                    iconTheme: { primary: "#84cc16", secondary: "#fff" },
                  },
                  error: {
                    iconTheme: { primary: "#ef4444", secondary: "#fff" },
                  },
                }}
              />
            </NotificationProvider>
          </SidebarProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
