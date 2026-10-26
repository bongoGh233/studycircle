import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { useMock } from "../store/MockContext";
import { Badge } from "./ui/badge";
import { StatusBadge } from "./ui/status-badge";

type GroupCardProps = {
  groupId: string;
  children?: ReactNode;
};

export function GroupCard({ groupId, children }: GroupCardProps) {
  const { groups, memberships, departments } = useMock();
  const group = groups.find((g) => g.id === groupId);

  if (!group) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm text-slate-500 dark:text-slate-400">This study group could not be found.</p>
        <Link to="/discover" className="mt-4 inline-flex text-sm font-semibold text-brand-600 dark:text-brand-400 transition-colors">
          Back to discover
        </Link>
      </div>
    );
  }

  const department = departments.find((item) => item.id === group.department_id);
  const members = memberships.filter((m) => m.group_id === group.id && m.status === "ACTIVE");
  const isFull = members.length >= group.capacity;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all group dark:border-slate-800 dark:bg-slate-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
            {group.name}
          </h3>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge variant="brand">{group.group_type === "COURSE" ? "Course group" : "General group"}</Badge>
            <StatusBadge status={group.status} />
          </div>
        </div>
      </div>
      {group.course_name ? (
        <p className="mt-4 text-sm font-medium text-slate-700 dark:text-slate-300">{group.course_name}</p>
      ) : null}
      {group.description ? (
        <p className="mt-2 line-clamp-3 text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          {group.description}
        </p>
      ) : null}
      <dl className="mt-5 grid grid-cols-2 gap-3 text-xs text-slate-500 dark:text-slate-400">
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
          <dt className="font-medium text-slate-400">Department</dt>
          <dd className="mt-1 text-slate-700 dark:text-slate-300">{department?.name ?? "—"}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
          <dt className="font-medium text-slate-400">Level</dt>
          <dd className="mt-1 text-slate-700 dark:text-slate-300">{group.academic_level ?? "—"}</dd>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
          <dt className="font-medium text-slate-400">Members</dt>
          <dd className="mt-1 text-slate-700 dark:text-slate-300">
            {members.length} / {group.capacity} {isFull ? "· Full" : ""}
          </dd>
        </div>
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/50 p-3">
          <dt className="font-medium text-slate-400">Admin</dt>
          <dd className="mt-1 text-slate-700 dark:text-slate-300">
            {members.find((m) => m.role === "ADMIN") ? "Group admin" : "—"}
          </dd>
        </div>
      </dl>
      {children}
      <Link
        to={`/groups/${group.id}`}
        className="mt-5 inline-flex text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors"
      >
        View group
      </Link>
    </div>
  );
}
