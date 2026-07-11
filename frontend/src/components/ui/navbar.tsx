// src/components/ui/navbar.tsx
import * as React from "react";
import { useLocation, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Bell, Sun, Moon, User, ChevronRight, Search, X, FileText, ClipboardList, Building, ShieldCheck } from "lucide-react";
import { api } from "@/shared/services/api";
import { useGlobalState } from "@/shared/context/global-context";

interface SearchResult {
  type: "regulation" | "task" | "department" | "evidence";
  title: string;
  subtitle: string;
  url: string;
}

export const Navbar: React.FC = () => {
  const { pathname } = useLocation();
  const { theme, setTheme } = useGlobalState();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Query 1: Fetch active sessions to extract regulations
  const { data: summary } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await api.get("/dashboard-summary");
      return response.data;
    },
  });

  // Query 2: Fetch all tasks for active sessions to make them searchable
  const { data: allTasks } = useQuery({
    queryKey: ["all-blueprint-tasks"],
    queryFn: async () => {
      const sessions = summary?.recent_sessions || [];
      const tasksPromises = sessions.map(async (s: any) => {
        try {
          const res = await api.get(`/action-plan/${s.id}`);
          return res.data.map((t: any) => ({ ...t, sessionId: s.id }));
        } catch {
          return [];
        }
      });
      const results = await Promise.all(tasksPromises);
      return results.flat();
    },
    enabled: !!summary?.recent_sessions,
  });

  // Split paths to construct breadcrumbs
  const pathParts = pathname.split("/").filter(Boolean);

  const getBreadcrumbLabel = (part: string) => {
    return part
      .replace(/-/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  // Compile search results
  const searchResults: SearchResult[] = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    const list: SearchResult[] = [];

    // Search Regulations
    const sessions = summary?.recent_sessions || [];
    sessions.forEach((s: any) => {
      const regTitle = s.regulation_title || "";
      const regNum = s.regulation_number || "";
      if (regTitle.toLowerCase().includes(query) || regNum.toLowerCase().includes(query)) {
        list.push({
          type: "regulation",
          title: regTitle,
          subtitle: `Regulation Number: ${regNum}`,
          url: `/analysis/${s.id}`
        });
      }
    });

    // Search Tasks, Departments, Evidence
    const tasks = allTasks || [];
    tasks.forEach((t: any) => {
      const taskTitle = t.task || "";
      const owner = t.owner || "";
      const evidence = t.evidence || "";
      
      if (taskTitle.toLowerCase().includes(query)) {
        list.push({
          type: "task",
          title: taskTitle,
          subtitle: `Remediation Task (${owner})`,
          url: `/action-plan/${t.sessionId}`
        });
      }

      if (owner.toLowerCase().includes(query)) {
        list.push({
          type: "department",
          title: owner,
          subtitle: `Department Owner — Task: ${taskTitle}`,
          url: `/action-plan/${t.sessionId}`
        });
      }

      if (evidence.toLowerCase().includes(query)) {
        list.push({
          type: "evidence",
          title: `Evidence: ${evidence}`,
          subtitle: `Linked to Control: ${taskTitle}`,
          url: `/action-plan/${t.sessionId}`
        });
      }
    });

    return list.slice(0, 10); // Limit to top 10 matches
  }, [searchQuery, summary, allTasks]);

  const highlightMatch = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, "gi"));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === search.toLowerCase() ? (
            <span key={i} className="bg-amber-500/30 text-amber-900 dark:text-amber-100 font-semibold rounded-sm">
              {part}
            </span>
          ) : (
            part
          )
        )}
      </>
    );
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "regulation":
        return <FileText className="h-4 w-4 text-blue-500 shrink-0" />;
      case "task":
        return <ClipboardList className="h-4 w-4 text-purple-500 shrink-0" />;
      case "department":
        return <Building className="h-4 w-4 text-amber-500 shrink-0" />;
      default:
        return <ShieldCheck className="h-4 w-4 text-accent-emerald-500 shrink-0" />;
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md px-6 shadow-sm">
      {/* Dynamic Breadcrumbs */}
      <div className="flex items-center space-x-2 text-sm text-slate-500 dark:text-slate-400">
        <Link to="/" className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
          Pramana
        </Link>
        {pathParts.map((part, index) => {
          const to = `/${pathParts.slice(0, index + 1).join("/")}`;
          const isLast = index === pathParts.length - 1;

          return (
            <React.Fragment key={to}>
              <ChevronRight className="h-3.5 w-3.5" />
              {isLast ? (
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {getBreadcrumbLabel(part)}
                </span>
              ) : (
                <Link to={to} className="hover:text-slate-900 dark:hover:text-slate-100 transition-colors">
                  {getBreadcrumbLabel(part)}
                </Link>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Global Search Component */}
      <div className="relative flex-1 max-w-md mx-6" ref={dropdownRef}>
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search regulations, tasks, departments, evidence..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:border-accent-emerald-500 focus:ring-1 focus:ring-accent-emerald-500/20 rounded-lg pl-9 pr-4 py-2 text-xs outline-none transition-all duration-200"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Autocomplete Dropdown */}
        {isFocused && searchQuery && (
          <div className="absolute top-11 left-0 right-0 z-50 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg shadow-xl max-h-80 overflow-y-auto">
            {searchResults.map((res, idx) => (
              <Link
                key={idx}
                to={res.url}
                onClick={() => {
                  setSearchQuery("");
                  setIsFocused(false);
                }}
                className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-900 border-b border-slate-100 dark:border-slate-900 text-left transition-all"
              >
                {getIconForType(res.type)}
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {highlightMatch(res.title, searchQuery)}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {highlightMatch(res.subtitle, searchQuery)}
                  </div>
                </div>
              </Link>
            ))}
            {searchResults.length === 0 && (
              <div className="p-4 text-center text-slate-500 text-xs">No matches found for "{searchQuery}"</div>
            )}
          </div>
        )}
      </div>

      {/* Control Actions */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle Button */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
        </button>

        {/* Mock Notification Counter */}
        <button className="relative rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent-emerald-500"></span>
          </span>
        </button>

        {/* Profile Info */}
        <div className="flex items-center space-x-2 border-l border-slate-200 dark:border-slate-800 pl-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700/60">
            <User className="h-4 w-4" />
          </div>
          <div className="hidden flex-col text-left md:flex">
            <span className="text-xs font-semibold text-slate-900 dark:text-slate-200 leading-none">
              Pramana Compliance Officer
            </span>
            <span className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">
              Enterprise Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
export default Navbar;
