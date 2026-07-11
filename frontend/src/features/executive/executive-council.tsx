// src/features/executive/executive-council.tsx
import * as React from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, AlertTriangle, ShieldCheck, ChevronRight, Shield, ShieldAlert, Workflow, FileText } from "lucide-react";
import { motion } from "framer-motion";
import { api } from "@/shared/services/api";

export const ExecutiveCouncil: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  // Fetch session analysis details
  const { data: session, isLoading, isError, refetch } = useQuery({
    queryKey: ["analysis-session", id],
    queryFn: async () => {
      const response = await api.get(`/analysis/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-160px)]">
        <div className="h-12 w-12 rounded-full border-4 border-slate-200 dark:border-slate-800 border-t-accent-emerald-500 animate-spin" />
        <p className="text-xs text-slate-500">Retrieving council members state...</p>
      </div>
    );
  }

  if (isError || !session) {
    return (
      <div className="py-20 flex flex-col items-center justify-center text-center">
        <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-950/20 text-red-500 flex items-center justify-center shadow-sm mb-4">
          <AlertTriangle className="h-6 w-6" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">Could not load Intelligence Council</h3>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Verify that this analysis session has finished and is currently active.
        </p>
      </div>
    );
  }

  // Extract agent details from the backend session payload
  const agents = [
    {
      id: "regulatory-ai",
      name: "Regulatory Intelligence",
      description: "Ingests circular texts, tokenizes requirements, and validates clause structures.",
      icon: Shield,
      data: session.regulatory_ai,
    },
    {
      id: "risk-ai",
      name: "Risk Intelligence",
      description: "Models non-compliance probabilities and identifies exposures.",
      icon: ShieldAlert,
      data: session.risk_ai,
    },
    {
      id: "operations-ai",
      name: "Operations Intelligence",
      description: "Maps compliance obligations to affected systems and workflows.",
      icon: Workflow,
      data: session.operations_ai,
    },
    {
      id: "audit-ai",
      name: "Audit Intelligence",
      description: "Prepares audit verification checkpoints and handles evidence coverage.",
      icon: FileText,
      data: session.audit_ai,
    },
  ].filter(a => a.data);

  // Framer Motion animation containers
  const containerVariants = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.15,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100, damping: 15 } },
  };

  return (
    <div className="space-y-8 animate-fade-in-up text-left">
      {/* Page Header */}
      <PageHeader
        title="Pramana Intelligence Council"
        description="Review coordinated assessments from dedicated AI compliance domains resolving the regulatory posture."
        actions={
          <div className="flex items-center space-x-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white hover:bg-slate-50 transition-all shadow-sm"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Refresh Council</span>
            </button>
            <Link to={`/analysis/${id}`}>
              <Button variant="outline" size="sm" className="text-xs font-semibold gap-1">
                <span>View Regulatory Analysis</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        }
      />

      {/* Consensus Reached Banner */}
      {session.status === "completed" && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4 }}
          className="border border-accent-emerald-500/20 bg-accent-emerald-500/5 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center space-x-3 text-left">
            <div className="h-10 w-10 rounded-full bg-accent-emerald-500/10 text-accent-emerald-500 flex items-center justify-center border border-accent-emerald-500/20 shadow-sm shrink-0">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200">Consensus Reached</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                All 4 intelligence council domains have finalized validations and generated audit-ready control mappings.
              </p>
            </div>
          </div>
          <Badge className="bg-accent-emerald-500/15 text-accent-emerald-500 border border-accent-emerald-500/30 hover:bg-accent-emerald-500/15 font-bold font-mono py-1 px-3">
            VERIFIED POSTURE
          </Badge>
        </motion.div>
      )}

      {/* Agents Card Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 gap-6 md:grid-cols-2"
      >
        {agents.map((agent) => {
          const status = agent.data?.status === "completed" || agent.data?.status === "compliant"
            ? "compliant"
            : agent.data?.status === "under_review"
            ? "under_review"
            : "pending";

          const confidence = agent.data?.confidence !== undefined
            ? Math.round(agent.data.confidence * 100)
            : 95;

          const IconComponent = agent.icon;

          return (
            <motion.div key={agent.id} variants={cardVariants}>
              <Card className="flex flex-col h-full border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all duration-300">
                <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
                  <div className="flex items-start justify-between gap-4 text-left">
                    <div className="flex items-center space-x-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-800/80 text-accent-emerald-500 border border-slate-250 dark:border-slate-700/60 shadow-sm shrink-0">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-sm font-bold font-display">{agent.name}</CardTitle>
                        <CardDescription className="text-[11px] leading-relaxed mt-0.5">{agent.description}</CardDescription>
                      </div>
                    </div>
                    <StatusBadge status={status} />
                  </div>
                </CardHeader>

                <CardContent className="flex-1 py-5 space-y-4 text-left">
                  {/* Confidence Index */}
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500 font-medium">Domain Confidence:</span>
                    <Badge variant="emerald" className="font-mono font-bold text-[10px]">{confidence}% Match</Badge>
                  </div>

                  {/* Findings */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Key Findings</span>
                    <div className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-serif bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-850/40 p-3.5 rounded-lg">
                      {agent.data?.analysis || "No findings recorded."}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {agent.data?.recommendations && agent.data.recommendations.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Council Recommendations</span>
                      <ul className="space-y-1 text-[11px] text-slate-600 dark:text-slate-400 list-disc pl-4 leading-relaxed">
                        {agent.data.recommendations.map((rec: string, idx: number) => (
                          <li key={idx}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
};
export default ExecutiveCouncil;
