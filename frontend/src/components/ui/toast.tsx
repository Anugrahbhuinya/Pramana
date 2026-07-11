// src/components/ui/toast.tsx
import * as React from "react";
import { X, CheckCircle2, AlertCircle, Info, AlertTriangle } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  title?: string;
  message: string;
  type?: ToastType;
  duration?: number;
}

interface ToastContextType {
  toast: (item: Omit<ToastItem, "id">) => void;
  dismiss: (id: string) => void;
  toasts: ToastItem[];
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = React.useState<ToastItem[]>([]);

  const toast = React.useCallback(({ title, message, type = "info", duration = 4000 }: Omit<ToastItem, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        dismiss(id);
      }, duration);
    }
  }, []);

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, toasts }}>
      {children}
      {/* Toast Render Portal Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col space-y-2 w-full max-w-sm">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "flex w-full items-start gap-3 rounded-lg border p-4 shadow-lg backdrop-blur-md transition-all duration-300 animate-in slide-in-from-bottom-5",
              t.type === "success" && "border-accent-emerald-500/30 bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100",
              t.type === "error" && "border-red-500/30 bg-red-50/50 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100",
              t.type === "warning" && "border-amber-500/30 bg-amber-50/50 dark:bg-slate-900/90 text-slate-800 dark:text-slate-100",
              t.type === "info" && "border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/90 text-slate-800 dark:text-slate-100"
            )}
          >
            {/* Status Icons */}
            <div className="shrink-0 mt-0.5">
              {t.type === "success" && <CheckCircle2 className="h-5 w-5 text-accent-emerald-500" />}
              {t.type === "error" && <AlertCircle className="h-5 w-5 text-red-500" />}
              {t.type === "warning" && <AlertTriangle className="h-5 w-5 text-amber-500" />}
              {t.type === "info" && <Info className="h-5 w-5 text-slate-500 dark:text-slate-400" />}
            </div>

            {/* Content Text */}
            <div className="flex-1">
              {t.title && <h5 className="font-semibold text-sm leading-none mb-1 font-display">{t.title}</h5>}
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal">{t.message}</p>
            </div>

            {/* Dismiss Button */}
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};
