// src/components/ui/page-header.tsx
import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  actions,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 border-b border-slate-100 dark:border-slate-800/60 pb-6 md:flex-row md:items-center md:justify-between md:gap-8",
        className
      )}
      {...props}
    >
      <div className="space-y-1.5">
        <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-50 md:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2.5 md:ml-auto">
          {actions}
        </div>
      )}
    </div>
  );
};
