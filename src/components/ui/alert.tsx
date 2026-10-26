import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { IconAlert, IconCheck, IconInfo } from "../icons";

export type AlertVariant = "error" | "success" | "info" | "warning";

type AlertProps = {
  variant?: AlertVariant;
  title?: string;
  children?: ReactNode;
  onClose?: () => void;
  className?: string;
};

const variantClasses: Record<AlertVariant, string> = {
  error: "bg-red-50 border-red-100 text-red-800 dark:bg-red-900/20 dark:border-red-900/30 dark:text-red-200",
  success: "bg-emerald-50 border-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-900/30 dark:text-emerald-200",
  info: "bg-sky-50 border-sky-100 text-sky-800 dark:bg-sky-900/20 dark:border-sky-900/30 dark:text-sky-200",
  warning: "bg-amber-50 border-amber-100 text-amber-800 dark:bg-amber-900/20 dark:border-amber-900/30 dark:text-amber-200",
};

const icons: Record<AlertVariant, typeof IconInfo> = {
  error: IconAlert,
  success: IconCheck,
  info: IconInfo,
  warning: IconAlert,
};

export function Alert({ variant = "info", title, children, onClose, className }: AlertProps) {
  const IconCmp = icons[variant];
  const iconColor =
    variant === "error" ? "text-red-600 dark:text-red-400" : variant === "success" ? "text-emerald-600 dark:text-emerald-400" : variant === "warning" ? "text-amber-600 dark:text-amber-400" : "text-sky-600 dark:text-sky-400";
  return (
    <div role="alert" className={cn("flex items-start gap-3 rounded-2xl border p-4 text-sm", variantClasses[variant], className)}>
      <div className="mt-0.5 shrink-0">
        <IconCmp size={18} className={iconColor} />
      </div>
      <div className="min-w-0 flex-1 leading-relaxed">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className="mt-1">{children}</div> : null}
      </div>
      {onClose ? (
        <button type="button" onClick={onClose} aria-label="Dismiss" className="rounded-lg p-1.5 text-current opacity-60 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      ) : null}
    </div>
  );
}
