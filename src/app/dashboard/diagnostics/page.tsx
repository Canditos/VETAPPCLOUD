"use client";

import { useState } from "react";
import {
  FlaskConical,
  ImageIcon,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Download,
  Eye,
  TrendingUp,
  AlertTriangle,
  Radio,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { PremiumCard } from "@/components/PremiumCard";
import { PageHeader } from "@/components/PageHeader";
import { StatsGrid } from "@/components/StatsGrid";
import { EmptyState } from "@/components/EmptyState";
import { useIntegrationHealth } from "@/hooks/useIntegrationHealth";
import { isFeatureEnabled } from "@/lib/features";
import type { DiagnosticResult } from "@/types";
import type { LucideIcon } from "lucide-react";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: LucideIcon }> = {
  COMPLETED: { label: "Recebido", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/30", icon: CheckCircle2 },
  PENDING: { label: "Em Processamento", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/30", icon: Clock },
  ALERT: { label: "Alerta Crítico", color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-900/30", icon: AlertCircle },
};

export default function DiagnosticsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState("all");

  const { data: diagnostics, isLoading } = useQuery({
    queryKey: ["diagnostics-feed"],
    queryFn: async () => {
      const res = await fetch("/api/diagnostics");
      if (!res.ok) throw new Error("Erro ao carregar diagnósticos");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const filteredData = diagnostics?.filter((dx: DiagnosticResult) =>
    filter === "all" ? true : dx.type === filter
  ) ?? [];

  const { data: health } = useIntegrationHealth();

  const stats = {
    total: diagnostics?.length ?? 0,
    pending: diagnostics?.filter((d: DiagnosticResult) => d.status === "PENDING").length ?? 0,
    alerts: diagnostics?.filter((d: DiagnosticResult) => d.status === "ALERT").length ?? 0,
  };

  const filterButtons = [
    { key: "all", label: "Todos", icon: null },
    { key: "LAB", label: "Laboratório", icon: FlaskConical },
    { key: "IMAGING", label: "Imagem", icon: ImageIcon },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-700 p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <PageHeader
        title="Centro de Diagnóstico"
        description="Gestão integrada de análises HL7 e imagens DICOM."
      >
        <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
          {filterButtons.map((btn) => (
            <Button
              key={btn.key}
              variant={filter === btn.key ? "default" : "ghost"}
              onClick={() => setFilter(btn.key)}
              className={
                filter === btn.key
                  ? "rounded-lg font-semibold text-xs bg-white dark:bg-slate-700 shadow-sm"
                  : "rounded-lg font-medium text-xs text-slate-500"
              }
            >
              {btn.icon && <btn.icon size={14} className="mr-1.5" />}
              {btn.label}
            </Button>
          ))}
        </div>
      </PageHeader>

      {/* Stats */}
      <StatsGrid
        items={[
          { label: "Total Exames", value: stats.total, icon: Activity, color: "blue" },
          {
            label: "Pendentes",
            value: stats.pending,
            icon: Clock,
            color: stats.pending > 0 ? "amber" : "slate",
          },
          {
            label: "Alertas",
            value: stats.alerts,
            icon: AlertTriangle,
            color: stats.alerts > 0 ? "rose" : "slate",
          },
        ]}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
          {isLoading && (
            <>
              <Skeleton className="h-28 w-full rounded-3xl" />
              <Skeleton className="h-28 w-full rounded-3xl opacity-60" />
              <Skeleton className="h-28 w-full rounded-3xl opacity-30" />
            </>
          )}

          {!isLoading && filteredData.length === 0 && (
            <EmptyState
              icon={Activity}
              title="Sem registos no período"
              description="Nenhum exame detetado nos integradores ativos."
            />
          )}

          {!isLoading &&
            filteredData.map((dx: DiagnosticResult) => {
              const status = STATUS_CONFIG[dx.status] ?? STATUS_CONFIG.PENDING;
              const StatusIcon = status.icon;
              return (
                <Card
                  key={dx.id}
                  className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5"
                >
                  <CardContent className="p-0">
                    <div className="flex items-center p-6 gap-4">
                      <div
                        className={`w-14 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${
                          dx.type === "LAB"
                            ? "bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
                            : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400"
                        }`}
                      >
                        {dx.type === "LAB" ? <FlaskConical size={24} /> : <ImageIcon size={24} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="secondary"
                            className="font-medium text-[10px]"
                          >
                            {dx.id?.slice(-6) ?? "—"}
                          </Badge>
                          <Badge className={`${status.bg} ${status.color} border-none text-[10px] font-medium`}>
                            <StatusIcon size={10} className="mr-1" />
                            {status.label}
                          </Badge>
                        </div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                           {dx.patientName ?? "—"}{" "}
                           <span className="text-slate-400 font-normal text-sm">
                             ({dx.ownerName ?? "—"})
                          </span>
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                          {dx.summary ?? dx.testName ?? "—"} ·{" "}
                          <span className="text-blue-600 dark:text-blue-400">
                            {dx.source ?? "—"}
                          </span>
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 uppercase">
                          {dx.createdAt
                            ? formatDistanceToNow(new Date(dx.createdAt), { addSuffix: true, locale: pt })
                            : "—"}
                        </p>
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (dx.patientId) router.push(`/dashboard/patients/${dx.patientId}?tab=exams`);
                            else toast.info(`A carregar relatório ${dx.id}...`);
                          }}
                          className="rounded-xl font-semibold h-9 gap-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm border-slate-200 dark:border-white/10"
                        >
                          <Eye size={14} /> Visualizar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Integration Status */}
          <PremiumCard>
            <h3 className="text-base font-bold flex items-center gap-2 text-slate-900 dark:text-white mb-6">
              <Activity size={20} className="text-blue-600" />
              Status Integrador
            </h3>
             <div className="space-y-3">
               <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                 <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${health?.hl7?.status === "online" ? "bg-emerald-500" : "bg-slate-400"}`} />
                   <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">Fuji DX HL7 Bridge</p>
                 </div>
                 <Badge className={
                   health?.hl7?.status === "online"
                     ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-none font-medium"
                     : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none font-medium"
                 }>
                   {health?.hl7?.label || "Offline"}
                 </Badge>
               </div>
               <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                 <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${health?.dicom?.status === "online" ? "bg-emerald-500" : "bg-slate-400"}`} />
                   <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">PACS Examion Cloud</p>
                 </div>
                 <Badge className={
                   health?.dicom?.status === "online"
                     ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-none font-medium"
                     : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none font-medium"
                 }>
                   {health?.dicom?.label || "Offline"}
                 </Badge>
               </div>
               <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                 <div className="flex items-center gap-3">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${health?.gdt?.status === "online" ? "bg-emerald-500" : "bg-amber-500"}`} />
                   <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">GDT Examion RX</p>
                 </div>
                 <Badge className={
                   health?.gdt?.status === "online"
                     ? "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-none font-medium"
                     : "bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-none font-medium"
                 }>
                   {health?.gdt?.label || "Offline"}
                 </Badge>
               </div>
             </div>
          </PremiumCard>

          {/* Quick Actions */}
          <PremiumCard padding="none">
            <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Ações Rápidas
              </h3>
            </div>
            <div className="p-4 space-y-1">
              <Button
                variant="ghost"
                onClick={() => window.open("/api/diagnostics/export", "_blank")}
                className="w-full justify-start gap-3 font-medium h-11 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5"
              >
                <Download size={18} /> Exportar Lote de Resultados
              </Button>
            </div>
          </PremiumCard>

          {/* Trending */}
          <PremiumCard variant="purple" className="!bg-gradient-to-br from-blue-600 to-blue-800 text-white">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp size={20} />
              <h3 className="font-bold text-sm uppercase tracking-wider">Resumo do Dia</h3>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-blue-100 text-xs font-medium">Exames Realizados</span>
                <span className="font-bold text-lg">{stats.total}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-100 text-xs font-medium">Com Alertas</span>
                <span className="font-bold text-lg text-amber-300">{stats.alerts}</span>
              </div>
            </div>
          </PremiumCard>
        </div>
      </div>
    </div>
  );
}
