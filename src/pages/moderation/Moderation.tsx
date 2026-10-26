import { Link, Navigate } from "react-router-dom";
import { Card } from "../../components/ui/card";
import { StatusBadge } from "../../components/ui/status-badge";
import { useMock } from "../../store/MockContext";
import { timeAgo } from "../../lib/utils";
import { IconShieldCheck, IconUsers } from "../../components/icons";

export function Moderation() {
  const { reports, profiles, groups, currentUser } = useMock();
  const pendingVerifications = profiles.filter((p) => p.verification_status === "PENDING");
  const openGroups = groups.filter((g) => g.status === "OPEN");

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
          Moderation
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Verification review is available; reports and safety actions are not connected to saved data yet.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <Card className="p-6">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">—</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Reporting not connected</p>
          <Link to="/moderation/reports" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors">
            Review reports
          </Link>
        </Card>
        <Card className="p-6">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{pendingVerifications.length}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Students awaiting verification</p>
          <Link to="/moderation/verifications" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors">
            Review verifications
          </Link>
        </Card>
        <Card className="p-6">
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100">{openGroups.length}</p>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Open study groups</p>
          <Link to="/discover" className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:text-brand-700 dark:text-brand-400 transition-colors">
            View groups
          </Link>
        </Card>
      </div>

      <Card className="p-7">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Recent reports</h2>
        {reports.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Reporting is not connected to saved data yet; a zero here would be misleading.
          </p>
        ) : (
          <ul className="space-y-2">
            {reports.slice(0, 5).map((report) => (
              <li key={report.id} className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 p-3 text-sm dark:border-slate-800">
                <div className="min-w-0">
                  <p className="font-medium text-slate-900 dark:text-slate-100">{report.reason}</p>
                  <p className="mt-1 text-xs text-slate-400">Reported {timeAgo(report.created_at)}</p>
                </div>
                <StatusBadge status={report.status} />
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="p-7">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4">Moderation access</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
          Platform moderators can review department verifications, investigate reports and handle safety actions.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link
            to="/moderation/verifications"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            <IconShieldCheck size={14} />
            Verifications
          </Link>
          <Link
            to="/moderation/reports"
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            <IconUsers size={14} />
            Reports
          </Link>
        </div>
      </Card>
    </div>
  );
}
