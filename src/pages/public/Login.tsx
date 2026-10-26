import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthSplit } from "../../components/auth/auth-split";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useMock } from "../../store/MockContext";

export function Login() {
  const { signIn, authMode, configError } = useMock();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);

    try {
      const result = await signIn(email, password);
      if (result.ok) {
        navigate("/dashboard", { replace: true });
        return;
      }
      if (result.code === "email_not_confirmed") {
        navigate("/verify-email", { replace: true, state: { email: email.trim() } });
        return;
      }
      setError(result.error ?? "Unable to sign in. Please try again.");
    } catch {
      setError("Unable to sign in right now. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const clearError = () => {
    if (error) setError(null);
  };

  return (
    <AuthSplit
      eyebrow="Member sign in"
      title="Welcome back"
      subtitle="Sign in to pick up your groups, shared resources and study sessions."
      panelTitle="Your course. Your people. One study circle."
      panelBody="Find classmates in your verified department, share notes, and keep every session in one calm, focused space."
    >
      {authMode === "supabase" ? (
        <form className="mt-9 space-y-5" onSubmit={onSubmit}>
          {error ? (
            <Alert variant="error" title="Sign in failed">{error}</Alert>
          ) : null}
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              clearError();
            }}
            placeholder="you@university.edu"
          />
          <Input
            label="Password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError();
            }}
            placeholder="••••••••"
          />
          <div className="-mt-1 flex justify-end">
            <Link
              to="/forgot-password"
              className="text-sm font-medium text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
            >
              Forgot password?
            </Link>
          </div>
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Sign in
          </Button>
        </form>
      ) : (
        <div className="mt-9">
          <Alert variant="warning" title="Sign-in unavailable">
            {configError ?? "Connect a Supabase project to enable real student accounts."}
          </Alert>
        </div>
      )}

      {authMode === "supabase" ? (
        <>
          <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
            New to UENR StudyCircle?{" "}
            <Link
              to="/register"
              className="font-semibold text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:text-brand-400 dark:hover:text-brand-300 dark:focus-visible:ring-offset-slate-950 transition-colors"
            >
              Create an account
            </Link>
          </p>
          <p className="mt-7 rounded-3xl border border-slate-200 bg-slate-50 p-5 text-xs leading-relaxed text-slate-500 dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-400">
            Sign-in uses real Supabase accounts. Confirm your email using the link we send before accessing eligible study groups.
          </p>
          <p className="mt-7 text-center text-sm">
            <Link
              to="/verify-email"
              className="font-medium text-slate-600 hover:text-brand-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:text-slate-400 dark:hover:text-brand-400 dark:focus-visible:ring-offset-slate-950 transition-colors"
            >
              Email verification help
            </Link>
          </p>
        </>
      ) : null}
    </AuthSplit>
  );
}
