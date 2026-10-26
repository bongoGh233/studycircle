import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "./context/ThemeContext";
import { MockProvider } from "./store/MockContext";
import { ModerationRoute, ProtectedRoute, PublicOnlyRoute } from "./components/routes";
import { AppShell } from "./components/layout/AppShell";
import { Landing } from "./pages/public/Landing";
import { Login } from "./pages/public/Login";
import { Register } from "./pages/public/Register";
import { ForgotPassword } from "./pages/public/ForgotPassword";
import { ResetPassword } from "./pages/public/ResetPassword";
import { VerifyEmail } from "./pages/public/VerifyEmail";
import { PrivacyPolicy, TermsOfService } from "./pages/public/Legal";
import { Onboarding } from "./pages/app/Onboarding";
import { Dashboard } from "./pages/app/Dashboard";
import { Discover } from "./pages/app/Discover";
import { MyGroups } from "./pages/app/MyGroups";
import { MyRequests } from "./pages/app/MyRequests";
import { Notifications } from "./pages/app/Notifications";
import { Profile } from "./pages/app/Profile";
import { Settings } from "./pages/app/Settings";
import { CreateGroup } from "./pages/group/CreateGroup";
import { GroupDetail } from "./pages/group/GroupDetail";
import { GroupWorkspace } from "./pages/group/GroupWorkspace";
import { GroupRules } from "./pages/group/GroupRules";
import { GroupTimetable } from "./pages/group/GroupTimetable";
import { GroupAdmin } from "./pages/group/GroupAdmin";
import { Moderation } from "./pages/moderation/Moderation";
import { ModerationVerifications } from "./pages/moderation/ModerationVerifications";
import { ModerationReports } from "./pages/moderation/ModerationReports";

export default function App() {
  return (
    <ThemeProvider>
      <MockProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<PublicOnlyRoute><Login /></PublicOnlyRoute>} />
          <Route path="/register" element={<PublicOnlyRoute><Register /></PublicOnlyRoute>} />
          <Route path="/verify-email" element={<VerifyEmail />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* Authenticated routes inside the app shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell>
                  <Outlet />
                </AppShell>
              </ProtectedRoute>
            }
          >
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/discover" element={<Discover />} />
            <Route path="/my-groups" element={<MyGroups />} />
            <Route path="/my-requests" element={<MyRequests />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/settings" element={<Settings />} />

            {/* Group routes */}
            <Route path="/groups/new" element={<CreateGroup />} />
            <Route path="/groups/:groupId" element={<GroupDetail />} />
            <Route path="/groups/:groupId/workspace" element={<GroupWorkspace />} />
            <Route path="/groups/:groupId/rules" element={<GroupRules />} />
            <Route path="/groups/:groupId/timetable" element={<GroupTimetable />} />
            <Route path="/groups/:groupId/admin" element={<GroupAdmin />} />

            {/* Platform moderation routes */}
            <Route path="/moderation" element={<ModerationRoute><Moderation /></ModerationRoute>} />
            <Route path="/moderation/verifications" element={<ModerationRoute><ModerationVerifications /></ModerationRoute>} />
            <Route path="/moderation/reports" element={<ModerationRoute><ModerationReports /></ModerationRoute>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MockProvider>
    </ThemeProvider>
  );
}
