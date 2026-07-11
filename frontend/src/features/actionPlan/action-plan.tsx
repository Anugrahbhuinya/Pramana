import * as React from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import {
  ClipboardList,
  Check,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
  FileText,
  User,
  AlertTriangle,
  Clock,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import { api } from "@/shared/services/api";
import { exportExecutionBlueprint } from "@/shared/utils/report-exporter";

interface ActionTask {
  id: string;
  task: string;
  owner: string;
  priority: string;
  status: string;
  dueDate?: string;
  dependencies?: string;
  risk: string;
  evidence: string;
}

export const ActionPlan: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = React.useState<"table" | "kanban" | "timeline">("table");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [priorityFilter, setPriorityFilter] = React.useState("all");
  const [deptFilter, setDeptFilter] = React.useState("all");
  const [selectedTaskIds, setSelectedTaskIds] = React.useState<string[]>([]);
  const [activeDrawerTaskId, setActiveDrawerTaskId] = React.useState<string | null>(null);
  const [sortField, setSortField] = React.useState<string>("dueDate");
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  // Query dynamic action plan list from backend
  const { data: tasks, isLoading, isError } = useQuery<ActionTask[]>({
    queryKey: ["action-plan", id],
    queryFn: async () => {
      const response = await api.get(`/action-plan/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: session } = useQuery({
    queryKey: ["analysis-session", id],
    queryFn: async () => {
      const response = await api.get(`/analysis/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const handleResolveTask = (taskId: string, taskTitle: string) => {
    toast({
      title: "Task Resolved",
      message: `"${taskTitle}" status has been set to Compliant.`,
      type: "success",
    });
    // Optimistic cache update
    queryClient.setQueryData(["action-plan", id], (old: ActionTask[] | undefined) => {
      if (!old) return old;
      return old.map(t => t.id === taskId ? { ...t, status: "compliant" } : t);
    });
  };

  const handleBulkResolve = () => {
    if (selectedTaskIds.length === 0) return;
    toast({
      title: "Bulk Verification Complete",
      message: `Updated status to Compliant for ${selectedTaskIds.length} control tasks.`,
      type: "success",
    });
    queryClient.setQueryData(["action-plan", id], (old: ActionTask[] | undefined) => {
      if (!old) return old;
      return old.map(t => selectedTaskIds.includes(t.id) ? { ...t, status: "compliant" } : t);
    });
    setSelectedTaskIds([]);
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-120px)]">
        <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-accent-emerald-500 animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Generating execution blueprint parameterization...</p>
      </div>
    );
  }

  if (isError || !tasks) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 text-red-500 flex items-center justify-center shadow-sm mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Could not load Blueprint</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Verify that this analysis session has finished and is currently active.
        </p>
      </div>
    );
  }

  // extract available unique departments/owners for filter dropdown
  const departments = Array.from(new Set(tasks.map(t => t.owner).filter(Boolean)));

  // Filter & Search Logic
  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.task.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.owner.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || t.priority === priorityFilter;
    const matchesDept = deptFilter === "all" || t.owner === deptFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDept;
  });

  // Sorting Logic
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let valA = (a as any)[sortField] || "";
    let valB = (b as any)[sortField] || "";
    
    if (typeof valA === "string") valA = valA.toLowerCase();
    if (typeof valB === "string") valB = valB.toLowerCase();

    if (valA < valB) return sortOrder === "asc" ? -1 : 1;
    if (valA > valB) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  // Kanban Columns definition
  const columns = [
    { title: "Pending Remediations", status: "pending", bg: "bg-slate-50/50 dark:bg-slate-900/10" },
    { title: "Under Review", status: "under_review", bg: "bg-amber-500/5 dark:bg-amber-500/5" },
    { title: "Compliant Proof", status: "compliant", bg: "bg-accent-emerald-500/5 dark:bg-accent-emerald-500/5" }
  ];

  const totalProgress = tasks.length > 0
    ? Math.round((tasks.filter(t => t.status === "compliant").length / tasks.length) * 100)
    : 100;

  const activeDrawerTask = tasks.find(t => t.id === activeDrawerTaskId);

  return (
    <div className="space-y-8 animate-fade-in-up flex flex-col min-h-[calc(100vh-120px)] relative text-left">
      {/* Page Header */}
      <PageHeader
        title="Execution Blueprint"
        description="Verify audit items, verify control mappings, and assign compliance checkoffs."
        actions={
          <div className="flex items-center space-x-3">
            {/* View Mode Toggle */}
            <div className="flex items-center border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-white dark:bg-slate-950 shadow-sm">
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "table" ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white" : "text-slate-400"
                }`}
                title="Table View"
              >
                <List className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("kanban")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "kanban" ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white" : "text-slate-400"
                }`}
                title="Kanban Board"
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("timeline")}
                className={`p-1.5 rounded-md transition-all ${
                  viewMode === "timeline" ? "bg-slate-100 dark:bg-slate-800 text-slate-950 dark:text-white" : "text-slate-400"
                }`}
                title="Timeline View"
              >
                <Clock className="h-4 w-4" />
              </button>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => session && exportExecutionBlueprint(session, tasks)}
              className="text-xs font-semibold"
            >
              Export Blueprint
            </Button>
            
            {selectedTaskIds.length > 0 && (
              <Button
                variant="emerald"
                size="sm"
                onClick={handleBulkResolve}
                className="font-semibold shadow-md shadow-accent-emerald-950/20"
              >
                <Check className="h-4 w-4 mr-1.5" />
                Resolve Selected ({selectedTaskIds.length})
              </Button>
            )}
          </div>
        }
      />

      {/* Progress & Search Filter Header */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
        {/* Progress Card */}
        <Card className="border border-slate-200 dark:border-slate-800 lg:col-span-1 py-3 px-4 flex items-center justify-between shadow-sm">
          <div className="text-left">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Blueprint Progress</span>
            <span className="text-xl font-bold text-slate-900 dark:text-white">{totalProgress}% Completed</span>
          </div>
          <div className="relative flex items-center justify-center shrink-0">
            <div className="h-10 w-10 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-accent-emerald-500 animate-pulse" />
            <span className="absolute text-[10px] font-mono font-bold text-accent-emerald-500">{totalProgress}%</span>
          </div>
        </Card>

        {/* Filters and search block */}
        <Card className="border border-slate-200 dark:border-slate-800 lg:col-span-3 p-3 flex flex-wrap items-center gap-4 shadow-sm bg-white/70 dark:bg-slate-900/50">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search blueprint tasks, owners..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:border-accent-emerald-500 focus:ring-1 focus:ring-accent-emerald-500/20 rounded-lg pl-9 pr-4 py-2 text-xs outline-none transition-all duration-200"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1 text-xs">
              <SlidersHorizontal className="h-3.5 w-3.5 text-slate-400" />
              <span className="text-slate-500">Filter:</span>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-350 focus:border-accent-emerald-500 outline-none shadow-sm cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="under_review">Under Review</option>
              <option value="compliant">Compliant</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-350 focus:border-accent-emerald-500 outline-none shadow-sm cursor-pointer"
            >
              <option value="all">All Priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-600 dark:text-slate-350 focus:border-accent-emerald-500 outline-none shadow-sm cursor-pointer max-w-[140px]"
            >
              <option value="all">All Owners</option>
              {departments.map((dept, idx) => (
                <option key={idx} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </Card>
      </div>

      {/* Main Content Area: Conditional Views */}
      <div className="flex-1 min-h-0 pt-4">
        {viewMode === "table" && (
          <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40px] text-center">
                      <input
                        type="checkbox"
                        checked={selectedTaskIds.length === sortedTasks.length && sortedTasks.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTaskIds(sortedTasks.map(t => t.id));
                          } else {
                            setSelectedTaskIds([]);
                          }
                        }}
                        className="rounded border-slate-300 dark:border-slate-800 text-accent-emerald-600 focus:ring-accent-emerald-500 h-3.5 w-3.5"
                      />
                    </TableHead>
                    <TableHead onClick={() => handleSort("task")} className="w-[30%] cursor-pointer select-none hover:text-slate-900 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Task Details</span>
                        {sortField === "task" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("owner")} className="w-[20%] cursor-pointer select-none hover:text-slate-900 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Owner Department</span>
                        {sortField === "owner" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("priority")} className="w-[12%] cursor-pointer select-none hover:text-slate-900 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Priority</span>
                        {sortField === "priority" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("status")} className="w-[12%] cursor-pointer select-none hover:text-slate-900 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Status</span>
                        {sortField === "status" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                    </TableHead>
                    <TableHead onClick={() => handleSort("dueDate")} className="w-[12%] cursor-pointer select-none hover:text-slate-900 dark:hover:text-white">
                      <div className="flex items-center gap-1">
                        <span>Due Date</span>
                        {sortField === "dueDate" && (sortOrder === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                      </div>
                    </TableHead>
                    <TableHead className="text-right w-[10%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedTasks.map((t) => (
                    <TableRow key={t.id} className="hover:bg-slate-50/40 dark:hover:bg-slate-850/40">
                      <TableCell className="text-center">
                        <input
                          type="checkbox"
                          checked={selectedTaskIds.includes(t.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedTaskIds([...selectedTaskIds, t.id]);
                            } else {
                              setSelectedTaskIds(selectedTaskIds.filter(id => id !== t.id));
                            }
                          }}
                          className="rounded border-slate-300 dark:border-slate-800 text-accent-emerald-600 focus:ring-accent-emerald-500 h-3.5 w-3.5"
                        />
                      </TableCell>
                      <TableCell className="font-semibold text-slate-900 dark:text-slate-200 py-3.5">
                        <div className="flex items-center space-x-2.5">
                          <ClipboardList className="h-4 w-4 text-slate-400 shrink-0" />
                          <span className="truncate max-w-xs block" title={t.task}>{t.task}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-500 dark:text-slate-400 text-xs">
                        {t.owner}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={t.priority} className="text-[10px]" />
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-500 dark:text-slate-400">
                        {t.dueDate || "N/A"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Inspect Details"
                            onClick={() => setActiveDrawerTaskId(t.id)}
                            className="h-8 w-8 text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                          >
                            <FileText className="h-4 w-4" />
                          </Button>
                          {t.status !== "compliant" && (
                            <Button
                              variant="outline"
                              size="icon"
                              title="Resolve Check"
                              onClick={() => handleResolveTask(t.id, t.task)}
                              className="h-8 w-8 text-accent-emerald-500 border-accent-emerald-500/20 hover:bg-accent-emerald-500/10 hover:text-accent-emerald-600"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {sortedTasks.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-400 text-xs">
                        No actionable checklist items found matching current filters.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {viewMode === "kanban" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full items-start">
            {columns.map((col) => {
              const columnTasks = sortedTasks.filter(t => t.status === col.status);
              return (
                <div key={col.status} className={`rounded-xl border border-slate-250/50 dark:border-slate-800/80 p-4 h-full flex flex-col min-h-[400px] ${col.bg}`}>
                  <div className="flex justify-between items-center mb-4 text-left">
                    <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">{col.title}</h4>
                    <Badge variant="outline" className="font-semibold">{columnTasks.length}</Badge>
                  </div>
                  <div className="space-y-3.5 overflow-y-auto flex-1 max-h-[500px]">
                    {columnTasks.map(t => (
                      <Card
                        key={t.id}
                        onClick={() => setActiveDrawerTaskId(t.id)}
                        className="border border-slate-200/60 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 shadow-sm hover:shadow-md cursor-pointer transition-all duration-200 hover:-translate-y-0.5 text-left space-y-3"
                      >
                        <div className="flex justify-between items-start gap-2">
                          <StatusBadge status={t.priority} className="text-[9px] uppercase font-bold" />
                          {t.status !== "compliant" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleResolveTask(t.id, t.task);
                              }}
                              className="p-1 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-accent-emerald-500/40 hover:text-accent-emerald-500 text-slate-400 transition-colors"
                            >
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <h5 className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-normal line-clamp-3">
                          {t.task}
                        </h5>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 border-t border-slate-100 dark:border-slate-900 pt-2.5">
                          <span className="truncate max-w-[100px] block">{t.owner}</span>
                          <span className="font-mono">{t.dueDate || "N/A"}</span>
                        </div>
                      </Card>
                    ))}
                    {columnTasks.length === 0 && (
                      <div className="h-32 rounded-lg border border-dashed border-slate-200 dark:border-slate-800/80 flex items-center justify-center text-slate-400 text-[10px]">
                        No items in this column
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "timeline" && (
          <div className="relative pl-8 border-l border-slate-200 dark:border-slate-800 space-y-6 text-xs max-w-4xl mx-auto">
            {sortedTasks.map((t) => {
              const initials = t.owner
                ? t.owner.split(" ").map((n: string) => n[0]).join("").toUpperCase().substring(0, 2)
                : "OP";

              return (
                <div key={t.id} className="relative">
                  {/* Timeline bullet as initials avatar */}
                  <span className="absolute -left-[44px] top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 border border-slate-700 text-[9px] font-bold text-slate-300 shadow-sm ring-4 ring-white dark:ring-slate-950 shrink-0">
                    {initials}
                  </span>
                  
                  <Card className="border border-slate-200 dark:border-slate-800 p-4 shadow-sm bg-white dark:bg-slate-950/60 hover:border-slate-350 dark:hover:border-slate-700 transition-all">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1.5 flex-1 min-w-0 text-left">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[10px] text-slate-400 font-bold block">{t.dueDate || "No deadline"}</span>
                          <StatusBadge status={t.priority} className="text-[9px]" />
                          <StatusBadge status={t.status} />
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white leading-normal truncate" title={t.task}>
                          {t.task}
                        </h4>
                        <div className="text-[10px] text-slate-400">
                          <span className="font-semibold text-slate-500">Dependencies:</span> {t.dependencies || "No workflow dependencies detected."}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 shrink-0 self-end sm:self-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setActiveDrawerTaskId(t.id)}
                          className="text-xs font-semibold h-8"
                        >
                          Inspect
                        </Button>
                        {t.status !== "compliant" && (
                          <Button
                            variant="emerald"
                            size="sm"
                            onClick={() => handleResolveTask(t.id, t.task)}
                            className="font-semibold text-xs h-8"
                          >
                            Verify Task
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
            {sortedTasks.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
                No blueprint checklist items found matching current filters.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Slide-over details drawer */}
      {activeDrawerTaskId && activeDrawerTask && (
        <div className="absolute inset-y-0 right-0 z-30 w-96 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-slate-800 shadow-xl flex flex-col h-full animate-fade-in-right">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 px-4 py-3 text-left">
            <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <ClipboardList className="h-4 w-4 text-accent-emerald-500" />
              Blueprint inspector
            </span>
            <button
              onClick={() => setActiveDrawerTaskId(null)}
              className="p-1 rounded-md text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-850 hover:text-slate-950 dark:hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
            <div className="space-y-2">
              <div className="flex gap-2">
                <StatusBadge status={activeDrawerTask.priority} className="text-[9px] uppercase font-bold" />
                <StatusBadge status={activeDrawerTask.status} />
              </div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-normal">
                {activeDrawerTask.task}
              </h4>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-4">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Required Evidence</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif bg-slate-50 dark:bg-slate-900/30 p-3 rounded-lg border border-slate-200/50 dark:border-slate-800/50">
                {activeDrawerTask.evidence}
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs border-t border-slate-100 dark:border-slate-800/60 pt-4">
              <User className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Department Owner</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">{activeDrawerTask.owner}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3 text-xs">
              <Clock className="h-4.5 w-4.5 text-slate-400 shrink-0" />
              <div>
                <span className="text-[10px] text-slate-400 block font-semibold uppercase">Due Date</span>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">{activeDrawerTask.dueDate || "No deadline set"}</span>
              </div>
            </div>

            {activeDrawerTask.dependencies && (
              <div className="space-y-1.5 border-t border-slate-100 dark:border-slate-800/60 pt-4">
                <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Workflow Dependencies</span>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  {activeDrawerTask.dependencies}
                </p>
              </div>
            )}
          </div>
          
          <div className="p-4 border-t border-slate-200 dark:border-slate-800/60 flex justify-end space-x-2 bg-slate-50 dark:bg-slate-900/20 shrink-0">
            {activeDrawerTask.status !== "compliant" && (
              <Button
                variant="emerald"
                size="sm"
                className="font-semibold"
                onClick={() => {
                  handleResolveTask(activeDrawerTask.id, activeDrawerTask.task);
                  setActiveDrawerTaskId(null);
                }}
              >
                Complete Checklist Task
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default ActionPlan;
