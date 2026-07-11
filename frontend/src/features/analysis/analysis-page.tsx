// src/features/analysis/analysis-page.tsx
import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  FileText,
  AlertOctagon,
  Download,
  Printer,
  ChevronRight,
  Clock,
  Layers,
  CheckCircle,
  HelpCircle,
  AlertTriangle,
  Loader2,
  Zap,
  BookOpen,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { api } from "@/shared/services/api";
import { exportExecutiveSummary, exportComplianceReport } from "@/shared/utils/report-exporter";

export const AnalysisPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Query 1: Analysis Session Status and Metadata
  const {
    data: session,
    isLoading: sessionLoading,
    error: sessionError,
    refetch: refetchSession,
  } = useQuery({
    queryKey: ["analysis-session", id],
    queryFn: async () => {
      const response = await api.get(`/analysis/${id}`);
      return response.data;
    },
    // Poll every 3 seconds if session is not complete or failed
    refetchInterval: (query) => {
      const data = query.state.data as any;
      if (data && (data.status === "running" || data.status === "pending")) {
        return 3000;
      }
      return false;
    },
  });

  // Query 2: Summary Details (only fetched if status is completed)
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ["executive-summary", id],
    queryFn: async () => {
      const response = await api.get(`/executive-summary/${id}`);
      return response.data;
    },
    enabled: session?.status === "completed",
  });

  // Query 3: Explainability Trace (to extract obligations list)
  const { data: traceData, isLoading: traceLoading } = useQuery({
    queryKey: ["explainability-trace", id],
    queryFn: async () => {
      const response = await api.get(`/explainability/${id}`);
      return response.data;
    },
    enabled: session?.status === "completed",
  });

  const handlePrint = () => {
    if (session && summary) {
      exportExecutiveSummary(session, summary);
    }
  };

  const handleDownload = () => {
    if (session && extractedObligations) {
      exportComplianceReport(session, extractedObligations);
    }
  };

  const isLoading = sessionLoading || (session?.status === "completed" && (summaryLoading || traceLoading));

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-6 min-h-[calc(100vh-160px)]">
        <div className="relative flex items-center justify-center">
          <div className="h-16 w-16 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-accent-emerald-500 animate-spin" />
          <FileText className="absolute h-6 w-6 text-slate-400" />
        </div>
        <div className="text-center space-y-2 max-w-sm">
          <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 animate-pulse">
            Regulatory Analysis Ingestion
          </h3>
          <p className="text-xs text-slate-500">
            Running SEBI circular parsing, mapping control nodes, and executing intelligence council reasoning...
          </p>
        </div>
      </div>
    );
  }

  if (sessionError || !session) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 text-red-500 flex items-center justify-center shadow-sm">
          <AlertOctagon className="h-6 w-6" />
        </div>
        <div className="space-y-1">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Intelligence Engine Connection Failure</h3>
          <p className="text-xs text-slate-500 max-w-sm">
            Unable to reach the Intelligence Engine. Verify backend connectivity and try again.
          </p>
        </div>
        <button
          onClick={() => refetchSession()}
          className="text-xs font-semibold text-accent-emerald-500 hover:text-accent-emerald-600 transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Handle Pipeline Processing States
  if (session.status === "running" || session.status === "pending") {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-8 animate-fade-in-up text-left">
        <Card className="border border-slate-200 dark:border-slate-800 shadow-md bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
          <CardHeader className="text-center pb-2">
            <div className="mx-auto h-12 w-12 rounded-full bg-accent-emerald-500/10 text-accent-emerald-500 flex items-center justify-center mb-4">
              <Clock className="h-6 w-6 animate-pulse" />
            </div>
            <CardTitle className="text-lg font-bold font-display">Regulatory Analysis In Progress</CardTitle>
            <CardDescription className="text-xs">
              The Pramana AI pipelines are currently reasoning over your document.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-4">
            {/* Timeline Steps */}
            <div className="space-y-4 text-xs font-medium">
              <div className="flex items-center space-x-3 text-accent-emerald-500">
                <CheckCircle className="h-4 w-4 fill-accent-emerald-500 text-white dark:text-slate-900" />
                <span>Step 1: Document text extraction & parsed elements</span>
              </div>
              <div className="flex items-center space-x-3 text-accent-emerald-500">
                <CheckCircle className="h-4 w-4 fill-accent-emerald-500 text-white dark:text-slate-900" />
                <span>Step 2: Vector embeddings and database synchronization</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-900 dark:text-white">
                <Loader2 className="h-4 w-4 animate-spin text-accent-emerald-500" />
                <span>Step 3: Pramana Intelligence Council evaluations</span>
              </div>
              <div className="flex items-center space-x-3 text-slate-400">
                <HelpCircle className="h-4 w-4" />
                <span>Step 4: Mapped control twins & audit evidence check</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-950/40 rounded-lg text-[10px] text-slate-400 text-center border border-slate-200/50 dark:border-slate-800/50">
              Page will automatically reload once the council reaches a consensus.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // extract department/systems list from trace data
  const affectedDepartments = Array.from(
    new Set(traceData?.trace?.map((t: any) => t.affected_entity).filter(Boolean))
  ) as string[];

  const extractedObligations = traceData?.trace || [];

  return (
    <div className="space-y-8 animate-fade-in-up text-left">
      {/* Page Header */}
      <PageHeader
        title={session.regulation_number || "Compliance Session"}
        description={session.regulation_title || "Regulatory Circular Findings"}
        actions={
          <div className="flex items-center space-x-2">
            {/* Live AI / Demo Mode Badge */}
            {session.analysis_mode === "live_ai" ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-accent-emerald-500/10 text-accent-emerald-500 border border-accent-emerald-500/20">
                <Zap className="h-3 w-3" />
                Live AI
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Demo Mode
              </span>
            )}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print</span>
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-50 transition-all shadow-sm"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export</span>
            </button>
          </div>
        }
      />

      {/* Overview Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Document Stats */}
        <Card className="border border-slate-200 dark:border-slate-800 md:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4.5 w-4.5 text-accent-emerald-500" />
              Regulatory Analysis Source Registry
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">File Name</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block truncate" title={session.document_name}>
                {session.document_name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Reference Code</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 block">
                {session.regulation_number || "N/A"}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Jurisdiction</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">SEBI (India)</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block uppercase text-[10px]">Status</span>
              <StatusBadge status="compliant" className="mt-0.5" />
            </div>
          </CardContent>
        </Card>

        {/* Quick Nav Card */}
        <Card className="border border-slate-200 dark:border-slate-800 bg-slate-900 text-white">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-semibold text-slate-400 uppercase tracking-wide text-[10px]">
              Compliance Controls
            </CardTitle>
            <CardDescription className="text-xs text-slate-500">Navigate to platform compliance views</CardDescription>
          </CardHeader>
          <CardContent className="pt-2">
            <Link
              to={`/digital-twin/${id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 text-xs font-semibold text-accent-emerald-400 transition-colors"
            >
              <div className="flex items-center space-x-2">
                <Layers className="h-4 w-4" />
                <span>Explore Regulatory Digital Twin</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>
            <Link
              to={`/action-plan/${id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-800 text-xs font-semibold text-accent-emerald-400 transition-colors mt-1"
            >
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-4 w-4" />
                <span>Open Execution Blueprint</span>
              </div>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Main summary details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Card */}
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <CardTitle className="text-base font-bold font-display">Pramana Intelligence Summary</CardTitle>
              <CardDescription className="text-xs">
                Unified intelligence synthesis explaining overall regulatory impact and compliance readiness.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              {/* Summary Text block */}
              <div className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-serif bg-slate-50 dark:bg-slate-900/30 p-5 rounded-xl border border-slate-200/50 dark:border-slate-800/50">
                {summary?.executive_summary || "No summary parsed."}
              </div>

              {/* Recommended Actions */}
              {summary?.recommended_actions && summary.recommended_actions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Required Remediations</h4>
                  <ul className="space-y-2 text-xs">
                    {summary.recommended_actions.map((act: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5 text-slate-700 dark:text-slate-300">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent-emerald-500/10 font-bold font-mono text-[10px] text-accent-emerald-500 border border-accent-emerald-500/20">
                          {idx + 1}
                        </span>
                        <span className="leading-normal pt-0.5">{act}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Obligations Lineage Card */}
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-4">
              <CardTitle className="text-base font-bold font-display">Active Organizational Obligations</CardTitle>
              <CardDescription className="text-xs">
                Traceable mandates linking internal control actions directly to parsed regulatory clauses.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0 border-t border-slate-100 dark:border-slate-800/60">
              <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {extractedObligations.map((ob: any, idx: number) => (
                  <div key={idx} className="p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 text-left flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-bold text-slate-900 dark:text-slate-100 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
                            {ob.source_clause}
                          </span>
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            {ob.affected_entity}
                          </span>
                        </div>
                        <h4 className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                          {ob.reason}
                        </h4>
                        {/* Source text snippet — grounding citation */}
                        {ob.source_text_snippet && (
                          <blockquote className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-relaxed border-l-2 border-accent-emerald-500/40 pl-3 bg-accent-emerald-500/5 py-1.5 rounded-r-lg">
                            "{ob.source_text_snippet}"
                          </blockquote>
                        )}
                        {/* Action required chip */}
                        {ob.action_required && (
                          <div className="text-[10px] text-accent-emerald-600 dark:text-accent-emerald-400 font-semibold bg-accent-emerald-500/8 border border-accent-emerald-500/20 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5">
                            <BookOpen className="h-3 w-3 shrink-0 mt-0.5" />
                            <span>{ob.action_required}</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-500 leading-relaxed bg-slate-50 dark:bg-slate-950/40 p-2.5 rounded-lg border border-slate-200/40 dark:border-slate-850/40">
                          <span className="font-semibold block text-slate-400 uppercase text-[8px] mb-1">Required Evidence</span>
                          {ob.evidence_required}
                        </div>
                      </div>
                      <Badge variant="emerald" className="font-mono font-bold shrink-0 text-[10px]">
                        {Math.round(ob.confidence * 100)}%
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Diagnostics */}
        <div className="space-y-8">
          {/* Risk Level and Escalation Alerts */}
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Risk & Governance Metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-5 space-y-5">
              {/* Flags */}
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Escalation Triggered:</span>
                  {summary?.escalation_needed ? (
                    <Badge className="bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500/10 font-bold">Yes</Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-400 font-bold">No</Badge>
                  )}
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Approval Required:</span>
                  {summary?.approval_required ? (
                    <Badge className="bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500/10 font-bold">Board Approval</Badge>
                  ) : (
                    <Badge variant="outline" className="text-slate-400 font-bold">None</Badge>
                  )}
                </div>
              </div>

              {/* Warning Alert if Escalation is active */}
              {summary?.escalation_needed && (
                <div className="p-3.5 rounded-lg border border-red-500/20 bg-red-500/5 text-xs text-red-500 leading-relaxed flex items-start gap-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Board Review Advised</span>
                    High priority gaps have been identified in the pre-trade treasury boundaries.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Affected Entities */}
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Affected Departments
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 flex flex-wrap gap-2">
              {affectedDepartments.length > 0 ? (
                affectedDepartments.map((dept, idx) => (
                  <Badge key={idx} variant="outline" className="font-semibold px-2.5 py-1 text-slate-600 dark:text-slate-300">
                    {dept}
                  </Badge>
                ))
              ) : (
                <span className="text-xs text-slate-500">None identified.</span>
              )}
            </CardContent>
          </Card>

          {/* Implementation Timeline */}
          {summary?.implementation_timeline && (
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-accent-emerald-500" />
                  Implementation Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4">
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  {summary.implementation_timeline}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Referenced Regulations */}
          {summary?.referenced_regulations && summary.referenced_regulations.length > 0 && (
            <Card className="border border-slate-200 dark:border-slate-800">
              <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-800/60">
                <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Referenced Acts & Regulations
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-4 space-y-1.5">
                {summary.referenced_regulations.map((ref: string, idx: number) => (
                  <div key={idx} className="text-[10px] text-slate-600 dark:text-slate-400 flex items-start gap-2">
                    <span className="text-accent-emerald-500 font-bold mt-0.5">›</span>
                    <span>{ref}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
export default AnalysisPage;
