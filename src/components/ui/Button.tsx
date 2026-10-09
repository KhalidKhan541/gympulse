import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "relative inline-flex select-none items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-all duration-200 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 " +
    "disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-primary-500 text-white shadow-sm hover:bg-primary-600 active:bg-primary-700",
        secondary:
          "bg-slate-900 text-white shadow-sm hover:bg-slate-800 active:bg-slate-700 " +
          "dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white dark:active:bg-slate-200",
        ghost:
          "bg-transparent text-slate-700 hover:bg-slate-100 active:bg-slate-200 " +
          "dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700",
        danger:
          "bg-red-600 text-white shadow-sm hover:bg-red-700 active:bg-red-800",
        outline:
          "border border-slate-300 bg-transparent text-slate-700 hover:bg-slate-50 active:bg-slate-100 " +
          "dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800 dark:active:bg-slate-700",
        gradient:
          "bg-gradient-to-r from-primary-500 via-primary-400 to-lime-300 text-slate-900 shadow-sm " +
          "hover:from-primary-600 hover:via-primary-500 hover:to-lime-400",
      },
      size: {
        sm: "h-8 rounded-md px-3 text-xs",
        md: "h-10 px-4 text-sm",
        lg: "h-12 rounded-xl px-6 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Shows a spinner and disables interaction. */
  loading?: boolean;
  /** Node rendered before the label (hidden while loading). */
  leftIcon?: ReactNode;
  /** Node rendered after the label. */
  rightIcon?: ReactNode;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      loading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = "button",
      ...props
    },
    ref
  ) => {
    const iconSize =
      size === "lg"
        ? "h-5 w-5"
        : size === "sm"
          ? "h-3.5 w-3.5"
          : size === "icon"
            ? "h-5 w-5"
            : "h-4 w-4";

    return (
      <button
        ref={ref}
        type={type}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading ? (
          <span className={cn("inline-flex shrink-0", iconSize)}>
            <Loader2 className="h-full w-full animate-spin" aria-hidden="true" />
          </span>
        ) : (
          leftIcon && (
            <span
              className={cn("inline-flex shrink-0 [&>svg]:h-full [&>svg]:w-full", iconSize)}
              aria-hidden="true"
            >
              {leftIcon}
            </span>
          )
        )}
        {children}
        {rightIcon && !loading && (
          <span
            className={cn("inline-flex shrink-0 [&>svg]:h-full [&>svg]:w-full", iconSize)}
            aria-hidden="true"
          >
            {rightIcon}
          </span>
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
