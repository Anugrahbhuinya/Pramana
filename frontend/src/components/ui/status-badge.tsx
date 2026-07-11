// src/components/ui/status-badge.tsx
import * as React from "react";
import { Badge } from "./badge";
import { cn } from "@/shared/utils/cn";

export type ProjectStatus =
  | "compliant"
  | "non_compliant"
  | "pending"
  | "under_review"
  | "critical"
  | "high"
  | "medium"
  | "low"
  | "active"
  | "inactive";

interface StatusBadgeProps {
  status: ProjectStatus | string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const normalized = status.toLowerCase().replace(/[\s-]/g, "_");

  let variant: "default" | "emerald" | "secondary" | "destructive" | "outline" = "default";
  let label = status;
  let dotColor = "bg-slate-400";

  switch (normalized) {
    case "compliant":
    case "active":
      variant = "emerald";
      dotColor = "bg-accent-emerald-500 animate-pulse-subtle";
      label = normalized === "compliant" ? "Compliant" : "Active";
      break;
    case "non_compliant":
    case "critical":
    case "high":
      variant = "destructive";
      dotColor = "bg-red-500";
      label = normalized === "non_compliant" ? "Non-Compliant" : normalized === "critical" ? "Critical" : "High Priority";
      break;
    case "under_review":
    case "medium":
    case "pending":
      variant = "outline";
      dotColor = "bg-amber-500";
      label = normalized === "under_review" ? "Under Review" : normalized === "medium" ? "Medium" : "Pending";
      break;
    case "low":
    case "inactive":
      variant = "secondary";
      dotColor = "bg-slate-400 dark:bg-slate-600";
      label = normalized === "low" ? "Low" : "Inactive";
      break;
    default:
      variant = "default";
      dotColor = "bg-slate-400";
      label = status;
  }

  return (
    <Badge variant={variant} className={cn("gap-1.5 font-medium px-2 py-0.5", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", dotColor)} />
      {label}
    </Badge>
  );
};
