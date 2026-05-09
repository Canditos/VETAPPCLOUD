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
  Activity,
  Bug
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
      case "VACCINATION": return <Syringe className="text-amber-600 dark:text-amber-400" size={16} strokeWidth={2.5} />;
      case "DEWORMING": return <Bug className="text-indigo-600 dark:text-indigo-400" size={16} strokeWidth={2.5} />;
      case "PRESCRIPTION": return <Pill className="text-rose-600 dark:text-rose-400" size={16} strokeWidth={2.5} />;
      case "VITALS": return <Activity className="text-indigo-600 dark:text-indigo-400" size={16} strokeWidth={2.5} />;
      default: return <FileText className="text-slate-600 dark:text-slate-400" size={16} strokeWidth={2.5} />;
    }
  };

  const getStatusBadge = () => {
    if (event.status === "COMPLETED") return <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-none text-[9px] font-black uppercase">Concluído</Badge>;
    if (event.status === "ACTIVE") return <Badge className="bg-blue-600 text-white border-none text-[9px] font-black uppercase shadow-lg shadow-blue-500/20">Ativo</Badge>;
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

                {event.type === "VACCINATION" && (
                  <div className="bg-amber-50/30 dark:bg-amber-500/5 p-4 rounded-xl border border-amber-100 dark:border-amber-500/10">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-sm font-black text-slate-900 dark:text-white">{event.data?.vaccineName}</p>
                           <p className="text-[10px] text-slate-500 font-bold mt-1">Lote: {event.data?.batchNumber || "N/A"}</p>
                        </div>
                        {event.data?.expiresAt && (
                           <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-none text-[9px] font-black">
                              Reforço: {format(new Date(event.data.expiresAt), "dd/MM/yyyy")}
                           </Badge>
                        )}
                     </div>
                     {event.data?.notes && (
                        <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 leading-relaxed italic">"{event.data.notes}"</p>
                     )}
                  </div>
                )}

                {event.type === "DEWORMING" && (
                  <div className="bg-indigo-50/30 dark:bg-indigo-500/5 p-4 rounded-xl border border-indigo-100 dark:border-indigo-500/10">
                     <div className="flex justify-between items-start">
                        <div>
                           <p className="text-sm font-black text-slate-900 dark:text-white">{event.data?.productName}</p>
                           <p className="text-[10px] text-slate-500 font-bold mt-1">Tipo: {event.data?.type}</p>
                        </div>
                        {event.data?.expiresAt && (
                           <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border-none text-[9px] font-black">
                              Próxima dose: {format(new Date(event.data.expiresAt), "dd/MM/yyyy")}
                           </Badge>
                        )}
                     </div>
                  </div>
                )}

                {event.type === "PRESCRIPTION" && (
                  <div className="bg-slate-900 dark:bg-black p-5 rounded-xl border border-slate-800 space-y-4">
                     <div className="flex justify-between items-center pb-3 border-b border-white/5">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Itens Prescritos</p>
                        <Badge className="bg-blue-600/20 text-blue-400 border border-blue-500/30 text-[8px]">OFICIAL</Badge>
                     </div>
                     <div className="space-y-3">
                        {event.data?.items?.map((item: any, i: number) => (
                           <div key={i} className="flex justify-between items-center group/item">
                              <div>
                                 <p className="text-xs font-black text-white">{item.medicineName}</p>
                                 <p className="text-[9px] text-slate-500 mt-0.5">{item.dosage} • {item.frequency} • {item.duration}</p>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
                )}

                {event.type === "VITALS" && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: "Peso", value: event.data?.weight ? `${event.data.weight} kg` : "---", color: "text-blue-500" },
                      { label: "Temp", value: event.data?.temperature ? `${event.data.temperature} ºC` : "---", color: "text-orange-500" },
                      { label: "FC", value: event.data?.heartRate || "---", color: "text-rose-500" },
                      { label: "FR", value: event.data?.respiratoryRate || "---", color: "text-indigo-500" },
                    ].map((v, i) => (
                      <div key={i} className="p-3 bg-white dark:bg-slate-950/60 rounded-xl border border-slate-100 dark:border-white/5 text-center">
                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{v.label}</p>
                        <p className={cn("text-xs font-black", v.color)}>{v.value}</p>
                      </div>
                    ))}
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
