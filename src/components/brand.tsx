import { Link } from "react-router-dom";
import { cn } from "../lib/utils";

type BrandSize = "sm" | "md";

const tileClasses: Record<BrandSize, string> = {
  sm: "h-8 w-8 rounded-lg p-1",
  md: "h-10 w-10 rounded-xl p-1.5",
};

const eyebrowClasses: Record<BrandSize, string> = {
  sm: "text-[8px]",
  md: "text-[9px]",
};

const nameClasses: Record<BrandSize, string> = {
  sm: "text-sm",
  md: "text-[15px]",
};

/**
 * The UENR crest on a white plate.
 *
 * The crest asset already has a transparent background, but it contains white
 * details, so it always sits on a white tile instead of inheriting the page
 * background (which would make those details disappear in dark mode).
 */
export function BrandMark({ size = "md", className }: { size?: BrandSize; className?: string }) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden bg-white shadow-sm ring-1 ring-slate-900/10 dark:ring-white/15",
        tileClasses[size],
        className
      )}
    >
      <img
        src="/brand/uenr-crest.png"
        alt=""
        width={429}
        height={557}
        draggable={false}
        className="h-full w-full object-contain"
      />
    </span>
  );
}

/**
 * Site lockup: UENR crest, the institution line and the product name.
 *
 * The visible name is split over two lines to stay compact in mobile headers.
 * The accessible label spells the full name out and repeats the independence
 * disclaimer so the trademark context travels with the mark.
 */
export function Brand({ to = "/", size = "md", showTagline = true, className }: BrandProps) {
  return (
    <Link
      to={to}
      aria-label="UENR StudyCircle home — independent student project, not an official UENR app"
      className={cn(
        "inline-flex shrink-0 items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-950",
        className
      )}
    >
      <BrandMark size={size} />
      <span className="flex min-w-0 flex-col justify-center">
        <span
          className={cn(
            "font-bold uppercase leading-none tracking-[0.2em] text-slate-500 dark:text-slate-400",
            eyebrowClasses[size]
          )}
        >
          UENR
        </span>
        <span
          className={cn(
            "mt-1 font-extrabold leading-none tracking-tight text-slate-900 dark:text-slate-50",
            nameClasses[size]
          )}
        >
          StudyCircle
        </span>
        {showTagline ? (
          <span className="mt-1 hidden text-[9px] font-medium leading-none text-slate-500 dark:text-slate-400 sm:block">
            Independent student project
          </span>
        ) : null}
      </span>
    </Link>
  );
}

type BrandProps = {
  /** Where the lockup links to. Public pages use `/`, the app shell uses `/dashboard`. */
  to?: string;
  size?: BrandSize;
  /** Small "independent student project" line, shown from the `sm` breakpoint up. */
  showTagline?: boolean;
  className?: string;
};
