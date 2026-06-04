"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import {
  Receipt,
  ExternalLink,
  CheckCircle2,
  Clock,
  Download,
  FileSearch,
  RefreshCw,
  AlertCircle,
  ChevronRight,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT");
}

function formatEur(value: number | string) {
  return `€${Number(value).toFixed(2)}`;
}

export default function BillingPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["billing", search],
    queryFn: async () => {
      const res = await fetch(`/api/billing?q=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Falha ao carregar faturas");
      return res.json();
    },
  });

  const invoices = data?.invoices ?? [];
  const stats = data?.stats;

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 p-4 md:p-6 animate-premium">
      {/* Painel de Gestão Financeira Unificado */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200/60 dark:ring-white/5 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">Faturação & Finanças</h1>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] tracking-wider">
               <Receipt size={14} className="text-blue-600" />
               <span>Controlo Legal via Vendus ERP & Vendas Locais</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              className="h-10 rounded-xl px-4 gap-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold text-[10px] tracking-wider hover:bg-white transition-all active:scale-95"
              onClick={() => {
                const now = new Date();
                const month = now.getMonth() + 1;
                const year = now.getFullYear();
                window.open(`/api/integrations/vendus/saft?year=${year}&month=${month}`, "_blank");
              }}
            >
              <Download size={16} />
              <span>Exportar SAF-T</span>
            </Button>
            
            <Button
              className="h-10 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 shadow-sm transition-all active:scale-95"
              onClick={() => refetch()}
              disabled={isRefetching}
            >
              <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
              <span className="text-[10px] tracking-wider">Sincronizar</span>
            </Button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { 
              label: "Faturado Hoje", 
              value: formatEur(stats?.todayTotal ?? 0), 
              sub: `${stats?.todayCount ?? 0} documentos`,
              icon: TrendingUp, 
              color: "text-blue-600", 
              bg: "bg-blue-50/50" 
            },
            { 
              label: "Pendente Sinc.", 
              value: formatEur(stats?.pendingTotal ?? 0), 
              sub: `${stats?.pendingCount ?? 0} rascunhos`,
              icon: Clock, 
              color: stats?.pendingCount > 0 ? "text-amber-600" : "text-slate-400", 
              bg: stats?.pendingCount > 0 ? "bg-amber-50/50" : "bg-slate-50/50" 
            },
            { 
              label: "Total de Documentos", 
              value: invoices.length, 
              sub: "Histórico completo",
              icon: Receipt, 
              color: "text-slate-900 dark:text-white", 
              bg: "bg-slate-900/5 dark:bg-white/5" 
            }
          ].map((stat, i) => (
            <Card key={i} className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
              <CardHeader className="flex flex-row items-center gap-4 p-5">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/5", stat.bg, stat.color)}>
                  <stat.icon size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[8px] font-bold text-slate-400 tracking-wider leading-tight">{stat.label}</p>
                  {isLoading ? (
                    <Skeleton className="h-6 w-20 mt-1" />
                  ) : (
                    <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
                  )}
                  <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 mt-0.5">{stat.sub}</p>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>

        {/* Search Bottom Row */}
        <div className="pt-6 border-t border-slate-100 dark:border-slate-800/50">
          <div className="relative group">
            <FileSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={18} />
            <Input
              placeholder="Pesquisar por fatura, cliente ou número externo..."
              className="h-14 pl-12 pr-6 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500/50 font-bold text-sm text-slate-700 dark:text-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Invoices Content - Premium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-white dark:bg-slate-900 animate-pulse ring-1 ring-slate-100 dark:ring-slate-800" />
          ))
        ) : isError ? (
          <div className="col-span-full py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-800">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <p className="text-slate-500 font-bold tracking-wider text-xs">Erro ao carregar faturas</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">Tentar novamente</Button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-2xl border-2 border-dashed border-slate-100 dark:border-slate-800">
             <Receipt size={64} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
             <h3 className="text-xl font-bold text-slate-900 dark:text-white">Sem faturas</h3>
             <p className="text-slate-500 font-medium">Não foram encontrados documentos para esta pesquisa.</p>
          </div>
        ) : (
          invoices.map((inv: any) => {
            const ownerName = inv.owner?.name ?? inv.consultation?.patient?.owner?.name ?? "Consumidor Final";
            const patientName = inv.consultation?.patient?.name;
            const isSynced = !!inv.externalId || inv.status === "PAID";
            const date = new Date(inv.createdAt);

            return (
              <div 
                key={inv.id} 
                className="group relative bg-white dark:bg-slate-900 p-6 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-800 hover:ring-blue-500/30 dark:hover:ring-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 flex flex-col gap-6"
              >
                {/* Invoice Header */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                      <Receipt size={28} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-bold text-xl text-slate-900 dark:text-white truncate tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                        {inv.externalId ?? `FT ${inv.id.substring(0, 8).toUpperCase()}`}
                      </h3>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-600 tracking-wider mt-2">
                        {date.toLocaleDateString("pt-PT", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-slate-900 dark:text-white tracking-tighter leading-none">
                      {formatEur(inv.total)}
                    </p>
                    <div className="mt-2">
                      {isSynced ? (
                        <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-none font-bold text-[8px] tracking-wider px-2 py-0.5">
                          Sincronizado
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-none font-bold text-[8px] tracking-wider px-2 py-0.5 animate-pulse">
                          Rascunho
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Client Info Section */}
                <div className="p-4 bg-slate-50/50 dark:bg-slate-800/30 rounded-2xl border border-slate-100/50 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center text-slate-400 ring-1 ring-slate-100 dark:ring-slate-800">
                      <Receipt size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 dark:text-slate-200 truncate">
                        {ownerName}
                      </p>
                      {patientName && (
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                          Paciente: {patientName}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="flex items-center justify-between mt-auto">
                   <div className="flex -space-x-2">
                      {inv.items?.slice(0, 3).map((item: any, i: number) => (
                        <div key={i} className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-slate-400">
                          {item.description[0]}
                        </div>
                      ))}
                      {inv.items?.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-bold text-blue-600">
                          +{inv.items.length - 3}
                        </div>
                      )}
                   </div>

                   <div className="flex gap-2">
                      {inv.pdfUrl && (
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all">
                          <Download size={18} />
                        </Button>
                      )}
                      {inv.externalId && (
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        >
                          <ExternalLink size={18} />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all"
                      >
                        <ChevronRight size={20} strokeWidth={3} />
                      </Button>
                   </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
