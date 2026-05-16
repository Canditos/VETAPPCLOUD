"use client";

import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface AlertItem {
  level: "critical" | "warning" | "info";
  message: string;
  action?: string | null;
}

interface SmartAlertsProps {
  alerts: AlertItem[];
  className?: string;
}

const levelConfig = {
  critical: {
    icon: XCircle,
    colors: "bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/30 text-rose-700 dark:text-rose-400",
    iconColor: "text-rose-500",
  },
  warning: {
    icon: AlertTriangle,
    colors: "bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400",
    iconColor: "text-amber-500",
  },
  info: {
    icon: Info,
    colors: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/30 text-blue-700 dark:text-blue-400",
    iconColor: "text-blue-500",
  },
};

export function SmartAlerts({ alerts, className }: SmartAlertsProps) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className={cn("space-y-2", className)}>
      {alerts.map((alert, index) => {
        const config = levelConfig[alert.level];
        const Icon = config.icon;
        return (
          <div
            key={index}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl border text-sm",
              config.colors
            )}
          >
            <Icon size={18} className={cn("shrink-0", config.iconColor)} />
            <div className="flex-1">
              <p className="font-medium">{alert.message}</p>
            </div>
            {alert.action && (
              <button className="text-xs font-semibold underline opacity-80 hover:opacity-100">
                {alert.action}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
