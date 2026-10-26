import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AuthSplit } from "../../components/auth/auth-split";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useMock } from "../../store/MockContext";

export function ForgotPassword() {
  const { requestPasswordReset, authMode, configError } = useMock();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError(null);

    try {
      const result = await requestPasswordReset(email);
      if (!result.ok) {
        setError(result.error ?? "The reset email could not be sent. Please try again.");
        return;
      }
      setSent(true);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSplit
      eyebrow="Account recovery"
      title="Reset your password"
      subtitle="Enter the email address on your account and we will send a reset link."
      panelTitle="Locked out? It happens."
      panelBody="Use the same email you registered with. The link expires, so open the newest one you receive."
    >
      {authMode !== "supabase" ? (
        <div className="mt-9">
          <Alert variant="warning" title="Password reset unavailable">
            {configError ?? "Connect a Supabase project to enable account recovery."}
          </Alert>
        </div>
      ) : sent ? (
        <div className="mt-9 space-y-6">
          <Alert variant="success" title="Check your inbox">
            If an account exists for <span className="font-semibold">{email.trim()}</span>, a reset
            link is on its way. Check your spam folder, then open the newest link.
          </Alert>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Reset links expire after a short time and can only be used once.
          </p>
          <Link to="/login">
            <Button variant="outline" className="w-full">
              Back to sign in
            </Button>
          </Link>
        </div>
      ) : (
        <form className="mt-9 space-y-5" onSubmit={onSubmit}>
          {error ? (
            <Alert variant="error" title="Could not send the reset email">
              {error}
            </Alert>
          ) : null}
          <Input
            label="Email address"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (error) setError(null);
            }}
            placeholder="you@university.edu"
            hint="Use the address you registered with."
          />
          <Button type="submit" size="lg" className="w-full" loading={busy}>
            Send reset link
          </Button>
        </form>
      )}

      <p className="mt-8 text-center text-sm text-slate-600 dark:text-slate-400">
        Remembered it?{" "}
        <Link
          to="/login"
          className="font-semibold text-brand-600 transition-colors hover:text-brand-700 dark:text-brand-400 dark:hover:text-brand-300"
        >
          Sign in instead
        </Link>
      </p>
    </AuthSplit>
  );
}
