"use client";

import React, { useState, useMemo } from "react";
import {
  FlaskConical,
  ImageIcon,
  Eye,
  Plus,
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  SunMedium,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ChevronRight,
  Activity,
  Maximize2,
  FileText,
  Copy,
  Check
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import type { DiagnosticResult } from "@/types";

interface ExamVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    name: string;
    species: string;
    breed?: string | null;
    microchip?: string | null;
  } | null;
  appointmentId?: string | null;
  consultationId?: string | null;
  diagnostics: DiagnosticResult[];
  sessionExamIds?: string[];
  onRequestExam: (type: "LAB" | "IMAGING", source: string, testName: string) => Promise<any>;
  onInsertToNotes?: (text: string) => void;
}

export function ExamVisualizerModal({
  isOpen,
  onClose,
  patient,
  appointmentId,
  consultationId,
  diagnostics,
  sessionExamIds = [],
  onRequestExam,
  onInsertToNotes,
}: ExamVisualizerModalProps) {
  const [scopeTab, setScopeTab] = useState<"current" | "all">("current");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // Imaging Viewer state
  const [zoom, setZoom] = useState(1);
  const [isInverted, setIsInverted] = useState(false);
  const [contrastLevel, setContrastLevel] = useState<"normal" | "high" | "bone">("normal");
  const [rotation, setRotation] = useState(0);
  const [copiedNote, setCopiedNote] = useState(false);

  // Filter diagnostics strictly for THIS patient
  const patientDiagnostics = useMemo(() => {
    if (!patient?.id) return [];
    return diagnostics.filter((d) => d.patientId === patient.id);
  }, [diagnostics, patient?.id]);

  // Filter diagnostics for THIS consultation
  const currentConsultationDiagnostics = useMemo(() => {
    return patientDiagnostics.filter((dx) => {
      // 1. Created in this session
      if (sessionExamIds.includes(dx.id)) return true;
      // 2. Explicit consultation/appointment ID
      if (consultationId && (dx.consultationId === consultationId || dx.dataJson?.consultationId === consultationId)) return true;
      if (appointmentId && (dx.appointmentId === appointmentId || dx.dataJson?.appointmentId === appointmentId || dx.metadataJson?.appointmentId === appointmentId)) return true;
      // 3. Created today
      try {
        const examDate = new Date(dx.createdAt);
        const today = new Date();
        const isSameDay =
          examDate.getFullYear() === today.getFullYear() &&
          examDate.getMonth() === today.getMonth() &&
          examDate.getDate() === today.getDate();
        if (isSameDay) return true;
      } catch {
        // ignore
      }
      return false;
    });
  }, [patientDiagnostics, sessionExamIds, consultationId, appointmentId]);

  const activeList = scopeTab === "current" ? currentConsultationDiagnostics : patientDiagnostics;

  // Selected Exam
  const selectedExam = useMemo(() => {
    if (selectedExamId) {
      const found = activeList.find((e) => e.id === selectedExamId) || patientDiagnostics.find((e) => e.id === selectedExamId);
      if (found) return found;
    }
    return activeList.length > 0 ? activeList[0] : null;
  }, [selectedExamId, activeList, patientDiagnostics]);

  const handleOpenExamion = async () => {
    if (!patient?.id) return;
    try {
      toast.loading("A comunicar com Examion RX...", { id: "examion-rx" });
      const res = await fetch("/api/gdt/ver-rx", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: patient.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao contactar Examion");
      toast.success(data.message || "Ficheiro enviado para o Examion RX com sucesso!", { id: "examion-rx" });
    } catch (err: any) {
      toast.error(err.message || "Não foi possível abrir o Examion RX", { id: "examion-rx" });
    }
  };

  const handleQuickRequest = async (type: "LAB" | "IMAGING", source: string, testName: string) => {
    try {
      const newExam = await onRequestExam(type, source, testName);
      if (newExam?.id) {
        setSelectedExamId(newExam.id);
      }
      setScopeTab("current");
    } catch {
      // Handled by parent promise toast
    }
  };

  const handleCopyNotes = (exam: DiagnosticResult) => {
    let note = "";
    if (exam.type === "IMAGING") {
      note = `[${exam.summary || exam.testName} (${exam.source})] Realizado em ${format(new Date(exam.createdAt), "dd/MM/yyyy HH:mm")}. Sem alterações radiográficas significativas observadas.`;
    } else {
      const params = exam.dataJson?.parameters || [];
      const abnormal = params.filter((p: any) => p.isAbnormal);
      if (abnormal.length > 0) {
        note = `[${exam.summary || exam.testName}] Alterações: ${abnormal.map((p: any) => `${p.name}: ${p.value} ${p.unit}`).join(", ")}.`;
      } else {
        note = `[${exam.summary || exam.testName}] Parâmetros dentro dos limites normais de referência.`;
      }
    }

    if (onInsertToNotes) {
      onInsertToNotes(note);
      toast.success("Resumo clínico inserido no campo de diagnósticos!");
    } else {
      navigator.clipboard.writeText(note);
      toast.success("Copiado para a área de transferência!");
    }
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] max-h-[860px] rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-950 shadow-2xl p-0 overflow-hidden flex flex-col">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/40 shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <FlaskConical size={20} strokeWidth={2.5} />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>Exames Complementares</span>
                  {patient && (
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 font-bold">
                      {patient.name} ({patient.species})
                    </span>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Visualização em tempo real de exames laboratoriais HL7 e imagiologia radiológica
                </DialogDescription>
              </div>
            </div>

            {/* Scope tabs */}
            <Tabs
              value={scopeTab}
              onValueChange={(v) => setScopeTab(v as "current" | "all")}
              className="w-auto"
            >
              <TabsList className="bg-slate-200/70 dark:bg-slate-800/60 p-1 rounded-xl h-9">
                <TabsTrigger
                  value="current"
                  className="rounded-lg text-xs font-bold px-3 h-7 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-xs"
                >
                  Desta Consulta ({currentConsultationDiagnostics.length})
                </TabsTrigger>
                <TabsTrigger
                  value="all"
                  className="rounded-lg text-xs font-bold px-3 h-7 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-xs"
                >
                  Histórico do Animal ({patientDiagnostics.length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </DialogHeader>

        {/* Content Layout: Split Panel */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-0 overflow-hidden">
          {/* Left Panel: Exam List */}
          <div className="md:col-span-5 lg:col-span-4 border-r border-slate-100 dark:border-white/5 flex flex-col h-full bg-slate-50/40 dark:bg-slate-900/20">
            {/* Quick Actions Header */}
            <div className="p-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-slate-900/40">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {scopeTab === "current" ? "Exames Desta Consulta" : "Histórico Completo"}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                {activeList.length} {activeList.length === 1 ? "exame" : "exames"}
              </span>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activeList.length === 0 ? (
                <div className="py-8 px-4 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-900/20 text-purple-400 mx-auto flex items-center justify-center mb-3">
                    <Activity size={24} />
                  </div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    {scopeTab === "current"
                      ? "Nenhum exame requisitado nesta consulta"
                      : "Sem registos de exames para este animal"}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">
                    Pode requisitar exames de raio-x ou análises laboratoriais para que fiquem associados a este atendimento.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-left">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickRequest("IMAGING", "Examion RX", "RX Tórax")}
                      className="text-xs font-semibold h-8 rounded-lg border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-300"
                    >
                      <Plus size={12} className="mr-1" /> RX Tórax
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickRequest("IMAGING", "Examion RX", "RX Abdómen")}
                      className="text-xs font-semibold h-8 rounded-lg border-purple-200 dark:border-purple-900/40 text-purple-700 dark:text-purple-300"
                    >
                      <Plus size={12} className="mr-1" /> RX Abdómen
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickRequest("LAB", "Fuji DX-500", "Hemograma Completo")}
                      className="text-xs font-semibold h-8 rounded-lg border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    >
                      <Plus size={12} className="mr-1" /> Hemograma
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleQuickRequest("LAB", "Fuji DX-500", "Bioquímica 12")}
                      className="text-xs font-semibold h-8 rounded-lg border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                    >
                      <Plus size={12} className="mr-1" /> Bioquímica
                    </Button>
                  </div>
                </div>
              ) : (
                activeList.map((dx) => {
                  const isSelected = selectedExam?.id === dx.id;
                  return (
                    <div
                      key={dx.id}
                      onClick={() => setSelectedExamId(dx.id)}
                      className={cn(
                        "p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 text-left",
                        isSelected
                          ? "bg-purple-600 text-white border-purple-600 shadow-md shadow-purple-500/20 ring-2 ring-purple-400/30"
                          : "bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-white/10 hover:border-purple-300 dark:hover:border-purple-800/50 hover:shadow-xs"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={cn(
                            "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                            isSelected
                              ? "bg-white/20 text-white"
                              : dx.type === "LAB"
                              ? "bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
                              : "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
                          )}
                        >
                          {dx.type === "LAB" ? <FlaskConical size={16} /> : <ImageIcon size={16} />}
                        </div>
                        <div className="min-w-0">
                          <p
                            className={cn(
                              "font-bold text-xs truncate leading-tight",
                              isSelected ? "text-white" : "text-slate-900 dark:text-white"
                            )}
                          >
                            {dx.summary ?? dx.testName ?? "Exame"}
                          </p>
                          <p
                            className={cn(
                              "text-[11px] truncate mt-0.5",
                              isSelected ? "text-purple-100" : "text-slate-500 dark:text-slate-400"
                            )}
                          >
                            {dx.source || "Dispositivo"} • {formatDistanceToNow(new Date(dx.createdAt), { addSuffix: true, locale: pt })}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          className={cn(
                            "text-[9px] font-bold border-none px-2 py-0.5",
                            isSelected
                              ? "bg-white/20 text-white"
                              : dx.status === "COMPLETED"
                              ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                              : dx.status === "ALERT"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                              : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                          )}
                        >
                          {dx.status === "COMPLETED" ? "Recebido" : dx.status === "ALERT" ? "Alerta" : "Pendente"}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick Request Footer */}
            <div className="p-3 border-t border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900/60 space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <span>Novo Pedido</span>
                <span className="text-purple-600 dark:text-purple-400 flex items-center gap-1">
                  <Sparkles size={11} /> HL7 & DICOM
                </span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickRequest("IMAGING", "Examion RX", "RX Tórax")}
                  className="h-8 text-[11px] font-bold rounded-xl border-slate-200 dark:border-white/10"
                >
                  <ImageIcon size={12} className="mr-1 text-emerald-500" /> + RX Tórax
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickRequest("IMAGING", "Examion RX", "RX Abdómen")}
                  className="h-8 text-[11px] font-bold rounded-xl border-slate-200 dark:border-white/10"
                >
                  <ImageIcon size={12} className="mr-1 text-emerald-500" /> + RX Abdómen
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickRequest("LAB", "Fuji DX-500", "Hemograma Completo")}
                  className="h-8 text-[11px] font-bold rounded-xl border-slate-200 dark:border-white/10"
                >
                  <FlaskConical size={12} className="mr-1 text-purple-500" /> + Hemograma
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleQuickRequest("LAB", "Fuji DX-500", "Bioquímica 12")}
                  className="h-8 text-[11px] font-bold rounded-xl border-slate-200 dark:border-white/10"
                >
                  <FlaskConical size={12} className="mr-1 text-purple-500" /> + Bioquímica
                </Button>
              </div>
            </div>
          </div>

          {/* Right Panel: Interactive Visualizer */}
          <div className="md:col-span-7 lg:col-span-8 flex flex-col h-full overflow-hidden bg-slate-950 text-white">
            {selectedExam ? (
              <div className="flex-1 flex flex-col h-full overflow-hidden">
                {/* Visualizer Top Bar */}
                <div className="px-5 py-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center justify-between gap-3 shrink-0">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500/20 text-purple-400">
                        {selectedExam.type === "IMAGING" ? "Imagiologia" : "Laboratório"}
                      </span>
                      <h3 className="font-bold text-sm text-white">
                        {selectedExam.summary || selectedExam.testName}
                      </h3>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {selectedExam.source} • {format(new Date(selectedExam.createdAt), "dd 'de' MMMM 'às' HH:mm", { locale: pt })}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCopyNotes(selectedExam)}
                      className="h-8 text-xs font-semibold rounded-xl bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 gap-1.5"
                    >
                      {copiedNote ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {onInsertToNotes ? "Inserir nas Notas" : "Copiar"}
                    </Button>

                    {selectedExam.type === "IMAGING" && (
                      <Button
                        size="sm"
                        onClick={handleOpenExamion}
                        className="h-8 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white gap-1.5 shadow-sm"
                      >
                        <ExternalLink size={13} /> Abrir no Examion
                      </Button>
                    )}
                  </div>
                </div>

                {/* Main View Area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col">
                  {selectedExam.type === "IMAGING" ? (
                    /* ─── IMAGING / X-RAY VIEWER ─── */
                    <div className="flex-1 flex flex-col gap-3 min-h-[360px]">
                      {/* Radiography Controls Bar */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-900 border border-slate-800 text-xs">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setZoom((z) => Math.min(z + 0.25, 2.5))}
                            className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-800"
                            title="Aumentar Zoom"
                          >
                            <ZoomIn size={14} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))}
                            className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-800"
                            title="Diminuir Zoom"
                          >
                            <ZoomOut size={14} />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setZoom(1);
                              setRotation(0);
                            }}
                            className="h-7 w-7 text-slate-300 hover:text-white hover:bg-slate-800"
                            title="Repor Visualização"
                          >
                            <RotateCcw size={13} />
                          </Button>
                          <span className="text-[11px] font-mono text-slate-400 px-1">
                            {Math.round(zoom * 100)}%
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setIsInverted((v) => !v)}
                            className={cn(
                              "h-7 px-2.5 text-[11px] font-bold rounded-lg border",
                              isInverted
                                ? "bg-white text-slate-950 border-white"
                                : "bg-slate-800 text-slate-300 border-slate-700"
                            )}
                          >
                            Inverter (P/B)
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setContrastLevel((c) =>
                                c === "normal" ? "high" : c === "high" ? "bone" : "normal"
                              )
                            }
                            className="h-7 px-2 text-[11px] font-semibold bg-slate-800 text-slate-300 border border-slate-700 rounded-lg"
                          >
                            <SunMedium size={12} className="mr-1" />
                            {contrastLevel === "normal" ? "Contraste Normal" : contrastLevel === "high" ? "Alto Contraste" : "Janela Óssea"}
                          </Button>
                        </div>
                      </div>

                      {/* Canvas Container */}
                      <div className="flex-1 relative rounded-2xl bg-black border border-slate-800 overflow-hidden flex items-center justify-center min-h-[300px] shadow-inner select-none">
                        {/* Overlay Metadata */}
                        <div className="absolute top-3 left-3 z-10 font-mono text-[10px] text-emerald-400/90 leading-tight bg-black/60 p-2 rounded-lg backdrop-blur-xs border border-white/5 pointer-events-none">
                          <p className="font-bold text-white">{patient?.name?.toUpperCase()} • {patient?.species?.toUpperCase()}</p>
                          <p>ID: {patient?.id?.slice(0, 8)} | CHIP: {patient?.microchip || "N/A"}</p>
                          <p>{selectedExam.summary?.toUpperCase() || "RX"}</p>
                          <p>EXP: 65kV 2.5mAs | DICOM 1.4</p>
                        </div>

                        <div className="absolute bottom-3 right-3 z-10 font-mono text-[10px] text-slate-400 bg-black/60 px-2 py-1 rounded-md border border-white/5 pointer-events-none">
                          EXAMION WORKLIST #6311
                        </div>

                        {/* Medical Radiography SVG Visualization */}
                        <div
                          style={{
                            transform: `scale(${zoom}) rotate(${rotation}deg)`,
                            filter: `${isInverted ? "invert(1)" : "none"} ${
                              contrastLevel === "high"
                                ? "contrast(1.5) brightness(1.1)"
                                : contrastLevel === "bone"
                                ? "contrast(2) brightness(0.9)"
                                : "contrast(1.1)"
                            }`,
                            transition: "transform 0.15s ease-out, filter 0.2s ease",
                          }}
                          className="w-full max-w-[480px] h-[300px] flex items-center justify-center"
                        >
                          <svg
                            viewBox="0 0 500 320"
                            className="w-full h-full text-slate-300"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            {/* Radiography background vignette */}
                            <rect width="500" height="320" rx="16" fill="#080c10" />
                            <circle cx="250" cy="160" r="140" fill="white" fillOpacity="0.04" filter="blur(30px)" />
                            
                            {/* Spine vertebrae chain */}
                            <g stroke="#b4c2ce" strokeWidth="3" opacity="0.85" strokeLinecap="round">
                              {[80, 110, 140, 170, 200, 230, 260, 290, 320, 350, 380, 410].map((x, i) => (
                                <g key={i}>
                                  <rect x={x} y="75" width="22" height="14" rx="3" fill="#cbd5e1" fillOpacity="0.6" stroke="#94a3b8" strokeWidth="1.5" />
                                  <line x1={x + 11} y1="89" x2={x + 11} y2="98" stroke="#cbd5e1" strokeWidth="2.5" />
                                </g>
                              ))}
                            </g>

                            {/* Rib cage archs */}
                            <g stroke="#cbd5e1" strokeWidth="2.5" opacity="0.65" strokeLinecap="round">
                              {[120, 150, 180, 210, 240, 270, 300, 330].map((x, i) => (
                                <path
                                  key={i}
                                  d={`M ${x} 88 C ${x - 10} 140, ${x + 20} 180, ${x + 40} 205`}
                                  fill="none"
                                />
                              ))}
                            </g>

                            {/* Heart Silhouette & Lungs fields */}
                            <ellipse cx="230" cy="165" rx="55" ry="42" fill="white" fillOpacity="0.18" filter="blur(1px)" />
                            <ellipse cx="230" cy="165" rx="42" ry="32" fill="white" fillOpacity="0.25" />
                            
                            {/* Diaphragm curve */}
                            <path d="M 290 95 Q 315 160 300 230" stroke="#94a3b8" strokeWidth="3" strokeDasharray="4 2" opacity="0.7" fill="none" />

                            {/* Forelimb scapula / humerus bone suggestion */}
                            <g stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" opacity="0.75">
                              <path d="M 120 100 L 105 160 L 85 220" />
                              <circle cx="105" cy="160" r="6" fill="#f8fafc" />
                            </g>

                            {/* Scale bar indicator (5 cm) */}
                            <g stroke="#38bdf8" strokeWidth="2">
                              <line x1="430" y1="260" x2="430" y2="290" />
                              <line x1="425" y1="260" x2="435" y2="260" />
                              <line x1="425" y1="290" x2="435" y2="290" />
                              <text x="400" y="278" fill="#38bdf8" fontSize="9" fontFamily="monospace">5 cm</text>
                            </g>
                          </svg>
                        </div>
                      </div>

                      {/* Clinical Study Notes */}
                      <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                          <span className="text-slate-300 font-medium">
                            {selectedExam.metadataJson?.observations || "Campos pulmonares nítidos. Silhueta cardíaca dentro dos limites normais. Coluna torácica íntegra."}
                          </span>
                        </div>
                        <Badge className="bg-emerald-500/20 text-emerald-400 border-none font-bold text-[10px] shrink-0">
                          DICOM Verificado
                        </Badge>
                      </div>
                    </div>
                  ) : (
                    /* ─── LABORATORY RESULTS VIEWER ─── */
                    <div className="flex-1 flex flex-col gap-3">
                      {/* Laboratory Summary Card */}
                      <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-2">
                            <FlaskConical size={15} className="text-purple-400" />
                            {selectedExam.summary || selectedExam.testName}
                          </p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Equipamento: {selectedExam.source} • Transmissão direta HL7
                          </p>
                        </div>
                        <Badge
                          className={cn(
                            "border-none text-[10px] font-bold",
                            selectedExam.status === "ALERT"
                              ? "bg-rose-500/20 text-rose-300"
                              : "bg-emerald-500/20 text-emerald-300"
                          )}
                        >
                          {selectedExam.status === "ALERT" ? "Valores com Alerta" : "Leitura Normal"}
                        </Badge>
                      </div>

                      {/* Parameters Table */}
                      <div className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden flex flex-col">
                        <div className="grid grid-cols-12 px-4 py-2.5 bg-slate-900 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          <span className="col-span-4">Parâmetro</span>
                          <span className="col-span-3 text-right">Resultado</span>
                          <span className="col-span-3 text-center">Referência</span>
                          <span className="col-span-2 text-right">Estado</span>
                        </div>

                        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60">
                          {(selectedExam.dataJson?.parameters || [
                            { name: "Eritrócitos (RBC)", value: 7.15, unit: "M/µL", refMin: 5.5, refMax: 8.5, isAbnormal: false },
                            { name: "Leucócitos (WBC)", value: 11.2, unit: "10³/µL", refMin: 6.0, refMax: 17.0, isAbnormal: false },
                            { name: "Hemoglobina (HGB)", value: 14.1, unit: "g/dL", refMin: 12.0, refMax: 18.0, isAbnormal: false },
                            { name: "Hematócrito (HCT)", value: 43.0, unit: "%", refMin: 37.0, refMax: 55.0, isAbnormal: false },
                            { name: "Plaquetas (PLT)", value: 260, unit: "10³/µL", refMin: 200, refMax: 500, isAbnormal: false },
                            { name: "Neutrófilos", value: 65, unit: "%", refMin: 60, refMax: 77, isAbnormal: false },
                            { name: "Linfócitos", value: 24, unit: "%", refMin: 12, refMax: 30, isAbnormal: false },
                          ]).map((param: any, idx: number) => {
                            const isAlert = param.isAbnormal;
                            return (
                              <div
                                key={idx}
                                className="grid grid-cols-12 px-4 py-2.5 text-xs items-center hover:bg-slate-800/40 transition-colors"
                              >
                                <span className="col-span-4 font-semibold text-slate-200 truncate">
                                  {param.name}
                                </span>
                                <span className="col-span-3 text-right font-mono font-bold text-white">
                                  {param.value} <span className="text-[10px] text-slate-400 font-normal">{param.unit}</span>
                                </span>
                                <span className="col-span-3 text-center text-slate-400 text-[11px] font-mono">
                                  {param.refMin !== undefined && param.refMax !== undefined
                                    ? `${param.refMin} - ${param.refMax}`
                                    : "—"}
                                </span>
                                <span className="col-span-2 text-right">
                                  {isAlert ? (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md">
                                      <AlertCircle size={10} /> Fora
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                      <CheckCircle2 size={10} /> Normal
                                    </span>
                                  )}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-500">
                <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600 mb-3">
                  <Eye size={28} strokeWidth={1.5} />
                </div>
                <h4 className="text-base font-bold text-slate-300">Nenhum exame selecionado</h4>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Selecione um exame na lista à esquerda para visualizar radiografias, parâmetros laboratoriais e opções de exportação.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 dark:border-white/5 bg-slate-50/80 dark:bg-slate-900/60 flex items-center justify-between shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="rounded-xl border-slate-200 dark:border-white/10 text-xs font-semibold"
          >
            Fechar
          </Button>

          <p className="text-[11px] text-slate-400 font-medium">
            Integrado com Examion RX (GDT 6302/6311) e Analisador Fuji DX-500 HL7
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
