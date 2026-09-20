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
  ArrowUpRight
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
import { ClinicalTimeline } from "@/components/ClinicalTimeline";
import { format, isPast, differenceInDays, differenceInYears, differenceInMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ClinicalSummaryBanner } from "@/components/ClinicalSummaryBanner";
import { PremiumCard } from "@/components/PremiumCard";
import { isFeatureEnabled } from "@/lib/features";
import { toast } from "sonner";
import type { Vaccination, VitalSign, Prescription } from "@/types";

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

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 max-w-[1600px] mx-auto">
        <div className="flex items-start gap-5">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="rounded-2xl h-12 w-12 bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 hover:scale-105 transition-all mt-1"
          >
            <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
          </Button>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tight">
                {patient.name}
              </h1>
              <Badge variant={patient.status === "ACTIVE" ? "default" : "secondary"} 
                className="rounded-full px-3 py-1 bg-blue-600/10 text-blue-600 border-blue-200 dark:border-blue-900/50 text-xs font-bold uppercase tracking-wider">
                {patient.status === "ACTIVE" ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-base">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <SpeciesIcon size={16} className="text-blue-500" />
                <span className="capitalize">{patient.species}</span>
              </div>
              {patient.breed && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                  <span>{patient.breed}</span>
                </div>
              )}
              <div className={cn("flex items-center gap-1.5 px-2.5 py-1 rounded-lg shadow-sm ring-1",
                isFemale
                  ? "bg-pink-50 dark:bg-pink-950/40 text-pink-700 dark:text-pink-300 ring-pink-200 dark:ring-pink-900/40"
                  : "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 ring-blue-200 dark:ring-blue-900/40"
              )}>
                <GenderIcon size={15} className={isFemale ? "text-pink-500" : "text-blue-500"} strokeWidth={2.5} />
                <span className="font-semibold text-xs">{isFemale ? "Fêmea" : "Macho"}</span>
              </div>
              {patient.aggressionLevel && (
                <div className={cn("flex items-center gap-1.5 px-3 py-1 rounded-lg shadow-sm font-bold text-xs uppercase tracking-wider text-white",
                  isDocil ? "bg-emerald-600 shadow-emerald-500/20" :
                  isNervoso ? "bg-amber-500 shadow-amber-500/20 text-slate-950 font-black" :
                  "bg-rose-600 shadow-rose-500/20"
                )}>
                  <tempDisplay.icon size={13} className={isNervoso ? "text-slate-950" : "text-white"} strokeWidth={2.5} />
                  <span>{tempDisplay.label}</span>
                </div>
              )}
              {patient.owner?.name && (
                <Link
                  href={`/dashboard/customers/${patient.owner?.id || patient.ownerId}`}
                  className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 hover:ring-blue-400 dark:hover:ring-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-all group"
                  title="Ver perfil do tutor"
                >
                  <User size={14} className="text-purple-500 group-hover:text-blue-600 transition-colors" />
                  <span className="font-semibold text-xs text-slate-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400">
                    {patient.owner.name}
                  </span>
                  <ArrowUpRight size={13} className="text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </Link>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
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
            className="rounded-xl h-12 px-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/80 shadow-sm gap-2 transition-all active:scale-95"
          >
            <Edit3 size={16} /> Editar Ficha
          </Button>
          <Button 
            onClick={() => router.push(`/dashboard/consultations?patientId=${patientId}`)}
            size="lg" 
            className="rounded-xl h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-lg shadow-blue-500/20 gap-2 transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} /> Nova Consulta
          </Button>
          {isFeatureEnabled("gdtIntegration") && (
            <>
              <Button
                onClick={() => handleGdtSend("/api/gdt/fazer-rx", "fazer-rx")}
                disabled={rxLoading !== null}
                size="lg"
                title="Envia ficha do paciente para a worklist do RX Examion"
                className="rounded-xl h-12 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-white font-bold shadow-lg shadow-emerald-500/20 gap-2 transition-all active:scale-95"
              >
                {rxLoading === "fazer-rx" ? <Loader2 size={18} className="animate-spin" /> : <Radio size={18} />}
                Fazer RX
              </Button>
              <Button
                onClick={() => handleGdtSend("/api/gdt/ver-rx", "ver-rx")}
                disabled={rxLoading !== null}
                variant="outline"
                size="lg"
                title="Abre o visualizador de imagens arquivadas no RX Examion"
                className="rounded-xl h-12 px-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-bold hover:bg-slate-50 dark:hover:bg-slate-800/80 disabled:opacity-60 shadow-sm gap-2 transition-all active:scale-95"
              >
                {rxLoading === "ver-rx" ? <Loader2 size={18} className="animate-spin" /> : <ScanLine size={18} />}
                Ver RX
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ── Clinical Summary Banner ── */}
      <div className="max-w-[1600px] mx-auto">
        <ClinicalSummaryBanner patientId={patientId} fallbackGender={patient.gender} />
      </div>

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 max-w-[1600px] mx-auto items-start">
        
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
                  <TabsTrigger value="lab" className="rounded-xl flex-1 px-3 h-full font-bold text-xs uppercase tracking-wider data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm transition-all justify-center">
                    Análises
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

                {/* ── LABORATÓRIO (Análises) ── */}
                <TabsContent value="lab" className="m-0 space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/10 p-5 rounded-2xl ring-1 ring-indigo-100 dark:ring-indigo-900/30">
                    <div>
                      <h4 className="text-lg font-bold text-slate-900 dark:text-white">Análises Laboratoriais</h4>
                      <p className="text-sm text-slate-500 font-medium">Resultados integrados dos equipamentos locais.</p>
                    </div>
                  </div>
                  <LabChartsViewer results={labResults} />
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
    </div>
  );
}
