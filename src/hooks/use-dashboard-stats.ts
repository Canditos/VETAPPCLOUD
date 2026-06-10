import { useQuery } from "@tanstack/react-query";
import { format, startOfDay, endOfDay, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from "date-fns";

export async function fetchDashboardStats() {
  const res = await fetch('/api/dashboard/stats', { cache: 'no-store' });
  if (!res.ok) throw new Error('Falha ao carregar dados do painel');
  return res.json();
}

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats,
    staleTime: 30_000,
  });
}

export function useDashboardRevenueRange(range: '7d' | '30d' | '90d' | 'month' | 'year') {
  return useQuery({
    queryKey: ['dashboard-stats-revenue', range],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/stats?range=${range}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao carregar faturamento');
      return res.json();
    },
    staleTime: 60_000,
  });
}

export function useAppointmentTrend(range: '7d' | '30d' | 'month') {
  return useQuery({
    queryKey: ['dashboard-appointments', range],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/appointments/${range}`, { cache: 'no-store' });
      if (!res.ok) throw new Error('Falha ao carregar tendência de marcações');
      return res.json();
    },
    staleTime: 60_000,
  });
}
