import type { HTMLAttributes } from "react";
import { cn } from "../../lib/utils";

export type BadgeVariant = "success" | "warning" | "danger" | "info" | "neutral" | "brand" | "brand-soft";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
};

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-900/30",
  warning: "bg-amber-50 text-amber-700 border border-amber-100 dark:bg-amber-900/20 dark:text-amber-300 dark:border-amber-900/30",
  danger: "bg-red-50 text-red-700 border border-red-100 dark:bg-red-900/20 dark:text-red-300 dark:border-red-900/30",
  info: "bg-sky-50 text-sky-700 border border-sky-100 dark:bg-sky-900/20 dark:text-sky-300 dark:border-sky-900/30",
  neutral: "bg-slate-50 text-slate-700 border border-slate-200 dark:bg-slate-800/30 dark:text-slate-300 dark:border-slate-700",
  brand: "bg-brand-600 text-white border border-brand-600 dark:bg-brand-600 dark:text-white",
  "brand-soft": "bg-brand-50 text-brand-700 border border-brand-100 dark:bg-brand-900/20 dark:text-brand-300 dark:border-brand-800/30",
};

export function Badge({ variant = "neutral", className, ...props }: BadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold", variantClasses[variant], className)} {...props} />
  );
}
