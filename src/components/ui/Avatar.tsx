import {
  Children,
  cloneElement,
  isValidElement,
  useMemo,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn, getInitials } from "@/lib/utils";

export type AvatarSize = "xs" | "sm" | "md" | "lg" | "xl";
export type PresenceStatus = "online" | "away" | "offline" | "busy" | null;

const SIZE_CLASSES: Record<AvatarSize, string> = {
  xs: "h-6 w-6 text-[9px]",
  sm: "h-8 w-8 text-[11px]",
  md: "h-10 w-10 text-xs",
  lg: "h-12 w-12 text-sm",
  xl: "h-16 w-16 text-lg",
};

const PRESENCE_CLASSES: Record<Exclude<PresenceStatus, null>, string> = {
  online: "bg-green-500",
  away: "bg-amber-400",
  offline: "bg-slate-400",
  busy: "bg-red-500",
};

/** Deterministic hash so the same name always gets the same color. */
function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const AVATAR_COLORS = [
  "bg-primary-500",
  "bg-emerald-500",
  "bg-sky-500",
  "bg-violet-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-teal-500",
  "bg-indigo-500",
  "bg-fuchsia-500",
  "bg-cyan-500",
];

export function avatarColorFor(seed: string): string {
  return AVATAR_COLORS[hashString(seed) % AVATAR_COLORS.length];
}

export interface AvatarProps extends HTMLAttributes<HTMLSpanElement> {
  name: string;
  src?: string | null;
  size?: AvatarSize;
  presence?: PresenceStatus;
  /** Optional ring around the avatar (useful in groups). */
  ring?: boolean;
}

export function Avatar({
  name,
  src,
  size = "md",
  presence = null,
  ring = false,
  className,
  ...props
}: AvatarProps) {
  const initials = useMemo(() => getInitials(name) || "?", [name]);
  const colorClass = useMemo(() => avatarColorFor(name), [name]);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 select-none",
        className
      )}
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name}
          className={cn(
            "rounded-full object-cover",
            SIZE_CLASSES[size],
            ring && "ring-2 ring-white dark:ring-slate-900"
          )}
        />
      ) : (
        <span
          role="img"
          aria-label={name}
          className={cn(
            "inline-flex items-center justify-center rounded-full font-semibold text-white",
            SIZE_CLASSES[size],
            colorClass,
            ring && "ring-2 ring-white dark:ring-slate-900"
          )}
        >
          {initials}
        </span>
      )}
      {presence && (
        <span
          aria-hidden="true"
          className={cn(
            "absolute bottom-0 right-0 block rounded-full ring-2 ring-white dark:ring-slate-900",
            size === "xs" ? "h-1.5 w-1.5" : size === "sm" ? "h-2 w-2" : "h-2.5 w-2.5",
            PRESENCE_CLASSES[presence]
          )}
        />
      )}
    </span>
  );
}

export interface AvatarGroupProps extends HTMLAttributes<HTMLSpanElement> {
  /** Avatar elements to stack. */
  children: ReactNode;
  /** Maximum visible avatars before collapsing into "+N". */
  max?: number;
  size?: AvatarSize;
}

export function AvatarGroup({
  children,
  max = 4,
  size = "sm",
  className,
  ...props
}: AvatarGroupProps) {
  const items = Children.toArray(children);
  const visible = items.slice(0, max);
  const overflow = items.length - visible.length;

  return (
    <span
      className={cn("inline-flex items-center -space-x-2", className)}
      {...props}
    >
      {visible.map((child, index) =>
        isValidElement(child)
          ? cloneElement(child as ReactElement<{ className?: string }>, {
              key: index,
              className: cn("ring-2 ring-white dark:ring-slate-900", (child.props as { className?: string }).className),
            })
          : child
      )}
      {overflow > 0 && (
        <span
          className={cn(
            "inline-flex items-center justify-center rounded-full bg-slate-200 font-semibold text-slate-600 ring-2 ring-white dark:bg-slate-700 dark:text-slate-300 dark:ring-slate-900",
            SIZE_CLASSES[size]
          )}
        >
          +{overflow}
        </span>
      )}
    </span>
  );
}

export default Avatar;
