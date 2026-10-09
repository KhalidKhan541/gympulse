import { forwardRef, type HTMLAttributes, type ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export const cardVariants = cva(
  "rounded-2xl transition-colors duration-200",
  {
    variants: {
      variant: {
        default:
          "border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900",
        outlined:
          "border-2 border-slate-200 bg-transparent dark:border-slate-700",
        elevated:
          "border border-slate-200 bg-white shadow-lg shadow-slate-900/5 dark:border-slate-800 dark:bg-slate-900 dark:shadow-black/20",
        interactive:
          "cursor-pointer border border-slate-200 bg-white shadow-sm hover:-translate-y-0.5 hover:border-primary-500/50 hover:shadow-md " +
          "dark:border-slate-800 dark:bg-slate-900 dark:hover:border-primary-500/40",
        gradient:
          "border-0 bg-gradient-to-br from-primary-500 via-lime-400 to-emerald-400 text-slate-900 shadow-md",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface CardProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  /** Adds hover/focus affordances for clickable cards. */
  interactive?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, interactive, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        cardVariants({ variant: interactive ? "interactive" : variant }),
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";

export function CardHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex flex-col gap-1.5 p-6 pb-3", className)}
      {...props}
    />
  );
}

export function CardTitle({
  className,
  ...props
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-base font-semibold leading-tight tracking-tight text-slate-900 dark:text-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function CardDescription({
  className,
  ...props
}: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn(
        "text-sm text-slate-500 dark:text-slate-400",
        className
      )}
      {...props}
    />
  );
}

export function CardContent({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6 pt-3", className)} {...props} />;
}

export function CardFooter({
  className,
  children,
  ...props
}: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 border-t border-slate-100 p-6 pt-4 dark:border-slate-800",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Card;
