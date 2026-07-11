// src/features/explainability/explainability.tsx
import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { FileText, Compass, ChevronDown, ChevronUp, AlertTriangle, Shield, GitCommit, FileCheck, CheckCircle2 } from "lucide-react";
import { api } from "@/shared/services/api";
import { exportDecisionTraceability } from "@/shared/utils/report-exporter";

interface TraceItem {
  source_clause: string;
  reason: string;
  confidence: number;
  supporting_context: string;
  affected_entity: string;
  evidence_required: string;
}

export const Explainability: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [expandedIndex, setExpandedIndex] = React.useState<number | null>(0);

  // Fetch explainability trace data
  const { data: explainData, isLoading, isError } = useQuery({
    queryKey: ["explainability-trace", id],
    queryFn: async () => {
      const response = await api.get(`/explainability/${id}`);
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

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-120px)]">
        <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-accent-emerald-500 animate-spin" />
        <p className="text-xs text-slate-500 font-semibold">Tracing compliance logic boundaries...</p>
      </div>
    );
  }

  if (isError || !explainData) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 text-red-500 flex items-center justify-center shadow-sm mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Could not resolve trace data</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Verify that this analysis session has finished and is currently active.
        </p>
      </div>
    );
  }

  const traces = explainData.trace || [];

  const toggleExpand = (idx: number) => {
    setExpandedIndex(expandedIndex === idx ? null : idx);
  };

  const highlightTerms = (text: string) => {
    if (!text) return "";
    const terms = ["segregate", "reconciliation", "escrow", "audit", "pre-trade", "limits", "penalties", "daily", "matching"];
    let highlighted = text;
    
    terms.forEach(term => {
      const regex = new RegExp(`\\b(${term})\\b`, "gi");
      highlighted = highlighted.replace(regex, '<span class="text-amber-500 font-semibold">$1</span>');
    });

    return <span dangerouslySetInnerHTML={{ __html: highlighted }} />;
  };

  return (
    <div className="space-y-8 animate-fade-in-up text-left">
      {/* Page Header */}
      <PageHeader
        title="Decision Traceability"
        description="Verify reasoning paths, confidence scores, and evidentiary logs linked back to original SEBI circulars."
        actions={
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => session && exportDecisionTraceability(session, traces)}
              className="text-xs font-semibold"
            >
              Export Traceability
            </Button>
            <Link to={`/analysis/${id}`}>
              <Button variant="outline" size="sm" className="font-semibold text-xs">
                <span>View Regulatory Analysis</span>
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 items-start">
        {/* Left Column: Source Clause Context panel (1/3 width) */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800/60 pb-4">
              <div className="flex items-center space-x-2 text-slate-500 dark:text-slate-400">
                <FileText className="h-4.5 w-4.5 text-accent-emerald-500" />
                <span className="text-xs font-bold uppercase tracking-wider">Source Clause Text</span>
              </div>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {expandedIndex !== null && traces[expandedIndex] ? (
                <>
                  <div className="space-y-2">
                    <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      {traces[expandedIndex].source_clause}
                    </span>
                    <blockquote className="rounded-lg bg-slate-50 dark:bg-slate-950/60 p-4 border-l-2 border-slate-350 dark:border-slate-750 text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-serif">
                      {highlightTerms(traces[expandedIndex].supporting_context || "No context text found.")}
                    </blockquote>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs pt-2">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Jurisdiction</span>
                      <span className="font-semibold text-slate-805 dark:text-slate-250">SEBI (India)</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block uppercase">Affected System</span>
                      <Badge variant="outline" className="mt-0.5">{traces[expandedIndex].affected_entity}</Badge>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Select a traceability item to view its corresponding clause text.
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Decision Journey flow accordion (2/3 width) */}
        <div className="space-y-4 lg:col-span-2">
          <Card className="border border-slate-200 dark:border-slate-800">
            <CardHeader className="pb-2 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center space-x-2 text-slate-500">
                <Compass className="h-4.5 w-4.5 text-accent-emerald-500" />
                <CardTitle className="text-sm font-semibold uppercase tracking-wider">Decision Journey Traces</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-200 dark:divide-slate-800/85">
                {traces.map((trace: TraceItem, idx: number) => {
                  const isExpanded = expandedIndex === idx;
                  const confidenceVal = Math.round(trace.confidence * 100);

                  return (
                    <div key={idx} className="transition-all duration-200">
                      {/* Accordion Trigger */}
                      <button
                        onClick={() => toggleExpand(idx)}
                        className={`w-full flex items-center justify-between p-5 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 text-left transition-colors ${
                          isExpanded ? "bg-slate-50/30 dark:bg-slate-900/5" : ""
                        }`}
                      >
                        <div className="flex-1 min-w-0 pr-4 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-[10px] font-bold text-slate-500 dark:text-slate-400">
                              {trace.source_clause}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="text-[9px] text-slate-400 font-semibold uppercase">{trace.affected_entity}</span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {trace.reason}
                          </h4>
                        </div>
                        <div className="flex items-center space-x-3 shrink-0">
                          <Badge variant="emerald" className="font-mono font-bold text-[10px]">
                            {confidenceVal}% Match
                          </Badge>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                        </div>
                      </button>

                      {/* Accordion Content: Connected Decision Journey timeline */}
                      {isExpanded && (
                        <div className="px-5 pb-6 pt-2 border-t border-slate-100/50 dark:border-slate-900/20 space-y-6">
                          {/* Calibration progress bar */}
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-slate-400 uppercase tracking-wider">Analysis Calibration Score:</span>
                              <span className="text-accent-emerald-500 font-mono">{confidenceVal}% Match</span>
                            </div>
                            <Progress value={confidenceVal} className="h-1" />
                          </div>

                          {/* Connected timeline cards */}
                          <div className="relative pl-6 border-l border-slate-200 dark:border-slate-800 space-y-6 text-xs text-left">
                            
                            {/* Step 1: Source Clause */}
                            <div className="relative">
                              <span className="absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-white shadow-sm ring-4 ring-white dark:ring-slate-950">
                                <Shield className="h-2.5 w-2.5" />
                              </span>
                              <div className="space-y-1">
                                <span className="text-[10px] text-blue-500 font-bold uppercase tracking-wider block">1. Regulatory Clause Node</span>
                                <div className="border border-blue-500/10 bg-blue-500/5 p-3 rounded-lg text-[11px] font-mono leading-normal text-slate-700 dark:text-slate-300">
                                  {trace.source_clause}
                                </div>
                              </div>
                            </div>

                            {/* Step 2: Reasoning Logic */}
                            <div className="relative">
                              <span className="absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm ring-4 ring-white dark:ring-slate-950">
                                <GitCommit className="h-2.5 w-2.5" />
                              </span>
                              <div className="space-y-1">
                                <span className="text-[10px] text-amber-500 font-bold uppercase tracking-wider block">2. AI reasoning Path</span>
                                <div className="border border-amber-500/10 bg-amber-500/5 p-3 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {trace.reason}
                                </div>
                              </div>
                            </div>

                            {/* Step 3: Required Evidence */}
                            <div className="relative">
                              <span className="absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-purple-500 text-white shadow-sm ring-4 ring-white dark:ring-slate-950">
                                <FileCheck className="h-2.5 w-2.5" />
                              </span>
                              <div className="space-y-1">
                                <span className="text-[10px] text-purple-500 font-bold uppercase tracking-wider block">3. Mandatory Evidence Requirement</span>
                                <div className="border border-purple-500/10 bg-purple-500/5 p-3 rounded-lg text-slate-700 dark:text-slate-300 leading-relaxed font-serif">
                                  {trace.evidence_required}
                                </div>
                              </div>
                            </div>

                            {/* Step 4: Verification & Execution */}
                            <div className="relative">
                              <span className="absolute -left-[30px] top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-accent-emerald-500 text-white shadow-sm ring-4 ring-white dark:ring-slate-950">
                                <CheckCircle2 className="h-2.5 w-2.5" />
                              </span>
                              <div className="space-y-1">
                                <span className="text-[10px] text-accent-emerald-500 font-bold uppercase tracking-wider block">4. Execution Blueprint node</span>
                                <div className="border border-accent-emerald-500/10 bg-accent-emerald-500/5 p-3 rounded-lg text-slate-700 dark:text-slate-300 leading-normal">
                                  Assign control checklist items to <span className="font-semibold text-accent-emerald-500">{trace.affected_entity}</span>.
                                </div>
                              </div>
                            </div>
                            
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {traces.length === 0 && (
                  <div className="text-center py-12 text-slate-400 text-xs">
                    No explainability traces found for this session.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
export default Explainability;
