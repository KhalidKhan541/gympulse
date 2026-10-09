import { forwardRef, type HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const badgeVariants = cva(
  "inline-flex items-center gap-1 whitespace-nowrap rounded-full font-medium",
  {
    variants: {
      variant: {
        default:
          "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
        success:
          "bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-400",
        warning:
          "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400",
        danger:
          "bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400",
        info: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-400",
        secondary:
          "bg-slate-500/10 text-slate-600 dark:bg-slate-400/10 dark:text-slate-300",
        gp: "bg-primary-500/15 text-primary-700 dark:bg-primary-500/20 dark:text-primary-300",
      },
      size: {
        sm: "px-1.5 py-0.5 text-[10px]",
        md: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export type BadgeVariant = NonNullable<
  VariantProps<typeof badgeVariants>["variant"]
>;

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  /** Renders a small leading status dot. */
  dot?: boolean;
}

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, dot = false, children, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(badgeVariants({ variant, size }), className)}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />}
      {children}
    </span>
  )
);
Badge.displayName = "Badge";

export default Badge;
