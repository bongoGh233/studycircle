import { useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { useMock } from "../../store/MockContext";
import { Alert } from "../ui/alert";
import { Button } from "../ui/button";
import { Avatar } from "../ui/avatar";
import { Brand } from "../brand";
import { ThemeToggle } from "../ui/theme-toggle";
import { IconBell, IconClipboard, IconCompass, IconHome, IconSettings, IconShieldCheck, IconUsers } from "../icons";
import { cn } from "../../lib/utils";

const iconButtonClass =
  "relative inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-600 shadow-sm transition-all hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800";

const navItems = [
  { to: "/dashboard", label: "Dashboard", icon: IconHome },
  { to: "/discover", label: "Discover", icon: IconCompass },
  { to: "/my-groups", label: "My Groups", icon: IconUsers },
  { to: "/my-requests", label: "Requests", icon: IconClipboard },
  { to: "/notifications", label: "Notifications", icon: IconBell },
];

const topNavItems = navItems.filter((item) => item.to !== "/notifications");

export function AppShell({ children }: { children: ReactNode }) {
  const {
    currentUser,
    notifications,
    authMode,
    communityLoading,
    communityError,
    refreshCommunity,
  } = useMock();
  const location = useLocation();
  const unreadCount = notifications.filter((n) => n.user_id === currentUser?.id && !n.read_at).length;
  const [statusDismissed, setStatusDismissed] = useState(
    () =>
      typeof window !== "undefined" &&
      window.localStorage.getItem("studycircle:storage-status-dismissed") === "1"
  );
  const dismissStatus = () => {
    setStatusDismissed(true);
    window.localStorage.setItem("studycircle:storage-status-dismissed", "1");
  };

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(`${to}/`);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/80">
        <div className="mx-auto flex h-14 w-full max-w-[1536px] items-center gap-3 px-4 sm:px-6 xl:px-8">
          <Brand to="/dashboard" size="sm" />
          <nav className="ml-7 hidden items-center gap-1 md:flex">
            {topNavItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => cn("whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all", isActive ? "bg-brand-600 text-white shadow-sm hover:bg-brand-700" : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800")}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            {currentUser?.role === "MODERATOR" ? (
              <Link to="/moderation" className={iconButtonClass} aria-label="Moderation" title="Moderation">
                <IconShieldCheck size={18} />
              </Link>
            ) : null}
            <Link
              to="/settings"
              className={cn(
                "inline-flex h-11 min-w-11 items-center justify-center gap-2 rounded-2xl border px-2.5 text-sm font-medium shadow-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900",
                isActive("/settings")
                  ? "border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-800 dark:bg-brand-900/40 dark:text-brand-200"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
              )}
              aria-label="Settings"
              aria-current={isActive("/settings") ? "page" : undefined}
              title="Settings"
            >
              <IconSettings size={18} aria-hidden="true" />
              <span className="hidden min-[480px]:inline">Settings</span>
            </Link>
            <Link
              to="/notifications"
              className={iconButtonClass}
              aria-label="Notifications"
            >
              <IconBell size={18} />
              {unreadCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-md">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              ) : null}
            </Link>
            <Link to="/profile" aria-label="Profile">
              <Avatar name={currentUser?.display_name ?? "?"} />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-[1536px] px-4 pb-28 pt-8 sm:px-6 xl:px-8 md:pb-12">
        {authMode === "supabase" ? (
          communityError ? (
            <Alert
              variant="error"
              title="Study-group data could not be loaded"
              className="mb-6"
            >
              <p>{communityError}</p>
              <Button size="sm" variant="outline" className="mt-3" onClick={() => void refreshCommunity()}>
                Try again
              </Button>
            </Alert>
          ) : communityLoading ? (
            <Alert variant="info" title="Loading study groups…" className="mb-6">
              Fetching groups, join requests and notifications.
            </Alert>
          ) : !statusDismissed ? (
            <div className="mb-8 flex items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400">
              <span
                aria-hidden="true"
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
              />
              <p className="flex-1">
                <span className="font-semibold text-slate-700 dark:text-slate-200">Live data:</span>{" "}
                accounts, profiles, groups, join requests and notifications are saved to Supabase.
                Discussions, resources, sessions, rules, reports and audit history are not connected
                yet.
              </p>
              <button
                type="button"
                onClick={dismissStatus}
                aria-label="Dismiss this notice"
                className="-mr-1 -mt-1 shrink-0 rounded-lg px-2 py-1 text-base leading-none text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                ×
              </button>
            </div>
          ) : null
        ) : null}
        {children}
        <p className="mt-12 border-t border-slate-200 pt-6 text-[11px] leading-relaxed text-slate-400 dark:border-slate-800">
          UENR StudyCircle is an independent student project. It is not affiliated with or endorsed by
          the University of Energy and Natural Resources.
        </p>
      </main>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/90 backdrop-blur-xl dark:border-slate-800 dark:bg-slate-900/90 md:hidden">
        <div className="mx-auto flex w-full max-w-[1536px] items-stretch justify-between px-3 pb-[env(safe-area-inset-bottom)] pt-3 sm:px-6 xl:px-8">
          {navItems.map((item) => {
            const IconCmp = item.icon;
            const active = isActive(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive: navActive }) => cn("flex flex-1 flex-col items-center gap-1.5 rounded-2xl px-2 py-2.5 text-[10px] font-medium transition-all", navActive || active ? "bg-brand-600/10 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400" : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200")}
              >
                <IconCmp size={20} />
                {item.label}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
