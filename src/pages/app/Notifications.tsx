import { useState } from "react";
import { Alert } from "../../components/ui/alert";
import { EmptyState } from "../../components/ui/empty-state";
import { useMock } from "../../store/MockContext";
import { formatDateTime, timeAgo } from "../../lib/utils";
import { IconBell } from "../../components/icons";
import { Navigate, useNavigate } from "react-router-dom";

const notificationTitles: Record<string, string> = {
  JOIN_REQUEST_RECEIVED: "Join request received",
  JOIN_REQUEST_WITHDRAWN: "Join request withdrawn",
  JOIN_REQUEST_DECIDED: "Join request update",
  ANNOUNCEMENT: "Announcement",
  SESSION_SCHEDULED: "New study session",
  SESSION_UPDATED: "Session updated",
  SESSION_CANCELLED: "Session cancelled",
  RULE_ACKNOWLEDGEMENT_REQUIRED: "New rules to acknowledge",
  REPORT: "Report received",
  MODERATION_ACTION: "Moderation action",
};

export function Notifications() {
  const { currentUser, notifications, markNotificationRead, markAllNotificationsRead } = useMock();
  const navigate = useNavigate();
  const [notice, setNotice] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const myNotifications = notifications
    .filter((n) => n.user_id === currentUser.id)
    .sort((a, b) => b.created_at.localeCompare(a.created_at));

  const markRead = async (id: string) => {
    if (busyId) return false;
    setNotice(null);
    setBusyId(id);
    const result = await markNotificationRead(id, currentUser.id);
    setBusyId(null);
    if (!result.ok) {
      setNotice(result.error ?? "The notification could not be updated.");
      return false;
    }
    return true;
  };

  const onMarkAllRead = async () => {
    if (markingAll) return;
    setNotice(null);
    setMarkingAll(true);
    const result = await markAllNotificationsRead(currentUser.id);
    setMarkingAll(false);
    if (!result.ok) {
      setNotice(result.error ?? "Notifications could not be updated.");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            Notifications
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
            Updates about your groups, requests and sessions.
          </p>
        </div>
        {myNotifications.some((n) => !n.read_at) ? (
          <button
            type="button"
            onClick={onMarkAllRead}
            disabled={markingAll}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800 transition-all"
          >
            {markingAll ? "Marking…" : "Mark all as read"}
          </button>
        ) : null}
      </div>

      {notice ? (
        <Alert variant="error" title="Notifications could not be updated">{notice}</Alert>
      ) : null}

      {myNotifications.length === 0 ? (
        <EmptyState
          icon={<IconBell size={28} />}
          title="No notifications yet"
          description="When there is activity in your study circles you will see it here."
        />
      ) : (
        <div className="space-y-3">
          {myNotifications.map((notification) => {
            const isUnread = !notification.read_at;
            const payload = notification.payload as Record<string, string | undefined>;
            const title = notificationTitles[notification.type] ?? "Notification";
            const groupName = payload?.group_name;
            const actionTo = payload?.group_id ? `/groups/${payload.group_id}` : undefined;
            return (
              <button
                key={notification.id}
                type="button"
                onClick={async () => {
                  const ok = await markRead(notification.id);
                  if (ok && actionTo) navigate(actionTo);
                }}
                disabled={Boolean(busyId)}
                className={`w-full rounded-2xl border p-5 text-left transition-all disabled:cursor-wait disabled:opacity-70 ${
                  isUnread
                    ? "border-brand-200 bg-brand-50 dark:border-brand-900/30 dark:bg-brand-900/20"
                    : "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{timeAgo(notification.created_at)}</span>
                </div>
                <p className="mt-1.5 text-sm text-slate-600 dark:text-slate-400">
                  {groupName ? `${groupName} · ` : ""}
                  {formatDateTime(notification.created_at)}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
