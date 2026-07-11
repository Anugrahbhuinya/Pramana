// src/components/ui/metric-card.tsx
import * as React from "react";
import { Card, CardContent } from "./card";
import { ArrowUpRight, ArrowDownRight, LucideIcon } from "lucide-react";
import { cn } from "@/shared/utils/cn";

export interface MetricCardProps {
  title: string;
  value: string | number;
  description?: string;
  change?: number; // percentage change, e.g. +4.5
  changeLabel?: string; // e.g. "vs last month"
  icon?: LucideIcon;
  isLoading?: boolean;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  description,
  change,
  changeLabel = "from yesterday",
  icon: Icon,
  isLoading = false,
}) => {
  const isPositive = change !== undefined && change >= 0;

  return (
    <Card className="hover:border-slate-300 dark:hover:border-slate-700/60 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 font-sans tracking-wide">
            {title}
          </p>
          {Icon && (
            <div className="rounded-lg p-2 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300">
              <Icon className="h-4 w-4" />
            </div>
          )}
        </div>

        <div className="mt-2.5">
          {isLoading ? (
            <div className="h-9 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-md" />
          ) : (
            <h3 className="text-3xl font-bold font-display tracking-tight text-slate-900 dark:text-slate-50">
              {value}
            </h3>
          )}
        </div>

        {(change !== undefined || description) && (
          <div className="mt-2.5 flex items-center space-x-1.5 text-xs">
            {change !== undefined && (
              <span
                className={cn(
                  "flex items-center font-semibold rounded px-1.5 py-0.5",
                  isPositive
                    ? "bg-accent-emerald-500/10 text-accent-emerald-600 dark:text-accent-emerald-400"
                    : "bg-red-500/10 text-red-600 dark:text-red-400"
                )}
              >
                {isPositive ? (
                  <ArrowUpRight className="mr-0.5 h-3.5 w-3.5" />
                ) : (
                  <ArrowDownRight className="mr-0.5 h-3.5 w-3.5" />
                )}
                {isPositive ? "+" : ""}
                {change}%
              </span>
            )}
            <span className="text-slate-500 dark:text-slate-400">
              {change !== undefined ? changeLabel : description}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
