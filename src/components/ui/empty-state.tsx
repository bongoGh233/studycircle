import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

type EmptyStateProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-16 text-center dark:border-slate-700 dark:bg-slate-900", className)}>
      {icon ? <div className="mb-5 text-slate-400 dark:text-slate-500">{icon}</div> : null}
      <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description ? <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">{description}</p> : null}
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}
