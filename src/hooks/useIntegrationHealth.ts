"use client";

import { useQuery } from "@tanstack/react-query";

export interface IntegrationHealth {
  vendus: { status: string; label: string };
  jasmin: { status: string; label: string };
  inventorySync: { status: string; label: string };
  hl7: { status: string; label: string };
  dicom: { status: string; label: string };
  checkedAt: string;
}

export function useIntegrationHealth() {
  return useQuery<IntegrationHealth>({
    queryKey: ["integration-health"],
    queryFn: async () => {
      const res = await fetch("/api/health/integrations");
      if (!res.ok) throw new Error("Falha ao verificar integrações");
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });
}
