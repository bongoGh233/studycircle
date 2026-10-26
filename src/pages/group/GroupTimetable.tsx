import { Link, Navigate, useParams } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { useMock } from "../../store/MockContext";
import { formatFullDateTime } from "../../lib/utils";
import { IconCalendar } from "../../components/icons";

export function GroupTimetable() {
  const { groupId } = useParams<{ groupId: string }>();
  const { groups, sessions, memberships, currentUser } = useMock();
  const group = groups.find((item) => item.id === groupId);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!group) return <EmptyState title="Group not found" description="This group may have been removed or is not available to your account." />;
  const membership = memberships.find((item) => item.group_id === groupId && item.student_id === currentUser.id && item.status === "ACTIVE");
  if (!membership) return <EmptyState title="Join the group to see the timetable" description="The study timetable is private to group members." action={<Link to={`/groups/${group.id}`}><Button size="sm">Go to group</Button></Link>} />;
  const groupSessions = sessions.filter((session) => session.group_id === group.id).sort((a, b) => a.starts_at.localeCompare(b.starts_at));
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link to={`/groups/${group.id}`} className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors">
            ← Back to {group.name}
          </Link>
          <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Study timetable
          </h1>
        </div>
        {membership.role === "ADMIN" ? (
          <Link to={`/groups/${group.id}/admin`}>
            <Button size="sm" variant="outline">Admin panel</Button>
          </Link>
        ) : null}
      </div>
      <Card className="p-8">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Sessions</h2>
        {groupSessions.length ? (
          <ul className="space-y-3">
            {groupSessions.map((session) => (
              <li key={session.id} className="rounded-2xl border border-slate-200 p-4 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">{session.title}</p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  <IconCalendar size={14} className="mr-1.5 inline" />
                  {formatFullDateTime(session.starts_at)} – {formatFullDateTime(session.ends_at)} · {session.time_zone}
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{session.location}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Alert variant="info" title="Scheduling is not available yet">
            Session creation, cancellation and timetable data are not connected to persistent storage. No session changes can be saved here.
          </Alert>
        )}
      </Card>
    </div>
  );
}
