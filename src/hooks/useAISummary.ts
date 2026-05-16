"use client";

import { useQuery } from "@tanstack/react-query";
import type { ClinicalSummary } from "./useClinicalSummary";

export interface AISummaryResponse {
  summary: string;
  recommendations: string[];
  alerts: string[];
  confidence: "high" | "medium" | "low";
  disclaimer: string;
  privacy: string;
  model: string;
  patientName: string;
}

export function useAISummary(patientId: string, enabled: boolean = false) {
  return useQuery<AISummaryResponse>({
    queryKey: ["ai-summary", patientId],
    queryFn: async () => {
      const res = await fetch("/api/ai/clinical-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      if (!res.ok) throw new Error("Erro ao gerar resumo IA");
      return res.json();
    },
    enabled: enabled && !!patientId,
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}
