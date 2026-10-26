import { useId, type SelectHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type SelectOption = { value: string; label: string };

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  options?: SelectOption[];
};

export function Select({ label, id, className, children, options, ...rest }: SelectProps) {
  const autoId = useId();
  const selectId = id ?? autoId;
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={selectId} className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
        </label>
      ) : null}
      <select
        id={selectId}
        className={cn(
          "h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900/30",
          className
        )}
        {...rest}
      >
        {options ? options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        )) : children}
      </select>
    </div>
  );
}
