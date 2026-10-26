import { initials } from "../../lib/utils";

type AvatarProps = {
  name: string;
  size?: "sm" | "md" | "lg";
};

const sizeClasses: Record<NonNullable<AvatarProps["size"]>, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-14 w-14 text-lg",
};

export function Avatar({ name, size = "md" }: AvatarProps) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-brand-100 border border-brand-200 font-bold text-brand-800 shadow-sm dark:bg-brand-900/30 dark:text-brand-100 dark:border-brand-800/30 ${sizeClasses[size]}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
