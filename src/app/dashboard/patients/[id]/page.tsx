"use client";

import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, PawPrint, User, Phone, Mail, Calendar, Activity,
  Stethoscope, Syringe, AlertCircle, Dog, Cat, FileText, Heart,
  Thermometer, Weight, Plus, Pill, Shield, TrendingUp, Info, Clock, 
  Sparkles, ChevronRight, Microscope, Edit3
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
import { format, isPast, differenceInDays, differenceInYears, differenceInMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useClinicalSummary } from "@/hooks/useClinicalSummary";
import { useAISummary } from "@/hooks/useAISummary";
import { PremiumCard } from "@/components/PremiumCard";
import type { Vaccination, VitalSign, Prescription } from "@/types";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d: string | Date) => format(new Date(d), "dd MMM yyyy", { locale: pt });
const fmtFull = (d: string | Date) => format(new Date(d), "dd 'de' MMMM 'de' yyyy", { locale: pt });

function EmptyState({ icon: Icon, text }: { icon: React.ComponentType<{ size?: number; strokeWidth?: number }>; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-slate-400 gap-3">
      <Icon size={36} strokeWidth={1.2} />
      <p className="text-sm font-medium">{text}</p>
    </div>
  );
}

function VaccineStatusBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) return <Badge variant="outline" className="text-[10px]">Sem reforço</Badge>;
  const d = new Date(expiresAt);
  const days = differenceInDays(d, new Date());
  if (isPast(d)) return <Badge className="bg-red-100 text-red-700 border-none text-[10px]">Expirada</Badge>;
  if (days <= 30) return <Badge className="bg-amber-100 text-amber-700 border-none text-[10px]">Em {days}d</Badge>;
  return <Badge className="bg-green-100 text-green-700 border-none text-[10px]">Válida</Badge>;
}

// ── Timeline Component ──
interface TimelineEvent {
  type: "CONSULTATION" | "VACCINE" | "EXAM" | string;
  date: string | Date;
  title: string;
  description: string;
  doctor?: string;
}

function ClinicalTimeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) return <EmptyState icon={Clock} text="Ainda não existem eventos no histórico clínico." />;

  return (
    <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-blue-500 before:via-slate-200 dark:before:via-slate-800 before:to-transparent">
      {events.map((event, i) => (
        <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group animate-in fade-in slide-in-from-left-4">
          {/* Dot */}
          <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white dark:border-slate-900 bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-blue-600 group-hover:text-white transition-all z-10 shrink-0 shadow-sm ring-4 ring-white dark:ring-slate-950">
            {event.type === "CONSULTATION" && <Stethoscope size={16} />}
            {event.type === "VACCINE" && <Syringe size={16} />}
            {event.type === "EXAM" && <Microscope size={16} />}
          </div>
          {/* Content */}
          <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-[2rem] bg-white dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all ml-6 md:ml-0 md:group-odd:mr-10 md:group-even:ml-10">
            <div className="flex items-center justify-between mb-2">
              <time className="text-[10px] font-black text-blue-500 uppercase tracking-widest">{fmt(event.date)}</time>
              <Badge variant="outline" className="text-[9px] uppercase tracking-tighter border-slate-200 dark:border-slate-700">{event.type}</Badge>
            </div>
            <h4 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{event.title}</h4>
            <p className="text-sm text-slate-500 font-medium mt-1 leading-relaxed">{event.description}</p>
            {event.doctor && (
               <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center"><User size={12} className="text-slate-400" /></div>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dr. {event.doctor}</span>
               </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Clinical Summary Banner Component ─────────────────────────────────────
function ClinicalSummaryBanner({ patientId }: { patientId: string }) {
  const { data: summary, isLoading: isLocalLoading } = useClinicalSummary(patientId);
  const [aiEnabled, setAiEnabled] = React.useState(false);
  const { data: aiSummary, isLoading: isAILoading } = useAISummary(patientId, aiEnabled);

  if (isLocalLoading) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 shadow-xl shadow-blue-500/10 animate-pulse">
        <div className="h-24 bg-white/10 rounded-2xl" />
      </div>
    );
  }

  if (!summary) return null;

  const hasAlerts = summary.safetyAlerts.length > 0 || summary.vaccines.expired.length > 0 || summary.deworming.overdue;
  const isLoadingAI = aiEnabled && isAILoading;

  return (
    <div className={`relative overflow-hidden rounded-3xl p-8 shadow-xl shadow-blue-500/10 group ${
      hasAlerts ? "bg-gradient-to-r from-blue-700 to-indigo-800" : "bg-gradient-to-r from-blue-600 to-indigo-700"
    }`}>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-32 translate-x-32 group-hover:bg-white/20 transition-all duration-700" />
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start justify-between gap-8">
        <div className="space-y-4 max-w-2xl">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="bg-white/20 p-2 rounded-xl text-white"><Sparkles size={18} /></div>
            <h3 className="text-lg font-bold text-white">Resumo Clínico</h3>
            <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
              aiEnabled
                ? "bg-purple-400/30 text-purple-100"
                : "bg-white/10 text-white/70"
            }`}>
              {aiEnabled ? "IA Groq (Anonimizado)" : "Local — 100% privado"}
            </span>
            <button
              onClick={() => setAiEnabled(!aiEnabled)}
              className="text-[10px] font-medium text-white/80 bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded-full transition-colors"
            >
              {aiEnabled ? "↩ Voltar Local" : "✨ Analisar com IA"}
            </button>
          </div>

          {isLoadingAI ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4" />
              <div className="h-4 bg-white/20 rounded w-1/2" />
            </div>
          ) : aiEnabled && aiSummary ? (
            <>
              <p className="text-blue-50 text-base font-medium leading-relaxed">
                {aiSummary.summary}
              </p>
              {aiSummary.alerts.length > 0 && (
                <div className="space-y-1">
                  {aiSummary.alerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-2 text-blue-100 text-sm font-semibold">
                      <AlertCircle size={14} /> {alert}
                    </div>
                  ))}
                </div>
              )}
              {aiSummary.recommendations.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {aiSummary.recommendations.map((rec, i) => (
                    <span key={i} className="text-xs font-medium text-white bg-white/20 px-3 py-1 rounded-full">
                      💡 {rec}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-white/50">{aiSummary.disclaimer}</p>
            </>
          ) : (
            <>
              <p className="text-blue-50 text-base font-medium leading-relaxed">
                {summary.patientName} é um {summary.species.toLowerCase()} {summary.gender.toLowerCase()} de {summary.breed}, {summary.ageText}.
                {summary.lastConsultation
                  ? ` Última consulta há ${summary.lastConsultation.daysAgo} dias com ${summary.lastConsultation.veterinarian}.`
                  : " Sem consultas registadas."}
              </p>

              {/* Safety Alerts */}
              {summary.safetyAlerts.length > 0 && (
                <div className="space-y-1">
                  {summary.safetyAlerts.map((alert, i) => (
                    <div key={i} className="flex items-center gap-2 text-blue-100 text-sm font-semibold">
                      <AlertCircle size={14} /> {alert}
                    </div>
                  ))}
                </div>
              )}

              {/* Vaccine Status */}
              {summary.vaccines.expired.length > 0 && (
                <p className="text-amber-100 text-sm font-semibold">
                  ⚠️ {summary.vaccines.expired.length} vacina(s) expirada(s): {summary.vaccines.expired.join(", ")}
                </p>
              )}
              {summary.vaccines.upcoming.length > 0 && (
                <p className="text-blue-100 text-sm">
                  📅 {summary.vaccines.upcoming.map(v => `${v.name} (em ${v.daysLeft}d)`).join(", ")}
                </p>
              )}

              {/* Recommendations */}
              {summary.recommendations.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {summary.recommendations.map((rec, i) => (
                    <span key={i} className="text-xs font-medium text-white bg-white/20 px-3 py-1 rounded-full">
                      💡 {rec}
                    </span>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[100px]">
            <p className="text-[10px] font-semibold text-blue-200 mb-1">Peso</p>
            <p className="text-2xl font-bold text-white">{summary.weight ?? "—"}</p>
            {summary.weightTrend && (
              <p className={`text-xs font-medium mt-1 ${summary.weightTrend.startsWith("+") ? "text-blue-200" : "text-emerald-200"}`}>
                {summary.weightTrend}
              </p>
            )}
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[100px]">
            <p className="text-[10px] font-semibold text-blue-200 mb-1">Idade</p>
            <p className="text-2xl font-bold text-white">{summary.ageText}</p>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[100px]">
            <p className="text-[10px] font-semibold text-blue-200 mb-1">Vacinas</p>
            <p className="text-2xl font-bold text-white">{summary.vaccines.total}</p>
            {summary.vaccines.expired.length > 0 && (
              <p className="text-xs text-blue-200 mt-1">{summary.vaccines.expired.length} exp.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const patientId = params?.id as string;
  const [dialog, setDialog] = useState<"vaccine" | "vitals" | "prescription" | "edit" | null>(null);

  const [editForm, setEditForm] = useState({
    name: "",
    species: "",
    breed: "",
    gender: "M",
    birthDate: "",
    microchip: "",
    status: "ACTIVE",
    allergies: "",
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

  const { data: history = [] } = useQuery({
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
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium text-base">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <SpeciesIcon size={16} className="text-blue-500" />
                <span className="capitalize">{patient.species}</span>
              </div>
              {patient.breed && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                  <span>{patient.breed}</span>
                </div>
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
        </div>
      </div>

      {/* ── Clinical Summary Banner ── */}
      <div className="max-w-[1600px] mx-auto">
        <ClinicalSummaryBanner patientId={patientId} />
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
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
                    <p className="text-base font-bold text-slate-900 dark:text-white">{val}</p>
                  </div>
                </div>
              ))}
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
                <div className="flex flex-col items-center justify-center py-4 text-slate-400 gap-2">
                  <Heart size={24} className="text-emerald-500/80" strokeWidth={1.5} />
                  <p className="text-xs font-semibold text-slate-400">Sem alergias ou observações.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Responsável */}
          <Card className="border-none shadow-lg bg-white dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl ring-1 ring-slate-200/60 dark:ring-slate-800 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-slate-100 dark:border-slate-800/60">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500">
                  <User size={14} strokeWidth={2.5} />
                </div>
                <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Responsável</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
               <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Nome Completo</p>
                  <p className="text-base font-bold text-slate-900 dark:text-white">{patient.owner?.name || "—"}</p>
               </div>
               <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="w-9 h-9 rounded-lg bg-green-100/60 text-green-600 flex items-center justify-center shrink-0">
                    <Phone size={16} />
                  </div>
                  <p className="text-sm font-bold">{patient.owner?.phone || "—"}</p>
               </div>
               <div className="flex items-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="w-9 h-9 rounded-lg bg-indigo-100/60 text-indigo-600 flex items-center justify-center shrink-0">
                    <Mail size={16} />
                  </div>
                  <p className="text-sm font-bold truncate">{patient.owner?.email || "—"}</p>
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
                  <ClinicalTimeline events={history} />
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
                              <p className="text-xs text-slate-400 font-medium mt-0.5 uppercase tracking-tighter">
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
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Peso</p>
                                 <p className="text-lg font-bold">{v.weight || "—"} kg</p>
                              </div>
                              <div className="space-y-1">
                                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Temp</p>
                                 <p className="text-lg font-bold">{v.temperature || "—"} °C</p>
                              </div>
                              {v.heartRate && (
                                <div className="space-y-1">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FC</p>
                                   <p className="text-lg font-bold">{v.heartRate} bpm</p>
                                </div>
                              )}
                              {v.respiratoryRate && (
                                <div className="space-y-1">
                                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">FR</p>
                                   <p className="text-lg font-bold">{v.respiratoryRate} rpm</p>
                                </div>
                              )}
                           </div>
                           <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-3 text-xs">{fmt(v.recordedAt || v.createdAt)}</Badge>
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
                              <p className="text-xs text-slate-400 font-medium">
                                {fmt(rx.createdAt)}
                                {rx.veterinarian?.name && ` · Dr. ${rx.veterinarian.name}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {rx.validUntil && (
                              <Badge className={cn(
                                "rounded-full text-[10px] px-3 py-1",
                                isPast(new Date(rx.validUntil))
                                  ? "bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-none"
                                  : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400 border-none"
                              )}>
                                {isPast(new Date(rx.validUntil)) ? "Expirada" : `Válida até ${fmt(new Date(rx.validUntil))}`}
                              </Badge>
                            )}
                            <Badge className="rounded-full text-[10px] px-3 py-1 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 border-none">
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
                                  <p className="text-xs text-slate-400 mt-1">{item.notes}</p>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-4 text-xs">
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Dosagem</p>
                                  <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{item.dosage}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Frequência</p>
                                  <p className="font-bold text-slate-700 dark:text-slate-200 mt-0.5">{item.frequency}</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Duração</p>
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
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Nome</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Espécie</label>
                <input
                  type="text"
                  value={editForm.species}
                  onChange={(e) => setEditForm({ ...editForm, species: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Raça</label>
                <input
                  type="text"
                  value={editForm.breed}
                  onChange={(e) => setEditForm({ ...editForm, breed: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Género</label>
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
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Data de Nascimento</label>
                <input
                  type="date"
                  value={editForm.birthDate}
                  onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Microchip</label>
                <input
                  type="text"
                  value={editForm.microchip}
                  onChange={(e) => setEditForm({ ...editForm, microchip: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-medium text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  placeholder="Número do chip"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Status</label>
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
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Alergias & Observações Clínicas</label>
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
                  try {
                    const res = await fetch(`/api/patients/${patientId}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(editForm),
                    });
                    if (res.ok) {
                      queryClient.invalidateQueries({ queryKey: ["patient", patientId] });
                      queryClient.invalidateQueries({ queryKey: ["clinical-summary", patientId] });
                      setDialog(null);
                    }
                  } catch (err) {
                    console.error(err);
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
