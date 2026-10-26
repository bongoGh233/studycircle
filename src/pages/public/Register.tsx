import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthSplit } from "../../components/auth/auth-split";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { useMock } from "../../store/MockContext";

const selectClasses =
  "h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900/30";

const labelClasses = "mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300";

export function Register() {
  const { signUp, departments, authMode, configError } = useMock();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [programme, setProgramme] = useState("");
  const [academicLevel, setAcademicLevel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clearError = () => {
    if (error) setError(null);
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (!departmentId) {
      setError("Please select your department.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await signUp({
        display_name: displayName,
        email,
        password,
        department_id: departmentId,
        programme,
        academic_level: academicLevel,
      });

      if (!result.ok) {
        setError(result.error ?? "Unable to create your account. Please try again.");
        return;
      }

      if (result.needsEmailConfirmation === false) {
        navigate("/onboarding", { replace: true });
      } else {
        navigate("/verify-email", { replace: true, state: { email: email.trim() } });
      }
    } catch {
      setError("Unable to create your account right now. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (authMode !== "supabase") {
    return (
      <AuthSplit
        eyebrow="New student account"
        title="Registration unavailable"
        subtitle="Real student accounts require the connected Supabase project."
        panelTitle="A student-led study space."
        panelBody="Registration will open after secure account storage and the UENR eligibility process are configured."
      >
        <div className="mt-9 space-y-4">
          <Alert variant="warning" title="Supabase setup required">
            {configError ?? "Registration is unavailable until Supabase is connected."}
          </Alert>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            UENR student eligibility still needs an agreed verification process. No email domain is assumed.
          </p>
          <Link to="/login" className="block text-center text-sm font-semibold text-brand-600 dark:text-brand-400 transition-colors">
            Back to sign in
          </Link>
        </div>
      </AuthSplit>
    );
  }

  return (
    <AuthSplit
      eyebrow="New student account"
      title="Create your account"
      subtitle="Join with your UENR department to find study circles for your courses."
      panelTitle="Start with your department."
      panelBody="Create a student profile, verify your department, and join the study circles built for your courses."
    >
      <form className="mt-9 space-y-5" onSubmit={onSubmit}>
        {configError ? (
          <Alert variant="error" title="Supabase configuration problem">{configError}</Alert>
        ) : null}
        {error ? (
          <Alert variant="error" title="Registration failed">{error}</Alert>
        ) : null}
        <Input
          label="Full display name"
          required
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            clearError();
          }}
          placeholder="e.g. Ama Mensah"
          autoComplete="name"
        />
        <Input
          label="University email address"
          type="email"
          required
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            clearError();
          }}
          placeholder="you@university.edu"
          autoComplete="email"
        />
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Password"
            type="password"
            required
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              clearError();
            }}
            placeholder="Min. 8 characters"
            autoComplete="new-password"
          />
          <Input
            label="Confirm password"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              clearError();
            }}
            placeholder="Repeat password"
            autoComplete="new-password"
          />
        </div>
        <div>
          <label htmlFor="register-department" className={labelClasses}>
            Department
          </label>
          <select
            id="register-department"
            value={departmentId}
            onChange={(e) => {
              setDepartmentId(e.target.value);
              clearError();
            }}
            className={selectClasses}
          >
            <option value="">Select your department</option>
            {departments.map((department) => (
              <option key={department.id} value={department.id}>
                {department.name}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Department options come from the connected project; the official UENR list must be verified before launch.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Input
            label="Programme"
            value={programme}
            onChange={(e) => setProgramme(e.target.value)}
            placeholder="e.g. BSc Computer Science"
          />
          <div>
            <label htmlFor="register-level" className={labelClasses}>
              Academic level
            </label>
            <select
              id="register-level"
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className={selectClasses}
            >
              <option value="">Select level</option>
              <option>100 Level</option>
              <option>200 Level</option>
              <option>300 Level</option>
              <option>400 Level</option>
            </select>
          </div>
        </div>
        <Button type="submit" size="lg" className="w-full" loading={busy}>
          Create account
        </Button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link
          to="/login"
          className="font-semibold text-brand-600 hover:text-brand-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:text-brand-400 dark:hover:text-brand-300 dark:focus-visible:ring-offset-slate-950 transition-colors"
        >
          Sign in
        </Link>
      </p>

      <p className="mt-5 text-center text-xs leading-relaxed text-slate-500 dark:text-slate-400">
        We will email you a confirmation link. Confirm it to activate your account, then complete the approved student eligibility check before using student-only features.
      </p>
    </AuthSplit>
  );
}
