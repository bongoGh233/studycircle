import type { ReactElement } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Brand } from "./brand";
import { useMock } from "../store/MockContext";

function AuthLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 dark:bg-slate-950">
      <div className="flex flex-col items-center gap-4" role="status" aria-live="polite">
        <Brand />
        <span
          className="h-6 w-6 animate-spin rounded-full border-2 border-brand-500 border-t-transparent"
          aria-hidden="true"
        />
        <p className="text-sm text-slate-600 dark:text-slate-400">Checking your session…</p>
      </div>
    </main>
  );
}

export function ProtectedRoute({ children }: { children: ReactElement }) {
  const { currentUserId, authReady } = useMock();
  const location = useLocation();

  if (!authReady) return <AuthLoading />;
  if (!currentUserId) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }
  return children;
}

export function PublicOnlyRoute({ children }: { children: ReactElement }) {
  const { currentUserId, authReady } = useMock();

  if (!authReady) return <AuthLoading />;
  if (currentUserId) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

export function ModerationRoute({ children }: { children: ReactElement }) {
  const { currentUser, authReady } = useMock();

  if (!authReady) return <AuthLoading />;
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }
  if (currentUser.role !== "MODERATOR") {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}
