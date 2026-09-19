"use client";

import React, { useState, useMemo } from "react";
import {
  FlaskConical,
  ImageIcon,
  Eye,
  Plus,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  SunMedium,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  X,
  Layers,
  Microscope,
  Stethoscope,
} from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
// Use Radix directly so we bypass shadcn's hardcoded sm:max-w-sm on DialogContent
const Dialog = DialogPrimitive.Root;
const DialogPortal = DialogPrimitive.Portal;
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
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

function StatusDot({ status }: { status?: string }) {
  if (status === "COMPLETED") return <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />;
  if (status === "ALERT")     return <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />;
  return <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />;
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
  const [scopeTab, setScopeTab]         = useState<"current" | "all">("current");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [zoom, setZoom]                 = useState(1);
  const [isInverted, setIsInverted]     = useState(false);
  const [contrastLevel, setContrastLevel] = useState<"normal" | "high" | "bone">("normal");
  const [rotation, setRotation]         = useState(0);
  const [copiedNote, setCopiedNote]     = useState(false);
  const [requesting, setRequesting]     = useState<string | null>(null);

  /* ── Data Filtering ── */
  const patientDiagnostics = useMemo(() => {
    if (!patient?.id) return [];
    return diagnostics.filter((d) => d.patientId === patient.id);
  }, [diagnostics, patient?.id]);

  const currentConsultationDiagnostics = useMemo(() => {
    return patientDiagnostics.filter((dx) => {
      if (sessionExamIds.includes(dx.id)) return true;
      if (consultationId && (dx.consultationId === consultationId || dx.dataJson?.consultationId === consultationId)) return true;
      if (appointmentId  && (dx.appointmentId  === appointmentId  || dx.dataJson?.appointmentId  === appointmentId  || dx.metadataJson?.appointmentId === appointmentId)) return true;
      try {
        const examDate = new Date(dx.createdAt);
        const today    = new Date();
        if (examDate.getFullYear() === today.getFullYear() && examDate.getMonth() === today.getMonth() && examDate.getDate() === today.getDate()) return true;
      } catch { /* ignore */ }
      return false;
    });
  }, [patientDiagnostics, sessionExamIds, consultationId, appointmentId]);

  const activeList    = scopeTab === "current" ? currentConsultationDiagnostics : patientDiagnostics;
  const imagingExams  = activeList.filter((d) => d.type === "IMAGING");
  const labExams      = activeList.filter((d) => d.type === "LAB");

  const selectedExam = useMemo(() => {
    if (selectedExamId) {
      const found = activeList.find((e) => e.id === selectedExamId) || patientDiagnostics.find((e) => e.id === selectedExamId);
      if (found) return found;
    }
    return activeList.length > 0 ? activeList[0] : null;
  }, [selectedExamId, activeList, patientDiagnostics]);

  /* ── Actions ── */
  const handleOpenExamion = async () => {
    if (!patient?.id) return;
    try {
      toast.loading("A comunicar com Examion RX...", { id: "examion-rx" });
      const res  = await fetch("/api/gdt/ver-rx", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ patientId: patient.id }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao contactar Examion");
      toast.success(data.message || "Ficheiro enviado para o Examion RX!", { id: "examion-rx" });
    } catch (err: any) {
      toast.error(err.message || "Não foi possível abrir o Examion RX", { id: "examion-rx" });
    }
  };

  const handleQuickRequest = async (type: "LAB" | "IMAGING", source: string, testName: string) => {
    setRequesting(testName);
    try {
      const newExam = await onRequestExam(type, source, testName);
      if (newExam?.id) setSelectedExamId(newExam.id);
      setScopeTab("current");
    } catch { /* handled by parent */ } finally {
      setRequesting(null);
    }
  };

  const handleCopyNotes = (exam: DiagnosticResult) => {
    let note = "";
    if (exam.type === "IMAGING") {
      note = `[${exam.summary || exam.testName} (${exam.source})] Realizado em ${format(new Date(exam.createdAt), "dd/MM/yyyy HH:mm")}. Sem alterações radiográficas significativas observadas.`;
    } else {
      const params   = exam.dataJson?.parameters || [];
      const abnormal = params.filter((p: any) => p.isAbnormal);
      note = abnormal.length > 0
        ? `[${exam.summary || exam.testName}] Alterações: ${abnormal.map((p: any) => `${p.name}: ${p.value} ${p.unit}`).join(", ")}.`
        : `[${exam.summary || exam.testName}] Parâmetros dentro dos limites normais de referência.`;
    }
    if (onInsertToNotes) {
      onInsertToNotes(note);
      toast.success("Resumo clínico inserido nas notas de diagnóstico!");
    } else {
      navigator.clipboard.writeText(note);
      toast.success("Copiado para a área de transferência!");
    }
    setCopiedNote(true);
    setTimeout(() => setCopiedNote(false), 2000);
  };

  /* ════════════════════════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════════════════════════ */
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogPortal>
        {/* Overlay */}
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        {/* Content — full screen, bypassing shadcn's sm:max-w-sm */}
        <DialogPrimitive.Content
          className="
            fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2
            z-50
            w-[98vw] h-[95vh]
            rounded-2xl border border-white/10
            bg-slate-950
            shadow-2xl shadow-black/60
            p-0 overflow-hidden flex flex-col
            outline-none
            data-[state=open]:animate-in data-[state=closed]:animate-out
            data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0
            data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95
          "
        >

        {/* ══════════════════════ TOP BAR ══════════════════════ */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-900 border-b border-white/8 shrink-0 gap-4">

          {/* Title + patient pill */}
          <div className="flex items-center gap-4 min-w-0">
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                <Microscope size={18} strokeWidth={2} />
              </div>
              <div>
                <h2 className="text-sm font-black text-white tracking-tight leading-none">Exames Complementares</h2>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">Visualizador HL7 &amp; DICOM</p>
              </div>
            </div>

            {patient && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 min-w-0">
                <Stethoscope size={13} className="text-blue-400 shrink-0" />
                <div className="leading-tight min-w-0">
                  <p className="text-xs font-bold text-blue-300 truncate">{patient.name}</p>
                  <p className="text-[10px] text-blue-400/70 font-medium truncate">
                    {patient.species}{patient.breed ? ` · ${patient.breed}` : ""}{patient.microchip ? ` · #${patient.microchip}` : ""}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Scope toggle */}
          <div className="flex items-center gap-1 bg-slate-800/80 border border-white/8 rounded-xl p-1 shrink-0">
            {(["current", "all"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setScopeTab(tab)}
                className={cn(
                  "px-4 py-1.5 rounded-lg text-xs font-bold transition-all",
                  scopeTab === tab
                    ? "bg-purple-600 text-white shadow-sm shadow-purple-900/50"
                    : "text-slate-400 hover:text-slate-200"
                )}
              >
                {tab === "current" ? "Esta Consulta" : "Histórico Completo"}
                <span className={cn(
                  "ml-2 px-1.5 py-0.5 rounded-md text-[10px] font-black",
                  scopeTab === tab ? "bg-white/20 text-white" : "bg-slate-700 text-slate-300"
                )}>
                  {tab === "current" ? currentConsultationDiagnostics.length : patientDiagnostics.length}
                </span>
              </button>
            ))}
          </div>

          {/* Close */}
          <Button size="icon" variant="ghost" onClick={onClose}
            className="h-9 w-9 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 shrink-0">
            <X size={18} />
          </Button>
        </div>

        {/* ══════════════════════ MAIN LAYOUT ══════════════════════ */}
        <div className="flex-1 flex min-h-0 overflow-hidden">

          {/* ── LEFT SIDEBAR ── */}
          <div className="w-72 shrink-0 flex flex-col border-r border-white/8 bg-slate-900/50 overflow-hidden">

            {/* Section: Imagiologia */}
            <div className="flex flex-col">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-slate-900/70">
                <div className="flex items-center gap-2">
                  <ImageIcon size={13} className="text-emerald-400" />
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">Imagiologia</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{imagingExams.length}</span>
              </div>

              {imagingExams.length === 0 ? (
                <p className="px-4 py-3 text-[11px] text-slate-600 italic">Nenhum exame de imagem</p>
              ) : (
                imagingExams.map((dx) => {
                  const isSelected = selectedExam?.id === dx.id;
                  return (
                    <button key={dx.id} onClick={() => setSelectedExamId(dx.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 border-b border-white/5 transition-all flex items-center gap-3",
                        isSelected
                          ? "bg-emerald-600/15 border-l-[3px] border-l-emerald-500"
                          : "hover:bg-slate-800/60 border-l-[3px] border-l-transparent"
                      )}>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-emerald-500/20 text-emerald-400" : "bg-slate-800 text-slate-500")}>
                        <ImageIcon size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-bold truncate", isSelected ? "text-white" : "text-slate-300")}>
                          {dx.summary ?? dx.testName ?? "Imagem"}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {dx.source} · {format(new Date(dx.createdAt), "dd/MM HH:mm")}
                        </p>
                      </div>
                      <StatusDot status={dx.status} />
                    </button>
                  );
                })
              )}
            </div>

            {/* Section: Laboratório */}
            <div className="flex flex-col border-t border-white/8">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 bg-slate-900/70">
                <div className="flex items-center gap-2">
                  <FlaskConical size={13} className="text-purple-400" />
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-wider">Laboratório</span>
                </div>
                <span className="text-[10px] font-bold text-slate-500">{labExams.length}</span>
              </div>

              {labExams.length === 0 ? (
                <p className="px-4 py-3 text-[11px] text-slate-600 italic">Nenhuma análise laboratorial</p>
              ) : (
                labExams.map((dx) => {
                  const isSelected  = selectedExam?.id === dx.id;
                  const params      = dx.dataJson?.parameters || [];
                  const alertCount  = params.filter((p: any) => p.isAbnormal).length;
                  return (
                    <button key={dx.id} onClick={() => setSelectedExamId(dx.id)}
                      className={cn(
                        "w-full text-left px-4 py-3 border-b border-white/5 transition-all flex items-center gap-3",
                        isSelected
                          ? "bg-purple-600/15 border-l-[3px] border-l-purple-500"
                          : "hover:bg-slate-800/60 border-l-[3px] border-l-transparent"
                      )}>
                      <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        isSelected ? "bg-purple-500/20 text-purple-400" : "bg-slate-800 text-slate-500")}>
                        <FlaskConical size={14} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={cn("text-xs font-bold truncate", isSelected ? "text-white" : "text-slate-300")}>
                          {dx.summary ?? dx.testName ?? "Análise"}
                        </p>
                        <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {dx.source} · {format(new Date(dx.createdAt), "dd/MM HH:mm")}
                        </p>
                      </div>
                      {alertCount > 0 ? (
                        <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 shrink-0">{alertCount}↑</span>
                      ) : (
                        <StatusDot status={dx.status} />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Quick Request Footer */}
            <div className="mt-auto border-t border-white/8 p-3 bg-slate-900/70 shrink-0">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
                <Sparkles size={10} className="text-purple-400" /> Requisitar Novo Exame
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { type: "IMAGING" as const, source: "Examion RX",  name: "RX Tórax",           color: "emerald" },
                  { type: "IMAGING" as const, source: "Examion RX",  name: "RX Abdómen",          color: "emerald" },
                  { type: "LAB"     as const, source: "Fuji DX-500", name: "Hemograma Completo",  label: "Hemograma",  color: "purple" },
                  { type: "LAB"     as const, source: "Fuji DX-500", name: "Bioquímica 12",       label: "Bioquímica", color: "purple" },
                ].map((item) => (
                  <button key={item.name} onClick={() => handleQuickRequest(item.type, item.source, item.name)}
                    disabled={requesting === item.name}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-2 rounded-lg text-[11px] font-bold transition-all border",
                      requesting === item.name ? "opacity-50 cursor-not-allowed" :
                      item.color === "emerald"
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                        : "bg-purple-500/10 border-purple-500/20 text-purple-400 hover:bg-purple-500/20"
                    )}>
                    <Plus size={11} />
                    {("label" in item ? item.label : null) ?? item.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT PANEL: Viewer ── */}
          <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
            {selectedExam ? (
              <>
                {/* ── Viewer Toolbar ── */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-900/80 border-b border-white/8 shrink-0 gap-4">
                  {/* Exam info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={cn(
                      "px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider shrink-0",
                      selectedExam.type === "IMAGING"
                        ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                        : "bg-purple-500/15 text-purple-400 border border-purple-500/25"
                    )}>
                      {selectedExam.type === "IMAGING" ? "Imagiologia" : "Laboratório"}
                    </span>
                    <div className="min-w-0">
                      <h3 className="text-sm font-black text-white leading-tight truncate">{selectedExam.summary || selectedExam.testName}</h3>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                        {selectedExam.source} &nbsp;·&nbsp; {format(new Date(selectedExam.createdAt), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}
                      </p>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    {selectedExam.type === "IMAGING" && (
                      <>
                        {/* Zoom controls */}
                        <div className="flex items-center gap-0.5 bg-slate-800 border border-white/8 rounded-lg px-1">
                          <button onClick={() => setZoom((z) => Math.max(z - 0.25, 0.5))} className="p-1.5 text-slate-400 hover:text-white" title="Diminuir"><ZoomOut size={14} /></button>
                          <span className="text-[11px] font-mono text-slate-300 px-1.5 min-w-[42px] text-center">{Math.round(zoom * 100)}%</span>
                          <button onClick={() => setZoom((z) => Math.min(z + 0.25, 3))} className="p-1.5 text-slate-400 hover:text-white" title="Aumentar"><ZoomIn size={14} /></button>
                          <div className="w-px h-4 bg-white/10 mx-0.5" />
                          <button onClick={() => { setZoom(1); setRotation(0); setIsInverted(false); setContrastLevel("normal"); }} className="p-1.5 text-slate-400 hover:text-white" title="Repor"><RotateCcw size={13} /></button>
                        </div>

                        <button onClick={() => setIsInverted((v) => !v)}
                          className={cn("px-3 py-1.5 rounded-lg text-[11px] font-bold border transition-all",
                            isInverted ? "bg-white text-slate-950 border-white" : "bg-slate-800 text-slate-300 border-white/10 hover:bg-slate-700")}>
                          Inv P/B
                        </button>

                        <button onClick={() => setContrastLevel((c) => c === "normal" ? "high" : c === "high" ? "bone" : "normal")}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold bg-slate-800 border border-white/10 text-slate-300 hover:bg-slate-700 transition-all">
                          <SunMedium size={12} />
                          {contrastLevel === "normal" ? "Normal" : contrastLevel === "high" ? "Alto Contraste" : "Janela Óssea"}
                        </button>

                        <Button size="sm" onClick={handleOpenExamion}
                          className="h-8 text-xs font-bold rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white gap-1.5 border-0">
                          <ExternalLink size={13} /> Examion RX
                        </Button>
                      </>
                    )}

                    <Button size="sm" variant="outline" onClick={() => handleCopyNotes(selectedExam)}
                      className="h-8 text-xs font-semibold rounded-xl bg-slate-800 border-white/10 text-slate-200 hover:bg-slate-700 gap-1.5">
                      {copiedNote ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                      {onInsertToNotes ? "Inserir nas Notas" : "Copiar Resumo"}
                    </Button>
                  </div>
                </div>

                {/* ── View Area ── */}
                <div className="flex-1 overflow-hidden flex flex-col p-5 gap-4">

                  {selectedExam.type === "IMAGING" ? (
                    /* ─── IMAGING VIEWER ─── */
                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                      {/* Canvas */}
                      <div className="flex-1 relative rounded-2xl bg-[#060a0f] border border-white/8 overflow-hidden flex items-center justify-center min-h-0 shadow-inner select-none">
                        {/* Overlay — patient metadata (top-left) */}
                        <div className="absolute top-4 left-4 z-10 font-mono text-[10px] text-emerald-400/90 leading-snug bg-black/70 p-2.5 rounded-xl border border-white/5 pointer-events-none">
                          <p className="font-black text-white text-[11px]">{patient?.name?.toUpperCase()} · {patient?.species?.toUpperCase()}</p>
                          <p>PID: {patient?.id?.slice(0, 8).toUpperCase()}</p>
                          {patient?.microchip && <p>CHIP: {patient.microchip}</p>}
                          <p className="text-emerald-300 mt-1">{selectedExam.summary?.toUpperCase() || selectedExam.testName?.toUpperCase()}</p>
                          <p>EXP: 65kV 2.5mAs · DICOM 1.4</p>
                          <p>{format(new Date(selectedExam.createdAt), "dd/MM/yyyy HH:mm:ss")}</p>
                        </div>

                        {/* Overlay — DICOM info (top-right) */}
                        <div className="absolute top-4 right-4 z-10 font-mono text-[10px] text-slate-400 bg-black/70 px-2.5 py-2 rounded-xl border border-white/5 pointer-events-none text-right">
                          <p className="text-white font-black">EXAMION WORKLIST</p>
                          <p>GDT 6311 · DICOM SR</p>
                          <p className="mt-1 text-[9px]">Z: {Math.round(zoom * 100)}% | {isInverted ? "INV" : "STD"}</p>
                        </div>

                        {/* Scale bar (bottom-right) */}
                        <div className="absolute bottom-4 right-4 z-10 pointer-events-none">
                          <svg width="90" height="30" viewBox="0 0 90 30">
                            <line x1="5" y1="20" x2="85" y2="20" stroke="#38bdf8" strokeWidth="2" />
                            <line x1="5" y1="14" x2="5" y2="26"  stroke="#38bdf8" strokeWidth="2" />
                            <line x1="85" y1="14" x2="85" y2="26" stroke="#38bdf8" strokeWidth="2" />
                            <text x="45" y="12" fill="#38bdf8" fontSize="9" fontFamily="monospace" textAnchor="middle">5 cm</text>
                          </svg>
                        </div>

                        {/* SVG anatomy visualisation */}
                        <div style={{
                          transform: `scale(${zoom}) rotate(${rotation}deg)`,
                          filter: `${isInverted ? "invert(1)" : "none"} ${
                            contrastLevel === "high" ? "contrast(1.6) brightness(1.1)" :
                            contrastLevel === "bone" ? "contrast(2.2) brightness(0.85) saturate(0)" :
                            "contrast(1.15)"
                          }`,
                          transition: "transform 0.15s ease-out, filter 0.2s ease",
                          width: "100%", maxWidth: "680px",
                        }}>
                          <svg viewBox="0 0 500 340" className="w-full h-full" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <rect width="500" height="340" rx="12" fill="#080c10" />
                            <circle cx="250" cy="170" r="160" fill="white" fillOpacity="0.03" />
                            {/* Spine */}
                            <g stroke="#b4c2ce" strokeWidth="2.5" opacity="0.85" strokeLinecap="round">
                              {[80,110,140,170,200,230,260,290,320,350,380,410].map((x, i) => (
                                <g key={i}>
                                  <rect x={x} y="82" width="20" height="13" rx="3" fill="#cbd5e1" fillOpacity="0.55" stroke="#94a3b8" strokeWidth="1.5" />
                                  <line x1={x+10} y1="95" x2={x+10} y2="104" stroke="#cbd5e1" strokeWidth="2" />
                                </g>
                              ))}
                            </g>
                            {/* Ribs */}
                            <g stroke="#cbd5e1" strokeWidth="2" opacity="0.6" strokeLinecap="round">
                              {[120,150,180,210,240,270,300,330].map((x, i) => (
                                <path key={i} d={`M ${x} 95 C ${x-12} 148, ${x+22} 192, ${x+44} 218`} fill="none" />
                              ))}
                            </g>
                            {/* Heart */}
                            <ellipse cx="235" cy="175" rx="58" ry="45" fill="white" fillOpacity="0.16" />
                            <ellipse cx="235" cy="175" rx="44" ry="34" fill="white" fillOpacity="0.22" />
                            {/* Diaphragm */}
                            <path d="M 290 100 Q 315 168 302 240" stroke="#94a3b8" strokeWidth="2.5" strokeDasharray="5 3" opacity="0.65" fill="none" />
                            {/* Forelimb */}
                            <g stroke="#e2e8f0" strokeWidth="5" strokeLinecap="round" opacity="0.7">
                              <path d="M 120 105 L 105 168 L 86 228" />
                              <circle cx="105" cy="168" r="7" fill="#f8fafc" />
                            </g>
                            {/* Trachea */}
                            <path d="M 250 55 L 250 90" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" opacity="0.4" />
                            <path d="M 250 90 C 240 110 220 125 210 140" stroke="#94a3b8" strokeWidth="3" opacity="0.3" fill="none" strokeLinecap="round" />
                            <path d="M 250 90 C 260 110 278 125 288 140" stroke="#94a3b8" strokeWidth="3" opacity="0.3" fill="none" strokeLinecap="round" />
                          </svg>
                        </div>
                      </div>

                      {/* Observation bar */}
                      <div className="flex items-start justify-between p-4 rounded-xl bg-slate-900/80 border border-white/8 shrink-0 gap-4">
                        <div className="flex items-start gap-3 min-w-0">
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-white mb-1">Observações Clínicas</p>
                            <p className="text-sm text-slate-300 leading-relaxed">
                              {selectedExam.metadataJson?.observations || "Campos pulmonares nítidos. Silhueta cardíaca dentro dos limites normais. Coluna torácica íntegra. Sem achados radiográficos significativos."}
                            </p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 font-bold text-[10px] shrink-0">
                          DICOM Verificado
                        </Badge>
                      </div>
                    </div>

                  ) : (
                    /* ─── LAB RESULTS VIEWER ─── */
                    <div className="flex-1 flex flex-col gap-4 min-h-0">
                      {/* Summary cards */}
                      <div className="grid grid-cols-3 gap-3 shrink-0">
                        <div className="p-4 rounded-xl bg-slate-900 border border-white/8">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Equipamento</p>
                          <p className="text-sm font-bold text-white">{selectedExam.source || "Analisador"}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Transmissão direta HL7</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-900 border border-white/8">
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Parâmetros</p>
                          <p className="text-sm font-bold text-white">{(selectedExam.dataJson?.parameters || []).length} analisados</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {(selectedExam.dataJson?.parameters || []).filter((p: any) => p.isAbnormal).length} fora do intervalo
                          </p>
                        </div>
                        <div className="p-4 rounded-xl border border-white/8"
                          style={{ background: (selectedExam.dataJson?.parameters || []).some((p: any) => p.isAbnormal) ? "rgb(239 68 68 / 0.08)" : "rgb(16 185 129 / 0.08)" }}>
                          <p className="text-[10px] font-black uppercase tracking-wider text-slate-500 mb-1">Estado Geral</p>
                          {(selectedExam.dataJson?.parameters || []).some((p: any) => p.isAbnormal) ? (
                            <>
                              <p className="text-sm font-black text-rose-400 flex items-center gap-1.5"><AlertCircle size={14} /> Com Alertas</p>
                              <p className="text-[11px] text-rose-400/70 mt-0.5">Verificar valores assinalados</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm font-black text-emerald-400 flex items-center gap-1.5"><CheckCircle2 size={14} /> Normal</p>
                              <p className="text-[11px] text-emerald-400/70 mt-0.5">Dentro dos valores de referência</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Parameters Table */}
                      <div className="flex-1 rounded-2xl border border-white/8 bg-slate-900/60 overflow-hidden flex flex-col min-h-0">
                        <div className="grid grid-cols-12 px-5 py-3 bg-slate-900 border-b border-white/8 text-[11px] font-black text-slate-400 uppercase tracking-wider shrink-0">
                          <span className="col-span-4">Parâmetro</span>
                          <span className="col-span-3 text-right">Resultado</span>
                          <span className="col-span-3 text-center">Ref. Min – Máx</span>
                          <span className="col-span-1 text-center">Unidade</span>
                          <span className="col-span-1 text-right">Estado</span>
                        </div>
                        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
                          {(selectedExam.dataJson?.parameters || [
                            { name: "Eritrócitos (RBC)",  value: 7.15, unit: "M/µL",    refMin: 5.5,  refMax: 8.5,   isAbnormal: false },
                            { name: "Leucócitos (WBC)",   value: 11.2, unit: "10³/µL",  refMin: 6.0,  refMax: 17.0,  isAbnormal: false },
                            { name: "Hemoglobina (HGB)",  value: 14.1, unit: "g/dL",    refMin: 12.0, refMax: 18.0,  isAbnormal: false },
                            { name: "Hematócrito (HCT)",  value: 43.0, unit: "%",       refMin: 37.0, refMax: 55.0,  isAbnormal: false },
                            { name: "Plaquetas (PLT)",    value: 260,  unit: "10³/µL",  refMin: 200,  refMax: 500,   isAbnormal: false },
                            { name: "Neutrófilos",        value: 65,   unit: "%",       refMin: 60,   refMax: 77,    isAbnormal: false },
                            { name: "Linfócitos",         value: 24,   unit: "%",       refMin: 12,   refMax: 30,    isAbnormal: false },
                            { name: "Monócitos",          value: 5,    unit: "%",       refMin: 3,    refMax: 10,    isAbnormal: false },
                            { name: "Eosinófilos",        value: 4,    unit: "%",       refMin: 0,    refMax: 9,     isAbnormal: false },
                            { name: "VCM",                value: 60,   unit: "fL",      refMin: 60,   refMax: 77,    isAbnormal: false },
                          ]).map((param: any, idx: number) => (
                            <div key={idx} className={cn(
                              "grid grid-cols-12 px-5 py-3.5 items-center transition-colors",
                              param.isAbnormal ? "bg-rose-500/5 hover:bg-rose-500/10" : "hover:bg-slate-800/40"
                            )}>
                              <span className={cn("col-span-4 text-sm font-semibold truncate", param.isAbnormal ? "text-rose-300" : "text-slate-200")}>
                                {param.name}
                              </span>
                              <span className={cn("col-span-3 text-right font-mono font-black text-base", param.isAbnormal ? "text-rose-300" : "text-white")}>
                                {param.value}
                              </span>
                              <span className="col-span-3 text-center text-slate-500 text-xs font-mono">
                                {param.refMin !== undefined && param.refMax !== undefined ? `${param.refMin} – ${param.refMax}` : "—"}
                              </span>
                              <span className="col-span-1 text-center text-slate-500 text-xs font-mono">{param.unit}</span>
                              <span className="col-span-1 text-right">
                                {param.isAbnormal ? (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-rose-400 bg-rose-500/15 px-2 py-1 rounded-lg border border-rose-500/20">
                                    <AlertCircle size={10} /> ALERTA
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
                                    <CheckCircle2 size={10} /> OK
                                  </span>
                                )}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* ─── EMPTY STATE ─── */
              <div className="flex-1 flex flex-col items-center justify-center gap-6 text-center p-8">
                <div className="w-20 h-20 rounded-3xl bg-slate-900 border border-white/8 flex items-center justify-center text-slate-700">
                  {activeList.length === 0 ? <Layers size={36} strokeWidth={1.5} /> : <Eye size={36} strokeWidth={1.5} />}
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-300 mb-2">
                    {activeList.length === 0
                      ? scopeTab === "current" ? "Nenhum exame nesta consulta" : "Sem registos de exames"
                      : "Selecione um exame"}
                  </h4>
                  <p className="text-sm text-slate-500 max-w-md">
                    {activeList.length === 0
                      ? "Utilize os botões abaixo para requisitar exames de imagiologia (RX) ou análises laboratoriais, que ficarão associados a esta consulta."
                      : "Clique num exame no painel esquerdo para visualizar os resultados."}
                  </p>
                </div>
                {activeList.length === 0 && (
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { type: "IMAGING" as const, source: "Examion RX",  name: "RX Tórax",          icon: <ImageIcon size={15} />,    color: "emerald" },
                      { type: "IMAGING" as const, source: "Examion RX",  name: "RX Abdómen",         icon: <ImageIcon size={15} />,    color: "emerald" },
                      { type: "LAB"     as const, source: "Fuji DX-500", name: "Hemograma Completo", label: "Hemograma",  icon: <FlaskConical size={15} />, color: "purple" },
                      { type: "LAB"     as const, source: "Fuji DX-500", name: "Bioquímica 12",      label: "Bioquímica", icon: <FlaskConical size={15} />, color: "purple" },
                    ].map((item) => (
                      <button key={item.name} onClick={() => handleQuickRequest(item.type, item.source, item.name)}
                        disabled={requesting === item.name}
                        className={cn(
                          "flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all border",
                          item.color === "emerald"
                            ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-purple-500/10 border-purple-500/25 text-purple-400 hover:bg-purple-500/20"
                        )}>
                        {item.icon} + {("label" in item ? item.label : null) ?? item.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ══════════════════════ STATUS BAR ══════════════════════ */}
        <div className="flex items-center justify-between px-5 py-2 bg-slate-900 border-t border-white/5 shrink-0">
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
              Examion RX · GDT 6302/6311
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse inline-block" style={{ animationDelay: "0.5s" }} />
              Fuji DX-500 · HL7 v2.5
            </div>
          </div>
          <p className="text-[11px] text-slate-600">
            {currentConsultationDiagnostics.length} nesta consulta · {patientDiagnostics.length} no total do animal
          </p>
        </div>
        </DialogPrimitive.Content>
      </DialogPortal>
    </Dialog>
  );
}
