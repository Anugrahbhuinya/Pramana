// src/app/layout.tsx
import * as React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "@/components/ui/sidebar";
import { Navbar } from "@/components/ui/navbar";
import { cn } from "@/shared/utils/cn";
import { useGlobalState } from "@/shared/context/global-context";

export const AppLayout: React.FC = () => {
  const { sidebarCollapsed, setSidebarCollapsed } = useGlobalState();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {/* Platform Sidebar */}
      <Sidebar collapsed={sidebarCollapsed} setCollapsed={setSidebarCollapsed} />

      {/* Main Workspace Area */}
      <div
        className={cn(
          "flex flex-col min-h-screen transition-all duration-300",
          sidebarCollapsed ? "pl-16" : "pl-64"
        )}
      >
        {/* Top Navbar */}
        <Navbar />

        {/* View Content Port */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};
