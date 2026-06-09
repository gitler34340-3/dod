import { createBrowserRouter, Navigate } from "react-router";
import { NewLoginScreen } from "@/app/components/NewLoginScreen";
import { DashboardScreen } from "@/app/components/DashboardScreen";
import { ImprovedScheduleScreen } from "@/app/components/ImprovedScheduleScreen";
import { DocumentsScreen } from "@/app/components/DocumentsScreen";
import { AchievementsScreen } from "@/app/components/AchievementsScreen";
import { StoryScreen } from "@/app/components/StoryScreen";
import { ProfileScreen } from "@/app/components/ProfileScreen";
import { TeamMemberProfile } from "@/app/components/TeamMemberProfile";
import { NotFoundScreen } from "@/app/components/NotFoundScreen";
import { ProtectedRoute } from "@/app/components/ProtectedRoute";
import { AppLayout } from "@/app/components/AppLayout";
import { WorkersScreen } from "@/app/components/WorkersScreen";
import { StatsScreen } from "@/app/components/StatsScreen";
import { JobApplicationsScreen } from "@/app/components/JobApplicationsScreen";
import { ShiftPreferencesPage } from "@/app/pages/ShiftPreferencesPage";
import { AdminSchedulePage } from "@/app/pages/AdminSchedulePage";

export const router = createBrowserRouter([
  { path: "/login", element: <NewLoginScreen /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: "home", element: <DashboardScreen /> },
      { path: "workers", element: <WorkersScreen /> },
      { path: "schedule", element: <ImprovedScheduleScreen /> },
      { path: "my-preferences", element: <ShiftPreferencesPage /> },
      { path: "admin/schedule", element: <AdminSchedulePage /> },
      { path: "documents", element: <DocumentsScreen /> },
      { path: "job-applications", element: <JobApplicationsScreen /> },
      { path: "stats", element: <StatsScreen /> },
      { path: "achievements", element: <AchievementsScreen /> },
      { path: "story", element: <StoryScreen /> },
      { path: "profile", element: <ProfileScreen /> },
      { path: "team/:employeeId", element: <TeamMemberProfile /> },
    ],
  },
  { path: "*", element: <NotFoundScreen /> },
]);
