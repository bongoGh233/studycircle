import { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { StatusBadge } from "../../components/ui/status-badge";
import { Textarea } from "../../components/ui/input";
import { useMock } from "../../store/MockContext";
import { timeAgo } from "../../lib/utils";
import { IconUsers } from "../../components/icons";

export function GroupAdmin() {
  const { groupId } = useParams<{ groupId: string }>();
  const { groups, memberships, joinRequests, decideJoinRequest, currentUser, users } = useMock();
  const [reasonByRequest, setReasonByRequest] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [busyRequestId, setBusyRequestId] = useState<string | null>(null);
  const [busyDecision, setBusyDecision] = useState<"ACCEPT" | "REJECT" | null>(null);

  const group = groups.find((g) => g.id === groupId);
  const membership = currentUser ? memberships.find((m) => m.group_id === groupId && m.student_id === currentUser.id && m.status === "ACTIVE") : undefined;
  const isAdmin = membership?.role === "ADMIN";

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!group) {
    return <EmptyState title="Group not found" description="This group may have been removed." />;
  }

  if (!isAdmin) {
    return (
      <EmptyState
        title="Administrator access required"
        description="Only the administrator of this group can manage membership decisions."
        action={
          <Link to={`/groups/${group.id}`}>
            <Button size="sm">Back to group</Button>
          </Link>
        }
      />
    );
  }

  const pendingRequests = joinRequests.filter((r) => r.group_id === group.id && r.status === "PENDING");
  const members = memberships.filter((m) => m.group_id === group.id && m.status === "ACTIVE");

  const onDecide = async (requestId: string, decision: "ACCEPT" | "REJECT") => {
    if (busyRequestId) return;
    setBusyRequestId(requestId);
    setBusyDecision(decision);
    const reason = reasonByRequest[requestId] ?? "";
    const result = await decideJoinRequest(requestId, decision, reason, currentUser.id);
    setBusyRequestId(null);
    setBusyDecision(null);
    setFeedback({
      ok: result.ok,
      text:
        result.error ??
        (decision === "ACCEPT"
          ? "The applicant was accepted."
          : "The applicant was rejected."),
    });
    if (result.ok) {
      setReasonByRequest((previous) => {
        const next = { ...previous };
        delete next[requestId];
        return next;
      });
    }
  };

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          to={`/groups/${group.id}`}
          className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors"
        >
          ← Back to {group.name}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Group administration
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Manage join requests and review members of {group.name}.
        </p>
      </div>

      {feedback ? (
        <Alert
          variant={feedback.ok ? "success" : "error"}
          title={feedback.ok ? "Decision recorded" : "Decision failed"}
        >
          {feedback.text}
        </Alert>
      ) : null}

      <Card className="p-7">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Pending join requests ({pendingRequests.length})
        </h2>
        {pendingRequests.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">There are no pending join requests.</p>
        ) : (
          <div className="space-y-5">
            {pendingRequests.map((request) => (
              <div key={request.id} className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">
                      {users.find((u) => u.id === request.student_id)?.display_name ?? request.student_id}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">Requested {timeAgo(request.created_at)}</p>
                  </div>
                  <StatusBadge status={request.status} />
                </div>
                {request.message ? (
                  <p className="mt-3 text-sm text-slate-600 dark:text-slate-400 italic">"{request.message}"</p>
                ) : null}
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <Textarea
                    aria-label="Rejection reason"
                    maxLength={500}
                    value={reasonByRequest[request.id] ?? ""}
                    onChange={(e) =>
                      setReasonByRequest({ ...reasonByRequest, [request.id]: e.target.value })
                    }
                    placeholder="Rejection reason (required to reject)"
                    className="min-h-[80px]"
                  />
                  <div className="flex items-end gap-2">
                    <Button
                      size="md"
                      onClick={() => onDecide(request.id, "ACCEPT")}
                      loading={busyRequestId === request.id && busyDecision === "ACCEPT"}
                      disabled={Boolean(busyRequestId) && busyRequestId !== request.id}
                    >
                      Accept
                    </Button>
                    <Button
                      size="md"
                      variant="danger"
                      onClick={() => onDecide(request.id, "REJECT")}
                      loading={busyRequestId === request.id && busyDecision === "REJECT"}
                      disabled={Boolean(busyRequestId) && busyRequestId !== request.id}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card className="p-7">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
          Current members ({members.length})
        </h2>
        <ul className="space-y-2">
          {members.map((m) => (
            <li key={m.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                {users.find((u) => u.id === m.student_id)?.display_name ?? m.student_id}
              </span>
              <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{m.role}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
          <IconUsers size={16} />
          <span>{members.length} of {group.capacity} seats taken</span>
        </div>
      </Card>
    </div>
  );
}
