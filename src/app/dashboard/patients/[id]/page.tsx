"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, PawPrint, User, Phone, Mail, Calendar, Activity,
  Stethoscope, Syringe, AlertCircle, Dog, Cat, FileText, Heart,
  Thermometer, Weight, Plus, Pill, Shield, TrendingUp, Info, Clock, 
  Sparkles, ChevronRight, Microscope, Edit3, Radio, ScanLine, Loader2,
  CheckCircle2, WifiOff, Venus, Mars, ShieldAlert, ShieldCheck, Zap,
  ArrowUpRight, ImageIcon, Eye, ExternalLink
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VaccinationForm } from "@/components/forms/VaccinationForm";
import { VitalSignsForm } from "@/components/forms/VitalSignsForm";
import { PrescriptionForm } from "@/components/forms/PrescriptionForm";
import { LabChartsViewer } from "@/components/patients/LabChartsViewer";
import { ExamVisualizerModal } from "@/components/consultations/ExamVisualizerModal";
import { ClinicalTimeline } from "@/components/ClinicalTimeline";
import { format, isPast, differenceInDays, differenceInYears, differenceInMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ClinicalSummaryBanner } from "@/components/ClinicalSummaryBanner";
import { PremiumCard } from "@/components/PremiumCard";
import { isFeatureEnabled } from "@/lib/features";
import { toast } from "sonner";
import type { Vaccination, VitalSign, Prescription, DiagnosticResult } from "@/types";

// ── GDT send helper ───────────────────────────────────────────────────────

async function sendGdt(endpoint: string, patientId: string): Promise<{
  success: boolean;
  written: boolean;
  target?: string;
  gdtContent?: string;
  message: string;
}> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ patientId }),
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({ error: "Erro ao gerar GDT" }));
    throw new Error(e.error || "Erro ao gerar GDT");
  }
  return res.json();
}

function triggerDownload(base64: string, filename = "mgpcs.gdt") {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const blob = new Blob([bytes], { type: "application/octet-stream" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

type GdtAction = "fazer-rx" | "ver-rx";
const RX_LOADING_MAP: Record<GdtAction, string> = {
  "fazer-rx": "A enviar pedido para o RX...",
  "ver-rx": "A consultar arquivo RX...",
};

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d: string | Date) => format(new Date(d), "dd MMM yyyy", { locale: pt });
const fmtFull = (d: string | Date) => format(new Date(d), "dd 'de' MMMM 'de' yyyy", { locale: pt });

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-slate-500 dark:text-slate-400 gap-3">
      <Icon size={36} strokeWidth={1.2} />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

function VaccineStatusBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <Badge variant="outline" className="text-[11px]">Sem reforço</Badge>;
  const d = new Date(expiresAt);
  const days = differenceInDays(d, new Date());
  if (isPast(d)) return <Badge className="bg-red-100 text-red-700 border-none text-[11px]">Expirada</Badge>;
  if (days <= 30) return <Badge className="bg-amber-100 text-amber-700 border-none text-[11px]">Em {days}d</Badge>;
  return <Badge className="bg-green-100 text-green-700 border-none text-[11px]">Válida</Badge>;
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const patientId = params?.id as string;
  const [dialog, setDialog] = useState<"vaccine" | "vitals" | "prescription" | "edit" | null>(null);
  const [rxLoading, setRxLoading] = useState<GdtAction | null>(null);

  async function handleGdtSend(endpoint: string, action: GdtAction) {
    setRxLoading(action);
    try {
      const result = await sendGdt(endpoint, patientId);
      if (result.written) {
        toast.success(result.message, {
          icon: <CheckCircle2 size={18} className="text-emerald-500" />,
          duration: 4000,
        });
      } else {
        toast.warning(result.message, {
          icon: <WifiOff size={18} className="text-amber-500" />,
          duration: 6000,
        });
        if (result.gdtContent) triggerDownload(result.gdtContent);
      }
    } catch (err) {
      toast.error(`Erro: ${err instanceof Error ? err.message : "Falha ao comunicar com RX"}`);
    } finally {
      setRxLoading(null);
    }
  }

  const [editForm, setEditForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "M",
    birthDate: "",
    microchip: "",
    status: "ACTIVE",
    allergies: "",
    aggressionLevel: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);

  // ── Patient base data ─────────────────────────────────────────────────────
  const { data: patient, isLoading, isError, error } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Erro"); }
      return res.json();
    },
    enabled: !!patientId,
  });

  // ── Clinical data ──────────────────────────────────────────────────
  const { data: vaccinations = [], refetch: refetchVax } = useQuery({
    queryKey: ["vaccinations", patientId],
    queryFn: async () => { const r = await fetch(`/api/patients/${patientId}/vaccinations`); return r.ok ? r.json() : []; },
    enabled: !!patientId,
  });

  const { data: vitals = [], refetch: refetchVitals } = useQuery({
    queryKey: ["vitals", patientId],
    queryFn: async () => { const r = await fetch(`/api/patients/${patientId}/vitals`); return r.ok ? r.json() : []; },
    enabled: !!patientId,
  });

  const { data: prescriptions = [], refetch: refetchRx } = useQuery({
    queryKey: ["prescriptions-patient", patientId],
    queryFn: async () => { const r = await fetch(`/api/prescriptions?patientId=${patientId}`); return r.ok ? r.json() : []; },
    enabled: !!patientId,
  });

  const { data: labResults = [] } = useQuery({
    queryKey: ["labResults", patientId],
    queryFn: async () => { const r = await fetch(`/api/patients/${patientId}/lab`); return r.ok ? r.json() : []; },
    enabled: !!patientId,
  });

  // ── Diagnostics (Imagiologia / RX & Laboratório) ─────────────────────────
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | undefined>(undefined);
  const [examCategoryFilter, setExamCategoryFilter] = useState<"ALL" | "IMAGING" | "LAB">("ALL");

  const { data: rawDiagnostics = [], refetch: refetchDiagnostics } = useQuery<DiagnosticResult[]>({
    queryKey: ["patient-diagnostics", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/diagnostics?patientId=${patientId}`);
      if (!res.ok) return [];
      const json = await res.json();
      return Array.isArray(json) ? json : json.data || [];
    },
    enabled: !!patientId,
  });

  const diagnosticsList = Array.isArray(rawDiagnostics) ? rawDiagnostics : [];
  const imagingStudies = diagnosticsList.filter((d) => d.type === "IMAGING");
  const labStudies = diagnosticsList.filter((d) => d.type === "LAB");

  const handleRequestExam = async (type: "IMAGING" | "LAB", source: string, name: string) => {
    try {
      const res = await fetch("/api/diagnostics/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId, type, source, testName: name }),
      });
      if (res.ok) {
        toast.success(`Exame ${name} requisitado com sucesso!`);
        refetchDiagnostics();
      } else {
        toast.error("Não foi possível registar o pedido");
      }
    } catch {
      toast.error("Erro ao requisitar exame");
    }
  };

  const { data: history = [], isLoading: isHistoryLoading } = useQuery({
    queryKey: ["patient-history", patientId],
    queryFn: async () => { const r = await fetch(`/api/patients/${patientId}/history`); return r.ok ? r.json() : []; },
    enabled: !!patientId,
  });

  if (isLoading) return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <Skeleton className="h-10 w-32" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-96 rounded-3xl" />
        <Skeleton className="h-96 rounded-3xl md:col-span-2" />
      </div>
    </div>
  );

  if (isError || !patient) return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <AlertCircle size={48} className="text-red-500" />
      <h2 className="text-2xl font-bold">Erro ao carregar paciente</h2>
      <p className="text-slate-500 max-w-md">{error instanceof Error ? error.message : "Não foi possível carregar os dados."}</p>
      <Button onClick={() => router.push("/dashboard/patients")}>Voltar para Lista</Button>
    </div>
  );

  const speciesLower = patient.species?.toLowerCase() || "";
  const isDog = speciesLower.includes("cão") || speciesLower.includes("can");
  const isCat = speciesLower.includes("gato") || speciesLower.includes("fel");
  const SpeciesIcon = isDog ? Dog : isCat ? Cat : PawPrint;
  const lastVital = vitals[0];

  const isFemale = patient.gender === "F" || patient.gender?.toLowerCase().includes("fêm") || patient.gender?.toLowerCase().includes("fem");
  const GenderIcon = isFemale ? Venus : Mars;

  const rawTemp = (patient.aggressionLevel || "").toLowerCase();
  const isDocil = rawTemp.includes("dócil") || rawTemp.includes("docil") || rawTemp.includes("baixo");
  const isNervoso = rawTemp.includes("nervoso") || rawTemp.includes("médio") || rawTemp.includes("medio");
  const isAgressivo = rawTemp.includes("agressivo") || rawTemp.includes("alto");

  const tempDisplay = isDocil
    ? { label: "Dócil", color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/15 ring-1 ring-emerald-500/30", badge: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-emerald-200 dark:ring-emerald-900/40", icon: ShieldCheck }
    : isNervoso
    ? { label: "Nervoso", color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/15 ring-1 ring-amber-500/30", badge: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 ring-amber-200 dark:ring-amber-900/40", icon: Zap }
    : isAgressivo
    ? { label: "Agressivo", color: "text-rose-600 dark:text-rose-400", bg: "bg-rose-500/15 ring-1 ring-rose-500/30", badge: "bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-rose-200 dark:ring-rose-900/40", icon: ShieldAlert }
    : { label: "Não definido", color: "text-slate-400", bg: "bg-slate-500/10", badge: "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 ring-slate-200 dark:ring-slate-700", icon: Activity };

  return (
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 md:p-8 lg:p-10 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header Context Bar (Consistent with Consultations) ── */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl ring-1 ring-slate-100 dark:ring-white/5 shadow-sm w-full">
        <div className="flex items-center gap-5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="rounded-2xl h-11 w-11 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shrink-0"
            title="Voltar"
          >
            <ArrowLeft size={18} />
          </Button>

          {/* Large Avatar with Gender Gradient & Initial */}
          <div className={cn(
            "w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl transition-all duration-300 hover:scale-105 hover:rotate-2 shrink-0 ring-4 ring-slate-100 dark:ring-white/10 relative overflow-hidden",
            isFemale
              ? "bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 text-white shadow-pink-500/25"
              : "bg-gradient-to-br from-blue-600 via-indigo-600 to-cyan-600 text-white shadow-blue-500/25"
          )}>
            <span>{patient.name?.[0]?.toUpperCase() || "?"}</span>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
          </div>

          <div>
            {/* Top row: Name + Species + Gender + Breed + Temperament + Status */}
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">
                {patient.name}
              </h1>

              {/* Species */}
              <Badge className="bg-blue-600 text-white border-none font-semibold text-xs px-3 py-1 rounded-lg">
                {patient.species}
              </Badge>

              {/* Gender */}
              <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1",
                isFemale
                  ? "border-pink-300 text-pink-700 bg-pink-50 dark:bg-pink-950/30 dark:border-pink-800 dark:text-pink-300"
                  : "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300"
              )}>
                <GenderIcon size={12} strokeWidth={2.5} />
                <span>{isFemale ? "Fêmea" : "Macho"}</span>
              </Badge>

              {/* Breed (após espécie e sexo) */}
              {patient.breed && (
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 rounded-lg border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50">
                  {patient.breed}
                </Badge>
              )}

              {/* Temperament */}
              {patient.aggressionLevel && (
                <Badge className={cn("text-xs font-bold px-2.5 py-1 rounded-lg border-none flex items-center gap-1 shadow-sm",
                  isDocil ? "bg-emerald-600 text-white shadow-emerald-500/20" :
                  isNervoso ? "bg-amber-500 text-slate-950 font-black shadow-amber-500/20" :
                  "bg-rose-600 text-white shadow-rose-500/20"
                )}>
                  <tempDisplay.icon size={12} strokeWidth={2.5} />
                  <span>{tempDisplay.label}</span>
                </Badge>
              )}

              {/* Status */}
              <Badge variant={patient.status === "ACTIVE" ? "default" : "secondary"} 
                className="rounded-lg px-2.5 py-1 text-xs font-bold uppercase tracking-wider">
                {patient.status === "ACTIVE" ? "Ativo" : "Inativo"}
              </Badge>
            </div>

            {/* Bottom row: Tutor Name first, then Phone, then Email */}
            <div className="flex flex-wrap items-center gap-3.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
              {/* Tutor (Nome primeiro) */}
              <Link 
                href={`/dashboard/customers/${patient.owner?.id || patient.ownerId}`}
                className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                title="Ficha do Tutor"
              >
                <User size={14} className="text-slate-400 shrink-0" />
                <span>{patient.owner?.name || "Sem tutor associado"}</span>
              </Link>

              {/* Contacto telefónico do tutor */}
              {patient.owner?.phone && (
                <>
                  <span className="opacity-25 text-slate-300 dark:text-slate-700">|</span>
                  <a 
                    href={`tel:${patient.owner.phone}`} 
                    className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Ligar para o tutor"
                  >
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{patient.owner.phone}</span>
                  </a>
                </>
              )}

              {/* E-mail do tutor */}
              {patient.owner?.email && (
                <>
                  <span className="opacity-25 text-slate-300 dark:text-slate-700">|</span>
                  <a 
                    href={`mailto:${patient.owner.email}`} 
                    className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Enviar e-mail"
                  >
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span>{patient.owner.email}</span>
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 shrink-0 self-end xl:self-auto">
          <Button
            onClick={() => {
              setEditForm({
                name: patient.name || "",
                species: patient.species || "",
                breed: patient.breed || "",
                gender: patient.gender || "M",
                birthDate: patient.birthDate ? patient.birthDate.split("T")[0] : "",
                microchip: patient.microchip || "",
                status: patient.status || "ACTIVE",
                allergies: patient.allergies || "",
                aggressionLevel: patient.aggressionLevel || "",
              });
              setDialog("edit");
            }}
            variant="outline"
            size="lg"
            className="rounded-xl h-11 px-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm gap-2 transition-all active:scale-95 text-xs"
          >
            <Edit3 size={15} /> Editar Ficha
          </Button>
          <Button 
            onClick={() => router.push(`/dashboard/consultations?patientId=${patientId}`)}
            size="lg" 
            className="rounded-xl h-11 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 gap-2 transition-all active:scale-95 text-xs"
          >
            <Plus size={16} strokeWidth={2.5} /> Nova Consulta
          </Button>
          {isFeatureEnabled("gdtIntegration") && (
            <>
              <Button
                onClick={() => handleGdtSend("/api/gdt/fazer-rx", "fazer-rx")}
                disabled={rxLoading !== null}
                size="lg"
                title="Envia ficha do paciente para a worklist do RX Examion"
                className="rounded-xl h-11 px-5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold shadow-lg shadow-emerald-500/20 gap-2 transition-all active:scale-95 text-xs"
              >
                {rxLoading === "fazer-rx" ? <Loader2 size={16} className="animate-spin" /> : <Radio size={16} />}
                Fazer RX
              </Button>
              <Button
                onClick={() => handleGdtSend("/api/gdt/ver-rx", "ver-rx")}
                disabled={rxLoading !== null}
                variant="outline"
                size="lg"
                title="Abre o visualizador de imagens arquivadas no RX Examion"
                className="rounded-xl h-11 px-5 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/80 disabled:opacity-60 shadow-sm gap-2 transition-all active:scale-95 text-xs"
              >
                {rxLoading === "ver-rx" ? <Loader2 size={16} className="animate-spin" /> : <ScanLine size={16} />}
                Ver RX
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Clinical Summary Banner ── */}
      <div className="w-full">
        <ClinicalSummaryBanner patientId={patientId} fallbackGender={patient.gender} />
      </div>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 w-full items-start">
        
        {/* Sidebar Column */}
        <div className="xl:col-span-3 space-y-6">
          {/* Contexto Médico */}
          <Card className="border-none shadow-lg bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl ring-1 ring-slate-200/60 dark:ring-slate-800 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Info size={14} strokeWidth={2.5} />
                </div>
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Contexto Médico</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {[
                { icon: Calendar, color: "text-amber-500",  bg: "bg-amber-500/10",  label: "Nascimento", val: patient.birthDate ? fmt(patient.birthDate) : "—" },
                { icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10", label: "Género",      val: patient.gender === "M" ? "Macho" : "Fêmea" },
                { icon: Weight,   color: "text-blue-500",   bg: "bg-blue-500/10",   label: "Peso Atual",   val: patient.weight ? `${patient.weight} kg` : "—" },
                { icon: FileText, color: "text-slate-500",  bg: "bg-slate-500/10",  label: "Microchip",    val: patient.microchip || "—" },
              ].map(({ icon: Icon, color, bg, label, val }) => (
                <div key={label} className="flex items-center gap-4">
                  <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0", bg)}>
                    <Icon size={20} className={color} />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{val}</p>
                  </div>
                </div>
              ))}

              {/* Temperamento */}
              <div className="flex items-center gap-4 pt-1">
                <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-all",
                  isDocil ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20" :
                  isNervoso ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20" :
                  isAgressivo ? "bg-rose-600 text-white shadow-md shadow-rose-500/20" :
                  "bg-slate-500/10 text-slate-400"
                )}>
                  <tempDisplay.icon size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Temperamento</p>
                  <span className={cn("inline-flex items-center text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider",
                    isDocil ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-900/40" :
                    isNervoso ? "bg-amber-50 text-amber-800 ring-1 ring-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-900/40" :
                    isAgressivo ? "bg-rose-50 text-rose-700 ring-1 ring-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:ring-rose-900/40" :
                    "bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400"
                  )}>
                    {tempDisplay.label}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alergias & Observações */}
          <Card className="border-none shadow-lg bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl ring-1 ring-slate-200/60 dark:ring-slate-800 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-rose-500/10 flex items-center justify-center text-rose-500 animate-pulse">
                  <AlertCircle size={14} strokeWidth={2.5} />
                </div>
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Alergias & Observações</CardTitle>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white"
                onClick={() => {
                  setEditForm({
                    name: patient.name || "",
                    species: patient.species || "",
                    breed: patient.breed || "",
                    gender: patient.gender || "M",
                    birthDate: patient.birthDate ? patient.birthDate.split("T")[0] : "",
                    microchip: patient.microchip || "",
                    status: patient.status || "ACTIVE",
                    allergies: patient.allergies || "",
                    aggressionLevel: patient.aggressionLevel || "",
                  });
                  setDialog("edit");
                }}
              >
                <Edit3 size={14} />
              </Button>
            </CardHeader>
            <CardContent className="p-6">
              {patient.allergies ? (
                <div className="p-4 rounded-2xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-rose-800 dark:text-rose-300">
                  <p className="text-sm font-semibold leading-relaxed whitespace-pre-wrap">{patient.allergies}</p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-4 text-slate-500 dark:text-slate-400 gap-2">
                  <Heart size={24} className="text-emerald-500/80" strokeWidth={1.5} />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Sem alergias ou observações.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responsável */}
          <Card className="border-none shadow-lg bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl ring-1 ring-slate-200/60 dark:ring-slate-800 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <User size={14} strokeWidth={2.5} />
                </div>
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Responsável</CardTitle>
              </div>
              {(patient.owner?.id || patient.ownerId) && (
                <Link
                  href={`/dashboard/customers/${patient.owner?.id || patient.ownerId}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 hover:underline transition-colors"
                >
                  Ver tutor
                  <ArrowUpRight size={14} />
                </Link>
              )}
            </CardHeader>
            <CardContent className="p-6 space-y-5">
               <div>
                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Nome Completo</p>
                  {(patient.owner?.id || patient.ownerId) ? (
                    <Link
                      href={`/dashboard/customers/${patient.owner?.id || patient.ownerId}`}
                      className="group inline-flex items-center gap-1.5 hover:text-blue-600 transition-colors"
                      title="Ver ficha do responsável"
                    >
                      <span className="text-base font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:underline underline-offset-2 transition-colors">
                        {patient.owner?.name || "—"}
                      </span>
                      <ArrowUpRight size={15} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                  ) : (
                    <p className="text-base font-bold text-slate-900 dark:text-white">{patient.owner?.name || "—"}</p>
                  )}
               </div>
               <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="w-9 h-9 rounded-lg bg-green-100/60 text-green-600 flex items-center justify-center shrink-0">
                    <Phone size={16} />
                  </div>
                  {patient.owner?.phone ? (
                    <a href={`tel:${patient.owner.phone}`} className="text-sm font-bold text-slate-900 dark:text-white hover:text-blue-600 hover:underline transition-colors">
                      {patient.owner.phone}
                    </a>
                  ) : (
                    <p className="text-sm font-bold text-slate-500">—</p>
                  )}
               </div>
               <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100/60 text-indigo-600 flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  {patient.owner?.email ? (
                    <a href={`mailto:${patient.owner.email}`} className="text-sm font-bold text-slate-900 dark:text-white truncate hover:text-blue-600 hover:underline transition-colors">
                      {patient.owner.email}
                    </a>
                  ) : (
                    <p className="text-sm font-bold text-slate-500 truncate">—</p>
                  )}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Column (Main Tabs) */}
        <div className="xl:col-span-9">
          <Card className="border-none shadow-lg bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl ring-1 ring-slate-200/60 dark:ring-slate-800 min-h-[600px] flex flex-col overflow-hidden">
            <Tabs defaultValue="history" className="w-full flex-1 flex flex-col">
              <div className="px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <TabsList className="bg-slate-100/70 dark:bg-slate-800/50 rounded-2xl p-1.5 h-12 w-full gap-1 flex">
                  <TabsTrigger value="history" className="rounded-xl flex-1 px-3 h-full font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all justify-center">
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="clinical" className="rounded-xl flex-1 px-3 h-full font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all justify-center">
                    Vacinas
                  </TabsTrigger>
                  <TabsTrigger value="vitals" className="rounded-xl flex-1 px-3 h-full font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all justify-center">
                    Biométricos
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions" className="rounded-xl flex-1 px-3 h-full font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all justify-center">
                    Receituário
                  </TabsTrigger>
                  <TabsTrigger value="lab" className="rounded-xl flex-1 px-3 h-full font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all justify-center gap-1.5">
                    <Microscope size={14} /> Exames (RX &amp; Análises)
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 p-6 overflow-y-auto">
                {/* ── HISTÓRICO (Timeline) ── */}
                <TabsContent value="history" className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
                  <ClinicalTimeline history={history} isLoading={isHistoryLoading} patientId={patientId} />
                </TabsContent>

                {/* ── VACINAS ── */}
                <TabsContent value="clinical" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10 p-5 rounded-2xl ring-1 ring-blue-100 dark:ring-blue-900/30">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Plano de Vacinação</h4>
                      <p className="text-sm text-slate-500 font-medium">Controlo e registo de vacinas e reforços.</p>
                    </div>
                    <Button size="sm" className="rounded-xl h-10 px-5 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 gap-2"
                      onClick={() => setDialog("vaccine")}>
                      <Plus size={16} strokeWidth={2.5} /> Nova Vacinação
                    </Button>
                  </div>
                  {vaccinations.length === 0 ? (
                    <EmptyState icon={Shield} text="Ainda não existem vacinas registadas." />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {vaccinations.map((v: any) => (
                        <div key={v.id} className="group flex items-center justify-between p-5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all shadow-sm">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-blue-100/50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Shield size={20} /></div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-base leading-tight">{v.vaccineName}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5 uppercase tracking-tighter">
                                {v.appliedAt ? fmt(v.appliedAt) : "Sem data"} {v.veterinarian?.name ? `· Dr. ${v.veterinarian.name}` : ""}
                              </p>
                            </div>
                          </div>
                          <VaccineStatusBadge expiresAt={v.expiresAt || null} />
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* ── BIOMÉTRICOS ── */}
                <TabsContent value="vitals" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 p-5 rounded-2xl ring-1 ring-slate-100 dark:ring-slate-800">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Sinais Vitais</h4>
                      <p className="text-sm text-slate-500 font-medium">Monitorização constante dos dados biométricos.</p>
                    </div>
                    <Button size="sm" className="rounded-xl h-10 px-5 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-bold shadow-lg gap-2"
                      onClick={() => setDialog("vitals")}>
                      <Plus size={16} strokeWidth={2.5} /> Registar Dados
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {vitals.length === 0 ? (
                      <EmptyState icon={Activity} text="Ainda não existem registos biométricos." />
                    ) : (
                      vitals.map((v: any) => (
                        <div key={v.id} className="p-5 rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4 shadow-sm">
                           <div className="flex flex-wrap gap-6 md:gap-8">
                              <div className="space-y-1">
                                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Peso</p>
                                 <p className="text-lg font-bold">{v.weight || "—"} kg</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Temp</p>
                                 <p className="text-lg font-bold">{v.temperature || "—"} °C</p>
                              </div>
                              {v.heartRate && (
                                <div className="space-y-1">
                                   <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">FC</p>
                                   <p className="text-lg font-bold">{v.heartRate} bpm</p>
                                </div>
                              )}
                              {v.respiratoryRate && (
                                <div className="space-y-1">
                                   <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">FR</p>
                                   <p className="text-lg font-bold">{v.respiratoryRate} rpm</p>
                                </div>
                              )}
                           </div>
                           <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-3 text-xs">{fmt(v.date || v.createdAt)}</Badge>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                {/* ── RECEITUÁRIO ── */}
                <TabsContent value="prescriptions" className="m-0 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  {prescriptions.length === 0 ? (
                    <EmptyState icon={Pill} text="Ainda não existem prescrições registadas." />
                  ) : (
                    prescriptions.map((rx: Prescription) => (
                      <div key={rx.id} className="rounded-2xl bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
                        {/* Header */}
                        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-xl bg-emerald-100/50 text-emerald-600 flex items-center justify-center">
                              <Pill size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-900 dark:text-white text-base">Receituário #{rx.id.slice(0, 8)}</p>
                              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                                {fmt(rx.createdAt)}
                                {rx.veterinarian?.name && ` · Dr. ${rx.veterinarian.name}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {rx.validUntil && (
                              <Badge className={cn(
                                "rounded-full text-[11px] px-3 py-1",
                                isPast(new Date(rx.validUntil))
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-none"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-none"
                              )}>
                                {isPast(new Date(rx.validUntil)) ? "Expirada" : `Válida até ${fmt(new Date(rx.validUntil))}`}
                              </Badge>
                            )}
                            <Badge className="rounded-full text-[11px] px-3 py-1 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-none">
                              {rx.items?.length || 0} medicamento{rx.items?.length !== 1 ? "s" : ""}
                            </Badge>
                          </div>
                        </div>
                        {/* Items */}
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                          {rx.items?.map((item, idx) => (
                            <div key={idx} className="px-5 py-4 flex flex-wrap items-start justify-between gap-4">
                              <div className="flex-1 min-w-[200px]">
                                <p className="font-bold text-slate-900 dark:text-white text-sm">{item.medicineName}</p>
                                {item.notes && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{item.notes}</p>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-4 text-xs">
                                <div className="text-center">
                                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dosagem</p>
                                  <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{item.dosage}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Frequência</p>
                                  <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{item.frequency}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Duração</p>
                                  <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{item.duration}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>

                {/* ── EXAMES COMPLEMENTARES (RX & Análises) ── */}
                <TabsContent value="lab" className="m-0 space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                  {/* Top Header Card */}
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-purple-500/10 dark:from-blue-950/40 dark:via-indigo-950/20 dark:to-purple-950/40 p-5 rounded-2xl ring-1 ring-blue-500/20">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                          <ScanLine size={20} strokeWidth={2.2} />
                        </div>
                        <div>
                          <h4 className="text-lg font-bold text-slate-900 dark:text-white">Exames Complementares (RX &amp; Análises)</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                            Radiografias digitais (DICOM / Examion) e análises clínicas integradas (HL7 / Fuji).
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedExamId(undefined);
                          setIsExamModalOpen(true);
                        }}
                        className="rounded-xl h-9 px-4 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-500/20 text-xs gap-1.5"
                      >
                        <Eye size={14} /> Abrir Visualizador Completo
                      </Button>
                    </div>
                  </div>

                  {/* Filter Sub-Bar */}
                  <div className="flex items-center justify-between gap-3 flex-wrap bg-slate-100/60 dark:bg-slate-800/40 p-1.5 rounded-2xl border border-slate-200/60 dark:border-white/5">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setExamCategoryFilter("ALL")}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all",
                          examCategoryFilter === "ALL"
                            ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                            : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                        )}
                      >
                        Todos os Exames ({diagnosticsList.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamCategoryFilter("IMAGING")}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all gap-1.5 inline-flex items-center",
                          examCategoryFilter === "IMAGING"
                            ? "bg-emerald-600 text-white shadow-xs"
                            : "text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
                        )}
                      >
                        <ImageIcon size={13} /> Radiologia / RX ({imagingStudies.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamCategoryFilter("LAB")}
                        className={cn(
                          "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all gap-1.5 inline-flex items-center",
                          examCategoryFilter === "LAB"
                            ? "bg-purple-600 text-white shadow-xs"
                            : "text-purple-700 dark:text-purple-400 hover:bg-purple-500/10"
                        )}
                      >
                        <Microscope size={13} /> Análises Laboratoriais ({labStudies.length || labResults.length})
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequestExam("IMAGING", "Examion RX", "RX Tórax")}
                        className="h-8 rounded-xl text-xs font-semibold border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/30 hover:bg-emerald-100 gap-1"
                      >
                        <Plus size={12} /> Requisitar RX (Examion)
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRequestExam("LAB", "Fuji DX-500", "Hemograma Completo")}
                        className="h-8 rounded-xl text-xs font-semibold border-purple-300 dark:border-purple-800 text-purple-700 dark:text-purple-300 bg-purple-50/50 dark:bg-purple-950/30 hover:bg-purple-100 gap-1"
                      >
                        <Plus size={12} /> Requisitar Hemograma
                      </Button>
                    </div>
                  </div>

                  {/* ── IMAGING / RX SECTION ── */}
                  {(examCategoryFilter === "ALL" || examCategoryFilter === "IMAGING") && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            Radiografias Digitais (RX / Imagiologia)
                          </h4>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold border-emerald-500/30 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30">
                          Examion RX · DICOM SR / GDT 6302
                        </Badge>
                      </div>

                      {imagingStudies.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {imagingStudies.map((study) => (
                            <div
                              key={study.id}
                              className="flex flex-col justify-between p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-white/10 hover:border-emerald-500/50 hover:shadow-md transition-all group"
                            >
                              <div className="space-y-3">
                                {/* Thumbnail preview container */}
                                <div
                                  onClick={() => {
                                    setSelectedExamId(study.id);
                                    setIsExamModalOpen(true);
                                  }}
                                  className="relative w-full h-36 rounded-xl bg-[#060a0f] border border-white/10 overflow-hidden flex items-center justify-center cursor-pointer group-hover:scale-[1.01] transition-transform"
                                >
                                  {/* Radiological mock preview */}
                                  <svg viewBox="0 0 300 180" className="w-full h-full opacity-70" fill="none">
                                    <circle cx="150" cy="90" r="70" fill="white" fillOpacity="0.04" />
                                    {/* Spine */}
                                    {[60, 90, 120, 150, 180, 210, 240].map((x, i) => (
                                      <rect key={i} x={x} y="45" width="16" height="8" rx="2" fill="#cbd5e1" fillOpacity="0.6" />
                                    ))}
                                    {/* Ribs */}
                                    {[90, 120, 150, 180, 210].map((x, i) => (
                                      <path key={i} d={`M ${x} 55 C ${x - 8} 90, ${x + 15} 120, ${x + 30} 140`} stroke="#cbd5e1" strokeWidth="1.5" strokeOpacity="0.5" fill="none" />
                                    ))}
                                    {/* Heart */}
                                    <ellipse cx="150" cy="100" rx="35" ry="25" fill="white" fillOpacity="0.2" />
                                  </svg>

                                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 text-[9px] font-mono text-emerald-400">
                                    DICOM · 65kV 2.5mAs
                                  </div>
                                  <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white font-bold text-xs backdrop-blur-[1px]">
                                    <Eye size={16} /> Abrir no Visualizador
                                  </div>
                                </div>

                                <div>
                                  <div className="flex items-center justify-between gap-2">
                                    <h5 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                                      {study.summary || study.testName}
                                    </h5>
                                    <Badge className="text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0">
                                      DICOM OK
                                    </Badge>
                                  </div>
                                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                                    {study.source} · {format(new Date(study.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: pt })}
                                  </p>
                                  <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-2 font-medium bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                    {study.metadataJson?.observations || "Campos pulmonares nítidos. Silhueta cardíaca dentro dos limites normais. Coluna torácica íntegra."}
                                  </p>
                                </div>
                              </div>

                              <div className="pt-3 mt-3 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setSelectedExamId(study.id);
                                    setIsExamModalOpen(true);
                                  }}
                                  className="w-full rounded-xl text-xs font-bold gap-1.5 h-8 bg-white dark:bg-slate-800 border-slate-200 dark:border-white/10"
                                >
                                  <Eye size={13} className="text-emerald-500" /> Ver Radiografia (DICOM)
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        /* Empty state when no RX yet */
                        <div className="p-8 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-white/10 flex flex-col items-center justify-center text-center gap-3">
                          <div className="w-12 h-12 rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                            <ImageIcon size={24} />
                          </div>
                          <div>
                            <h5 className="font-bold text-sm text-slate-800 dark:text-slate-200">Sem estudos radiográficos registados</h5>
                            <p className="text-xs text-slate-500 max-w-md mt-1">
                              Pode enviar o pedido diretamente para a estação Examion através do protocolo GDT.
                            </p>
                          </div>
                          <div className="flex items-center gap-2 pt-2">
                            <Button
                              size="sm"
                              onClick={() => handleRequestExam("IMAGING", "Examion RX", "RX Tórax")}
                              className="rounded-xl h-8 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5"
                            >
                              <Plus size={13} /> Requisitar RX Tórax
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleRequestExam("IMAGING", "Examion RX", "RX Abdómen")}
                              className="rounded-xl h-8 text-xs font-bold border-slate-300 dark:border-white/10 gap-1.5"
                            >
                              <Plus size={13} /> Requisitar RX Abdómen
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ── LAB SECTION ── */}
                  {(examCategoryFilter === "ALL" || examCategoryFilter === "LAB") && (
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-white/5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                          <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                            Análises Clínicas &amp; Tendências Laboratoriais
                          </h4>
                        </div>
                        <Badge variant="outline" className="text-[10px] font-bold border-purple-500/30 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30">
                          Fuji DX-500 · HL7 v2.5
                        </Badge>
                      </div>

                      <LabChartsViewer results={labResults} />
                    </div>
                  )}
                </TabsContent>

              </div>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <Dialog open={dialog === "vaccine"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
          <div className="bg-blue-600 p-6 text-white"><DialogHeader><DialogTitle className="text-xl font-bold flex items-center gap-3">Registar Vacinação</DialogTitle></DialogHeader></div>
          <div className="p-6"><VaccinationForm patientId={patientId} onSuccess={() => { setDialog(null); refetchVax(); }} /></div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "vitals"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
          <div className="bg-slate-900 dark:bg-slate-800 p-6 text-white"><DialogHeader><DialogTitle className="text-xl font-bold flex items-center gap-3">Registar Sinais Vitais</DialogTitle></DialogHeader></div>
          <div className="p-6"><VitalSignsForm patientId={patientId} onSuccess={() => { setDialog(null); refetchVitals(); }} /></div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "prescription"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
          <div className="bg-emerald-600 p-6 text-white"><DialogHeader><DialogTitle className="text-xl font-bold flex items-center gap-3">Criar Prescrição</DialogTitle></DialogHeader></div>
          <div className="p-6"><PrescriptionForm patientId={patientId} onSuccess={() => { setDialog(null); refetchRx(); }} /></div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "edit"} onOpenChange={(o) => !o && !isSaving && !isEnhancing && setDialog(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white flex justify-between items-center">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-3">
                <Edit3 size={20} /> Editar Ficha do Paciente
              </DialogTitle>
            </DialogHeader>
          </div>
          
          <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto relative">
            {isEnhancing && (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm z-50 flex flex-col items-center justify-center gap-3 animate-in fade-in duration-300">
                <div className="relative">
                  <div className="w-12 h-12 rounded-full border-4 border-blue-500/20 border-t-blue-600 animate-spin" />
                  <Sparkles size={20} className="absolute inset-0 m-auto text-blue-500 animate-pulse" />
                </div>
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tight">IA a aprimorar descrição clínica...</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Espécie</label>
                <input
                  type="text"
                  value={editForm.species}
                  onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Raça</label>
                <input
                  type="text"
                  value={editForm.breed}
                  onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Género</label>
                <select
                  value={editForm.gender}
                  onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="M">Macho</option>
                  <option value="F">Fêmea</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Data de Nascimento</label>
                <input
                  type="date"
                  value={editForm.birthDate}
                  onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Microchip</label>
                <input
                  type="text"
                  value={editForm.microchip}
                  onChange={(e) => setEditForm({ ...editForm, microchip: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Número do chip"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                >
                  <option value="ACTIVE">Ativo</option>
                  <option value="INACTIVE">Inativo</option>
                </select>
              </div>

              <div className="space-y-1.5 col-span-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Temperamento</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { val: "Dócil", active: "bg-emerald-600 text-white shadow-md shadow-emerald-500/20 ring-2 ring-emerald-500", inactive: "bg-slate-50 dark:bg-slate-950 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-50/50" },
                    { val: "Nervoso", active: "bg-amber-500 text-slate-950 font-black shadow-md shadow-amber-500/20 ring-2 ring-amber-400", inactive: "bg-slate-50 dark:bg-slate-950 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-50/50" },
                    { val: "Agressivo", active: "bg-rose-600 text-white shadow-md shadow-rose-500/20 ring-2 ring-rose-500", inactive: "bg-slate-50 dark:bg-slate-950 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/60 hover:bg-rose-50/50" },
                  ].map(({ val, active, inactive }) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEditForm({ ...editForm, aggressionLevel: editForm.aggressionLevel === val ? "" : val })}
                      className={cn(
                        "h-11 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2",
                        editForm.aggressionLevel === val ? active : inactive
                      )}
                    >
                      <span className={cn("w-2 h-2 rounded-full",
                        val === "Dócil" ? "bg-emerald-400" : val === "Nervoso" ? "bg-amber-400" : "bg-rose-400"
                      )} />
                      {val}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5 col-span-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Alergias & Observações Clínicas</label>
                  <Button
                    type="button"
                    onClick={async () => {
                      setIsEnhancing(true);
                      try {
                        const res = await fetch("/api/ai/enhance-description", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ patientId, text: editForm.allergies }),
                        });
                        if (res.ok) {
                          const data = await res.json();
                          if (data.text) {
                            setEditForm((prev) => ({ ...prev, allergies: data.text }));
                          }
                        }
                      } catch (err) {
                        console.error(err);
                      } finally {
                        setIsEnhancing(false);
                      }
                    }}
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 font-bold gap-1 rounded-lg"
                  >
                    <Sparkles size={12} /> Melhorar com IA
                  </Button>
                </div>
                <textarea
                  value={editForm.allergies}
                  onChange={(e) => setEditForm({ ...editForm, allergies: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none"
                  placeholder="Rascunho de observações, alergias, restrições alimentares..."
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog(null)}
                disabled={isSaving || isEnhancing}
                className="rounded-xl font-bold h-11 px-5"
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={async () => {
                  setIsSaving(true);
                  const sanitizedPayload = {
                    ...editForm,
                    microchip: editForm.microchip?.trim() || null,
                    allergies: editForm.allergies?.trim() || null,
                    aggressionLevel: editForm.aggressionLevel?.trim() || null,
                    birthDate: editForm.birthDate ? editForm.birthDate : null,
                  };

                  const savePromise = fetch(`/api/patients/${patientId}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(sanitizedPayload),
                  }).then(async (res) => {
                    const data = await res.json().catch(() => ({}));
                    if (!res.ok) {
                      throw new Error(data.error || "Erro ao guardar alterações");
                    }
                    return data;
                  });

                  toast.promise(savePromise, {
                    loading: "A guardar alterações da ficha...",
                    success: () => {
                      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
                      queryClient.invalidateQueries({ queryKey: ["clinical-summary", patientId] });
                      setDialog(null);
                      return "Ficha do paciente atualizada com sucesso!";
                    },
                    error: (err: any) => err?.message || "Não foi possível guardar as alterações",
                  });

                  try {
                    await savePromise;
                  } catch (err) {
                    console.error("[PATIENT_SAVE_ERROR]", err);
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving || isEnhancing}
                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 px-5 shadow-lg shadow-blue-500/20"
              >
                {isSaving ? "A Guardar..." : "Guardar Alterações"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ── Visualizador de Exames (DICOM / HL7) ── */}
      <ExamVisualizerModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        patient={patient}
        patientDiagnostics={diagnosticsList}
        initialSelectedId={selectedExamId}
        onRequestExam={handleRequestExam}
      />
    </div>
  );
}
