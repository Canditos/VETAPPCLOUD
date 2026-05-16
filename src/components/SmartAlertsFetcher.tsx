"use client";

import { useQuery } from "@tanstack/react-query";
import { SmartAlerts } from "./SmartAlerts";

interface SmartAlertsFetcherProps {
  patientId: string;
  className?: string;
}

export function SmartAlertsFetcher({ patientId, className }: SmartAlertsFetcherProps) {
  const { data: alerts } = useQuery({
    queryKey: ["clinical-alerts", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/alerts`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!patientId,
  });

  return <SmartAlerts alerts={alerts || []} className={className} />;
}
