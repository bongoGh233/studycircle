import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { Textarea } from "../../components/ui/input";
import { Badge } from "../../components/ui/badge";
import { useMock } from "../../store/MockContext";
import { formatFullDateTime } from "../../lib/utils";
import { IconArrowLeft } from "../../components/icons";

export function GroupDetail() {
  const { groupId } = useParams<{ groupId: string }>();
  const { groups, memberships, joinRequests, sendJoinRequest, currentUser, rules, sessions, users, departments } = useMock();
  const navigate = useNavigate();
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const group = groups.find((g) => g.id === groupId);
  const membership = currentUser ? memberships.find((m) => m.group_id === groupId && m.student_id === currentUser.id && m.status === "ACTIVE") : undefined;
  const pendingRequest = currentUser
    ? joinRequests.find((r) => r.group_id === groupId && r.student_id === currentUser.id && r.status === "PENDING")
    : undefined;

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (!group) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50">Group not found</h1>
        <Alert variant="error" title="Missing group">The study group you are looking for does not exist or was removed.</Alert>
        <Link to="/discover">
          <Button variant="outline">Back to discover</Button>
        </Link>
      </div>
    );
  }

  const department = departments.find((item) => item.id === group.department_id);
  const members = memberships.filter((m) => m.group_id === group.id && m.status === "ACTIVE");
  const adminMembership = members.find((m) => m.role === "ADMIN");
  const admin = adminMembership ? users.find((u) => u.id === adminMembership.student_id) : undefined;
  const isMember = Boolean(membership);
  const isAdmin = membership?.role === "ADMIN";
  const emailVerified = currentUser.profile?.email_verified === true;
  const departmentVerified = currentUser.profile?.verification_status === "VERIFIED";
  const latestRule = rules.filter((r) => r.group_id === group.id).sort((a, b) => b.version - a.version)[0];
  const nextSession = sessions
    .filter((s) => s.group_id === group.id && s.status === "SCHEDULED")
    .sort((a, b) => a.starts_at.localeCompare(b.starts_at))[0];

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!currentUser || busy) return;
    setBusy(true);
    setFeedback(null);
    const result = await sendJoinRequest(currentUser.id, group.id, message);
    setBusy(false);
    if (result.ok) {
      setFeedback({ ok: true, text: "Your join request was sent. The group administrator will review it." });
      setMessage("");
    } else {
      setFeedback({ ok: false, text: result.error ?? "Your join request could not be sent." });
    }
  };

  return (
    <div className="space-y-8">
      <Link
        to="/discover"
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors"
      >
        <IconArrowLeft size={16} />
        Back to discover
      </Link>
      <div className="grid gap-7 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 md:text-3xl tracking-tight">
                    {group.name}
                  </h1>
                  <StatusBadge status={group.status} />
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <Badge variant="brand">
                    {group.group_type === "COURSE" ? "Course group" : "General group"}
                  </Badge>
                  {group.course_name ? (
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{group.course_name}</span>
                  ) : null}
                  {group.programme ? (
                    <span className="text-sm text-slate-500 dark:text-slate-400">{group.programme}</span>
                  ) : null}
                  {group.academic_level ? (
                    <span className="text-sm text-slate-500 dark:text-slate-400">{group.academic_level}</span>
                  ) : null}
                </div>
              </div>
            </div>
            <p className="mt-5 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{group.description}</p>
            <dl className="mt-7 grid gap-5 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Department</dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">{department?.name ?? "—"}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Membership capacity</dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">
                  {members.length} / {group.capacity} {members.length >= group.capacity ? "(Full)" : ""}
                </dd>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Group administrator</dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">{admin?.display_name ?? "—"}</dd>
              </div>
              <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-4">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Created</dt>
                <dd className="mt-1.5 text-sm font-medium text-slate-900 dark:text-slate-100">{formatFullDateTime(group.created_at)}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-7">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Join this group</h2>
            {isMember ? (
              <div className="space-y-4 mt-4">
                <Alert variant="success" title="You are a member">
                  You have access to this group's private workspace. {isAdmin ? "You are the administrator." : ""}
                </Alert>
                <div className="flex flex-wrap gap-2">
                  <Link to={`/groups/${group.id}/workspace`}>
                    <Button size="sm">Open workspace</Button>
                  </Link>
                  <Link to={`/groups/${group.id}/rules`}>
                    <Button size="sm" variant="outline">Rules</Button>
                  </Link>
                  <Link to={`/groups/${group.id}/timetable`}>
                    <Button size="sm" variant="outline">Timetable</Button>
                  </Link>
                  {isAdmin ? (
                    <Link to={`/groups/${group.id}/admin`}>
                      <Button size="sm" variant="outline">Admin</Button>
                    </Link>
                  ) : null}
                </div>
              </div>
            ) : pendingRequest ? (
              <div className="space-y-4 mt-4">
                <Alert variant="warning" title="Pending request">
                  Your join request is pending administrator review. You can withdraw it from your requests page.
                </Alert>
                <div>
                  <Link to="/my-requests">
                    <Button variant="outline" size="sm">View my requests</Button>
                  </Link>
                </div>
              </div>
            ) : !emailVerified || !departmentVerified ? (
              <div className="mt-4 space-y-4">
                <Alert variant="warning" title="Verification needed">
                  {!emailVerified
                    ? "Verify your email address before sending a join request."
                    : "Your department affiliation is awaiting moderator review. You can browse groups while you wait."}
                </Alert>
                {!emailVerified ? (
                  <Link to="/verify-email">
                    <Button size="sm">Verify email</Button>
                  </Link>
                ) : null}
              </div>
            ) : (
              <form className="mt-5 space-y-4" onSubmit={onSubmit}>
                {feedback ? (
                  <Alert variant={feedback.ok ? "success" : "error"} title={feedback.ok ? "Request sent" : "Request failed"}>
                    {feedback.text}
                  </Alert>
                ) : null}
                <div>
                  <Textarea
                    label="Introduction (optional)"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell the admin about your study goals for this group."
                    maxLength={500}
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <Button type="submit" loading={busy}>Send join request</Button>
                  <Button type="button" variant="outline" onClick={() => navigate("/discover")}>
                    Keep browsing
                  </Button>
                </div>
              </form>
            )}
          </Card>

          <Card className="p-7">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Members ({members.length})
            </h2>
            <ul className="space-y-2">
              {members.map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3 dark:border-slate-800">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {users.find((u) => u.id === m.student_id)?.display_name ?? "Student"}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">{m.role}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="p-7">
            <div className="flex items-center justify-between gap-2 mb-4">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Rules preview</h2>
              {latestRule ? <StatusBadge status="ACTIVE" /> : null}
            </div>
            {latestRule ? (
              <>
                <p className="mt-2 text-xs font-medium uppercase tracking-wide text-slate-400">
                  Version {latestRule.version}
                </p>
                <p className="mt-3 line-clamp-6 whitespace-pre-line text-sm text-slate-700 dark:text-slate-300">
                  {latestRule.content}
                </p>
                {isMember ? (
                  <Link
                    to={`/groups/${group.id}/rules`}
                    className="mt-4 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
                  >
                    Read all rules
                  </Link>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                Group rules are not available here yet; this view is not a substitute for an approved, persisted rule set.
              </p>
            )}
          </Card>
          <Card className="p-7">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Next session</h2>
            {nextSession ? (
              <>
                <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-slate-100">{nextSession.title}</p>
                <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
                  {formatFullDateTime(nextSession.starts_at)}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  {nextSession.location} · {nextSession.time_zone}
                </p>
                {isMember ? (
                  <Link
                    to={`/groups/${group.id}/timetable`}
                    className="mt-4 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
                  >
                    View timetable
                  </Link>
                ) : null}
              </>
            ) : (
              <p className="mt-3 text-sm text-amber-700 dark:text-amber-300">
                Session scheduling is not connected to saved data yet, so no session details are shown.
              </p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
