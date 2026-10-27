import { useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useMock } from "../../store/MockContext";
import { IconSettings, IconShieldCheck } from "../../components/icons";
import type { AcademicLevel, VerificationStatus } from "../../data/types";

export function Profile() {
  const {
    currentUser,
    departments,
    updateProfile,
    requestVerification,
    redeemDepartmentCode,
    profileError,
  } = useMock();

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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [accessCode, setAccessCode] = useState("");
  const [redeeming, setRedeeming] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const verificationStatus: VerificationStatus =
    currentUser.profile?.verification_status ?? "UNVERIFIED";
  const department = departments.find(
    (item) => item.id === currentUser.profile?.department_id
  );
  const canRequestVerification =
    Boolean(currentUser.profile?.department_id) &&
    (verificationStatus === "UNVERIFIED" || verificationStatus === "REJECTED");

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (saving) return;

    const identityChanged =
      departmentId !== (currentUser.profile?.department_id ?? "") ||
      (programme.trim() || null) !== (currentUser.profile?.programme ?? null) ||
      ((academicLevel || null) as string | null) !==
        (currentUser.profile?.academic_level ?? null);

    setSaving(true);
    setError(null);
    setMessage(null);

    try {
      const result = await updateProfile(currentUser.id, {
        display_name: displayName.trim(),
        department_id: departmentId || null,
        programme: programme.trim() || null,
        academic_level: (academicLevel || null) as AcademicLevel | null,
      });

      if (!result.ok) {
        setError(result.error ?? "Could not update your profile. Please try again.");
        return;
      }

      setMessage(
        identityChanged
          ? "Profile updated. Your department verification is pending again because your academic details changed."
          : "Profile updated."
      );
    } catch {
      setError("Could not update your profile right now. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const onRequestVerification = async () => {
    if (requesting) return;
    setRequesting(true);
    setError(null);
    setMessage(null);

    try {
      const result = await requestVerification();
      if (!result.ok) {
        setError(result.error ?? "Could not request verification. Please try again.");
        return;
      }
      setMessage("Verification requested. A moderator will review using the approved UENR eligibility process.");
    } catch {
      setError("Could not request verification right now. Check your connection and try again.");
    } finally {
      setRequesting(false);
    }
  };

  const onRedeemCode = async (event: FormEvent) => {
    event.preventDefault();
    if (redeeming) return;
    setRedeeming(true);
    setError(null);
    setMessage(null);

    try {
      const result = await redeemDepartmentCode(accessCode);
      if (!result.ok) {
        setError(result.error ?? "That code could not be redeemed. Please try again.");
        return;
      }
      setAccessCode("");
      setMessage(
        `Verified. You now have access to ${result.department ?? "your department"}'s study groups.`
      );
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setRedeeming(false);
    }
  };

  const verificationCopy =
    verificationStatus === "VERIFIED"
      ? "Your department affiliation is verified."
      : verificationStatus === "PENDING"
        ? "Enter the department code your class moderator shared to get verified instantly, or wait for a moderator to review your request."
        : verificationStatus === "REJECTED"
          ? "Your last verification request was rejected. Check your details and request another review."
          : "UENR eligibility must be confirmed before group access. The evidence and review process still needs to be agreed.";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Profile
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            View and manage your UENR StudyCircle profile.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/settings">
            <Button variant="outline" size="sm">
              <IconSettings size={16} /> Settings
            </Button>
          </Link>
          {currentUser.role === "MODERATOR" ? (
            <Link to="/moderation">
              <Button variant="outline" size="sm">
                <IconShieldCheck size={16} /> Moderation
              </Button>
            </Link>
          ) : null}
        </div>
      </div>

      {profileError ? (
        <Alert variant="warning" title="Profile sync warning">{profileError}</Alert>
      ) : null}

      <Card className="p-8">
        <div className="flex flex-wrap items-center justify-between gap-5">
          <div className="flex items-center gap-5">
            <span className="flex h-18 w-18 items-center justify-center rounded-3xl bg-brand-50 border border-brand-100 text-3xl font-bold text-brand-700 dark:bg-brand-900/20 dark:border-brand-800/30 dark:text-brand-300">
              {(currentUser.profile?.display_name ?? currentUser.display_name)
                .slice(0, 1)
                .toUpperCase()}
            </span>
            <div>
              <p className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {currentUser.profile?.display_name ?? currentUser.display_name}
              </p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                {currentUser.email}
              </p>
              <div className="flex items-center gap-1.5 mt-2">
                <Badge
                  variant={currentUser.profile?.email_verified ? "brand" : "neutral"}
                  className="px-3 py-1.5"
                >
                  {currentUser.profile?.email_verified ? "Email verified" : "Email not verified"}
                </Badge>
                <Badge
                  variant={department ? "brand-soft" : "neutral"}
                  className="px-3 py-1.5"
                >
                  {department?.name ?? "Department not set"}
                </Badge>
              </div>
            </div>
          </div>
          <div className="max-w-xs rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Verification status
            </p>
            <p className="mt-2 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {verificationCopy}
            </p>
            {verificationStatus !== "VERIFIED" ? (
              <form className="mt-4 space-y-2" onSubmit={onRedeemCode}>
                <Input
                  label="Department code"
                  value={accessCode}
                  onChange={(event) => setAccessCode(event.target.value.toUpperCase())}
                  placeholder="e.g. CLIM-7K2P"
                />
                <Button type="submit" className="w-full" loading={redeeming}>
                  Verify with code
                </Button>
              </form>
            ) : null}
            {canRequestVerification ? (
              <Button
                variant="ghost"
                size="sm"
                className="mt-2 w-full"
                onClick={onRequestVerification}
                loading={requesting}
              >
                Ask a moderator instead
              </Button>
            ) : null}
          </div>
        </div>
      </Card>

      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Edit profile</h2>
          {message ? (
            <Alert variant="success" title="Saved">{message}</Alert>
          ) : null}
        </div>
        {error ? (
          <Alert variant="error" title="Could not save changes">{error}</Alert>
        ) : null}
        <form className="space-y-5" onSubmit={onSubmit}>
          <div>
            <Input
              label="Display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="e.g. Ama Mensah"
            />
          </div>
          <div>
            <label htmlFor="profile-department" className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Department
            </label>
            <select
              id="profile-department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
              className="h-12 w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:ring-brand-900/30"
            >
              <option value="">Select department</option>
              {departments.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              Changing your department, programme or academic level resets verification to pending.
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
            <label htmlFor="profile-level" className="mb-2 block text-sm font-medium text-slate-600 dark:text-slate-300">
              Academic level
            </label>
            <select
              id="profile-level"
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
          <div className="pt-2">
            <Button type="submit" loading={saving} className="w-full">
              Save changes
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
