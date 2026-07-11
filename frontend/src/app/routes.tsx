// src/app/routes.tsx
import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import { AppLayout } from "./layout";
import { LandingPage } from "@/features/landing/landing-page";
import { Dashboard } from "@/features/dashboard/dashboard";
import { UploadPage } from "@/features/upload/upload";
import { AnalysisPage } from "@/features/analysis/analysis-page";
import { DigitalTwin } from "@/features/digitalTwin/digital-twin";
import { ExecutiveCouncil } from "@/features/executive/executive-council";
import { ActionPlan } from "@/features/actionPlan/action-plan";
import { Explainability } from "@/features/explainability/explainability";
import { SettingsPage } from "@/features/settings/settings";
import { NotFoundPage } from "@/features/notFound/not-found";

// Helper component to redirect to active session ID if available, or fall back to dashboard
const SessionRedirect: React.FC<{ target: string }> = ({ target }) => {
  const activeSessionId = localStorage.getItem("activeSessionId");
  if (activeSessionId) {
    return <Navigate to={`/${target}/${activeSessionId}`} replace />;
  }
  return <Navigate to="/dashboard" replace />;
};

export const router = createBrowserRouter([
  // Standalone Landing Page
  {
    path: "/",
    element: <LandingPage />,
  },
  
  // App Shell Layout routes
  {
    element: <AppLayout />,
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "upload",
        element: <UploadPage />,
      },
      {
        path: "analysis/:id",
        element: <AnalysisPage />,
      },
      {
        path: "analysis",
        element: <SessionRedirect target="analysis" />,
      },
      {
        path: "digital-twin/:id",
        element: <DigitalTwin />,
      },
      {
        path: "digital-twin",
        element: <SessionRedirect target="digital-twin" />,
      },
      {
        path: "executive-council/:id",
        element: <ExecutiveCouncil />,
      },
      {
        path: "executive-council",
        element: <SessionRedirect target="executive-council" />,
      },
      {
        path: "action-plan/:id",
        element: <ActionPlan />,
      },
      {
        path: "action-plan",
        element: <SessionRedirect target="action-plan" />,
      },
      {
        path: "explainability/:id",
        element: <Explainability />,
      },
      {
        path: "explainability",
        element: <SessionRedirect target="explainability" />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
      {
        path: "not-found",
        element: <NotFoundPage />,
      },
      // 404 Route inside dashboard layout
      {
        path: "*",
        element: <Navigate to="/not-found" replace />,
      },
    ],
  },
]);

