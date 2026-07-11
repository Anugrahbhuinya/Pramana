// src/components/ui/error-state.tsx
import * as React from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = "Failed to load resource",
  message,
  onRetry,
}) => {
  return (
    <div className="flex min-h-[300px] flex-col items-center justify-center rounded-xl border border-red-100 dark:border-red-950/20 bg-red-50/20 dark:bg-red-950/5 p-8 text-center animate-fade-in-up">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30 text-red-600 dark:text-red-400">
        <AlertCircle className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold font-display text-slate-900 dark:text-slate-50">
        {title}
      </h3>
      <p className="mt-2 text-xs text-red-600 dark:text-red-400/80 max-w-md mx-auto leading-relaxed">
        {message}
      </p>
      {onRetry && (
        <div className="mt-6">
          <Button variant="outline" size="sm" onClick={onRetry} className="border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-950/20">
            <RefreshCw className="mr-2 h-3.5 w-3.5" />
            Try again
          </Button>
        </div>
      )}
    </div>
  );
};
