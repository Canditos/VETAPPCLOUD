"use client";

import { useState } from "react";
import { 
  FlaskConical, 
  ImageIcon, 
  Search, 
  Plus, 
  ChevronRight, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Activity,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

// Mock data based on provided screen
const mockDiagnostics = [
  {
    id: "DX-001",
    patient: "Tobias",
    owner: "João Silva",
    type: "LAB",
    source: "Fuji DX-500",
    status: "COMPLETED",
    createdAt: "2024-05-02T10:30:00",
    summary: "Hemograma Completo"
  },
  {
    id: "DX-002",
    patient: "Luna",
    owner: "Maria Santos",
    type: "IMAGING",
    source: "Examion RX",
    status: "PENDING",
    createdAt: "2024-05-02T11:15:00",
    summary: "RX Tórax Lat/VD"
  },
  {
    id: "DX-003",
    patient: "Max",
    owner: "Ricardo Pereira",
    type: "LAB",
    source: "Fuji DX-500",
    status: "ALERT",
    createdAt: "2024-05-02T09:00:00",
    summary: "Bioquímica (Rim/Fígado)"
  }
];

export default function DiagnosticsPage() {
  const [filter, setFilter] = useState("all");

  const { data: diagnostics, isLoading } = useQuery({
    queryKey: ["diagnostics-feed"],
    queryFn: async () => {
      const res = await fetch("/api/diagnostics");
      if (!res.ok) throw new Error("Erro ao carregar diagnósticos");
      return res.json();
    }
  });

  const filteredData = diagnostics?.filter((dx: any) => 
    filter === "all" ? true : dx.type === filter
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700 p-4 md:p-8">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Centro de Diagnóstico</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Gestão integrada de análises HL7 e imagens DICOM.</p>
        </div>
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
           <Button 
             variant={filter === "all" ? "secondary" : "ghost"} 
             onClick={() => setFilter("all")}
             className="rounded-lg font-bold text-xs"
           >Todos</Button>
           <Button 
             variant={filter === "LAB" ? "secondary" : "ghost"} 
             onClick={() => setFilter("LAB")}
             className="rounded-lg font-bold text-xs gap-2"
           ><FlaskConical size={14}/> Laboratório</Button>
           <Button 
             variant={filter === "IMAGING" ? "secondary" : "ghost"} 
             onClick={() => setFilter("IMAGING")}
             className="rounded-lg font-bold text-xs gap-2"
           ><ImageIcon size={14}/> Imagem</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 g        {/* Main Feed */}
        <div className="lg:col-span-2 space-y-4">
           {isLoading && (
             <>
               <Skeleton className="h-28 w-full rounded-3xl" />
               <Skeleton className="h-28 w-full rounded-3xl opacity-60" />
               <Skeleton className="h-28 w-full rounded-3xl opacity-30" />
             </>
           )}

           {!isLoading && filteredData?.map((dx: any) => (
             <Card key={dx.id} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
               <CardContent className="p-0">
                  <div className="flex items-center p-6 gap-6">
                     <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm
                       ${dx.type === 'LAB' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400'}`}>
                        {dx.type === 'LAB' ? <FlaskConical size={24} /> : <ImageIcon size={24} />}
                     </div>
                     
                     <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                           <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none font-black text-[10px] uppercase">{dx.id.slice(-6)}</Badge>
                           {dx.status === 'COMPLETED' && <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-none text-[10px] font-bold"><CheckCircle2 size={10} className="mr-1"/> Recebido</Badge>}
                           {dx.status === 'PENDING' && <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-none text-[10px] font-bold"><Clock size={10} className="mr-1"/> Em Processamento</Badge>}
                           {dx.status === 'ALERT' && <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-none text-[10px] font-bold"><AlertCircle size={10} className="mr-1"/> Alerta Crítico</Badge>}
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white truncate">{dx.patient} <span className="text-slate-400 font-medium text-sm">({dx.owner})</span></h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-bold tracking-tight">{dx.summary} • <span className="text-blue-600 dark:text-blue-400">{dx.source}</span></p>
                     </div>

                      <div className="flex flex-col items-end gap-2">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase">{new Date(dx.createdAt).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}</p>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            toast.info(`A carregar relatório ${dx.id}...`);
                          }}
                          className="rounded-xl font-bold h-9 gap-2 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm border-slate-200 dark:border-white/10"
                        >
                           Visualizar <ChevronRight size={16} />
                        </Button>
                      </div>
                  </div>
               </CardContent>
             </Card>
           ))}

           {!isLoading && filteredData?.length === 0 && (
             <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-white/5">
                <Activity size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                <p className="font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">Sem registos no período</p>
                <p className="text-sm text-slate-400 mt-2">Nenhum exame detetado nos integradores ativos.</p>
             </div>
           )}
        </div>
    </div>

        {/* Integration Stats / Setup */}
        <div className="space-y-6">
        <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 text-slate-900 dark:text-white rounded-3xl p-6">
           <CardHeader className="p-0 mb-6">
              <CardTitle className="text-lg font-black flex items-center gap-2">
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

           <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50">
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
        </div>
      </div>
    </div>
  );
}
