"use client";

import { useQuery } from "@tanstack/react-query";
import type { IntegrationHealth } from "@/types";

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
