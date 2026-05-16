"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  badge?: string;
  badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  badge,
  badgeVariant = "default",
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6", className)}>
      <div>
        {badge && (
          <Badge
            variant={badgeVariant}
            className="mb-3 font-semibold text-[10px] uppercase tracking-wider px-3 py-1 rounded-lg"
          >
            {badge}
          </Badge>
        )}
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-slate-500 dark:text-slate-400 font-medium mt-1.5 text-sm max-w-xl">
            {description}
          </p>
        )}
      </div>
      {children && <div className="flex items-center gap-3">{children}</div>}
    </div>
  );
}
