import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { ThemeToggle } from "../../components/ui/theme-toggle";
import { useMock } from "../../store/MockContext";
import { useTheme } from "../../context/ThemeContext";
import { IconLogout } from "../../components/icons";

export function Settings() {
  const { currentUser, signOut, authMode, configError, profileError } = useMock();
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const onSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    try {
      await signOut();
      navigate("/login", { replace: true });
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Settings
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage your account and app preferences.
        </p>
      </div>

      {configError ? (
        <Alert variant="error" title="Supabase configuration problem">{configError}</Alert>
      ) : null}

      {profileError ? (
        <Alert variant="warning" title="Profile sync warning">{profileError}</Alert>
      ) : null}

      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Appearance</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Choose between light and dark themes.
            </p>
          </div>
          <ThemeToggle />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-500 dark:text-slate-400">Current theme</span>
          <span className="text-sm font-medium text-slate-900 dark:text-slate-100 capitalize">
            {theme}
          </span>
        </div>
      </Card>

      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Account</h2>
        </div>
        <dl className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
            <dt className="font-medium text-slate-900 dark:text-slate-100">Email</dt>
            <dd className="text-right">{currentUser.email}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
            <dt className="font-medium text-slate-900 dark:text-slate-100">Display name</dt>
            <dd className="text-right">
              {currentUser.profile?.display_name ?? currentUser.display_name}
            </dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-slate-100 pb-3 dark:border-slate-800">
            <dt className="font-medium text-slate-900 dark:text-slate-100">Email verification</dt>
            <dd className="text-right">
              {currentUser.profile?.email_verified ? "Verified" : "Not verified"}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="font-medium text-slate-900 dark:text-slate-100">Account source</dt>
            <dd className="text-right">
              {authMode === "supabase" ? "Supabase Auth" : "Unavailable"}
            </dd>
          </div>
        </dl>

        {!currentUser.profile?.email_verified ? (
          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            <Link
              to="/verify-email"
              className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300 transition-colors"
            >
              Verify your email address
            </Link>{" "}
            to unlock group membership.
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={onSignOut} loading={signingOut} className="w-full sm:w-auto">
            <IconLogout size={16} /> Sign out
          </Button>
        </div>
      </Card>

      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Connection</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
          {authMode === "supabase"
            ? "Accounts, profiles, groups, membership requests and notifications use this Supabase project. Discussions, resources, sessions, rules, reports and audits are not yet backed by persistent storage."
            : "Real accounts are unavailable until the local app is configured with the Supabase project URL and anon key."}
        </p>
        {import.meta.env.DEV ? (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Account backend: {authMode}
          </p>
        ) : null}
      </Card>

      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Danger zone</h2>
        </div>
        <Alert variant="warning" title="Account deletion">
          Account deletion and report handling are handled through authorised administrative processes.
          This action will be available in a future release.
        </Alert>
      </Card>
    </div>
  );
}
