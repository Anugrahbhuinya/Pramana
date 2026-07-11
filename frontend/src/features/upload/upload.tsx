// src/features/upload/upload.tsx
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { UploadCloud, FileText, ArrowRight, Loader2, CheckCircle, Clock, Shield } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { api } from "@/shared/services/api";
import { useToast } from "@/components/ui/toast";
import { useGlobalState } from "@/shared/context/global-context";

interface PipelineStage {
  title: string;
  description: string;
}

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setActiveSessionId } = useGlobalState();
  const [file, setFile] = React.useState<File | null>(null);
  const [dragActive, setDragActive] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [analysisProgress, setAnalysisProgress] = React.useState(0);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 1. Upload Document Mutation
  const uploadMutation = useMutation({
    mutationFn: async (fileToUpload: File) => {
      const formData = new FormData();
      formData.append("file", fileToUpload);
      
      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        },
      });
      return response.data;
    },
    onSuccess: (data) => {
      // Guard: document_id must be a valid string before calling analyze
      const documentId = data?.document_id ? String(data.document_id) : null;
      if (!documentId) {
        console.error("[Pramana] upload response missing document_id", data);
        toast({
          title: "Upload Warning",
          message: "Document was uploaded but ID was not returned. Please retry.",
          type: "error",
        });
        return;
      }
      analyzeMutation.mutate(documentId);
    },
    onError: (error: any) => {
      toast({
        title: "Ingestion Failed",
        message: error.message || "Could not process regulatory document. Ensure it is a valid PDF.",
        type: "error",
      });
      setFile(null);
      setUploadProgress(0);
    },
  });

  // 2. Analyze Document Mutation
  const analyzeMutation = useMutation({
    mutationFn: async (documentId: string) => {
      const interval = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev >= 95) {
            clearInterval(interval);
            return 95;
          }
          return prev + 15;
        });
      }, 700);

      try {
        const response = await api.post(`/analyze/${documentId}`);
        clearInterval(interval);
        setAnalysisProgress(100);
        return response.data;
      } catch (error) {
        clearInterval(interval);
        throw error;
      }
    },
    onSuccess: (data) => {
      // Invalidate dashboard caches so new analysis appears immediately
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["sessions-list"] });

      // Ensure session_id is a valid string before storing or navigating
      const sessionId = data?.session_id ? String(data.session_id) : null;
      if (!sessionId) {
        console.error("[Pramana] analyze response missing session_id", data);
        toast({
          title: "Analysis Warning",
          message: "Analysis completed but session ID was not returned. Please check the dashboard.",
          type: "error",
        });
        return;
      }

      toast({
        title: "Ingestion Complete",
        message: "SEBI Circular ingested successfully. Twin model built.",
        type: "success",
      });
      setActiveSessionId(sessionId);
      setTimeout(() => {
        navigate(`/analysis/${sessionId}`);
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Analysis Failed",
        message: error.message || "Failed running compliance intelligence pipelines.",
        type: "error",
      });
      setFile(null);
      setUploadProgress(0);
      setAnalysisProgress(0);
    },
  });

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      validateAndSetFile(droppedFile);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (selectedFile: File) => {
    if (selectedFile.type !== "application/pdf" && !selectedFile.name.endsWith(".pdf")) {
      toast({
        title: "Invalid File Type",
        message: "Only PDF SEBI Circulars are supported at this stage.",
        type: "error",
      });
      return;
    }
    setFile(selectedFile);
  };

  const triggerUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  const isPending = uploadMutation.isPending || analyzeMutation.isPending;

  // 8-stage pipeline with phase labels matching the AI briefing
  const pipelineStages: PipelineStage[] = [
    { title: "Reading Regulation", description: "Parsing and chunking PDF text" },
    { title: "Extracting Clauses", description: "Identifying clause numbers and titles" },
    { title: "Understanding Obligations", description: "Extracting actionable mandates" },
    { title: "Mapping Departments", description: "Identifying operational impact" },
    { title: "Assessing Risk", description: "Calculating compliance risk scores" },
    { title: "Generating Controls", description: "Building audit evidence checklist" },
    { title: "Preparing Blueprint", description: "Synthesizing execution plan" },
    { title: "Consensus Complete", description: "Intelligence Council verified ✓" },
  ];

  const getStageStatus = (index: number): "pending" | "active" | "completed" => {
    if (uploadMutation.isPending) {
      return index === 0 ? "active" : "pending";
    }
    if (analyzeMutation.isPending) {
      if (index === 0) return "completed";
      const p = analysisProgress;
      const thresholds = [0, 14, 28, 43, 57, 71, 85, 95];
      const nextThresholds = [14, 28, 43, 57, 71, 85, 95, 100];
      if (p >= nextThresholds[index]) return "completed";
      if (p >= thresholds[index]) return "active";
      return "pending";
    }
    if (analyzeMutation.isSuccess) return "completed";
    return "pending";
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 py-6 animate-fade-in-up text-left">
      <Card className="border border-slate-200 dark:border-slate-800 shadow-lg bg-white/70 dark:bg-slate-900/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="text-xl font-bold font-display text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-accent-emerald-500" />
            Regulation Ingestion
          </CardTitle>
          <CardDescription className="text-sm text-slate-500">
            Submit SEBI circulars in PDF format to build your organization's Regulatory Digital Twin and generate an AI-powered execution blueprint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AnimatePresence mode="wait">
            {!file ? (
              <motion.div
                key="dropzone"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-300 ${
                  dragActive
                    ? "border-accent-emerald-500 bg-accent-emerald-500/5"
                    : "border-slate-300 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-950/20"
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  accept=".pdf"
                  onChange={handleChange}
                />
                <div className="p-4 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-400 mb-4 shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                  <UploadCloud className="h-8 w-8 text-slate-500 dark:text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Drag & drop regulation circular here
                </h3>
                
                {/* Meta details banner */}
                <div className="mt-4 grid grid-cols-2 gap-4 max-w-sm w-full mx-auto border-t border-slate-250/40 dark:border-slate-800/60 pt-4 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Supported Format</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">SEBI Circular (PDF)</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-bold uppercase">Maximum Size</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">20 MB</span>
                  </div>
                </div>

                <Button variant="outline" size="sm" className="mt-6 font-semibold">
                  Browse Files
                </Button>
              </motion.div>
            ) : (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="border border-slate-200 dark:border-slate-800 rounded-xl p-6 bg-slate-50/50 dark:bg-slate-950/20 space-y-6"
              >
                <div className="flex items-center space-x-4">
                  <div className="p-3 rounded-lg bg-accent-emerald-500/10 text-accent-emerald-500 border border-accent-emerald-500/20 shadow-sm">
                    <FileText className="h-6 w-6" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-200 truncate">
                      {file.name}
                    </h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to analyze
                    </p>
                  </div>
                </div>

                {isPending ? (
                  /* Animated 8-Stage Intelligence Pipeline */
                  <div className="space-y-4 border-t border-slate-200 dark:border-slate-800/80 pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Pramana AI Pipeline</span>
                      <span className="text-[10px] font-mono font-bold text-accent-emerald-500">
                        {uploadMutation.isPending ? `${uploadProgress}%` : `${analysisProgress}%`}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      {pipelineStages.map((stage, index) => {
                        const stageStatus = getStageStatus(index);
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: stageStatus === "pending" ? 0.4 : 1, x: 0 }}
                            transition={{ delay: index * 0.08, duration: 0.3 }}
                            className="flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center space-x-3 text-left">
                              <div className="w-4 h-4 shrink-0 flex items-center justify-center">
                                {stageStatus === "completed" && (
                                  <CheckCircle className="h-4 w-4 text-accent-emerald-500" />
                                )}
                                {stageStatus === "active" && (
                                  <Loader2 className="h-4 w-4 animate-spin text-accent-emerald-400" />
                                )}
                                {stageStatus === "pending" && (
                                  <div className="h-3 w-3 rounded-full border border-slate-600" />
                                )}
                              </div>
                              <div>
                                <span className={`font-semibold block leading-tight ${
                                  stageStatus === "active"
                                    ? "text-slate-900 dark:text-white"
                                    : stageStatus === "completed"
                                    ? "text-slate-600 dark:text-slate-400"
                                    : "text-slate-400"
                                }`}>
                                  {stage.title}
                                </span>
                                {stageStatus === "active" && (
                                  <span className="text-[10px] text-accent-emerald-500 font-medium">
                                    {stage.description}
                                  </span>
                                )}
                              </div>
                            </div>
                            {stageStatus === "active" && (
                              <span className="text-[9px] uppercase tracking-wider text-accent-emerald-500 font-bold animate-pulse">
                                Running
                              </span>
                            )}
                            {stageStatus === "completed" && (
                              <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                                Done
                              </span>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    <Progress value={uploadMutation.isPending ? uploadProgress : analysisProgress} className="h-1.5 mt-2" />
                  </div>
                ) : (
                  <div className="flex items-center justify-end space-x-3 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isPending}
                      onClick={() => setFile(null)}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="emerald"
                      size="sm"
                      className="font-semibold shadow-md shadow-accent-emerald-950/20"
                      disabled={isPending}
                      onClick={triggerUpload}
                    >
                      <span>Start Regulatory Analysis</span>
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
};
export default UploadPage;
