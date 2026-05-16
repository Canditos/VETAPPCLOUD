"use client";

import { useQuery } from "@tanstack/react-query";

export interface ClinicalSummary {
  patientName: string;
  species: string;
  gender: string;
  breed: string;
  ageText: string;
  ownerName: string;
  weight: string | null;
  weightTrend: string | null;
  lastConsultation: {
    date: string;
    daysAgo: number | null;
    veterinarian: string;
    notes: string | null;
  } | null;
  vaccines: {
    total: number;
    expired: string[];
    upcoming: { name: string; daysLeft: number }[];
  };
  deworming: {
    lastType: string | null;
    lastDate: string | null;
    overdue: boolean;
  };
  recommendations: string[];
  safetyAlerts: string[];
  microchip: string | null;
  reproductiveStatus: string | null;
  generatedAt: string;
  dataSource: string;
  privacy: string;
}

export function useClinicalSummary(patientId: string) {
  return useQuery<ClinicalSummary>({
    queryKey: ["clinical-summary", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/summary`);
      if (!res.ok) throw new Error("Erro ao gerar resumo clínico");
      return res.json();
    },
    enabled: !!patientId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}
