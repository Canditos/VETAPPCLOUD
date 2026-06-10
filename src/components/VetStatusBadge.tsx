"use client";

import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import {
  Syringe,
  Stethoscope,
  Bed,
  ClipboardCheck,
  Pill,
  FlaskConical,
  X,
} from "lucide-react";
import React from "react";

const statusBadgeVariants = cva(
  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide",
  {
    variants: {
      status: {
        scheduled: "border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300",
        completed: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300",
        cancelled: "border-red-200 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300",
        in_progress: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300",
        pending: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-300",
        critical: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/40 dark:bg-rose-900/20 dark:text-rose-300",
        stable: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300",
        vaccinated: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/40 dark:bg-indigo-900/20 dark:text-indigo-300",
        prescribed: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/40 dark:bg-blue-900/20 dark:text-blue-300",
        done: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 dark:text-emerald-300",
      },
    },
    defaultVariants: {
      status: "scheduled",
    },
  }
);

type Status = VariantProps<typeof statusBadgeVariants>["status"];

const iconByStatus: Record<string, React.ReactNode> = {
  scheduled: <Stethoscope size={12} />,
  completed: <ClipboardCheck size={12} />,
  cancelled: <X size={12} />,
  in_progress: <Stethoscope size={12} />,
  pending: <Pill size={12} />,
  critical: <FlaskConical size={12} />,
  stable: <ClipboardCheck size={12} />,
  vaccinated: <Syringe size={12} />,
  prescribed: <Pill size={12} />,
  done: <ClipboardCheck size={12} />,
};

export interface VetStatusBadgeProps {
  status?: Status;
  label?: string;
  className?: string;
}

export const VetStatusBadge = ({ status = "scheduled", label, className }: VetStatusBadgeProps) => {
  const mapped = (label || status || "scheduled").toLowerCase();
  const safeStatus = status || "scheduled";
  const icon = iconByStatus[safeStatus] || <Stethoscope size={12} />;
  return (
    <span className={cn(statusBadgeVariants({ status: safeStatus }), className)}>
      <span className="shrink-0">{icon}</span>
      <span>{label || safeStatus.replace(/_/g, " ")}</span>
    </span>
  );
};
