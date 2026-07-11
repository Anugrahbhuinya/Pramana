// src/components/ui/loader.tsx
import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "default" | "lg";
}

export const Loader: React.FC<LoaderProps> = ({ className, size = "default", ...props }) => {
  return (
    <div
      className={cn(
        "animate-spin rounded-full border-2 border-slate-300 border-t-slate-900 dark:border-slate-800 dark:border-t-slate-100",
        size === "sm" && "h-4 w-4 border-2",
        size === "default" && "h-8 w-8 border-2",
        size === "lg" && "h-12 w-12 border-3",
        className
      )}
      {...props}
    />
  );
};

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-slate-200/60 dark:bg-slate-800/50",
        className
      )}
      {...props}
    >
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
};

export const ThinkingIndicator: React.FC<{ label?: string }> = ({ label = "Bot thinking" }) => {
  return (
    <div className="flex flex-col items-center justify-center space-y-2 py-4">
      <div className="flex items-center space-x-1.5">
        <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald-500 animate-thinking [animation-delay:-0.3s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald-500 animate-thinking [animation-delay:-0.15s]" />
        <span className="w-2.5 h-2.5 rounded-full bg-accent-emerald-500 animate-thinking" />
      </div>
      {label && <span className="text-xs text-slate-400 font-medium tracking-wide animate-pulse-subtle">{label}</span>}
    </div>
  );
};

export const CardSkeleton: React.FC = () => {
  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
      <Skeleton className="h-4 w-1/3" />
      <div className="space-y-2">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-16" />
      </div>
    </div>
  );
};
