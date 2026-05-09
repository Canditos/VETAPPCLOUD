"use client";

import { 
  Stethoscope, 
  FlaskConical, 
  Image as ImageIcon, 
  FileText, 
  ChevronDown, 
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Receipt,
  Syringe,
  Pill,
  Activity
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface HistoryEventProps {
  event: any;
}

function HistoryEvent({ event }: HistoryEventProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = () => {
    switch (event.type) {
      case "CONSULTATION": return <Stethoscope className="text-blue-600 dark:text-blue-400" size={16} strokeWidth={2.5} />;
      case "LAB_RESULT": return <FlaskConical className="text-purple-600 dark:text-purple-400" size={16} strokeWidth={2.5} />;
      case "IMAGING": return <ImageIcon className="text-emerald-600 dark:text-emerald-400" size={16} strokeWidth={2.5} />;
      case "VACCINE": return <Syringe className="text-amber-600 dark:text-amber-400" size={16} strokeWidth={2.5} />;
      case "PRESCRIPTION": return <Pill className="text-rose-600 dark:text-rose-400" size={16} strokeWidth={2.5} />;
      case "VITALS": return <Activity className="text-indigo-600 dark:text-indigo-400" size={16} strokeWidth={2.5} />;
      default: return <FileText className="text-slate-600 dark:text-slate-400" size={16} strokeWidth={2.5} />;
    }
  };

  const getStatusBadge = () => {
    if (event.status === "COMPLETED") return <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-none text-[9px] font-black uppercase">Concluído</Badge>;
    if (event.status === "SCHEDULED") return <Badge className="bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-none text-[9px] font-black uppercase">Agendado</Badge>;
    return <Badge variant="outline" className="text-[9px] font-black uppercase border-slate-200 dark:border-white/10">{event.status}</Badge>;
  };

  return (
    <div className="relative pl-10 pb-6 last:pb-0 group">
      {/* Timeline Line with Gradient */}
      <div className="absolute left-[15px] top-2 bottom-0 w-[2px] bg-linear-to-b from-slate-200 via-slate-100 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent group-last:hidden"></div>
      
      {/* Icon Circle - Floating Premium Style */}
      <div className={cn(
        "absolute left-0 top-0 w-8 h-8 rounded-xl bg-white dark:bg-slate-950 border transition-all duration-500 flex items-center justify-center z-10 shadow-sm",
        isExpanded 
          ? "border-blue-500 shadow-lg shadow-blue-500/20 scale-110" 
          : "border-slate-100 dark:border-white/5 group-hover:border-slate-300 dark:group-hover:border-white/20"
      )}>
        {getIcon()}
      </div>

      <Card className={cn(
        "border border-slate-100 dark:border-white/5 shadow-none transition-all duration-500 rounded-2xl overflow-hidden",
        isExpanded 
          ? "ring-1 ring-blue-500/10 dark:ring-blue-500/20 bg-blue-50/5 dark:bg-blue-500/5 shadow-xl shadow-slate-200/40 dark:shadow-none" 
          : "hover:bg-slate-50/50 dark:hover:bg-white/5 bg-white dark:bg-slate-900/40"
      )}>
        <CardContent className="p-0">
          <div 
            className="p-4 flex justify-between items-center cursor-pointer select-none" 
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {new Date(event.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                {getStatusBadge()}
              </div>
              <div className="flex items-baseline gap-2">
                <h3 className="text-sm font-black text-slate-900 dark:text-white truncate">{event.title}</h3>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold hidden sm:inline">•</span>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium truncate hidden sm:inline">{event.subtitle}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 ml-4">
              <Button variant="ghost" size="icon" className={cn(
                "h-7 w-7 rounded-lg text-slate-400 transition-transform duration-300",
                isExpanded && "rotate-180 text-blue-500"
              )}>
                <ChevronDown size={16} strokeWidth={3} />
              </Button>
            </div>
          </div>

          {isExpanded && (
            <div className="px-4 pb-4 animate-in slide-in-from-top-2 duration-300">
              <div className="pt-4 border-t border-slate-100 dark:border-white/5">
                {event.type === "CONSULTATION" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5">
                      <p className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5">Diagnóstico / Assessment</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed">{event.data?.notes?.assessment || "Sem notas de diagnóstico."}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-blue-50/30 dark:bg-blue-500/5 border border-blue-100/50 dark:border-blue-500/10">
                      <p className="text-[8px] font-black text-blue-600/60 dark:text-blue-400/60 uppercase tracking-widest mb-1.5">Plano Terapêutico</p>
                      <p className="text-xs text-blue-900/80 dark:text-blue-200 font-bold leading-relaxed">{event.data?.notes?.plan || "Sem plano registado."}</p>
                    </div>
                    {event.data?.invoice && (
                      <div className="col-span-1 md:col-span-2 p-3 bg-white dark:bg-slate-950/60 border border-slate-100 dark:border-white/5 rounded-xl flex justify-between items-center shadow-sm">
                         <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-black text-[10px] uppercase tracking-tight">
                            <Receipt size={14} /> Fatura: {eur(event.data.invoice.total)}
                         </div>
                         <Button variant="ghost" size="sm" className="h-7 px-3 text-[9px] font-black uppercase tracking-widest rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 dark:text-white">Ver Detalhes</Button>
                      </div>
                    )}
                  </div>
                )}

                {event.type === "LAB_RESULT" && (
                  <div className="bg-white dark:bg-slate-950/60 p-4 rounded-xl border border-slate-100 dark:border-white/5">
                     <div className="flex justify-between items-center mb-3">
                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tight">Análise de Sangue</p>
                        {event.data?.abnormalFlags && <Badge className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-none text-[8px] font-black uppercase">Crítico</Badge>}
                     </div>
                     <div className="space-y-1">
                        <div className="flex justify-between text-[10px] py-1.5 border-b border-slate-50 dark:border-white/5">
                          <span className="text-slate-500 dark:text-slate-400 font-bold">WBC</span>
                          <span className="font-black text-slate-800 dark:text-slate-200">12.4 x10³/µL</span>
                        </div>
                        <div className="flex justify-between text-[10px] py-1.5">
                          <span className="text-slate-500 dark:text-slate-400 font-bold">RBC</span>
                          <span className="font-black text-slate-800 dark:text-slate-200">6.8 x10⁶/µL</span>
                        </div>
                     </div>
                     <Button variant="outline" className="w-full mt-3 h-8 text-[9px] font-black uppercase tracking-widest rounded-lg border-slate-200 dark:border-white/10 dark:text-white hover:bg-slate-50 dark:hover:bg-white/5">
                       Abrir Relatório Completo
                     </Button>
                  </div>
                )}

                {event.type === "IMAGING" && (
                  <div className="space-y-2">
                     <div className="aspect-video bg-slate-900 dark:bg-black rounded-xl flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-inner overflow-hidden relative group">
                        <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-60 transition-opacity">
                          <ImageIcon size={32} className="text-slate-400" />
                          <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">DICOM Media Preview</p>
                        </div>
                        <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center backdrop-blur-sm">
                           <Button className="bg-white text-black hover:bg-slate-100 rounded-xl h-9 px-4 text-[10px] font-black uppercase tracking-widest gap-2 shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                              <ImageIcon size={14} strokeWidth={3} /> Visualizar Imagem
                           </Button>
                        </div>
                     </div>
                     <p className="text-[9px] text-slate-400 dark:text-slate-500 font-bold italic text-center">RX Tórax Lateral • Protocolo DICOM</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

const eur = (v: number) => `€${v.toFixed(2)}`;

export function ClinicalTimeline({ history, isLoading }: { history: any[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 bg-slate-100 dark:bg-white/5 rounded-xl" />
            <div className="flex-1 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem] bg-slate-50/30 dark:bg-transparent">
        <div className="h-16 w-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Clock size={28} className="text-slate-300 dark:text-slate-700" />
        </div>
        <p className="text-slate-400 dark:text-slate-600 font-black text-xs uppercase tracking-widest">Sem registos clínicos</p>
        <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Este animal ainda não tem eventos registados.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {history.map((event) => (
        <HistoryEvent key={event.id} event={event} />
      ))}
    </div>
  );
}
