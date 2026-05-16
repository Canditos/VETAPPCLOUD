"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatItem {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  color?: "blue" | "emerald" | "rose" | "amber" | "purple" | "slate";
  subtext?: string;
}

interface StatsGridProps {
  items: StatItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}

const colorStyles = {
  blue: "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400",
  emerald: "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400",
  rose: "bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400",
  amber: "bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400",
  purple: "bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400",
  slate: "bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400",
};

export function StatsGrid({ items, columns = 3, className }: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={cn("grid gap-4", gridCols[columns], className)}>
      {items.map((item, i) => {
        const Icon = item.icon;
        return (
          <div
            key={i}
            className="bg-white dark:bg-slate-900 rounded-2xl p-5 ring-1 ring-slate-100 dark:ring-white/5 shadow-sm flex items-center gap-4"
          >
            {Icon && (
              <div
                className={cn(
                  "w-11 h-11 rounded-xl flex items-center justify-center shrink-0",
                  colorStyles[item.color || "slate"]
                )}
              >
                <Icon size={20} strokeWidth={2} />
              </div>
            )}
            <div>
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{item.label}</p>
              <p className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{item.value}</p>
              {item.subtext && (
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">{item.subtext}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
