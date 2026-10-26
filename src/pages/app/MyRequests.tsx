import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { Dialog } from "../../components/ui/dialog";
import { StatusBadge } from "../../components/ui/status-badge";
import { useMock } from "../../store/MockContext";
import { formatDateTime, timeAgo } from "../../lib/utils";
import { IconClipboard } from "../../components/icons";

export function MyRequests() {
  const { currentUser, groups, joinRequests, withdrawJoinRequest } = useMock();
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const myRequests = joinRequests
    .filter((r) => r.student_id === currentUser.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const onConfirmWithdraw = async () => {
    if (!confirmId || busy) return;
    setBusy(true);
    const result = await withdrawJoinRequest(confirmId, currentUser.id);
    setBusy(false);
    setNotice({
      ok: result.ok,
      text: result.ok
        ? "Your join request was withdrawn."
        : result.error ?? "The request could not be withdrawn.",
    });
    if (result.ok) setConfirmId(null);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          My join requests
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Track the status of your requests. You can withdraw a pending request.
        </p>
      </div>

      {notice ? (
        <Alert variant={notice.ok ? "success" : "error"} title={notice.ok ? "Request withdrawn" : "Could not withdraw request"}>
          {notice.text}
        </Alert>
      ) : null}

      {myRequests.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center dark:border-slate-700 dark:bg-slate-900">
          <div className="flex justify-center text-slate-400">
            <IconClipboard size={32} />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900 dark:text-slate-100">No join requests yet</h2>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">When you request to join a study group it will appear here.</p>
          <div className="mt-7">
            <Link to="/discover">
              <Button size="sm">Discover groups</Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-5">
          {myRequests.map((request) => {
            const group = groups.find((g) => g.id === request.group_id);
            const pending = request.status === "PENDING";
            return (
              <Card key={request.id} className="p-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    {group ? (
                      <Link
                        to={`/groups/${group.id}`}
                        className="text-lg font-bold text-slate-900 hover:text-brand-700 dark:text-slate-100 dark:hover:text-brand-400 transition-colors"
                      >
                        {group.name}
                      </Link>
                    ) : (
                      <p className="text-lg font-bold text-slate-900 dark:text-slate-100">Unknown group</p>
                    )}
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <StatusBadge status={request.status} />
                      <span className="text-xs text-slate-500 dark:text-slate-400">Requested {timeAgo(request.created_at)}</span>
                    </div>
                  </div>
                  {pending ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmId(request.id)}
                      disabled={busy}
                    >
                      Withdraw request
                    </Button>
                  ) : null}
                </div>
                {request.message ? (
                  <p className="mt-4 text-sm text-slate-600 dark:text-slate-400 italic">
                    "{request.message}"
                  </p>
                ) : null}
                {request.status === "REJECTED" && request.decision_reason ? (
                  <div className="mt-4">
                    <Alert variant="warning" title="Decision reason">{request.decision_reason}</Alert>
                  </div>
                ) : null}
                {group ? (
                  <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    Group: {group.name} · Decided {request.decided_at ? formatDateTime(request.decided_at) : "—"}
                  </p>
                ) : null}
              </Card>
            );
          })}
        </div>
      )}

      <Dialog
        open={Boolean(confirmId)}
        onClose={() => setConfirmId(null)}
        title="Withdraw join request?"
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmId(null)}
              disabled={busy}
            >
              Keep request
            </Button>
            <Button variant="danger" size="sm" onClick={onConfirmWithdraw} loading={busy}>
              Withdraw request
            </Button>
          </>
        }
      >
        The group administrator will no longer see this request. You can send a new request later if the group is still open.
      </Dialog>
    </div>
  );
}
