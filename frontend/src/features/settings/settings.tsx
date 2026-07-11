import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Settings, Shield, Cpu, RefreshCw, Moon, Sun, CheckCircle, AlertCircle } from "lucide-react";
import { useGlobalState } from "@/shared/context/global-context";
import { api } from "@/shared/services/api";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";

export const SettingsPage: React.FC = () => {
  const { theme, setTheme } = useGlobalState();
  const { toast } = useToast();
  const [seeding, setSeeding] = React.useState(false);

  // Query Backend Health Check
  const { data: health, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["backend-health"],
    queryFn: async () => {
      const response = await api.get("/health");
      return response.data;
    },
    retry: false,
  });

  const handleLoadDemo = async () => {
    setSeeding(true);
    try {
      await api.post("/seed-demo");
      toast({
        title: "Demo Data Loaded",
        message: "Successfully seeded SEBI compliance circulars, obligations, and execution blueprint tasks.",
        type: "success",
      });
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

  return (
    <div className="space-y-8 animate-fade-in-up text-left">
      <PageHeader
        title="Platform Settings"
        description="Manage your workspace preferences, check platform diagnostics, and view connection telemetry."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Workspace Configurations */}
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center space-x-2 text-slate-500">
              <Settings className="h-4.5 w-4.5 text-accent-emerald-500" />
              <CardTitle className="text-base font-semibold">User Interface Preferences</CardTitle>
            </div>
            <CardDescription className="text-xs">Adjust how the platform appears on your screen.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Aesthetic Theme</h4>
                <p className="text-xs text-slate-500 mt-0.5">Toggle between slate dark mode and clear light mode.</p>
              </div>
              <div className="flex items-center space-x-1 border border-slate-200 dark:border-slate-800 rounded-lg p-1 bg-slate-50 dark:bg-slate-900/60 shadow-sm">
                <button
                  onClick={() => setTheme("light")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    theme === "light"
                      ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Sun className="h-3.5 w-3.5" />
                  <span>Light</span>
                </button>
                <button
                  onClick={() => setTheme("dark")}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                    theme === "dark"
                      ? "bg-slate-800 text-white shadow-sm border border-slate-700/60"
                      : "text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <Moon className="h-3.5 w-3.5" />
                  <span>Dark</span>
                </button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* System Diagnostics & Telemetry */}
        <Card className="border border-slate-200 dark:border-slate-800">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-slate-500">
                <Cpu className="h-4.5 w-4.5 text-accent-emerald-500" />
                <CardTitle className="text-base font-semibold">Service Status & Diagnostics</CardTitle>
              </div>
              <button
                onClick={() => refetch()}
                disabled={isLoading || isRefetching}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-950 dark:hover:text-white transition-colors"
                title="Refresh Status"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${isRefetching ? "animate-spin" : ""}`} />
              </button>
            </div>
            <CardDescription className="text-xs">Live status report from the FastAPI backend and database engine.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Deployment Environment:</span>
              <Badge variant="outline" className="font-semibold capitalize">
                {health?.environment || "development"}
              </Badge>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">FastAPI Core Server Status:</span>
              <div className="flex items-center gap-1.5">
                {isLoading ? (
                  <Badge variant="outline" className="text-slate-400">Checking...</Badge>
                ) : health?.status === "healthy" || health?.status === "degraded" ? (
                  <span className="flex items-center gap-1 text-accent-emerald-500 font-semibold">
                    <CheckCircle className="h-3.5 w-3.5" /> Online
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" /> Offline
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">PostgreSQL Database Connection:</span>
              <div className="flex items-center gap-1.5">
                {isLoading ? (
                  <Badge variant="outline" className="text-slate-400">Probing...</Badge>
                ) : health?.database === "healthy" ? (
                  <span className="flex items-center gap-1 text-accent-emerald-500 font-semibold">
                    <CheckCircle className="h-3.5 w-3.5" /> Connected (Pool: 20 max)
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-red-500 font-semibold">
                    <AlertCircle className="h-3.5 w-3.5" /> Connection Failed
                  </span>
                )}
              </div>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">Application Version:</span>
              <span className="font-mono text-slate-800 dark:text-slate-200">v1.0.0 (MVP)</span>
            </div>
          </CardContent>
        </Card>

        {/* Demonstration Setup */}
        <Card className="border border-slate-200 dark:border-slate-800 md:col-span-2">
          <CardHeader>
            <div className="flex items-center space-x-2 text-slate-500">
              <RefreshCw className="h-4.5 w-4.5 text-accent-emerald-500" />
              <CardTitle className="text-base font-semibold">Demonstration Setup & Seeding</CardTitle>
            </div>
            <CardDescription className="text-xs">Populate the platform database with the standard SEBI regulatory compliance dataset.</CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-semibold text-slate-850 dark:text-slate-200">Load Mock SEBI Data</h4>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">Seeds 3 circulars, 20 obligations, and 40 execution checklist tasks for Demo Securities Ltd.</p>
            </div>
            <Button
              onClick={handleLoadDemo}
              disabled={seeding}
              className="font-semibold"
            >
              {seeding ? "Seeding..." : "Load Demo Dataset"}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* About Section */}
      <Card className="border border-slate-200 dark:border-slate-800">
        <CardHeader>
          <div className="flex items-center space-x-2 text-slate-500">
            <Shield className="h-4.5 w-4.5 text-accent-emerald-500" />
            <CardTitle className="text-base font-semibold">About Pramana</CardTitle>
          </div>
          <CardDescription className="text-xs">The Enterprise Regulatory Intelligence Platform.</CardDescription>
        </CardHeader>
        <CardContent className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-3xl space-y-3">
          <p>
            Pramana is engineered to ingest complex regulatory text, extract structural compliance guidelines, and construct actionable internal audit trails.
          </p>
          <p>
            By mapping external legal mandates to local control policies and systems databases, Pramana provides compliance officers and risk executives with an explainable, visual digital twin of their regulatory posture.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
