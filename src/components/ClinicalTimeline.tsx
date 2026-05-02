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
    <div className="relative pl-8 pb-8 last:pb-0">
      {/* Timeline Line */}
      <div className="absolute left-[15px] top-0 bottom-0 w-px bg-slate-100 group-last:hidden"></div>
      
      {/* Icon Circle */}
      <div className="absolute left-0 top-0 w-8 h-8 rounded-full bg-white border border-slate-100 shadow-sm flex items-center justify-center z-10">
        {getIcon()}
      </div>

      <Card className={`border-none shadow-sm transition-all ${isExpanded ? "ring-1 ring-blue-100 bg-blue-50/10" : "hover:bg-slate-50/50"}`}>
        <CardContent className="p-4">
          <div className="flex justify-between items-start cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
            <div>
              <div className="flex items-center gap-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                  {new Date(event.date).toLocaleDateString('pt-PT', { day: '2-digit', month: 'short', year: 'numeric' })}
                </p>
                {getStatusBadge()}
              </div>
              <h3 className="text-sm font-black text-slate-900 mt-1">{event.title}</h3>
              <p className="text-xs text-slate-500 font-medium">{event.subtitle}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
            </Button>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2 duration-300">
              {event.type === "CONSULTATION" && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Assessment</p>
                    <p className="text-sm text-slate-700">{event.data.notes?.assessment || "Sem notas de diagnóstico."}</p>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Plano Terapêutico</p>
                    <p className="text-sm text-slate-700">{event.data.notes?.plan || "Sem plano registado."}</p>
                  </div>
                  {event.data.invoice && (
                    <div className="col-span-2 p-3 bg-white border border-slate-100 rounded-xl flex justify-between items-center">
                       <div className="flex items-center gap-2 text-blue-600 font-bold text-xs">
                          <Receipt size={14} /> Fatura Emitida (€{event.data.invoice.total})
                       </div>
                       <Button variant="ghost" size="sm" className="text-[10px] font-bold h-6">Ver Detalhes</Button>
                    </div>
                  )}
                </div>
              )}

              {event.type === "LAB_RESULT" && (
                <div className="bg-white p-3 rounded-xl border border-slate-100 overflow-hidden">
                   <div className="flex justify-between items-center mb-3">
                      <p className="text-xs font-bold">Resultados de Sangue</p>
                      {event.data.abnormalFlags && <Badge className="bg-red-50 text-red-600 border-none text-[8px]">Anomalias Detetadas</Badge>}
                   </div>
                   <div className="space-y-1">
                      {/* Simulating lab data keys */}
                      <div className="flex justify-between text-[10px] py-1 border-b border-slate-50">
                        <span className="text-slate-500">WBC (Glóbulos Brancos)</span>
                        <span className="font-bold text-slate-800">12.4 x10³/µL</span>
                      </div>
                      <div className="flex justify-between text-[10px] py-1">
                        <span className="text-slate-500">RBC (Glóbulos Vermelhos)</span>
                        <span className="font-bold text-slate-800">6.8 x10⁶/µL</span>
                      </div>
                   </div>
                   <Button variant="outline" className="w-full mt-3 h-8 text-[10px] rounded-lg">Descarregar PDF Completo</Button>
                </div>
              )}

              {event.type === "IMAGING" && (
                <div className="space-y-3">
                   <div className="aspect-video bg-slate-900 rounded-xl flex items-center justify-center border border-slate-800 overflow-hidden relative group">
                      <p className="text-slate-600 text-[10px]">Preview Indisponível</p>
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Button className="bg-white text-black hover:bg-slate-100 rounded-lg h-8 text-xs font-bold gap-2">
                            <ImageIcon size={14} /> Abrir PACS (DICOM)
                         </Button>
                      </div>
                   </div>
                   <p className="text-[10px] text-slate-400 font-medium italic">RX Tórax Lateral - Visualizador Examion Web 3.2</p>
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
