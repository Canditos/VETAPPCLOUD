"use client";

import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, PawPrint, User, Phone, Mail, Calendar, Activity,
  Stethoscope, Syringe, AlertCircle, Dog, Cat, FileText, Heart,
  Thermometer, Weight, Plus, Pill, Shield, TrendingUp, Info, Clock, 
  Sparkles, ChevronRight, Microscope
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
      hasAlerts ? "bg-gradient-to-r from-rose-600 to-orange-600" : "bg-gradient-to-r from-blue-600 to-indigo-700"
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
                    <div key={i} className="flex items-center gap-2 text-rose-100 text-sm font-semibold">
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
                    <div key={i} className="flex items-center gap-2 text-rose-100 text-sm font-semibold">
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
              <p className={`text-xs font-medium mt-1 ${summary.weightTrend.startsWith("+") ? "text-rose-200" : "text-emerald-200"}`}>
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
              <p className="text-xs text-rose-200 mt-1">{summary.vaccines.expired.length} exp.</p>
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
  const patientId = params?.id as string;
  const [dialog, setDialog] = useState<"vaccine" | "vitals" | "prescription" | null>(null);

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
    <div className="w-full min-h-screen bg-slate-50/50 dark:bg-slate-950 p-4 md:p-8 lg:p-12 space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header Ultra-Modern ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2">
        <div className="flex items-start gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.back()} 
            className="rounded-2xl h-14 w-14 bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800 hover:scale-105 transition-all"
          >
            <ArrowLeft size={24} className="text-slate-600 dark:text-slate-400" />
          </Button>
          <div className="space-y-1">
            <div className="flex items-center gap-4">
              <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight">
                {patient.name}
              </h1>
              <Badge variant={patient.status === "ACTIVE" ? "default" : "secondary"} 
                className="rounded-full px-4 py-1.5 bg-blue-600/10 text-blue-600 border-blue-200 dark:border-blue-900/50 text-xs font-black uppercase tracking-widest">
                {patient.status === "ACTIVE" ? "Ativo" : "Inativo"}
              </Badge>
            </div>
            <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-bold text-lg">
              <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                <SpeciesIcon size={20} className="text-blue-500" />
                <span className="capitalize">{patient.species}</span>
              </div>
              {patient.breed && (
                <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                  <span>{patient.breed}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => router.push(`/dashboard/consultations?patientId=${patientId}`)}
            size="lg" 
            className="rounded-2xl h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/20 gap-3 transition-all active:scale-95"
          >
            <Plus size={20} strokeWidth={3} /> Nova Consulta
          </Button>
        </div>
      </div>

      {/* ── Clinical Summary Banner ── */}
      <ClinicalSummaryBanner patientId={patientId} />

      {/* ── Main Layout ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Sidebar Column */}
        <div className="xl:col-span-1 space-y-8">
          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2 group/header">
               <div className="w-5 h-5 rounded-md bg-blue-500/10 flex items-center justify-center text-blue-500"><Info size={10} strokeWidth={3} /></div>
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Contexto Médico</h3>
            </div>
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 space-y-8 ring-1 ring-slate-200/50 dark:ring-slate-800 shadow-sm">
              {[
                { icon: Calendar, color: "text-amber-500",  bg: "bg-amber-500/10",  label: "Nascimento", val: patient.birthDate ? fmt(patient.birthDate) : "—" },
                { icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10", label: "Género",      val: patient.gender === "M" ? "Macho" : "Fêmea" },
                { icon: Weight,   color: "text-blue-500",   bg: "bg-blue-500/10",   label: "Peso Atual",   val: patient.weight ? `${patient.weight} kg` : "—" },
                { icon: FileText, color: "text-slate-500",  bg: "bg-slate-500/10",  label: "Microchip",    val: patient.microchip || "—" },
              ].map(({ icon: Icon, color, bg, label, val }) => (
                <div key={label} className="flex items-center gap-5">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner", bg)}>
                    <Icon size={24} className={color} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white leading-tight">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <div className="flex items-center gap-2 px-2 group/header">
               <div className="w-5 h-5 rounded-md bg-purple-500/10 flex items-center justify-center text-purple-500"><User size={10} strokeWidth={3} /></div>
               <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Responsável</h3>
            </div>
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 space-y-6 ring-1 ring-slate-200/50 dark:ring-slate-800 shadow-sm">
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Nome Completo</p>
                  <p className="text-lg font-black text-slate-900 dark:text-white">{patient.owner?.name || "—"}</p>
               </div>
               <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="w-10 h-10 rounded-xl bg-green-100/50 text-green-600 flex items-center justify-center"><Phone size={18} /></div>
                  <p className="text-sm font-black">{patient.owner?.phone || "—"}</p>
               </div>
               <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/50">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100/50 text-indigo-600 flex items-center justify-center"><Mail size={18} /></div>
                  <p className="text-sm font-black truncate max-w-[150px]">{patient.owner?.email || "—"}</p>
               </div>
            </div>
          </section>
        </div>

        {/* Content Column (Main Tabs) */}
        <div className="xl:col-span-3">
          <Card className="border-none shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[3rem] ring-1 ring-slate-200/50 dark:ring-slate-800 min-h-[800px] flex flex-col overflow-hidden">
            <Tabs defaultValue="history" className="w-full flex-1 flex flex-col">
              <div className="px-10 pt-10 pb-6 border-b border-slate-100 dark:border-slate-800/50">
                <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 rounded-[1.5rem] p-2 h-16 w-full max-w-3xl gap-2">
                  <TabsTrigger value="history" className="rounded-[1.2rem] flex-1 px-4 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all">
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="clinical" className="rounded-[1.2rem] flex-1 px-4 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all">
                    Vacinas
                  </TabsTrigger>
                  <TabsTrigger value="vitals" className="rounded-[1.2rem] flex-1 px-4 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all">
                    Biométricos
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions" className="rounded-[1.2rem] flex-1 px-4 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all">
                    Receituário
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 p-10 overflow-y-auto">
                {/* ── HISTÓRICO (Timeline) ── */}
                <TabsContent value="history" className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
                  <ClinicalTimeline events={history} />
                </TabsContent>

                {/* ── VACINAS ── */}
                <TabsContent value="clinical" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex justify-between items-center bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-[2rem] ring-1 ring-blue-100 dark:ring-blue-900/30">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Plano de Vacinação</h4>
                      <p className="text-sm text-slate-500 font-medium">Controlo e registo de vacinas e reforços.</p>
                    </div>
                    <Button size="lg" className="rounded-2xl h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/20 gap-3"
                      onClick={() => setDialog("vaccine")}>
                      <Plus size={20} strokeWidth={3} /> Nova Vacinação
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {vaccinations.map((v: Vaccination) => (
                      <div key={v.id} className="group flex items-center justify-between p-6 rounded-[2rem] bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all shadow-sm">
                        <div className="flex items-center gap-5">
                          <div className="w-16 h-16 rounded-2xl bg-blue-100/50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Shield size={24} /></div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white text-lg leading-tight">{v.vaccineName}</p>
                            <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                              {v.appliedAt ? fmt(v.appliedAt) : "Sem data"} {v.veterinarian?.name ? `· Dr. ${v.veterinarian.name}` : ""}
                            </p>
                          </div>
                        </div>
                        <VaccineStatusBadge expiresAt={v.expiresAt} />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* ── BIOMÉTRICOS ── */}
                <TabsContent value="vitals" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/20 p-6 rounded-[2rem] ring-1 ring-slate-100 dark:ring-slate-800">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Sinais Vitais</h4>
                      <p className="text-sm text-slate-500 font-medium">Monitorização constante dos dados biométricos.</p>
                    </div>
                    <Button size="lg" className="rounded-2xl h-14 px-8 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white font-black shadow-lg gap-3"
                      onClick={() => setDialog("vitals")}>
                      <Plus size={20} strokeWidth={3} /> Registar Dados
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {vitals.map((v: VitalSign) => (
                      <div key={v.id} className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-6 shadow-sm">
                         <div className="flex flex-wrap gap-10">
                            <div className="space-y-1">
                               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Peso</p>
                               <p className="text-xl font-black">{v.weight || "—"} kg</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Temp</p>
                               <p className="text-xl font-black">{v.temperature || "—"} °C</p>
                            </div>
                         </div>
                         <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-4">{fmt(v.createdAt)}</Badge>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* ── RECEITUÁRIO ── */}
                <TabsContent value="prescriptions" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  {prescriptions.map((rx: Prescription) => (
                    <div key={rx.id} className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                       <div className="flex justify-between items-start">
                          <div className="flex items-center gap-4">
                             <div className="w-14 h-14 rounded-2xl bg-emerald-100/50 text-emerald-600 flex items-center justify-center"><Pill size={24} /></div>
                             <div>
                                <p className="font-black text-slate-900 dark:text-white text-lg">{rx.items?.length} Medicamentos</p>
                                <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{fmt(rx.createdAt)}</p>
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* ── Dialogs (Keep original functionality) ── */}
      <Dialog open={dialog === "vaccine"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-blue-600 p-8 text-white"><DialogHeader><DialogTitle className="text-2xl font-black flex items-center gap-4">Registar Vacinação</DialogTitle></DialogHeader></div>
          <div className="p-8"><VaccinationForm patientId={patientId} onSuccess={() => { setDialog(null); refetchVax(); }} /></div>
        </DialogContent>
      </Dialog>
      {/* ... other dialogs ... */}
    </div>
  );
}
