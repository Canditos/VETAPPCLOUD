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
  Receipt
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface HistoryEventProps {
  event: any;
}

function HistoryEvent({ event }: HistoryEventProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getIcon = () => {
    switch (event.type) {
      case "CONSULTATION": return <Stethoscope className="text-blue-600" size={18} />;
      case "LAB_RESULT": return <FlaskConical className="text-purple-600" size={18} />;
      case "IMAGING": return <ImageIcon className="text-emerald-600" size={18} />;
      default: return <FileText className="text-slate-600" size={18} />;
    }
  };

  const getStatusBadge = () => {
    if (event.status === "COMPLETED") return <Badge className="bg-green-50 text-green-700 border-none">Concluído</Badge>;
    if (event.status === "SCHEDULED") return <Badge className="bg-amber-50 text-amber-700 border-none">Agendado</Badge>;
    return <Badge variant="outline">{event.status}</Badge>;
  };

  return (
    <div className="relative pl-8 pb-8 last:pb-0 group">
      {/* Timeline Line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-slate-100 dark:bg-white/5 group-last:hidden"></div>
      
      {/* Icon Circle */}
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 shadow-sm flex items-center justify-center z-10">
        {getIcon()}
      </div>

      <Card className={cn(
        "border-none shadow-sm transition-all rounded-3xl",
        isExpanded 
          ? "ring-1 ring-blue-100 dark:ring-blue-500/30 bg-blue-50/10 dark:bg-blue-900/10" 
          : "hover:bg-slate-50/50 dark:hover:bg-white/5 bg-white dark:bg-slate-900/40"
      )}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div>
              <div className="flex items-center gap-3">
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                  {new Date(event.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                {getStatusBadge()}
              </div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white mt-1">{event.title}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{event.subtitle}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 dark:text-slate-600">
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5 space-y-4 animate-in slide-in-from-top-2 duration-300">
              {event.type === "CONSULTATION" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Assessment</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{event.data.notes?.assessment || "Sem notas de diagnóstico."}</p>
                  </div>
                  <div className="space-y-2 p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-white/5">
                    <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Plano Terapêutico</p>
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">{event.data.notes?.plan || "Sem plano registado."}</p>
                  </div>
                  {event.data.invoice && (
                    <div className="col-span-1 md:col-span-2 p-4 bg-white dark:bg-slate-950/60 border border-slate-100 dark:border-white/5 rounded-2xl flex justify-between items-center shadow-sm">
                       <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 font-black text-xs uppercase tracking-tighter">
                          <Receipt size={16} /> Fatura Emitida (€{event.data.invoice.total})
                       </div>
                       <Button variant="outline" size="sm" className="text-[9px] font-black uppercase tracking-widest h-8 rounded-xl border-slate-200 dark:border-white/10 dark:text-white">Ver Detalhes</Button>
                    </div>
                  )}
                </div>
              )}

              {event.type === "LAB_RESULT" && (
                <div className="bg-white dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
                   <div className="flex justify-between items-center mb-4">
                      <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">Resultados Hematológicos</p>
                      {event.data.abnormalFlags && <Badge className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 border-none text-[8px] font-black uppercase">Alertas</Badge>}
                   </div>
                   <div className="space-y-2">
                      <div className="flex justify-between text-[10px] py-2 border-b border-slate-50 dark:border-white/5">
                        <span className="text-slate-500 dark:text-slate-400 font-bold">WBC (Glóbulos Brancos)</span>
                        <span className="font-black text-slate-800 dark:text-slate-200">12.4 x10³/µL</span>
                      </div>
                      <div className="flex justify-between text-[10px] py-2">
                        <span className="text-slate-500 dark:text-slate-400 font-bold">RBC (Glóbulos Vermelhos)</span>
                        <span className="font-black text-slate-800 dark:text-slate-200">6.8 x10⁶/µL</span>
                      </div>
                   </div>
                   <Button variant="outline" className="w-full mt-4 h-10 text-[10px] font-black uppercase tracking-widest rounded-xl border-slate-200 dark:border-white/10 dark:text-white">
                     Descarregar PDF Completo
                   </Button>
                </div>
              )}

              {event.type === "IMAGING" && (
                <div className="space-y-3">
                   <div className="aspect-video bg-slate-900 dark:bg-black rounded-2xl flex items-center justify-center border border-slate-200 dark:border-white/5 shadow-inner overflow-hidden relative group">
                      <p className="text-slate-600 dark:text-slate-800 text-[10px] font-black uppercase tracking-widest">Preview Indisponível</p>
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                         <Button className="bg-white text-black hover:bg-slate-100 rounded-xl h-10 px-6 text-xs font-black uppercase tracking-widest gap-2 shadow-2xl">
                            <ImageIcon size={16} strokeWidth={3} /> Abrir DICOM Viewer
                         </Button>
                      </div>
                   </div>
                   <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold italic tracking-tight">RX Tórax Lateral • DICOM Protocol • Examion Web</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ClinicalTimeline({ history, isLoading }: { history: any[], isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-8 h-8 bg-slate-100 rounded-full" />
            <div className="flex-1 h-24 bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  if (!history || history.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
        <Clock size={40} className="mx-auto text-slate-100 mb-3" />
        <p className="text-slate-400 font-medium">Nenhum registo no histórico clínico.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((event) => (
        <HistoryEvent key={event.id} event={event} />
      ))}
    </div>
  );
}
