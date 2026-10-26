import type { ReactNode } from "react";
import { Brand } from "../brand";
import { ThemeToggle } from "../ui/theme-toggle";
import { IconCheck, IconShieldCheck, IconUsers } from "../icons";

const AUTH_POSTER = "/media/uenr-campus-poster.jpg";

const benefits = [
  "Verified department communities",
  "Private, member-only workspaces",
  "Notes, sessions and discussions in one place",
];

type AuthSplitProps = {
  eyebrow: string;
  title: string;
  subtitle: string;
  /** Form, links and secondary actions. */
  children: ReactNode;
  panelTitle: string;
  panelBody: string;
};

/**
 * Split-screen shell shared by the sign-in and sign-up pages.
 *
 * The left column holds the form; the right column is a branded visual panel
 * using the UENR campus image. The panel is decorative and only appears from
 * the `lg` breakpoint so small screens keep the form front and centre.
 */
export function AuthSplit({ eyebrow, title, subtitle, children, panelTitle, panelBody }: AuthSplitProps) {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 lg:grid lg:grid-cols-2">
      <main className="flex min-h-screen flex-col px-5 py-6 sm:px-8 lg:min-h-0 lg:border-r lg:border-slate-200 lg:px-12 lg:py-8 dark:lg:border-slate-800">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
          <div className="flex items-center justify-between gap-4">
            <Brand />
            <ThemeToggle />
          </div>

          <div className="flex flex-1 items-center py-10">
            <div className="w-full">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-400">
                {eyebrow}
              </p>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-50 sm:text-4xl">
                {title}
              </h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{subtitle}</p>
              {children}
            </div>
          </div>

          <p className="pb-2 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Independent student project. Not affiliated with or endorsed by the University of Energy and Natural Resources.
          </p>
        </div>
      </main>

      <aside className="relative hidden overflow-hidden bg-slate-950 lg:block">
        <img src={AUTH_POSTER} alt="" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-slate-950/55" />
        <div className="absolute inset-0 bg-gradient-to-br from-brand-900/90 via-slate-950/55 to-slate-950/95" />
        <div
          className="absolute inset-0"
          style={{ backgroundImage: "radial-gradient(ellipse at center, rgba(2,6,23,0) 0%, rgba(2,6,23,0.6) 100%)" }}
        />

        <div className="relative flex h-full min-h-[42rem] flex-col justify-between gap-10 p-8 xl:p-12">
          <span className="inline-flex w-fit items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md">
            <IconShieldCheck size={14} className="text-brand-200" />
            Independent UENR pilot
          </span>

          <div className="max-w-md">
            <h2 className="text-3xl font-extrabold leading-tight tracking-tight text-white xl:text-4xl">{panelTitle}</h2>
            <p className="mt-3 text-sm leading-relaxed text-slate-200 xl:text-base">{panelBody}</p>

            <div
              aria-hidden="true"
              className="mt-6 rounded-2xl border border-white/15 bg-white/10 p-4 shadow-2xl shadow-slate-950/40 backdrop-blur-xl xl:p-5"
            >
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
                  <IconUsers size={18} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-white">Database Systems Study Circle</p>
                  <p className="text-xs text-slate-300">CS305 · Computer Science</p>
                </div>
                <span className="ml-auto shrink-0 rounded-full border border-emerald-300/30 bg-emerald-400/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-200">
                  Open
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl bg-slate-950/30 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Next session</p>
                  <p className="mt-1 text-xs font-semibold text-white">Tue · 4:00 PM</p>
                  <p className="mt-0.5 text-[10px] text-slate-300">Normalisation &amp; ER</p>
                </div>
                <div className="rounded-xl bg-slate-950/30 p-3">
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">Department</p>
                  <p className="mt-1 text-xs font-semibold text-white">Computer Science</p>
                  <p className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-emerald-300">
                    <IconCheck size={10} /> Verified
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {["KM", "AD", "YA"].map((initials) => (
                    <span
                      key={initials}
                      className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-slate-900 bg-brand-500 text-[9px] font-bold text-white"
                    >
                      {initials}
                    </span>
                  ))}
                </div>
                <span className="text-[10px] font-medium uppercase tracking-wide text-slate-400">Product preview</span>
              </div>
            </div>

            <ul className="mt-6 space-y-2.5 text-sm text-slate-200">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-center gap-2.5">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10 text-brand-200">
                    <IconCheck size={12} />
                  </span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-[10px] text-white/60">
            Campus photography by{" "}
            <a
              href="https://commons.wikimedia.org/wiki/Category:University_of_Energy_and_Natural_Resources_(Ghana)"
              target="_blank"
              rel="noreferrer"
              className="underline decoration-white/35 underline-offset-2 transition-colors hover:text-white/85"
            >
              Noahalorwu via Wikimedia Commons
            </a>
            , licensed CC BY-SA 4.0.
          </p>
        </div>
      </aside>
    </div>
  );
}
