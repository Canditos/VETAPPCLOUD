"use client";

import { cn } from "@/lib/utils";

export interface PatientAvatarProps {
  name: string;
  className?: string;
}

export const PatientAvatar = ({ name, className }: PatientAvatarProps) => {
  const colors = [
    "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
    "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400",
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
    "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400",
    "bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400",
  ];
  const index = (name?.[0]?.toLowerCase()?.charCodeAt(0) || 0) % colors.length;

  return (
    <div
      className={cn(
        "inline-flex h-10 w-10 items-center justify-center rounded-xl text-base font-bold shadow-sm transition-all duration-200",
        colors[index],
        className
      )}
      aria-hidden="true"
    >
      {name?.[0]?.toUpperCase()}
    </div>
  );
};
