// src/components/ui/chart-card.tsx
import * as React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "./card";
import { cn } from "@/shared/utils/cn";

export interface ChartCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  headerAction?: React.ReactNode;
}

export const ChartCard: React.FC<ChartCardProps> = ({
  title,
  description,
  headerAction,
  className,
  children,
  ...props
}) => {
  return (
    <Card className={cn("flex flex-col h-full", className)} {...props}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-base font-semibold">{title}</CardTitle>
          {description && <CardDescription className="text-xs">{description}</CardDescription>}
        </div>
        {headerAction && <div className="flex items-center space-x-2">{headerAction}</div>}
      </CardHeader>
      <CardContent className="flex-1 pb-4 min-h-[240px] relative">
        {children}
      </CardContent>
    </Card>
  );
};
