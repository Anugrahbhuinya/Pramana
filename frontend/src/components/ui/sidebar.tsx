// src/components/ui/sidebar.tsx
import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ShieldCheck,
  Upload,
  FileText,
  Network,
  Workflow,
  Bot,
  Compass,
  Settings,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useGlobalState } from "@/shared/context/global-context";

interface SidebarProps {
  collapsed?: boolean;
  setCollapsed?: (collapsed: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = () => {
  const { pathname } = useLocation();
  const { activeSessionId, sidebarCollapsed, setSidebarCollapsed } = useGlobalState();

  const navItems = [
    { label: "Compliance Control Center", path: "/dashboard", icon: ShieldCheck, matchPrefix: "/dashboard" },
    { label: "Regulation Ingestion", path: "/upload", icon: Upload, matchPrefix: "/upload" },
    { 
      label: "Regulatory Analysis", 
      path: activeSessionId ? `/analysis/${activeSessionId}` : "", 
      icon: FileText, 
      matchPrefix: "/analysis",
      disabled: !activeSessionId 
    },
    { 
      label: "Regulatory Digital Twin", 
      path: activeSessionId ? `/digital-twin/${activeSessionId}` : "/digital-twin", 
      icon: Network,
      matchPrefix: "/digital-twin" 
    },
    { 
      label: "Execution Blueprint", 
      path: activeSessionId ? `/action-plan/${activeSessionId}` : "/action-plan", 
      icon: Workflow,
      matchPrefix: "/action-plan"
    },
    { 
      label: "Pramana Intelligence Council", 
      path: activeSessionId ? `/executive-council/${activeSessionId}` : "/executive-council", 
      icon: Bot,
      matchPrefix: "/executive-council"
    },
    { 
      label: "Decision Traceability", 
      path: activeSessionId ? `/explainability/${activeSessionId}` : "/explainability", 
      icon: Compass,
      matchPrefix: "/explainability"
    },
    { label: "Platform Settings", path: "/settings", icon: Settings, matchPrefix: "/settings" },
  ];

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-900 text-slate-100 transition-all duration-300",
        sidebarCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Brand Logo Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
        <Link to="/" className="flex items-center space-x-2.5 overflow-hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-emerald-600 shrink-0 shadow-sm shadow-accent-emerald-900/50">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          {!sidebarCollapsed && (
            <span className="font-display font-bold text-lg tracking-wide text-white leading-none">
              Pramana
            </span>
          )}
        </Link>
        {!sidebarCollapsed && (
          <button
            onClick={() => setSidebarCollapsed(true)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          // Check prefix match to support parameterized subpaths
          const isActive = pathname.startsWith(item.matchPrefix);

          if (item.disabled) {
            return (
              <div
                key={item.label}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium opacity-40 cursor-not-allowed text-slate-600"
                )}
                title={sidebarCollapsed ? `${item.label} (Select session)` : "Select a session from dashboard to view"}
              >
                <Icon className="h-4 w-4 shrink-0 text-slate-600" />
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                isActive
                  ? "bg-accent-emerald-600/10 text-accent-emerald-500"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
              )}
              title={sidebarCollapsed ? item.label : undefined}
            >
              <Icon className={cn("h-4 w-4 shrink-0", isActive ? "text-accent-emerald-500" : "text-slate-400")} />
              {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Expand Toggle for Collapsed State */}
      {sidebarCollapsed && (
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={() => setSidebarCollapsed(false)}
            className="flex w-full items-center justify-center rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </aside>
  );
};
export default Sidebar;
