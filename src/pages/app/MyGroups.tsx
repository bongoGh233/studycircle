import { Link, Navigate } from "react-router-dom";
import { Button } from "../../components/ui/button";
import { EmptyState } from "../../components/ui/empty-state";
import { useMock } from "../../store/MockContext";
import { GroupCard } from "../../components/GroupCard";
import { IconPlus, IconUsers } from "../../components/icons";
import type { Group } from "../../data/types";

export function MyGroups() {
  const { currentUser, groups, memberships } = useMock();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const myGroups: Group[] = memberships
    .filter((m) => m.student_id === currentUser.id && m.status === "ACTIVE")
    .map((m) => groups.find((g) => g.id === m.group_id))
    .filter((g): g is Group => Boolean(g));

  if (myGroups.length === 0) {
    return (
      <EmptyState
        icon={<IconUsers size={28} />}
        title="You haven't joined any study groups yet"
        description="Discover groups in your verified department and send your first join request."
        action={
          <Link to="/discover">
            <Button size="sm">Discover study groups</Button>
          </Link>
        }
      />
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            My study groups
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Groups you are a member of.
          </p>
        </div>
        <Link to="/groups/new">
          <Button size="sm">
            <IconPlus size={16} />
            Create a group
          </Button>
        </Link>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {myGroups.map((group) => (
          <GroupCard key={group.id} groupId={group.id} />
        ))}
      </div>
    </div>
  );
}
