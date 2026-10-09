"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type: "info" | "success" | "warning" | "danger";
  createdAt: string; // ISO
  read: boolean;
}

interface NotificationContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  open: (id: string) => void;
  markAllAsRead: () => void;
  dismiss: (id: string) => void;
  push: (notification: Omit<AppNotification, "id" | "createdAt" | "read">) => void;
}

const NotificationContext = createContext<NotificationContextValue | undefined>(
  undefined
);

const SEED: AppNotification[] = [
  {
    id: "n01",
    title: "Payment overdue",
    body: "Daniel Okafor's Pro Monthly invoice is 33 days overdue.",
    type: "danger",
    createdAt: "2026-10-08T09:12:00.000Z",
    read: false,
  },
  {
    id: "n02",
    title: "HIIT Inferno at capacity",
    body: "Tuesday 7:00 PM class is fully booked (24/24). Consider opening a waitlist.",
    type: "warning",
    createdAt: "2026-10-08T08:40:00.000Z",
    read: false,
  },
  {
    id: "n03",
    title: "New high-intent lead",
    body: "Andre Wilson booked a tour via Google Ads — score 91.",
    type: "success",
    createdAt: "2026-10-07T17:05:00.000Z",
    read: false,
  },
  {
    id: "n04",
    title: "Stock alert",
    body: "BCAA Recovery is out of stock at the POS counter.",
    type: "info",
    createdAt: "2026-10-07T11:22:00.000Z",
    read: true,
  },
  {
    id: "n05",
    title: "Membership frozen",
    body: "Chloe Dubois froze her Elite Annual plan until December.",
    type: "info",
    createdAt: "2026-10-06T15:48:00.000Z",
    read: true,
  },
];

export function GpNotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>(SEED);

  const open = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const dismiss = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  const push = useCallback(
    (input: Omit<AppNotification, "id" | "createdAt" | "read">) => {
      const notification: AppNotification = {
        ...input,
        id: `n${Date.now()}`,
        createdAt: new Date().toISOString(),
        read: false,
      };
      setNotifications((prev) => [notification, ...prev]);
    },
    []
  );

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.read).length,
    [notifications]
  );

  const value = useMemo(
    () => ({ notifications, unreadCount, open, markAllAsRead, dismiss, push }),
    [notifications, unreadCount, open, markAllAsRead, dismiss, push]
  );

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const ctx = useContext(NotificationContext);
  if (!ctx)
    throw new Error("useNotifications must be used within GpNotificationProvider");
  return ctx;
}

/** Alias for consistency with other providers. */
export const NotificationProvider = GpNotificationProvider;
