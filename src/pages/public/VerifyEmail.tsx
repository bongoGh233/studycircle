import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Brand } from "../../components/brand";
import { Alert, type AlertVariant } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useMock } from "../../store/MockContext";

type Notice = { variant: AlertVariant; title: string; body: string };

export function VerifyEmail() {
  const { currentUser, verifyEmail, resendVerificationEmail, authMode, configError } = useMock();
  const location = useLocation();
  const navigate = useNavigate();
  const stateEmail = (location.state as { email?: string } | null)?.email ?? "";
  const [email, setEmail] = useState(currentUser?.email || stateEmail);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState<"resend" | "check" | null>(null);
  const emailVerified = currentUser?.profile?.email_verified === true;
  const departmentVerified = currentUser?.profile?.verification_status === "VERIFIED";

  const onResend = async () => {
    if (busy || !email.trim()) return;
    setBusy("resend");
    try {
      const result = await resendVerificationEmail(email);
      setNotice(result.ok
        ? { variant: "success", title: "Check your inbox", body: "If that email is registered and unconfirmed, the newest confirmation link is on its way. Check spam too." }
        : { variant: "error", title: "Could not resend the email", body: result.error ?? "Please try again in a few minutes." });
    } catch {
      setNotice({ variant: "error", title: "Could not resend the email", body: "Check your internet connection and try again." });
    } finally { setBusy(null); }
  };

  const onCheck = async () => {
    if (busy) return;
    setBusy("check");
    try {
      const result = await verifyEmail(currentUser?.id ?? "");
      if (result.ok) {
        setNotice({ variant: "success", title: "Email verified", body: "Your email address is confirmed. Taking you to your dashboard." });
        navigate("/dashboard", { replace: true });
      } else {
        setNotice({ variant: "info", title: "Not confirmed yet", body: result.error ?? "Open the newest link in your inbox, then try again." });
      }
    } catch {
      setNotice({ variant: "error", title: "Verification check failed", body: "Check your internet connection, then try again." });
    } finally { setBusy(null); }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12 dark:bg-slate-950">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Brand />
        </div>
        <Card className="p-8">
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Verify your email</h1>
          {authMode !== "supabase" ? (
            <div className="mt-5 space-y-4">
              <Alert variant="warning" title="Email verification unavailable">
                {configError ?? "Connect Supabase to send or verify real account email."}
              </Alert>
              <p className="text-sm text-slate-500 dark:text-slate-400">No confirmation email has been sent from this local build.</p>
            </div>
          ) : emailVerified ? (
            <>
              <div className="mt-5">
                <Alert variant="success" title="Email verified">
                  Your email address has been verified. {departmentVerified
                    ? "Your student eligibility is verified too, so you can use permitted group features."
                    : "Your student eligibility still needs review before you can create or join groups."}
                </Alert>
              </div>
              <Link to="/dashboard" className="mt-6 inline-flex">
                <Button>Go to dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <p className="mt-4 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                {currentUser?.email || email
                  ? <>A confirmation link was requested for <span className="font-semibold">{currentUser?.email || email}</span>. Open the newest link to activate your account.</>
                  : "Open the confirmation link from your registration email to activate your account."}
              </p>
              {!currentUser ? (
                <div className="mt-5">
                  <Input
                    label="Email address"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="Your registered email"
                    hint="Use the address you registered with."
                  />
                </div>
              ) : null}
              {notice ? (
                <div className="mt-5">
                  <Alert variant={notice.variant} title={notice.title}>{notice.body}</Alert>
                </div>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <Button variant="outline" onClick={() => void onResend()} loading={busy === "resend"} disabled={!email.trim()}>
                  Resend verification email
                </Button>
                <Button onClick={() => void onCheck()} loading={busy === "check"}>
                  Check verification
                </Button>
              </div>
              <p className="mt-5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                This check uses your real Supabase Auth session. Department/student eligibility is reviewed separately; no email domain is presumed to prove UENR enrollment.
              </p>
            </>
          )}
          <p className="mt-7 text-center text-sm text-slate-500 dark:text-slate-400">
            <Link to="/login" className="font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors">
              Back to sign in
            </Link>
          </p>
        </Card>
      </div>
    </main>
  );
}
