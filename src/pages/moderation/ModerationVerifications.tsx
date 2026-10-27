import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Card } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { useMock } from "../../store/MockContext";

type Notice = {
  variant: "success" | "error";
  message: string;
};

export function ModerationVerifications() {
  const {
    profiles,
    reviewVerification,
    currentUser,
    users,
    departments,
    profilesLoading,
    profileError,
    departmentCodes,
    rotateDepartmentCode,
  } = useMock();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedDepartment, setCopiedDepartment] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [codesNotice, setCodesNotice] = useState<string | null>(null);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const pending = profiles.filter((profile) => profile.verification_status === "PENDING");

  const copyCode = async (departmentId: string, code: string) => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopiedDepartment(departmentId);
      window.setTimeout(() => setCopiedDepartment(null), 1600);
    } catch {
      setCodesNotice("Copying failed — select the code and copy it manually.");
    }
  };

  const rotate = async (departmentId: string, name: string) => {
    if (rotatingId) return;
    setRotatingId(departmentId);
    setCodesNotice(null);

    try {
      const result = await rotateDepartmentCode(departmentId);
      if (!result.ok) {
        setCodesNotice(result.error ?? "Could not create a new code. Please try again.");
        return;
      }
      setCodesNotice(`New code for ${name}: ${result.newCode}. Share it with that class only.`);
    } catch {
      setCodesNotice("Could not create a new code right now. Check your connection.");
    } finally {
      setRotatingId(null);
    }
  };

  const decide = async (studentId: string, status: "VERIFIED" | "REJECTED", name: string) => {
    if (busyId) return;
    setBusyId(studentId);
    setNotice(null);

    try {
      const result = await reviewVerification(studentId, status, currentUser.id);
      if (!result.ok) {
        setNotice({
          variant: "error",
          message: result.error ?? "Could not update this verification. Please try again.",
        });
        return;
      }
      setNotice({
        variant: "success",
        message:
          status === "VERIFIED"
            ? `Approved verification for ${name}.`
            : `Rejected verification for ${name}. The student can request another review.`,
      });
    } catch {
      setNotice({
        variant: "error",
        message: "Could not update this verification right now. Check your connection and try again.",
      });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Department verifications
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Review student department affiliation requests in the moderation queue.
        </p>
      </div>

      {notice ? (
        <Alert
          variant={notice.variant}
          title={notice.variant === "success" ? "Verification updated" : "Action failed"}
        >
          {notice.message}
        </Alert>
      ) : null}

      {profileError ? (
        <Alert variant="warning" title="Profile sync warning">{profileError}</Alert>
      ) : null}

      <Alert variant="warning" title="Student eligibility evidence is not configured">
        A confirmed email and self-entered department, programme or level do not prove current UENR enrollment. Share a
        department code only with students you know are in that class — anyone holding the code is verified
        automatically.
      </Alert>

      <Card className="p-7">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Verification queue ({pending.length})
        </h2>

        {profilesLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading the verification queue…</p>
        ) : pending.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">The verification queue is empty.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((profile) => {
              const user = users.find((item) => item.id === profile.id);
              const department = departments.find((item) => item.id === profile.department_id);
              const isBusy = busyId === profile.id;

              return (
                <li
                  key={profile.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-4 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {profile.display_name}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {user?.email ?? "No email on file"}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {department?.name ?? "Department not set"}
                      {profile.programme ? ` · ${profile.programme}` : ""}
                      {profile.academic_level ? ` · ${profile.academic_level}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={profile.verification_status} />
                    <button
                      type="button"
                      className="inline-flex min-h-[40px] items-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={Boolean(busyId)}
                      aria-busy={isBusy}
                      onClick={() => void decide(profile.id, "VERIFIED", profile.display_name)}
                    >
                      {isBusy ? "Saving…" : "Approve"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex min-h-[40px] items-center rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                      disabled={Boolean(busyId)}
                      aria-busy={isBusy}
                      onClick={() => void decide(profile.id, "REJECTED", profile.display_name)}
                    >
                      {isBusy ? "Saving…" : "Reject"}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Card>

      <Card className="p-7">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          Department codes ({departmentCodes.length})
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Paste one code into that class&apos;s WhatsApp group. Any student who enters it is verified
          instantly — no approval needed. Rotate a code if it leaks.
        </p>

        {codesNotice ? (
          <div className="mt-4">
            <Alert variant="info" title="Department code">
              {codesNotice}
            </Alert>
          </div>
        ) : null}

        <ul className="mt-4 max-h-96 space-y-2 overflow-y-auto pr-1">
          {[...departments]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((department) => {
              const row = departmentCodes.find((item) => item.department_id === department.id);
              const isRotating = rotatingId === department.id;

              return (
                <li
                  key={department.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">
                      {department.name}
                    </p>
                    <p className="mt-0.5 font-mono text-sm tracking-wide text-brand-700 dark:text-brand-300">
                      {row?.code ?? "No code yet"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex min-h-[36px] items-center rounded-xl border border-slate-200 px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                      disabled={!row}
                      onClick={() => void copyCode(department.id, row?.code ?? "")}
                    >
                      {copiedDepartment === department.id ? "Copied" : "Copy"}
                    </button>
                    <button
                      type="button"
                      className="inline-flex min-h-[36px] items-center rounded-xl bg-slate-900 px-3 text-xs font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                      disabled={Boolean(rotatingId)}
                      aria-busy={isRotating}
                      onClick={() => void rotate(department.id, department.name)}
                    >
                      {isRotating ? "Creating…" : "New code"}
                    </button>
                  </div>
                </li>
              );
            })}
        </ul>
      </Card>
    </div>
  );
}
