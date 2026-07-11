// src/components/ui/section-header.tsx
import * as React from "react";
import { cn } from "@/shared/utils/cn";

export interface SectionHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  description,
  className,
  ...props
}) => {
  return (
    <div className={cn("space-y-1 pb-2", className)} {...props}>
      <h2 className="text-lg font-semibold font-display text-slate-900 dark:text-slate-50">
        {title}
      </h2>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {description}
        </p>
      )}
    </div>
  );
};
