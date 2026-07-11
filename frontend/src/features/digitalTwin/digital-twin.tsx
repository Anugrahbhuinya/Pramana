// src/features/digitalTwin/digital-twin.tsx
import * as React from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import ReactFlow, { Background, Controls, MiniMap, Node, Edge, Handle, Position } from "reactflow";
import "reactflow/dist/style.css";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Info, X, ShieldAlert, Network, FileCheck } from "lucide-react";
import { api } from "@/shared/services/api";

// Custom node renderer to render dict labels beautifully
const CustomNode: React.FC<any> = ({ data, id }) => {
  const title = data.label?.title || "Registry Node";
  const description = data.label?.description || "";
  const isCircular = id === "circular";
  const isClause = id.startsWith("clause-");
  const isObligation = id.startsWith("obligation-");
  const isAudit = id.startsWith("audit-");

  const isAffected = data.isAffected;
  const isHealthy = data.isHealthy;
  const isSelected = data.isSelected;

  let borderClass = "border-slate-300 dark:border-slate-800 bg-slate-900";
  let titleClass = "text-slate-400";
  
  if (isCircular) {
    borderClass = "border-blue-500/40 bg-blue-950/80 shadow-md shadow-blue-950/20";
    titleClass = "text-blue-400 font-bold uppercase";
  } else if (isClause) {
    if (isAffected) {
      borderClass = "border-amber-500/50 bg-amber-950/80 shadow-[0_0_12px_rgba(245,158,11,0.25)]";
    } else {
      borderClass = "border-amber-500/20 bg-amber-950/40 opacity-60";
    }
    titleClass = "text-amber-400 font-bold uppercase";
  } else if (isObligation) {
    if (isAffected) {
      borderClass = "border-purple-500/50 bg-purple-950/80 shadow-[0_0_12px_rgba(168,85,247,0.25)]";
    } else {
      borderClass = "border-purple-500/20 bg-purple-950/40 opacity-60";
    }
    titleClass = "text-purple-400 font-bold uppercase";
  } else if (isAudit) {
    if (isAffected) {
      borderClass = "border-red-500/60 bg-red-950/80 shadow-[0_0_15px_rgba(239,68,68,0.35)] animate-pulse-subtle";
      titleClass = "text-red-400 font-bold uppercase";
    } else if (isHealthy) {
      borderClass = "border-accent-emerald-500/40 bg-accent-emerald-950/40 opacity-65";
      titleClass = "text-accent-emerald-500 font-bold uppercase";
    } else {
      borderClass = "border-slate-200 dark:border-slate-850 bg-slate-950/40 opacity-55";
      titleClass = "text-slate-400 font-bold uppercase";
    }
  }

  return (
    <div className={`px-4 py-3 rounded-lg border text-left text-white shadow-sm transition-all duration-300 w-[220px] ${borderClass} ${isSelected ? "ring-2 ring-accent-emerald-500" : ""}`}>
      <div className={`text-[9px] tracking-wider mb-1 ${titleClass}`}>{title}</div>
      <div className="text-xs font-semibold text-slate-100 truncate">{description}</div>
      
      <Handle type="target" position={Position.Top} className="!bg-slate-500 !border-slate-900" />
      <Handle type="source" position={Position.Bottom} className="!bg-slate-500 !border-slate-900" />
    </div>
  );
};

const nodeTypes = {
  input: CustomNode,
  output: CustomNode,
  default: CustomNode,
};

export const DigitalTwin: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [selectedNodeId, setSelectedNodeId] = React.useState<string | null>(null);

  // Fetch dynamic twin graph from backend
  const { data: graphData, isLoading, isError, refetch } = useQuery({
    queryKey: ["digital-twin-graph", id],
    queryFn: async () => {
      const response = await api.get(`/digital-twin/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  // Fetch explainability details for details panel
  const { data: explainData } = useQuery({
    queryKey: ["explainability-details", id],
    queryFn: async () => {
      const response = await api.get(`/explainability/${id}`);
      return response.data;
    },
    enabled: !!id && !!selectedNodeId,
  });

  // Fetch action plan tasks for control details
  const { data: taskData } = useQuery({
    queryKey: ["action-plan-tasks", id],
    queryFn: async () => {
      const response = await api.get(`/action-plan/${id}`);
      return response.data;
    },
    enabled: !!id && !!selectedNodeId,
  });

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-120px)]">
        <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-accent-emerald-500 animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Generating digital compliance twin...</p>
      </div>
    );
  }

  if (isError || !graphData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 text-red-500 flex items-center justify-center shadow-sm mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-850 dark:text-slate-250">Failed to render Compliance Twin</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Verify that this analysis session has finished and is currently active.
        </p>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-4 font-semibold">
          Retry Rendering
        </Button>
      </div>
    );
  }

  const handleNodeClick = (_event: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
  };

  // Process nodes to apply custom styling and selection border
  const processedNodes = (graphData.nodes || []).map((node: Node) => {
    const isSelected = node.id === selectedNodeId;
    
    // Determine if this specific node represents an "affected" control
    let isAffected = false;
    let isHealthy = false;
    
    if (node.id.startsWith("audit-")) {
      const dbId = node.id.replace("audit-", "");
      const task = taskData?.find((t: any) => t.id === dbId);
      if (task) {
        if (task.status !== "compliant") {
          isAffected = true;
        } else {
          isHealthy = true;
        }
      }
    } else if (node.id.startsWith("obligation-") || node.id.startsWith("clause-")) {
      isAffected = true;
    }

    return {
      ...node,
      type: node.type || "default",
      data: {
        ...node.data,
        isAffected,
        isHealthy,
        isSelected
      },
      style: {
        ...node.style,
        transition: "all 0.3s ease-in-out",
      },
    };
  });

  const processedEdges = (graphData.edges || []).map((edge: Edge) => ({
    ...edge,
    style: { stroke: "#64748B", strokeWidth: 1.5, opacity: 0.5 },
    animated: edge.animated || false,
  }));

  // Resolve details panel content
  const getSelectedNodeDetails = () => {
    if (!selectedNodeId) return null;
    const node = graphData.nodes.find((n: Node) => n.id === selectedNodeId);
    if (!node) return null;

    const title = node.data?.label?.title || "Node Info";
    const description = node.data?.label?.description || "";

    if (selectedNodeId === "circular") {
      return (
        <div className="space-y-4">
          <Badge className="bg-blue-500/10 text-blue-500 border border-blue-500/20 font-bold uppercase tracking-wider text-[9px]">Root Regulation</Badge>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-serif bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">
            {description}
          </p>
        </div>
      );
    }

    if (selectedNodeId.startsWith("clause-")) {
      const trace = explainData?.trace?.find((t: any) => t.source_clause.includes(title));
      return (
        <div className="space-y-4">
          <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 font-bold uppercase tracking-wider text-[9px]">Clause Rule</Badge>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-serif bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">
            {description}
          </p>
          {trace && (
            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800/80">
              <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">AI Reasoning</span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-900/40 p-3 rounded-lg">{trace.reason}</p>
            </div>
          )}
        </div>
      );
    }

    if (selectedNodeId.startsWith("obligation-")) {
      return (
        <div className="space-y-4">
          <Badge className="bg-purple-500/10 text-purple-500 border border-purple-500/20 font-bold uppercase tracking-wider text-[9px]">Actionable Mandate</Badge>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">
            {description}
          </p>
        </div>
      );
    }

    if (selectedNodeId.startsWith("audit-")) {
      const dbId = selectedNodeId.replace("audit-", "");
      const task = taskData?.find((t: any) => t.id === dbId);
      return (
        <div className="space-y-4">
          <Badge className="bg-accent-emerald-500/10 text-accent-emerald-500 border border-accent-emerald-500/20 font-bold uppercase tracking-wider text-[9px]">Internal Control Point</Badge>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">{title}</h4>
          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed font-serif bg-slate-50 dark:bg-slate-950 p-3 rounded-lg">
            {description}
          </p>
          {task && (
            <div className="space-y-4 pt-4 border-t border-slate-150 dark:border-slate-800/80 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-slate-450 block font-semibold uppercase">Owner</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{task.owner}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-455 block font-semibold uppercase">Risk Level</span>
                  <Badge variant={task.priority === "critical" ? "destructive" : "outline"} className="mt-0.5">{task.priority}</Badge>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-450 block font-semibold uppercase mb-1">Impact Description</span>
                <p className="text-[11px] text-slate-600 dark:text-slate-350 leading-relaxed">{task.task}</p>
              </div>

              <div>
                <span className="text-[10px] text-slate-450 block font-semibold uppercase mb-1">Required Evidence</span>
                <div className="flex items-start space-x-2 text-[11px] text-slate-650 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-lg border border-slate-250/50 dark:border-slate-850/50">
                  <FileCheck className="h-4 w-4 text-accent-emerald-500 shrink-0 mt-0.5" />
                  <span>{task.evidence}</span>
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div>
                  <span className="text-[10px] text-slate-450 block font-semibold uppercase">Deadline</span>
                  <span className="font-mono text-[11px] text-slate-750 dark:text-slate-250">{task.dueDate || "N/A"}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-450 block font-semibold uppercase text-right">Status</span>
                  <Badge variant={task.status === "compliant" ? "emerald" : "outline"} className="mt-0.5">{task.status}</Badge>
                </div>
              </div>
            </div>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-8 animate-fade-in-up text-left h-[calc(100vh-130px)] flex flex-col">
      {/* Page Header */}
      <PageHeader
        title="Regulatory Digital Twin"
        description="Interact with the dynamic topological representation linking regulatory rules, active obligations, and internal control checkpoints."
      />

      {/* Main Flow Canvas Grid */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-4 gap-6 items-stretch">
        {/* React Flow Canvas (3/4 width) */}
        <Card className="lg:col-span-3 border border-slate-200 dark:border-slate-800 overflow-hidden relative bg-slate-950 shadow-inner min-h-[450px]">
          <ReactFlow
            nodes={processedNodes}
            edges={processedEdges}
            nodeTypes={nodeTypes}
            onNodeClick={handleNodeClick}
            fitView
            minZoom={0.5}
            maxZoom={1.5}
          >
            <Background color="#334155" gap={16} size={1} />
            <Controls className="!bg-slate-900 !border-slate-800 !text-white" />
            <MiniMap 
              nodeColor={(node) => {
                if (node.id === "circular") return "#3b82f6";
                if (node.id.startsWith("clause-")) return "#f59e0b";
                if (node.id.startsWith("obligation-")) return "#a855f7";
                return "#10b981";
              }}
              maskColor="rgba(15, 23, 42, 0.7)"
              className="!bg-slate-900 border border-slate-800 rounded-lg overflow-hidden hidden sm:block"
            />
          </ReactFlow>
        </Card>

        {/* Selected Node Details side panel (1/4 width) */}
        <Card className="lg:col-span-1 border border-slate-200 dark:border-slate-800 shadow-sm p-6 bg-white/75 dark:bg-slate-900/50 backdrop-blur-md overflow-y-auto flex flex-col">
          {selectedNodeId ? (
            <div className="space-y-6 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
                  <Network className="h-4.5 w-4.5 text-accent-emerald-500" />
                  Twin Inspector
                </span>
                <button
                  onClick={() => setSelectedNodeId(null)}
                  className="p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto pr-1">
                {getSelectedNodeDetails()}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center text-center h-full text-slate-400 p-4 space-y-4">
              <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-850 flex items-center justify-center text-slate-500 border border-slate-200 dark:border-slate-800">
                <Info className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Node Not Selected</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">
                  Select any control, clause, or obligation node in the topology canvas to inspect operational parameters.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
export default DigitalTwin;
