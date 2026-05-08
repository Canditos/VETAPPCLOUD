"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Faturação &amp; Finanças
          </h1>
          <p className="text-slate-500 font-medium">
            Controlo legal via Jasmin ERP e histórico de vendas.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl gap-2">
            <Download size={16} /> Exportar SAF-T
          </Button>
          <Button
            className="rounded-xl gap-2 bg-blue-600"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
            Sincronizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm transition-all duration-300 group overflow-hidden bg-white dark:bg-card ring-1 ring-slate-100 dark:ring-white/10 rounded-[2rem]">
          <CardContent className="p-7">
            <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <TrendingUp size={26} strokeWidth={2.5} />
              </div>
              <Badge variant="outline" className="text-[10px] font-black border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1">
                Hoje
              </Badge>
            </div>
            <div className="mt-6">
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Faturado Hoje</p>
              {isLoading ? (
                <Skeleton className="h-10 w-28 mt-2" />
              ) : (
                <p className="text-4xl font-black text-slate-900 dark:text-slate-100 mt-2 tracking-tighter">
                  {formatEur(stats?.todayTotal ?? 0)}
                </p>
              )}
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                {stats?.todayCount ?? 0} documentos emitidos
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm transition-all duration-300 group overflow-hidden bg-white dark:bg-card ring-1 ring-slate-100 dark:ring-white/10 rounded-[2rem]">
          <CardContent className="p-7">
            <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Clock size={26} strokeWidth={2.5} />
              </div>
              <Badge variant="outline" className="text-[10px] font-black border-slate-100 dark:border-white/10 text-amber-600/50 uppercase tracking-widest px-2 py-1 animate-pulse">
                Aguardando
              </Badge>
            </div>
            <div className="mt-6">
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Pendente Sinc.</p>
              {isLoading ? (
                <Skeleton className="h-10 w-28 mt-2" />
              ) : (
                <p className="text-4xl font-black text-amber-600 mt-2 tracking-tighter">
                  {formatEur(stats?.pendingTotal ?? 0)}
                </p>
              )}
              <p className="text-[10px] font-bold text-amber-600/80 mt-1 uppercase tracking-tight">
                {stats?.pendingCount ?? 0} rascunhos por enviar
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm transition-all duration-300 group overflow-hidden bg-white dark:bg-card ring-1 ring-slate-100 dark:ring-white/10 rounded-[2rem]">
          <CardContent className="p-7">
            <div className="flex justify-between items-start">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-500/10 text-slate-600 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500">
                <Receipt size={26} strokeWidth={2.5} />
              </div>
              <Badge variant="outline" className="text-[10px] font-black border-slate-100 dark:border-white/10 text-slate-400 uppercase tracking-widest px-2 py-1">
                Global
              </Badge>
            </div>
            <div className="mt-6">
              <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Total Documentos</p>
              {isLoading ? (
                <Skeleton className="h-10 w-28 mt-2" />
              ) : (
                <p className="text-4xl font-black text-slate-900 dark:text-slate-100 mt-2 tracking-tighter">
                  {invoices.length}
                </p>
              )}
              <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-tight">
                documentos no sistema
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Toolbar with Backdrop Blur */}
      <Card className="border-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/40 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
        <CardContent className="p-4 md:p-6">
          <div className="relative group">
            <FileSearch className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
            <Input
              placeholder="Procurar por fatura, cliente ou número externo..."
              className="h-16 pl-16 pr-6 rounded-3xl border-none bg-slate-100/50 dark:bg-slate-800/50 focus-visible:ring-2 focus-visible:ring-blue-500/50 font-semibold text-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Invoices Content - Premium Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-[2.5rem] bg-white dark:bg-slate-900 animate-pulse ring-1 ring-slate-100 dark:ring-slate-800" />
          ))
        ) : isError ? (
          <div className="col-span-full py-20 text-center space-y-4 bg-white dark:bg-slate-900 rounded-[2.5rem] ring-1 ring-slate-100 dark:ring-slate-800">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-900/20 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Erro ao carregar faturas</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="rounded-xl">Tentar novamente</Button>
          </div>
        ) : invoices.length === 0 ? (
          <div className="col-span-full py-32 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
             <Receipt size={64} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
             <h3 className="text-xl font-black text-slate-900 dark:text-white">Sem faturas</h3>
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
                className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] ring-1 ring-slate-100 dark:ring-slate-800 hover:ring-blue-500/30 dark:hover:ring-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 flex flex-col gap-6"
              >
                {/* Invoice Header */}
                <div className="flex justify-between items-start">
                  <div className="flex gap-4 items-center">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                      <Receipt size={28} strokeWidth={2} />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-black text-xl text-slate-900 dark:text-white truncate tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                        {inv.externalId ?? `FT ${inv.id.substring(0, 8).toUpperCase()}`}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-2">
                        {date.toLocaleDateString("pt-PT", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                      {formatEur(inv.total)}
                    </p>
                    <div className="mt-2">
                      {isSynced ? (
                        <Badge className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5">
                          Sincronizado
                        </Badge>
                      ) : (
                        <Badge className="bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 animate-pulse">
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
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">
                        {ownerName}
                      </p>
                      {patientName && (
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
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
                        <div key={i} className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-slate-400">
                          {item.description[0]}
                        </div>
                      ))}
                      {inv.items?.length > 3 && (
                        <div className="w-6 h-6 rounded-full bg-blue-50 dark:bg-blue-900 border-2 border-white dark:border-slate-900 flex items-center justify-center text-[8px] font-black text-blue-600">
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
