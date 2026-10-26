import { Navigate } from "react-router-dom";
import { Alert } from "../../components/ui/alert";
import { Card } from "../../components/ui/card";
import { useMock } from "../../store/MockContext";

export function ModerationReports() {
  const { currentUser } = useMock();
  if (!currentUser) return <Navigate to="/login" replace />;
  if (currentUser.role !== "MODERATOR") return <Navigate to="/dashboard" replace />;
  return <div className="mx-auto max-w-3xl space-y-6"><div><h1 className="text-2xl font-bold text-slate-900 dark:text-slate-50 md:text-3xl">Reported content</h1><p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Report storage and moderation decisions are not connected yet.</p></div><Card className="p-6"><Alert variant="warning" title="Report handling is unavailable">No reports are being collected or reviewed in this build. Do not rely on this screen for safety reporting.</Alert></Card></div>;
}
