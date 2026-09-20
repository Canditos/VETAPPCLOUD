"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  FlaskConical, 
  Image as ImageIcon, 
  FileText, 
  ChevronDown, 
  Clock, 
  Receipt, 
  Syringe, 
  Pill, 
  Activity, 
  Bug, 
  TrendingUp,
  Search,
  ExternalLink,
  ChevronRight,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Sparkles,
  Layers,
  X
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { LabResultDetail, LabResultsChart } from "@/components/LabResultDetail";

interface HistoryEventProps {
  event: any;
  patientId?: string;
  isExpanded: boolean;
  onToggle: () => void;
}

function HistoryEventCard({ event, patientId, isExpanded, onToggle }: HistoryEventProps) {
  const [showChart, setShowChart] = useState(false);

  const getTypeConfig = () => {
    switch (event.type) {
      case "CONSULTATION":
        return {
          label: "Consulta",
          icon: Stethoscope,
          accentBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/40",
          ringColor: "ring-blue-500/20",
          badgeBg: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800",
          dotBg: "bg-blue-600 text-white shadow-blue-500/30"
        };
      case "VACCINATION":
        return {
          label: "Vacinação",
          icon: Syringe,
          accentBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
          ringColor: "ring-emerald-500/20",
          badgeBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          dotBg: "bg-emerald-600 text-white shadow-emerald-500/30"
        };
      case "DEWORMING":
        return {
          label: "Desparasitação",
          icon: Bug,
          accentBg: "bg-teal-500/10 text-teal-600 dark:text-teal-400 border-teal-200 dark:border-teal-900/40",
          ringColor: "ring-teal-500/20",
          badgeBg: "bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-800",
          dotBg: "bg-teal-600 text-white shadow-teal-500/30"
        };
      case "LAB_RESULT":
        return {
          label: "Análises",
          icon: FlaskConical,
          accentBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/40",
          ringColor: "ring-purple-500/20",
          badgeBg: "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-800",
          dotBg: "bg-purple-600 text-white shadow-purple-500/30"
        };
      case "IMAGING":
        return {
          label: "Imagiologia",
          icon: ImageIcon,
          accentBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-900/40",
          ringColor: "ring-indigo-500/20",
          badgeBg: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800",
          dotBg: "bg-indigo-600 text-white shadow-indigo-500/30"
        };
      case "PRESCRIPTION":
        return {
          label: "Receita",
          icon: Pill,
          accentBg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/40",
          ringColor: "ring-rose-500/20",
          badgeBg: "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800",
          dotBg: "bg-rose-600 text-white shadow-rose-500/30"
        };
      case "VITALS":
        return {
          label: "Vitais",
          icon: Activity,
          accentBg: "bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-900/40",
          ringColor: "ring-sky-500/20",
          badgeBg: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300 border-sky-200 dark:border-sky-800",
          dotBg: "bg-sky-600 text-white shadow-sky-500/30"
        };
      case "PAYMENT":
        return {
          label: "Pagamento",
          icon: Receipt,
          accentBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/40",
          ringColor: "ring-emerald-500/20",
          badgeBg: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800",
          dotBg: "bg-emerald-600 text-white shadow-emerald-500/30"
        };
      default:
        return {
          label: "Registo",
          icon: FileText,
          accentBg: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800",
          ringColor: "ring-slate-500/20",
          badgeBg: "bg-slate-50 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700",
          dotBg: "bg-slate-600 text-white shadow-slate-500/30"
        };
    }
  };

  const config = getTypeConfig();
  const Icon = config.icon;
  const eventDate = new Date(event.date);
  const isValidDate = !isNaN(eventDate.getTime());
  const dateFormatted = isValidDate ? format(eventDate, "d MMM yyyy", { locale: pt }) : "Sem data";
  const timeFormatted = isValidDate ? format(eventDate, "HH:mm") : "";

  const eur = (v: number) => `€${Number(v).toFixed(2)}`;

  // Quick preview snippet
  const previewSnippet = (() => {
    if (event.type === "CONSULTATION") {
      return event.data?.notes?.assessment || event.data?.notes?.chiefComplaint || event.subtitle || "Sem notas registadas";
    }
    if (event.type === "VACCINATION") {
      return event.data?.vaccineName ? `${event.data.vaccineName}${event.data.batchNumber ? ` (Lote ${event.data.batchNumber})` : ""}` : event.subtitle;
    }
    if (event.type === "DEWORMING") {
      return event.data?.productName ? `${event.data.productName} (${event.data.type || "Geral"})` : event.subtitle;
    }
    if (event.type === "PRESCRIPTION") {
      const items = event.data?.items;
      if (items && items.length > 0) {
        return items.map((it: any) => it.medicineName).filter(Boolean).join(", ");
      }
      return event.subtitle;
    }
    if (event.type === "VITALS") {
      const parts = [];
      if (event.data?.weight) parts.push(`${event.data.weight} kg`);
      if (event.data?.temperature) parts.push(`${event.data.temperature} ºC`);
      if (event.data?.heartRate) parts.push(`${event.data.heartRate} bpm`);
      return parts.join(" · ") || event.subtitle;
    }
    return event.subtitle || "";
  })();

  const consultationId = event.data?.id || (event.type === "CONSULTATION" ? event.id : null);
  const targetPatientId = patientId || event.data?.patientId;

  return (
    <div className="relative pl-12 sm:pl-16 pb-6 last:pb-0 group">
      {/* Continuous spine line */}
      <div className="absolute left-[19px] sm:left-[27px] top-6 bottom-0 w-[2px] bg-slate-200 dark:bg-slate-800 group-last:hidden" />

      {/* Node Dot / Icon */}
      <div 
        onClick={onToggle}
        className={cn(
          "absolute left-1 sm:left-3 top-2 w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-md cursor-pointer z-10 ring-4 ring-white dark:ring-slate-950",
          config.dotBg,
          isExpanded ? "scale-110 ring-blue-500/30" : "hover:scale-105"
        )}
        title="Clique para expandir/recolher detalhes"
      >
        <Icon size={18} strokeWidth={2.5} />
      </div>

      {/* Main Content Card */}
      <Card 
        className={cn(
          "border transition-all duration-200 rounded-2xl overflow-hidden shadow-xs cursor-pointer",
          isExpanded 
            ? "border-blue-300 dark:border-blue-900/60 bg-blue-50/20 dark:bg-blue-950/10 shadow-md" 
            : "border-slate-200/70 dark:border-slate-800 bg-white dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
        )}
      >
        <CardContent className="p-0">
          <div 
            className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 select-none"
            onClick={onToggle}
          >
            {/* Left Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                {/* Date Badge */}
                <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-lg">
                  <Calendar size={12} className="text-slate-500" />
                  {dateFormatted}
                  {timeFormatted && timeFormatted !== "00:00" && (
                    <span className="text-slate-500 dark:text-slate-400 font-normal">· {timeFormatted}</span>
                  )}
                </span>

                {/* Type Badge */}
                <Badge variant="outline" className={cn("text-[11px] font-semibold px-2.5 py-0.5 rounded-lg border", config.badgeBg)}>
                  {config.label}
                </Badge>

                {/* Doctor if available */}
                {(event.data?.veterinarian?.name || event.doctor) && (
                  <span className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                    <User size={12} className="text-slate-500" />
                    Dr(a). {event.data?.veterinarian?.name || event.doctor}
                  </span>
                )}
              </div>

              {/* Title & Preview */}
              <div className="mt-1">
                <h4 className="text-base font-bold text-slate-900 dark:text-white tracking-tight leading-snug">
                  {event.title}
                </h4>
                {previewSnippet && (
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 line-clamp-1 font-medium">
                    {previewSnippet}
                  </p>
                )}
              </div>
            </div>

            {/* Right Quick Actions / Chevron */}
            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
              {event.type === "CONSULTATION" && targetPatientId && consultationId && (
                <Link
                  href={`/dashboard/consultations?patientId=${targetPatientId}&appointmentId=${consultationId}`}
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-1.5 rounded-xl transition-colors hover:bg-blue-100"
                >
                  Abrir Atendimento
                  <ExternalLink size={12} />
                </Link>
              )}

              <Button
                variant="ghost"
                size="icon"
                className={cn(
                  "h-8 w-8 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-transform duration-200",
                  isExpanded && "rotate-180 text-blue-600"
                )}
              >
                <ChevronDown size={18} strokeWidth={2.5} />
              </Button>
            </div>
          </div>

          {/* Expanded Drawer Details */}
          {isExpanded && (
            <div className="px-4 sm:px-6 pb-5 pt-1 border-t border-slate-100 dark:border-slate-800/80 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="pt-4 space-y-4">
                
                {/* CONSULTATION DETAILS */}
                {event.type === "CONSULTATION" && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Queixa Principal */}
                      {(event.data?.notes?.subjective || event.data?.notes?.chiefComplaint || event.subtitle) && (
                        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Motivo / Queixa Principal</p>
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                            {event.data?.notes?.subjective || event.data?.notes?.chiefComplaint || event.subtitle}
                          </p>
                        </div>
                      )}

                      {/* Exame Físico / Objetivo */}
                      {(event.data?.notes?.objective || event.data?.notes?.physicalExam) && (
                        <div className="p-3.5 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1">Exame Físico / Sinais</p>
                          <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                            {event.data?.notes?.objective || event.data?.notes?.physicalExam}
                          </p>
                        </div>
                      )}

                      {/* Diagnóstico / Avaliação */}
                      <div className="p-3.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1">Diagnóstico / Avaliação</p>
                        <p className="text-xs text-slate-900 dark:text-slate-100 font-medium leading-relaxed whitespace-pre-line">
                          {event.data?.notes?.assessment || event.data?.notes?.diagnosticsNotes || "Sem notas de diagnóstico registadas."}
                        </p>
                      </div>

                      {/* Plano Terapêutico */}
                      <div className="p-3.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">Plano & Tratamento</p>
                        <p className="text-xs text-slate-900 dark:text-slate-100 font-medium leading-relaxed whitespace-pre-line">
                          {event.data?.notes?.plan || event.data?.notes?.treatment || "Sem plano registado."}
                        </p>
                      </div>
                    </div>

                    {/* Exames Complementares */}
                    {event.data?.notes?.complementaryExams && (
                      <div className="p-3.5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/30">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-purple-700 dark:text-purple-400 mb-1">Exames Complementares</p>
                        <p className="text-xs text-slate-800 dark:text-slate-200 font-medium leading-relaxed whitespace-pre-line">
                          {event.data?.notes?.complementaryExams}
                        </p>
                      </div>
                    )}

                    {/* Fatura associada */}
                    {event.data?.invoice && (
                      <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/30 flex justify-between items-center">
                        <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs">
                          <Receipt size={15} />
                          Fatura Associada: {eur(event.data.invoice.total || 0)}
                        </div>
                        <span className="text-[11px] font-semibold uppercase text-emerald-700 dark:text-emerald-400">
                          {event.data.invoice.status || "Emitida"}
                        </span>
                      </div>
                    )}

                    {/* Direct link footer */}
                    {targetPatientId && consultationId && (
                      <div className="pt-2 flex justify-end">
                        <Link
                          href={`/dashboard/consultations?patientId=${targetPatientId}&appointmentId=${consultationId}`}
                          className="inline-flex items-center gap-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-xl transition-all shadow-sm"
                        >
                          <Stethoscope size={14} /> Abrir Consulta Completa
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                {/* VACCINATION DETAILS */}
                {event.type === "VACCINATION" && (
                  <div className="bg-emerald-50/40 dark:bg-emerald-950/10 p-4 rounded-xl border border-emerald-200/60 dark:border-emerald-900/30 space-y-2">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{event.data?.vaccineName || event.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Lote: {event.data?.batchNumber || "Não registado"}</p>
                      </div>
                      {event.data?.expiresAt && (
                        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 border-none text-xs font-semibold">
                          Próximo Reforço: {format(new Date(event.data.expiresAt), "dd/MM/yyyy")}
                        </Badge>
                      )}
                    </div>
                    {event.data?.notes && (
                      <p className="text-xs text-slate-600 dark:text-slate-400 italic pt-2 border-t border-emerald-200/40 dark:border-emerald-900/20">
                        "{event.data.notes}"
                      </p>
                    )}
                  </div>
                )}

                {/* DEWORMING DETAILS */}
                {event.type === "DEWORMING" && (
                  <div className="bg-teal-50/40 dark:bg-teal-950/10 p-4 rounded-xl border border-teal-200/60 dark:border-teal-900/30 space-y-2">
                    <div className="flex flex-wrap justify-between items-start gap-2">
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{event.data?.productName || event.title}</p>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">Tipo: {event.data?.type || "Geral"}</p>
                      </div>
                      {event.data?.expiresAt && (
                        <Badge className="bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300 border-none text-xs font-semibold">
                          Próxima Aplicação: {format(new Date(event.data.expiresAt), "dd/MM/yyyy")}
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* LAB RESULT DETAILS */}
                {event.type === "LAB_RESULT" && (
                  <div className="space-y-3">
                    <LabResultDetail event={event} />
                    {(event.data?.dataJson?.results?.length ?? 0) > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); setShowChart(true); }}
                        className="h-8 rounded-xl gap-2 text-xs font-bold border-purple-200 dark:border-purple-800 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                      >
                        <TrendingUp size={14} /> Ver Evolução Gráfica
                      </Button>
                    )}
                    <Dialog open={showChart} onOpenChange={setShowChart}>
                      <DialogContent className="sm:max-w-[700px] max-h-[80vh] rounded-2xl border-none p-0 overflow-hidden bg-white dark:bg-slate-900">
                        <div className="bg-purple-600 p-6 text-white">
                          <DialogTitle className="text-xl font-bold tracking-tight">Evolução de Análises</DialogTitle>
                          <p className="text-purple-100 text-xs font-semibold mt-0.5">Tendências ao longo do tempo</p>
                        </div>
                        <div className="p-6 max-h-[60vh] overflow-y-auto">
                          <LabResultsChart patientId={targetPatientId || event.data?.patientId} />
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}

                {/* PRESCRIPTION DETAILS */}
                {event.type === "PRESCRIPTION" && (
                  <div className="bg-rose-50/30 dark:bg-slate-900/80 p-4 rounded-xl border border-rose-200/60 dark:border-rose-900/30 space-y-3">
                    <div className="flex justify-between items-center pb-2 border-b border-rose-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-rose-700 dark:text-rose-400">Medicamentos Prescritos</p>
                      <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 border-none text-[10px]">
                        Receita Ativa
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {event.data?.items?.map((item: any, i: number) => (
                        <div key={i} className="p-2.5 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                          <div>
                            <p className="font-bold text-slate-900 dark:text-white">{item.medicineName}</p>
                            <p className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                              {item.dosage} · {item.frequency} · {item.duration}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VITALS DETAILS */}
                {event.type === "VITALS" && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {[
                      { label: "Peso", value: event.data?.weight ? `${event.data.weight} kg` : "---", color: "text-blue-600 dark:text-blue-400" },
                      { label: "Temperatura", value: event.data?.temperature ? `${event.data.temperature} ºC` : "---", color: "text-amber-600 dark:text-amber-400" },
                      { label: "Freq. Cardíaca", value: event.data?.heartRate ? `${event.data.heartRate} bpm` : "---", color: "text-rose-600 dark:text-rose-400" },
                      { label: "Freq. Respiratória", value: event.data?.respiratoryRate ? `${event.data.respiratoryRate} mpm` : "---", color: "text-indigo-600 dark:text-indigo-400" },
                    ].map((v, i) => (
                      <div key={i} className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/60 dark:border-slate-800 text-center">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{v.label}</p>
                        <p className={cn("text-sm font-black", v.color)}>{v.value}</p>
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

export function ClinicalTimeline({ 
  history = [], 
  isLoading = false,
  patientId
}: { 
  history: any[]; 
  isLoading?: boolean;
  patientId?: string;
}) {
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  // Category counts
  const counts = useMemo(() => {
    const c: Record<string, number> = {
      ALL: history.length,
      CONSULTATION: 0,
      VACCINATION: 0,
      LAB_RESULT: 0,
      PRESCRIPTION: 0,
      VITALS: 0
    };
    history.forEach(item => {
      if (item.type === "CONSULTATION") c.CONSULTATION++;
      else if (item.type === "VACCINATION" || item.type === "DEWORMING") c.VACCINATION++;
      else if (item.type === "LAB_RESULT" || item.type === "IMAGING") c.LAB_RESULT++;
      else if (item.type === "PRESCRIPTION") c.PRESCRIPTION++;
      else if (item.type === "VITALS") c.VITALS++;
    });
    return c;
  }, [history]);

  // Filtered list
  const filteredEvents = useMemo(() => {
    return history.filter(event => {
      // Category check
      if (selectedFilter !== "ALL") {
        if (selectedFilter === "VACCINATION" && event.type !== "VACCINATION" && event.type !== "DEWORMING") return false;
        else if (selectedFilter === "LAB_RESULT" && event.type !== "LAB_RESULT" && event.type !== "IMAGING") return false;
        else if (selectedFilter !== "VACCINATION" && selectedFilter !== "LAB_RESULT" && event.type !== selectedFilter) return false;
      }

      // Search query check
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (event.title || "").toLowerCase().includes(q);
        const subMatch = (event.subtitle || "").toLowerCase().includes(q);
        const vetMatch = (event.data?.veterinarian?.name || event.doctor || "").toLowerCase().includes(q);
        const assessmentMatch = (event.data?.notes?.assessment || "").toLowerCase().includes(q);
        const planMatch = (event.data?.notes?.plan || "").toLowerCase().includes(q);
        const vaxMatch = (event.data?.vaccineName || "").toLowerCase().includes(q);
        const medMatch = event.data?.items?.some?.((i: any) => (i.medicineName || "").toLowerCase().includes(q));

        if (!titleMatch && !subMatch && !vetMatch && !assessmentMatch && !planMatch && !vaxMatch && !medMatch) {
          return false;
        }
      }

      return true;
    });
  }, [history, selectedFilter, searchQuery]);

  const toggleEvent = (id: string) => {
    setExpandedIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    filteredEvents.forEach(e => { all[e.id] = true; });
    setExpandedIds(all);
  };

  const collapseAll = () => {
    setExpandedIds({});
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-4 animate-pulse">
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-800 rounded-2xl shrink-0" />
            <div className="flex-1 h-20 bg-slate-100 dark:bg-slate-800/50 rounded-2xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls Bar: Filters + Search */}
      <div className="space-y-3 bg-slate-50/60 dark:bg-slate-800/30 p-3.5 rounded-2xl border border-slate-200/60 dark:border-slate-800">
        
        {/* Search Bar */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Pesquisar por motivo, diagnóstico, vacina, médico ou medicamento..."
            className="pl-9 pr-9 h-10 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-medium"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Pills + Expand/Collapse */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: "ALL", label: "Todos", count: counts.ALL },
              { id: "CONSULTATION", label: "Consultas", icon: Stethoscope, count: counts.CONSULTATION },
              { id: "VACCINATION", label: "Vacinas & Desp.", icon: Syringe, count: counts.VACCINATION },
              { id: "LAB_RESULT", label: "Análises & Exames", icon: FlaskConical, count: counts.LAB_RESULT },
              { id: "PRESCRIPTION", label: "Receitas", icon: Pill, count: counts.PRESCRIPTION },
              { id: "VITALS", label: "Vitais", icon: Activity, count: counts.VITALS },
            ].map(tab => {
              const active = selectedFilter === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setSelectedFilter(tab.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer",
                    active
                      ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm"
                      : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800 hover:border-slate-300"
                  )}
                >
                  {Icon && <Icon size={13} strokeWidth={2.5} />}
                  <span>{tab.label}</span>
                  <span className={cn(
                    "text-[10px] px-1.5 py-0.2 rounded-full",
                    active 
                      ? "bg-white/20 text-white dark:bg-slate-900/20 dark:text-slate-900" 
                      : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                  )}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick toggle all */}
          {filteredEvents.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500">
              <button 
                onClick={expandAll}
                className="hover:text-blue-600 px-2 py-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Expandir tudo
              </button>
              <span>·</span>
              <button 
                onClick={collapseAll}
                className="hover:text-blue-600 px-2 py-1 rounded-md hover:bg-slate-200/50 dark:hover:bg-slate-800 cursor-pointer"
              >
                Recolher tudo
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Events List */}
      {filteredEvents.length === 0 ? (
        <div className="text-center py-16 px-4 border-2 border-dashed border-slate-200/80 dark:border-slate-800 rounded-3xl bg-slate-50/40 dark:bg-slate-900/20">
          <div className="w-14 h-14 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Clock size={24} />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Nenhum evento encontrado</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            {searchQuery || selectedFilter !== "ALL" 
              ? "Não foram encontrados registos para o filtro ou pesquisa aplicados."
              : "Este animal ainda não tem eventos registados no histórico clínico."}
          </p>
          {(searchQuery || selectedFilter !== "ALL") && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setSelectedFilter("ALL"); setSearchQuery(""); }}
              className="mt-4 rounded-xl text-xs font-bold"
            >
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="pt-2">
          {filteredEvents.map((event, idx) => (
            <HistoryEventCard
              key={event.id || idx}
              event={event}
              patientId={patientId}
              isExpanded={!!expandedIds[event.id || idx]}
              onToggle={() => toggleEvent(event.id || idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
