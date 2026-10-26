import { useState, type FormEvent } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { useMock } from "../../store/MockContext";
import type { AcademicLevel } from "../../data/types";

export function Onboarding() {
  const { currentUser, departments, updateProfile, profileError } = useMock();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(
    currentUser?.profile?.display_name ?? currentUser?.display_name ?? ""
  );
  const [departmentId, setDepartmentId] = useState(
    currentUser?.profile?.department_id ?? ""
  );
  const [programme, setProgramme] = useState(currentUser?.profile?.programme ?? "");
  const [academicLevel, setAcademicLevel] = useState(
    currentUser?.profile?.academic_level ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    if (!displayName.trim()) {
      setError("Please enter your display name.");
      return;
    }
    if (!departmentId) {
      setError("Please select your verified department.");
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const result = await updateProfile(currentUser.id, {
        display_name: displayName.trim(),
        department_id: departmentId,
        programme: programme.trim() || null,
        academic_level: (academicLevel || null) as AcademicLevel | null,
      });

      if (!result.ok) {
        setError(result.error ?? "Could not save your profile. Please try again.");
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch {
      setError("Could not save your profile right now. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Complete your profile
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          This information is used to find study groups in your department. Your department and
          programme will be verified by a platform moderator before you can create or join groups.
        </p>
      </div>
      <Card className="p-8">
        <form className="space-y-5" onSubmit={onSubmit}>
          {profileError ? (
            <Alert variant="warning" title="Profile sync warning">{profileError}</Alert>
          ) : null}
          {error ? (
            <Alert variant="error" title="Could not save profile">{error}</Alert>
          ) : null}
          <div>
            <Input
              label="Display name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="e.g. Ama Mensah"
            />
          </div>
          <div>
            <label htmlFor="onboarding-department" className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Department
            </label>
            <select
              id="onboarding-department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900/30"
            >
              <option value="">Select your department</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Changing your department, programme or level later resets department verification to pending.
            </p>
          </div>
          <div>
            <Input
              label="Programme"
              value={programme}
              onChange={(e) => setProgramme(e.target.value)}
              placeholder="e.g. BSc Computer Science"
            />
          </div>
          <div>
            <label htmlFor="onboarding-level" className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Academic level
            </label>
            <select
              id="onboarding-level"
              value={academicLevel}
              onChange={(e) => setAcademicLevel(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900/30"
            >
              <option value="">Select level</option>
              <option>100 Level</option>
              <option>200 Level</option>
              <option>300 Level</option>
              <option>400 Level</option>
            </select>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button type="submit" loading={busy}>
              Save profile
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/dashboard")} disabled={busy}>
              Skip for now
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
