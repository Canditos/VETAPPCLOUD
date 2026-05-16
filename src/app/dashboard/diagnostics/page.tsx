"use client";

import { useState } from "react";
import { 
  FlaskConical, 
  ImageIcon, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Download,
  Eye,
  FileText,
  TrendingUp,
  AlertTriangle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useRouter } from "next/navigation";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
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

  const filteredData = diagnostics?.filter((dx: any) => 
    filter === "all" ? true : dx.type === filter
  ) ?? [];

  const stats = {
    total: diagnostics?.length ?? 0,
    pending: diagnostics?.filter((d: any) => d.status === "PENDING").length ?? 0,
    alerts: diagnostics?.filter((d: any) => d.status === "ALERT").length ?? 0,
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Centro de Diagnóstico</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestão integrada de análises HL7 e imagens DICOM.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
           <Button 
             variant={filter === "all" ? "default" : "ghost"} 
             onClick={() => setFilter("all")}
             className={filter === "all" ? "rounded-xl font-black text-xs bg-white dark:bg-slate-700 shadow-sm" : "rounded-xl font-bold text-xs text-slate-500"}
           >Todos</Button>
           <Button 
             variant={filter === "LAB" ? "default" : "ghost"} 
             onClick={() => setFilter("LAB")}
             className={filter === "LAB" ? "rounded-xl font-black text-xs bg-white dark:bg-slate-700 shadow-sm" : "rounded-xl font-bold text-xs text-slate-500"}
           ><FlaskConical size={14}/> Laboratório</Button>
           <Button 
             variant={filter === "IMAGING" ? "default" : "ghost"} 
             onClick={() => setFilter("IMAGING")}
             className={filter === "IMAGING" ? "rounded-xl font-black text-xs bg-white dark:bg-slate-700 shadow-sm" : "rounded-xl font-bold text-xs text-slate-500"}
           ><ImageIcon size={14}/> Imagem</Button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Total Exames", value: stats.total, icon: Activity, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
          { label: "Pendentes", value: stats.pending, icon: Clock, color: stats.pending > 0 ? "text-amber-600" : "text-slate-400", bg: stats.pending > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-slate-50 dark:bg-slate-800/20" },
          { label: "Alertas", value: stats.alerts, icon: AlertTriangle, color: stats.alerts > 0 ? "text-rose-600" : "text-slate-400", bg: stats.alerts > 0 ? "bg-rose-50 dark:bg-rose-900/20" : "bg-slate-50 dark:bg-slate-800/20" },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
            <CardContent className="p-6 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${stat.bg} ${stat.color}`}>
                <stat.icon size={22} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stat.label}</p>
                {isLoading ? <Skeleton className="h-7 w-12 mt-1" /> : <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
           {isLoading && (
             <>
               <Skeleton className="h-28 w-full rounded-[2rem]" />
               <Skeleton className="h-28 w-full rounded-[2rem] opacity-60" />
               <Skeleton className="h-28 w-full rounded-[2rem] opacity-30" />
             </>
           )}

           {!isLoading && filteredData.length === 0 && (
             <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-white/5">
                <Activity size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                <p className="font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Sem registos no período</p>
                <p className="text-sm text-slate-400 mt-2">Nenhum exame detetado nos integradores ativos.</p>
             </div>
           )}

           {!isLoading && filteredData.map((dx: any) => {
             const status = STATUS_CONFIG[dx.status] ?? STATUS_CONFIG.PENDING;
             const StatusIcon = status.icon;
             return (
               <Card key={dx.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden rounded-[2rem] bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
                 <CardContent className="p-0">
                    <div className="flex items-center p-6 gap-6">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                         ${dx.type === 'LAB' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                          {dx.type === 'LAB' ? <FlaskConical size={24} /> : <ImageIcon size={24} />}
                       </div>
                       
                       <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                             <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none font-black text-[10px] uppercase">{dx.id?.slice(-6) ?? "—"}</Badge>
                             <Badge className={`${status.bg} ${status.color} border-none text-[10px] font-bold`}>
                               <StatusIcon size={10} className="mr-1"/>{status.label}
                             </Badge>
                          </div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{dx.patientName ?? dx.patient ?? "—"} <span className="text-slate-400 font-medium text-sm">({dx.ownerName ?? dx.owner ?? "—" })</span></h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 font-bold tracking-tight">{dx.summary ?? dx.testName ?? "—"} • <span className="text-blue-600 dark:text-blue-400">{dx.source ?? "—"}</span></p>
                       </div>

                        <div className="flex flex-col items-end gap-2">
                          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{dx.createdAt ? formatDistanceToNow(new Date(dx.createdAt), { addSuffix: true, locale: pt }) : "—"}</p>
                          <Button 
                            variant="outline" 
                            onClick={() => {
                              if (dx.patientId) router.push(`/dashboard/patients/${dx.patientId}?tab=exams`);
                              else toast.info(`A carregar relatório ${dx.id}...`);
                            }}
                            className="rounded-xl font-bold h-9 gap-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm border-slate-200 dark:border-white/10"
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
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 rounded-[2rem] p-6">
             <CardHeader className="p-0 mb-6">
                <CardTitle className="text-lg font-black flex items-center gap-2 text-slate-900 dark:text-white">
                   <Activity size={20} className="text-blue-600" />
                   Status Integrador
                </CardTitle>
             </CardHeader>
             <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Fuji DX HL7 Bridge</p>
                   </div>
                   <Badge className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-none">ONLINE</Badge>
                </div>
                <div className="flex justify-between items-center bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-100 dark:border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">PACS Examion Cloud</p>
                   </div>
                   <Badge className="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-none">CONNECTED</Badge>
                </div>
             </div>
          </Card>

          {/* Quick Actions */}
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
             <CardHeader className="bg-slate-50/50 dark:bg-white/5">
                <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Ações Rápidas</CardTitle>
             </CardHeader>
             <CardContent className="p-4 space-y-2">
                <Button 
                  variant="ghost" 
                  onClick={() => toast.success("Pedido de Laboratório iniciado.")}
                  className="w-full justify-start gap-3 font-bold h-12 rounded-xl hover:bg-purple-50 hover:text-purple-600 dark:hover:bg-purple-900/20"
                >
                   <FlaskConical size={18} /> Novo Pedido Laboratório
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => toast.success("Solicitação de RX Digital aberta.")}
                  className="w-full justify-start gap-3 font-bold h-12 rounded-xl hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                >
                   <ImageIcon size={18} /> Solicitar RX Digital
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => toast.info("A preparar lote para exportação...")}
                  className="w-full justify-start gap-3 font-bold h-12 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5"
                >
                   <Download size={18} /> Exportar Lote de Resultados
                </Button>
             </CardContent>
          </Card>

          {/* Trending */}
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6">
             <div className="flex items-center gap-3 mb-4">
                <TrendingUp size={20} />
                <h3 className="font-black text-sm uppercase tracking-widest">Resumo do Dia</h3>
             </div>
             <div className="space-y-3">
                <div className="flex justify-between items-center">
                   <span className="text-blue-100 text-xs font-bold">Exames Realizados</span>
                   <span className="font-black text-lg">{stats.total}</span>
                </div>
                <div className="flex justify-between items-center">
                   <span className="text-blue-100 text-xs font-bold">Com Alertas</span>
                   <span className="font-black text-lg text-amber-300">{stats.alerts}</span>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
