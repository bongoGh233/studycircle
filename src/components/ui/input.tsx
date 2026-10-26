import { useId, type InputHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "../../lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, id, className, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
        </label>
      ) : null}
      <input
        id={inputId}
        className={cn(
          "h-12 w-full rounded-xl border bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-900/30",
          error ? "border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30" : "border-slate-200",
          className
        )}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error ? (
        <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Textarea({ label, error, hint, id, className, ...rest }: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={textareaId} className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
          {label}
        </label>
      ) : null}
      <textarea
        id={textareaId}
        className={cn(
          "min-h-[112px] w-full rounded-xl border bg-white px-3.5 py-3 text-sm text-slate-900 shadow-sm outline-none transition-all",
          "focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:ring-brand-900/30",
          error ? "border-red-500 focus:border-red-500 focus:ring-red-100 dark:focus:ring-red-900/30" : "border-slate-200",
          className
        )}
        aria-invalid={error ? true : undefined}
        {...rest}
      />
      {error ? <p className="mt-2 text-sm font-medium text-red-600 dark:text-red-400">{error}</p> : hint ? <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{hint}</p> : null}
    </div>
  );
}
