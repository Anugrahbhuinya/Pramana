import * as React from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ShieldAlert,
  FolderLock,
  ListCheck,
  CalendarDays,
  Binary,
  Upload,
  RefreshCw,
  Clock,
  Shield,
  ArrowRight,
  Zap,
  AlertTriangle
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { MetricCard } from "@/components/ui/metric-card";
import { ChartCard } from "@/components/ui/chart-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { Loader } from "@/components/ui/loader";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";
import { api } from "@/shared/services/api";

const CircularProgress: React.FC<{ value: number; size?: number; strokeWidth?: number }> = ({
  value,
  size = 140,
  strokeWidth = 12,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-slate-100 dark:stroke-slate-800"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          className="stroke-accent-emerald-500 transition-all duration-1000 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          fill="transparent"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-3xl font-extrabold font-display text-slate-900 dark:text-white">{value}%</span>
        <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider mt-0.5">Readiness</span>
      </div>
    </div>
  );
};

export const Dashboard: React.FC = () => {
  const { toast } = useToast();
  const [seeding, setSeeding] = React.useState(false);

  // Fetch AI server / status endpoint
  const { data: statusData } = useQuery({
    queryKey: ["platform-status"],
    queryFn: async () => {
      const response = await api.get("/status");
      return response.data;
    },
  });

  const { data: summary, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: async () => {
      const response = await api.get("/dashboard-summary");
      return response.data;
    },
  });

  const handleLoadDemo = async () => {
    setSeeding(true);
    try {
      await api.post("/seed-demo");
      toast({
        title: "Demo Data Seeded",
        message: "Successfully seeded SEBI compliance circulars, obligations, and execution blueprint tasks.",
        type: "success",
      });
      refetch();
    } catch (err: any) {
      toast({
        title: "Seeding Failed",
        message: err.message || "Failed to load SEBI compliance demo dataset.",
        type: "error",
      });
    } finally {
      setSeeding(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4 min-h-[calc(100vh-160px)]">
        <Loader size="lg" />
        <p className="text-xs text-slate-500 font-semibold animate-pulse">Ingesting platform telemetry...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="py-20 flex items-center justify-center min-h-[calc(100vh-160px)]">
        <ErrorState
          title="Telemetry Server Offline"
          message="Unable to reach the Intelligence Engine. Verify backend connectivity and try again."
          onRetry={refetch}
        />
      </div>
    );
  }

  const hasSessions = summary?.recent_sessions && summary.recent_sessions.length > 0;

  if (!hasSessions) {
    return (
      <div className="space-y-8 animate-fade-in-up text-left">
        <PageHeader
          title="Compliance Control Center"
          description="AI-Powered Regulatory Intelligence Platform for SEBI compliance."
        />
        <div className="py-16 border border-slate-200 dark:border-slate-800 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm shadow-sm flex flex-col items-center justify-center text-center px-6">
          <div className="max-w-md space-y-6">
            <EmptyState
              icon={Shield}
              title="Welcome to Pramana."
              description="No regulations have been analyzed. Ingest your first SEBI Circular to build your organization's Regulatory Digital Twin and generate an AI-powered execution blueprint."
              actionText="Analyze First Regulation"
              onAction={() => window.location.href = "/upload"}
            />
            <div className="flex justify-center pt-2">
              <Button onClick={handleLoadDemo} variant="outline" disabled={seeding}>
                {seeding ? "Seeding..." : "Load SEBI Compliance Demo Dataset"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const trendData = summary.compliance_trend && summary.compliance_trend.length > 0
    ? summary.compliance_trend
    : [
        { month: "May", score: 80 },
        { month: "Jun", score: 85 },
        { month: "Jul", score: 84.5 }
      ];

  const obligationsByDept = summary.department_impact && summary.department_impact.length > 0
    ? summary.department_impact
    : [
        { name: "Treasury", count: 12 },
        { name: "Compliance", count: 8 }
      ];

  const isLiveAI = statusData?.mode === "live";

  return (
    <div className="space-y-8 animate-fade-in-up text-left">
      {/* Page Header */}
      <PageHeader
        title="Compliance Control Center"
        description="Monitor organization-wide SEBI compliance readiness, risks, and active obligations."
        actions={
          <div className="flex items-center space-x-3">
            {/* Status Pill */}
            {isLiveAI ? (
              <Badge className="bg-accent-emerald-500/10 text-accent-emerald-500 border border-accent-emerald-500/20 hover:bg-accent-emerald-500/10 font-bold uppercase tracking-wider text-[10px] py-1 px-2.5 flex items-center gap-1">
                <Zap className="h-3 w-3" />
                Live AI Active
              </Badge>
            ) : (
              <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/10 font-bold uppercase tracking-wider text-[10px] py-1 px-2.5">
                Demo Mode
              </Badge>
            )}

            <button
              onClick={() => refetch()}
              disabled={isRefetching}
              className="p-2 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-all shadow-sm"
              title="Reload Controls"
            >
              <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            </button>
            <Button
              variant="outline"
              size="sm"
              disabled={seeding}
              onClick={handleLoadDemo}
              className="text-xs font-semibold"
            >
              {seeding ? "Seeding..." : "Reset & Load Demo Data"}
            </Button>
            <Link to="/upload">
              <Button variant="emerald" size="sm" className="font-semibold shadow-md shadow-accent-emerald-950/10">
                <Upload className="mr-1.5 h-4 w-4" />
                Regulation Ingestion
              </Button>
            </Link>
          </div>
        }
      />

      {/* Demo Mode Notice Banner */}
      {!isLiveAI && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5 text-xs text-blue-400 flex items-start gap-3 shadow-sm">
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold block text-blue-300">Running in Demo Mode</span>
            <p className="leading-relaxed">
              Pramana is currently operating with pre-seeded demo telemetry. Upload an official SEBI circular PDF in the 
              <strong> Ingestion workspace</strong> to execute grounded live AI compliance mapping and build custom digital twins.
            </p>
          </div>
        </div>
      )}

      {/* Hero Experience Area: Above the fold */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Today's Compliance Readiness Hero Widget */}
        <Card className="border border-slate-200 dark:border-slate-800 lg:col-span-1 bg-gradient-to-br from-slate-900 to-slate-950 text-white shadow-xl flex flex-col justify-between p-6">
          <div className="space-y-2">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Real-time Telemetry</span>
            <h3 className="text-md font-bold text-white leading-normal">Today's Compliance Readiness</h3>
          </div>
          
          <div className="my-6 flex justify-center py-2">
            <CircularProgress value={summary.compliance_readiness} />
          </div>

          <div className="border-t border-slate-800/80 pt-4 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-1.5">
              <Binary className="h-4 w-4 text-accent-emerald-500" />
              <span className="text-slate-400 font-medium">AI Confidence:</span>
            </div>
            <span className="font-mono font-bold text-accent-emerald-500">{summary.ai_confidence}%</span>
          </div>
        </Card>

        {/* Right Side: Surrounding 2x2 Grid cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-6">
          <MetricCard
            title="Critical Risks"
            value={String(summary.critical_risks)}
            description="High severity exposure vectors"
            icon={ShieldAlert}
          />
          <MetricCard
            title="Pending Obligations"
            value={String(summary.pending_obligations)}
            description="Governance checklist items remaining"
            icon={ListCheck}
          />
          <MetricCard
            title="Upcoming Deadlines"
            value={String(summary.upcoming_deadlines)}
            description="Tasks due in the next 7 business days"
            icon={CalendarDays}
          />
          <MetricCard
            title="Evidence Coverage"
            value={`${summary.evidence_coverage}%`}
            description="Reconciled internal proof artifacts"
            icon={FolderLock}
          />
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <ChartCard
          title="Compliance Readiness Trend"
          description="Platform compliance score tracking over completed regulatory reviews."
        >
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis
                dataKey="month"
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(148, 163, 184, 0.2)",
                  borderRadius: "8px",
                  color: "#F1F5F9",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="score"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorScore)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Obligations by Department"
          description="Distribution of active regulatory compliance requirements."
        >
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={obligationsByDept} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(148, 163, 184, 0.1)" />
              <XAxis
                dataKey="name"
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#64748B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.95)",
                  borderColor: "rgba(148, 163, 184, 0.2)",
                  borderRadius: "8px",
                  color: "#F1F5F9",
                  fontSize: "12px",
                }}
                cursor={{ fill: "rgba(148, 163, 184, 0.05)" }}
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={45}>
                {obligationsByDept.map((_item: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#10B981" : "#1E293B"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Ingestions Feed */}
      <div className="grid grid-cols-1 gap-6">
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2 text-slate-500">
              <Clock className="h-4.5 w-4.5 text-accent-emerald-500" />
              <CardTitle className="text-base font-semibold">Recent Ingestions & Regulatory Reviews</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-0 border-t border-slate-200 dark:border-slate-800/60">
            <div className="divide-y divide-slate-200 dark:divide-slate-800/80">
              {summary.recent_sessions.map((s: any) => (
                <div key={s.session_id} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 dark:hover:bg-slate-900/10 transition-colors">
                  <div className="text-left space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="font-mono font-bold text-[10px]">{s.regulation_number || "Circular"}</Badge>
                      <span className="text-[10px] text-slate-400">
                        {new Date(s.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-200">
                      {s.regulation_title || s.document_name}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                    <Link to={`/analysis/${s.session_id}`}>
                      <Button variant="ghost" size="sm" className="h-8 text-xs font-semibold gap-1">
                        <span>Workspace</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
export default Dashboard;
