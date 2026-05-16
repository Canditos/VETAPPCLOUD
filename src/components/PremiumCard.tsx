"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface PremiumCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "danger" | "success" | "warning" | "purple";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const variantStyles = {
  default: "bg-white dark:bg-slate-900 ring-slate-100 dark:ring-white/5",
  danger: "bg-rose-50/50 dark:bg-rose-950/20 ring-rose-100 dark:ring-rose-900/30",
  success: "bg-emerald-50/50 dark:bg-emerald-950/20 ring-emerald-100 dark:ring-emerald-900/30",
  warning: "bg-amber-50/50 dark:bg-amber-950/20 ring-amber-100 dark:ring-amber-900/30",
  purple: "bg-purple-50/50 dark:bg-purple-950/20 ring-purple-100 dark:ring-purple-900/30",
};

const paddingStyles = {
  none: "",
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  xl: "p-10",
};

export function PremiumCard({
  children,
  className,
  variant = "default",
  padding = "lg",
}: PremiumCardProps) {
  return (
    <Card
      className={cn(
        "border-none shadow-sm rounded-3xl ring-1 transition-all duration-300",
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </Card>
  );
}
