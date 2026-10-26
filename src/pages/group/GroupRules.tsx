import { Link, Navigate, useParams } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Button } from "../../components/ui/button";
import { Card } from "../../components/ui/card";
import { EmptyState } from "../../components/ui/empty-state";
import { useMock } from "../../store/MockContext";
import { formatFullDateTime } from "../../lib/utils";

export function GroupRules() {
  const { groupId } = useParams<{ groupId: string }>();
  const { groups, rules, memberships, currentUser } = useMock();
  const group = groups.find((item) => item.id === groupId);
  if (!currentUser) return <Navigate to="/login" replace />;
  if (!group) return <EmptyState title="Group not found" description="This group may have been removed or is not available to your account." />;
  const membership = memberships.find((item) => item.group_id === groupId && item.student_id === currentUser.id && item.status === "ACTIVE");
  if (!membership) return <EmptyState title="Join the group to read its rules" description="Group rules are private to members after a join request is accepted." action={<Link to={`/groups/${group.id}`}><Button size="sm">Go to group</Button></Link>} />;
  const groupRules = rules.filter((rule) => rule.group_id === groupId).sort((a, b) => b.version - a.version);
  const current = groupRules[0];
  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link to={`/groups/${group.id}`} className="text-sm font-medium text-slate-600 hover:text-brand-600 dark:text-slate-300 dark:hover:text-brand-400 transition-colors">
          ← Back to {group.name}
        </Link>
        <h1 className="mt-4 text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Group rules
        </h1>
      </div>
      <Card className="p-8">
        {current ? (
          <>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Current rules · version {current.version}
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Published {formatFullDateTime(current.created_at)}
            </p>
            <pre className="mt-6 whitespace-pre-wrap rounded-2xl bg-slate-50 p-5 text-sm text-slate-700 dark:bg-slate-800 dark:text-slate-300">
              {current.content}
            </pre>
          </>
        ) : (
          <Alert variant="info" title="Rules are not available yet">
            Rule publishing and acknowledgements are not connected to persistent storage. An empty panel does not mean the group has no rules.
          </Alert>
        )}
      </Card>
    </div>
  );
}
