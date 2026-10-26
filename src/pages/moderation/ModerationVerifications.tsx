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
  } = useMock();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const pending = profiles.filter((profile) => profile.verification_status === "PENDING");

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
        A confirmed email and self-entered department, programme or level do not prove current UENR enrollment. Do not approve an account solely from these profile fields; use an agreed, university-approved evidence process.
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
    </div>
  );
}
