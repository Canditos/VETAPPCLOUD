"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
  variant?: "default" | "dashed";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  variant = "dashed",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "text-center py-12 rounded-3xl",
        variant === "dashed"
          ? "border-2 border-dashed border-slate-100 dark:border-white/5"
          : "bg-slate-50 dark:bg-white/5",
        className
      )}
    >
      {Icon && (
        <Icon
          size={32}
          className="mx-auto text-slate-200 dark:text-slate-700 mb-3"
          strokeWidth={1.5}
        />
      )}
      <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
        {title}
      </p>
      {description && (
        <p className="text-slate-400 dark:text-slate-500 text-xs mt-1 max-w-xs mx-auto">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
