import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthSplit } from "../../components/auth/auth-split";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useMock } from "../../store/MockContext";

export function ResetPassword() {
  const { updatePassword, currentUser, authReady, authMode, configError } = useMock();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    if (password.length < 8) {
      setError("Use at least 8 characters for your new password.");
      return;
    }
    if (password !== confirmPassword) {
      setError("The two passwords do not match.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await updatePassword(password);
      if (!result.ok) {
        setError(result.error ?? "Your password could not be updated. Request a new link.");
        return;
      }
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  const linkInvalid = authReady && !currentUser;

  return (
    <AuthSplit
      eyebrow="Account recovery"
      title="Choose a new password"
      subtitle="Set a password you have not used before, then sign straight back in."
      panelTitle="One new password, back to studying."
      panelBody="Your groups, requests and notifications stay exactly where you left them."
    >
      {authMode !== "supabase" ? (
        <div className="mt-9">
          <Alert variant="warning" title="Password reset unavailable">
            {configError ?? "Connect a Supabase project to enable account recovery."}
          </Alert>
        </div>
      ) : !authReady ? (
        <div className="mt-9">
          <Alert variant="info" title="Checking your reset link…">
            This takes a moment.
          </Alert>
        </div>
      ) : linkInvalid ? (
        <div className="mt-9 space-y-6">
          <Alert variant="error" title="This reset link is invalid or expired">
            Reset links can only be used once and expire quickly. Request a fresh one and open the
            newest email.
          </Alert>
          <Link to="/forgot-password">
            <Button className="w-full">Request a new link</Button>
          </Link>
        </div>
      ) : (
        <form className="mt-9 space-y-5" onSubmit={onSubmit}>
          {error ? (
            <Alert variant="error" title="Could not update your password">
              {error}
            </Alert>
          ) : null}
          <Input
            label="New password"
            type="password"
            autoComplete="new-password"
            required
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (error) setError(null);
            }}
            placeholder="At least 8 characters"
            hint="Use at least 8 characters."
          />
          <Input
            label="Confirm new password"
            type="password"
            autoComplete="new-password"
            required
            value={confirmPassword}
            onChange={(event) => {
              setConfirmPassword(event.target.value);
              if (error) setError(null);
            }}
            placeholder="Re-enter your new password"
          />
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Save new password
          </Button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        <Link
          to="/login"
          className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Back to sign in
        </Link>
      </p>
    </AuthSplit>
  );
}
