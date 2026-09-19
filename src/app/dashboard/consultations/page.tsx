"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Save, FileText, Activity, ClipboardCheck, Receipt, FlaskConical,
  ChevronLeft, Stethoscope, Image as ImageIcon, Thermometer, Weight,
  Clock, Plus, ShieldAlert, Search, History, Syringe, AlertCircle,
  AlertTriangle, Sparkles, Eye, TrendingUp, CheckCircle2, Pill,
  Venus, Mars, ShieldCheck, Zap, Calendar, CalendarCheck
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ConsultationBilling } from "@/components/ConsultationBilling";
import { ClinicalSummaryBanner } from "@/components/ClinicalSummaryBanner";
import { PremiumCard } from "@/components/PremiumCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { ExamVisualizerModal } from "@/components/consultations/ExamVisualizerModal";
import { useIntegrationHealth } from "@/hooks/useIntegrationHealth";
import type { BillingItem, DiagnosticResult } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

function ConsultationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get("patientId");
  const appointmentId = searchParams.get("appointmentId");
  const urlTab = searchParams.get("tab") || "clinical";
  
  const [activeTab, setActiveTab] = useState(urlTab);
  const [billingItems, setBillingItems] = useState<BillingItem[]>([]);
  
  // Clinical structured fields
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [pastHistory, setPastHistory] = useState("");
  const [physicalExam, setPhysicalExam] = useState("");
  const [examNotes, setExamNotes] = useState("");
  const [diagnosticsNotes, setDiagnosticsNotes] = useState("");
  const [treatment, setTreatment] = useState("");
  const [reassessmentDate, setReassessmentDate] = useState("");

  const [vitals, setVitals] = useState({ weight: "", temperature: "", heartRate: "", respiratoryRate: "", bodyConditionScore: -1 });
  const [temperament, setTemperament] = useState<string>("");
  const [isExamsModalOpen, setIsExamsModalOpen] = useState(false);
  const [reassessmentPopup, setReassessmentPopup] = useState<{ open: boolean; date: string } | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => { setActiveTab(urlTab); }, [urlTab]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(patientSearch.trim());
    }, 250);
    return () => clearTimeout(handler);
  }, [patientSearch]);

  const { data: searchResults, isLoading: isSearchingPatients } = useQuery({
    queryKey: ["quick-patient-search", debouncedSearch],
    queryFn: async () => {
      if (!debouncedSearch) return [];
      const res = await fetch(`/api/patients?search=${encodeURIComponent(debouncedSearch)}&limit=6`);
      if (!res.ok) return [];
      const json = await res.json();
      return json.data || [];
    },
    enabled: !patientId && debouncedSearch.length >= 2,
  });

  const { data: patient, isLoading: isPatientLoading, error: patientError } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) throw new Error("Paciente não encontrado.");
      return res.json();
    },
    enabled: !!patientId
  });

  useEffect(() => {
    if (patient?.aggressionLevel && !temperament) {
      setTemperament(patient.aggressionLevel);
    }
  }, [patient?.aggressionLevel, temperament]);

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["patient-history", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/history`);
      if (!res.ok) throw new Error("Erro ao carregar histórico");
      return res.json();
    },
    enabled: !!patientId
  });

  const { data: veterinarians } = useQuery({
    queryKey: ["veterinarians"],
    queryFn: async () => {
      const res = await fetch("/api/users?role=VETERINARIAN");
      if (!res.ok) return [];
      return res.json();
    }
  });

  const [sessionExamIds, setSessionExamIds] = useState<string[]>([]);

  const { data: diagnostics = [], refetch: refetchDiagnostics } = useQuery({
    queryKey: ["patient-diagnostics", patientId],
    queryFn: async () => {
      if (!patientId) return [];
      const res = await fetch(`/api/diagnostics?patientId=${patientId}`);
      if (!res.ok) return [];
      const json = await res.json().catch(() => []);
      return Array.isArray(json) ? json : [];
    },
    enabled: !!patientId,
    refetchInterval: isExamsModalOpen ? 5000 : false,
  });

  const safeDiagnostics: DiagnosticResult[] = Array.isArray(diagnostics) ? diagnostics : [];

  // Exames da consulta em questão e deste animal
  const currentConsultationDiagnostics = useMemo(() => {
    return safeDiagnostics.filter((dx) => {
      if (sessionExamIds.includes(dx.id)) return true;
      if (appointmentId && (dx.appointmentId === appointmentId || dx.dataJson?.appointmentId === appointmentId || dx.metadataJson?.appointmentId === appointmentId)) return true;
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
  }, [safeDiagnostics, sessionExamIds, appointmentId]);

  const safeFormatDistance = (dateStr?: string | Date | null) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return "—";
      return formatDistanceToNow(d, { addSuffix: true, locale: pt });
    } catch {
      return "—";
    }
  };

  const { data: health } = useIntegrationHealth();

  const handleRequestExam = async (type: "LAB" | "IMAGING", source: string, testName: string) => {
    const isRxExam = source === "Examion RX" && testName !== "Ecografia";

    const registerPromise = fetch("/api/diagnostics/request", {
      method: "POST",
      body: JSON.stringify({
        patientId,
        appointmentId,
        type,
        source,
        testName
      }),
      headers: { "Content-Type": "application/json" },
    }).then(async (res) => {
      if (!res.ok) throw new Error((await res.json()).error || "Erro ao registar exame");
      const data = await res.json();
      if (data.id) {
        setSessionExamIds((prev) => [...prev, data.id]);
      }
      refetchDiagnostics();
      return data;
    });

    if (!isRxExam) {
      toast.promise(registerPromise, {
        loading: `A registar ${testName}...`,
        success: (data) => data.message,
        error: "Erro ao registar exame.",
      });
      return registerPromise;
    }

    // RX exam: register + push GDT in one flow
    return toast.promise(
      registerPromise.then(async (regResult) => {
        const gdtRes = await fetch("/api/gdt/fazer-rx", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ patientId }),
        });
        if (!gdtRes.ok) throw new Error("Erro ao gerar GDT");
        const gdtData = await gdtRes.json();

        if (gdtData.written) {
          return `RX ${testName} enviado para ${gdtData.target}.`;
        }
        // Fallback: trigger client-side download with base64 content
        if (gdtData.gdtContent) {
          const binary = atob(gdtData.gdtContent);
          const bytes = new Uint8Array(binary.length);
          for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
          const blob = new Blob([bytes], { type: "application/octet-stream" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "mgpcs.gdt";
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
        return `RX ${testName} registado. Nenhum PC RX online — mgpcs.gdt descarregado.`;
      }),
      {
        loading: `A enviar ${testName} para o RX...`,
        success: (msg) => msg,
        error: "Erro ao comunicar com o RX.",
      }
    );
  };

  const handleSave = async () => {
    const hasNotes = chiefComplaint || pastHistory || physicalExam || examNotes || diagnosticsNotes || treatment;
    if (billingItems.length === 0 && !hasNotes) {
      toast.error("Adicione notas clínicas ou itens para faturar.");
      return;
    }
    toast.promise(
      fetch("/api/consultations", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          appointmentId: appointmentId || "walk-in-" + Date.now(),
          clinicalFields: {
            chiefComplaint,
            pastHistory,
            physicalExam,
            complementaryExams: examNotes,
            diagnostics: diagnosticsNotes,
            treatment,
            reassessmentDate,
          },
          notes: {
            subjective: [chiefComplaint && `Motivo: ${chiefComplaint}`, pastHistory && `História: ${pastHistory}`].filter(Boolean).join("\n\n"),
            objective: [physicalExam && `Exame Físico:\n${physicalExam}`, examNotes && `Exames Complementares:\n${examNotes}`].filter(Boolean).join("\n\n"),
            assessment: diagnosticsNotes,
            plan: [treatment && `Tratamento: ${treatment}`, reassessmentDate && `Reavaliação: ${reassessmentDate}`].filter(Boolean).join("\n\n"),
          },
          temperament: temperament || null,
          vitals: {
            weight: vitals.weight ? parseFloat(vitals.weight) : null,
            temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
            heartRate: vitals.heartRate ? parseFloat(vitals.heartRate) : null,
            respiratoryRate: vitals.respiratoryRate ? parseFloat(vitals.respiratoryRate) : null,
            bodyConditionScore: vitals.bodyConditionScore >= 1 ? vitals.bodyConditionScore : null,
          },
          items: billingItems,
          billNow: true
        }),
        headers: { "Content-Type": "application/json" },
      }).then(async res => {
        if (!res.ok) throw new Error("Erro na gravação");
        return res.json();
      }),
      {
        loading: 'A gravar consulta e a sincronizar faturamento...',
        success: () => {
          if (reassessmentDate) {
            setReassessmentPopup({ open: true, date: reassessmentDate });
            return "Consulta finalizada com sucesso!";
          }
          router.push(`/dashboard/patients/${patientId}`);
          return "Consulta finalizada com sucesso!";
        },
        error: 'Erro ao gravar a consulta.',
      }
    );
  };

  const updateTab = (tab: string) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`?${params.toString()}`);
  };

  if (!patientId || patientError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 animate-in fade-in zoom-in-95 duration-1000 max-w-2xl mx-auto px-4 w-full">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full animate-pulse" />
          <div className="w-28 h-28 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-white/5 shadow-2xl relative z-10">
             <Stethoscope size={56} strokeWidth={1.5} />
          </div>
          <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 shadow-xl z-20">
             <Plus size={20} strokeWidth={3} />
          </div>
        </div>
        <div className="text-center space-y-2 relative z-10">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Atendimento Clínico</h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-base">
            Pesquise um paciente ou selecione da agenda para iniciar a consulta.
          </p>
        </div>

        {/* Quick Search Bar */}
        <div className="w-full relative z-10 space-y-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              value={patientSearch}
              onChange={(e) => setPatientSearch(e.target.value)}
              placeholder="Pesquisar por nome do animal, microchip ou tutor..."
              className="h-14 pl-11 pr-4 rounded-2xl border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-900/80 backdrop-blur shadow-lg text-base focus-visible:ring-blue-500"
            />
            {patientSearch && (
              <button
                onClick={() => setPatientSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Limpar
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {debouncedSearch.length >= 2 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden divide-y divide-slate-100 dark:divide-white/5 animate-in fade-in slide-in-from-top-2 duration-200">
              {isSearchingPatients ? (
                <div className="p-4 text-center text-sm text-slate-500">A pesquisar pacientes...</div>
              ) : searchResults && searchResults.length > 0 ? (
                searchResults.map((p: any) => (
                  <div
                    key={p.id}
                    onClick={() => router.push(`/dashboard/consultations?patientId=${p.id}`)}
                    className="p-3.5 flex items-center justify-between hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-sm">
                        {p.species === "CANINE" ? "🐶" : p.species === "FELINE" ? "🐱" : "🐾"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                            {p.name}
                          </span>
                          {p.breed && (
                            <span className="text-xs text-slate-400">({p.breed})</span>
                          )}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          Tutor: <strong className="text-slate-700 dark:text-slate-300">{p.owner?.name || "Sem tutor"}</strong>
                          {p.owner?.phone && ` • ${p.owner.phone}`}
                          {p.microchip && ` • Chip: ${p.microchip}`}
                        </div>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-xl h-8 px-3 text-xs bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      Iniciar
                    </Button>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-sm text-slate-500">
                  Nenhum paciente encontrado com &ldquo;{debouncedSearch}&rdquo;.
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-2">
          <Button onClick={() => router.push("/dashboard/appointments")} className="h-12 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 px-8 font-bold transition-all active:scale-95 shadow-xl shadow-blue-500/10 tracking-wide text-xs">
            Abrir Agenda
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/patients")} className="h-12 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:scale-105 px-8 font-bold transition-all active:scale-95 tracking-wide text-xs">
            Ver Todos os Pacientes
          </Button>
        </div>
      </div>
    );
  }

  if (isPatientLoading) {
    return (
      <div className="space-y-6 animate-pulse p-6 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-end">
          <div className="flex gap-6">
            <Skeleton className="h-24 w-24 rounded-2xl" />
            <div className="space-y-4"><Skeleton className="h-10 w-80" /><Skeleton className="h-5 w-60" /></div>
          </div>
          <div className="flex gap-3"><Skeleton className="h-14 w-32 rounded-2xl" /><Skeleton className="h-14 w-48 rounded-2xl" /></div>
        </div>
        <Skeleton className="h-[500px] w-full rounded-2xl" />
      </div>
    );
  }

  const allergies = patient?.allergies;
  const lastVitals = history?.find((h: { type: string; data?: { weight?: number } }) => h.type === "VITALS")?.data;

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto px-4 sm:px-0">
      
      {/* Header Context Bar */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl ring-1 ring-slate-100 dark:ring-white/5 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 font-bold text-3xl shadow-lg transition-transform hover:rotate-3 shrink-0">
            {patient?.name?.[0] || "?"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{patient?.name}</h1>
              <Badge className="bg-blue-600 text-white border-none font-semibold text-xs px-3 py-1 rounded-lg">{patient?.species}</Badge>

              {/* Gender Badge */}
              {patient?.gender && (
                <Badge variant="outline" className={cn("text-xs font-semibold px-2.5 py-1 rounded-lg flex items-center gap-1",
                  patient.gender === "F" || patient.gender === "Fêmea"
                    ? "border-pink-300 text-pink-700 bg-pink-50 dark:bg-pink-950/30 dark:border-pink-800 dark:text-pink-300"
                    : "border-blue-300 text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-300"
                )}>
                  {patient.gender === "F" || patient.gender === "Fêmea" ? <Venus size={12} strokeWidth={2.5} /> : <Mars size={12} strokeWidth={2.5} />}
                  {patient.gender === "F" || patient.gender === "Fêmea" ? "Fêmea" : "Macho"}
                </Badge>
              )}

              {/* Temperament Badge */}
              {(temperament || patient?.aggressionLevel) && (
                <Badge className={cn("text-xs font-bold px-2.5 py-1 rounded-lg border-none flex items-center gap-1 shadow-sm",
                  (temperament || patient?.aggressionLevel) === "Dócil" ? "bg-emerald-600 text-white shadow-emerald-500/20" :
                  (temperament || patient?.aggressionLevel) === "Nervoso" ? "bg-amber-500 text-slate-950 font-black shadow-amber-500/20" :
                  "bg-rose-600 text-white shadow-rose-500/20"
                )}>
                  {(temperament || patient?.aggressionLevel) === "Dócil" ? <ShieldCheck size={12} strokeWidth={2.5} /> :
                   (temperament || patient?.aggressionLevel) === "Nervoso" ? <Zap size={12} strokeWidth={2.5} /> :
                   <ShieldAlert size={12} strokeWidth={2.5} />}
                  {temperament || patient?.aggressionLevel}
                </Badge>
              )}

              {!appointmentId && (
                <Badge variant="outline" className="border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 font-medium text-[11px] px-3 py-1 rounded-lg animate-pulse">Walk-in</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 dark:text-slate-400 font-medium">
              <p>{patient?.breed || "Sem raça definida"} <span className="mx-2 opacity-20">|</span> {patient?.owner?.name || "Sem tutor"}</p>
              {lastVitals && (
                <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                  <Weight size={12} /> {lastVitals.weight}kg
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Allergy Alert — Enquadrado com elegância no cabeçalho */}
        {allergies && (
          <div className="flex items-center gap-3.5 px-4 py-3 bg-gradient-to-r from-rose-600 to-rose-700 text-white rounded-2xl shadow-lg shadow-rose-600/20 ring-1 ring-rose-400/40 max-w-md w-full xl:w-auto">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <AlertTriangle size={20} strokeWidth={2.5} className="animate-pulse text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded text-white">Alerta de Alergias</span>
                <span className="text-[10px] font-bold text-rose-200 uppercase">Atenção Médica</span>
              </div>
              <p className="text-xs font-bold text-rose-100 truncate mt-0.5" title={allergies}>{allergies}</p>
            </div>
          </div>
        )}
        
        <div className="flex gap-3 w-full xl:w-auto shrink-0">
           <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 dark:border-white/10 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex-1 xl:flex-none" onClick={() => router.back()}>
             <ChevronLeft className="w-4 h-4 mr-2" strokeWidth={3} /> Cancelar
           </Button>
           <Button onClick={handleSave} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex-1 xl:flex-none">
             <Save className="w-4 h-4 mr-2" strokeWidth={3} /> Finalizar Visita
           </Button>
        </div>
      </div>

      {/* Resumo Clínico Inteligente (Gender-adaptive Design) */}
      <ClinicalSummaryBanner
        patientId={patientId!}
        fallbackGender={patient?.gender}
      />

      {/* Main Clinical Navigation */}
      <Tabs value={activeTab} onValueChange={updateTab} className="w-full">
        <div className="mb-10 overflow-x-auto -mx-4 px-4 md:-mx-8 md:px-8 no-scrollbar w-full">
          <TabsList className="flex w-full bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl ring-1 ring-slate-200/50 dark:ring-white/5 gap-1">
            {[
              { val: "clinical", label: "Atendimento Clínico", icon: ClipboardCheck },
              { val: "exams", label: "Meios Complementares", icon: FlaskConical },
              { val: "billing", label: "Farmácia & Faturação", icon: Receipt }
            ].map(t => (
              <TabsTrigger key={t.val} value={t.val}
                className="flex-1 rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md font-semibold text-xs transition-all gap-2 py-3 px-4 dark:text-slate-400 dark:data-[state=active]:text-white whitespace-nowrap justify-center">
                <t.icon className="w-4 h-4 shrink-0" strokeWidth={2.5} />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* CLINICAL / SOAP TAB */}
        <TabsContent value="clinical" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="w-full space-y-6">
            <div>
              <PremiumCard padding="none">
                <div className="px-6 py-6 pb-4 border-b border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Protocolo Clínico SOAP</h2>
                    <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-medium px-3 py-1 rounded-lg">Standard Workflow</Badge>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  
                  {/* Vitals Input — 4 core measurements */}
                  <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-white/5">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sinais Vitais</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { label: "Peso", icon: Weight, unit: "kg", color: "text-blue-500", placeholder: "12.45", key: "weight" },
                        { label: "Temp.", icon: Thermometer, unit: "ºC", color: "text-orange-500", placeholder: "38.6", key: "temperature" },
                        { label: "FC", icon: Clock, unit: "bpm", color: "text-purple-500", placeholder: "100", key: "heartRate" },
                        { label: "FR", icon: Activity, unit: "mpm", color: "text-rose-500", placeholder: "24", key: "respiratoryRate" }
                      ].map((vital, i) => (
                        <div key={i} className="flex flex-col gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-100 dark:ring-white/5 transition-all hover:ring-blue-500/30">
                          <div className="flex items-center gap-2">
                             <vital.icon size={14} className={vital.color} strokeWidth={3} />
                             <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">{vital.label}</span>
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                             <Input type="number" step="0.1" className="border-none bg-transparent p-0 h-auto text-2xl font-bold text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 focus-visible:ring-0" placeholder={vital.placeholder} value={(vitals as any)[vital.key]} onChange={(e) => setVitals({ ...vitals, [vital.key]: e.target.value })} />
                             <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{vital.unit}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Body Condition Score 1–9 */}
                    <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-white/5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">BCS — Condição Corporal (1–9)</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Avaliação visual e palpação das costelas, coluna e gordura subcutânea</p>
                        </div>
                        {vitals.bodyConditionScore >= 1 && (
                          <span className={cn("text-xs font-bold px-2 py-1 rounded-lg",
                            vitals.bodyConditionScore <= 3 ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                            vitals.bodyConditionScore <= 5 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" :
                            vitals.bodyConditionScore <= 7 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                            "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400"
                          )}>
                            {vitals.bodyConditionScore <= 2 ? "Caquético" : vitals.bodyConditionScore === 3 ? "Magro" : vitals.bodyConditionScore <= 5 ? "Peso ideal" : vitals.bodyConditionScore <= 7 ? "Excesso de peso" : "Obesidade"}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1.5">
                        {[
                          { score: 1, label: "Caquético" },
                          { score: 2, label: "Muito magro" },
                          { score: 3, label: "Magro" },
                          { score: 4, label: "Abaixo ideal" },
                          { score: 5, label: "Ideal" },
                          { score: 6, label: "Acima ideal" },
                          { score: 7, label: "Excesso" },
                          { score: 8, label: "Obeso" },
                          { score: 9, label: "Obesidade grave" },
                        ].map(({ score, label }) => (
                          <button key={score} type="button" title={label}
                            onClick={() => setVitals({ ...vitals, bodyConditionScore: vitals.bodyConditionScore === score ? -1 : score })}
                            className={cn("flex-1 h-10 rounded-xl text-sm font-black transition-all active:scale-95 ring-2",
                              vitals.bodyConditionScore === score ? (
                                score <= 3 ? "bg-blue-500 text-white ring-blue-300" :
                                score <= 5 ? "bg-emerald-500 text-white ring-emerald-300" :
                                score <= 7 ? "bg-yellow-500 text-white ring-yellow-300" :
                                "bg-rose-600 text-white ring-rose-400"
                              ) : "bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400 ring-slate-100 dark:ring-white/5 hover:ring-slate-300 dark:hover:border-white/10"
                            )}>
                            {score}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-[11px] font-semibold text-slate-500 dark:text-slate-400 px-0.5">
                        <span className="text-blue-500">← Caquético</span>
                        <span className="text-emerald-500">Ideal</span>
                        <span className="text-rose-500">Obeso →</span>
                      </div>
                    </div>

                    {/* Temperamento do Paciente — Só aparece se ainda NÃO estiver definido no cadastro */}
                    {!patient?.aggressionLevel && (
                      <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Temperamento do Paciente</p>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Definir temperamento inicial (após gravado, apenas editável na Ficha do Paciente)</p>
                          </div>
                          {temperament && (
                            <span className={cn("text-xs font-bold px-2.5 py-0.5 rounded-lg text-white",
                              temperament === "Dócil" ? "bg-emerald-600" :
                              temperament === "Nervoso" ? "bg-amber-500" :
                              "bg-rose-600"
                            )}>
                              {temperament}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-3 gap-2.5">
                          {[
                            { label: "Dócil", desc: "Calmo e cooperante", activeClass: "border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 ring-2 ring-emerald-400 shadow-sm", dotClass: "bg-emerald-500" },
                            { label: "Nervoso", desc: "Ansioso / Medroso", activeClass: "border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 ring-2 ring-amber-400 shadow-sm", dotClass: "bg-amber-500" },
                            { label: "Agressivo", desc: "Cuidado na manipulação", activeClass: "border-rose-500 bg-rose-50 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 ring-2 ring-rose-400 shadow-sm", dotClass: "bg-rose-500" }
                          ].map(t => (
                            <button
                              key={t.label}
                              type="button"
                              onClick={() => setTemperament(temperament === t.label ? "" : t.label)}
                              className={cn(
                                "flex flex-col items-center justify-center p-3 rounded-2xl border text-center transition-all cursor-pointer select-none",
                                temperament === t.label
                                  ? t.activeClass
                                  : "border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-slate-300 text-slate-700 dark:text-slate-300"
                              )}
                            >
                              <div className="flex items-center gap-2 mb-0.5">
                                <span className={cn("w-2.5 h-2.5 rounded-full", t.dotClass)} />
                                <span className="font-bold text-xs">{t.label}</span>
                              </div>
                              <span className="text-[10px] text-slate-400 font-medium">{t.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Campos Clínicos Estruturados */}
                  <div className="space-y-6 pt-2">
                    {/* 1. Motivo de Consulta (campo mais pequeno) */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 ml-0.5">
                        <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black flex items-center justify-center">1</span>
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Motivo de Consulta</Label>
                      </div>
                      <Input
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="Ex: Vacinação anual, tosse e espirros, vómitos frequentes, claudicação da pata posterior..."
                        className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm font-medium focus-visible:ring-blue-500/20"
                      />
                    </div>

                    {/* 2. História Pregressa */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 ml-0.5">
                        <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black flex items-center justify-center">2</span>
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">História Pregressa</Label>
                      </div>
                      <Textarea
                        value={pastHistory}
                        onChange={(e) => setPastHistory(e.target.value)}
                        placeholder="Início e evolução dos sinais clínicos, medicação em curso, doenças prévias, cirurgias anteriores, alimentação e ambiente..."
                        className="min-h-[105px] rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm focus-visible:ring-blue-500/20 resize-none"
                      />
                    </div>

                    {/* 3. Exame Físico */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 ml-0.5">
                        <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-black flex items-center justify-center">3</span>
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Exame Físico</Label>
                      </div>
                      <Textarea
                        value={physicalExam}
                        onChange={(e) => setPhysicalExam(e.target.value)}
                        placeholder="Alerta mental, mucosas, TRC, hidratação, auscultação cardiopulmonar, palpação abdominal, linfonodos, ouvidos, olhos, cavidade oral, pele e anexos..."
                        className="min-h-[105px] rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm focus-visible:ring-blue-500/20 resize-none"
                      />
                    </div>

                    {/* 4. Exames Complementares de Diagnóstico (Botão para resultados) */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/30 border border-slate-200/80 dark:border-white/10 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-black flex items-center justify-center">4</span>
                          <div>
                            <Label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Exames Complementares de Diagnóstico</Label>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Resultados laboratoriais, radiografias e ecografias deste atendimento</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => setIsExamsModalOpen(true)}
                            className="h-10 px-4 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 gap-2 transition-transform active:scale-95"
                          >
                            <FlaskConical size={15} /> Ver Resultados dos Exames ({currentConsultationDiagnostics.length})
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsExamsModalOpen(true)}
                            className="h-10 px-3 rounded-xl border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 gap-1.5"
                          >
                            <Plus size={13} /> Requisitar Exame
                          </Button>
                        </div>
                      </div>

                      <Textarea
                        value={examNotes}
                        onChange={(e) => setExamNotes(e.target.value)}
                        placeholder="Resultados e observações dos exames complementares (inseridos pelo visualizador de exames ou manualmente)..."
                        className="min-h-[105px] rounded-2xl bg-white dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm focus-visible:ring-emerald-500/20 resize-none"
                      />
                    </div>

                    {/* 5. Diagnósticos Diferenciais / Definitivo */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 ml-0.5">
                        <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-black flex items-center justify-center">5</span>
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Diagnósticos Diferenciais / Definitivo</Label>
                      </div>
                      <Textarea
                        value={diagnosticsNotes}
                        onChange={(e) => setDiagnosticsNotes(e.target.value)}
                        placeholder="Lista de hipóteses diagnósticas, diferenciais considerados e diagnóstico definitivo..."
                        className="min-h-[105px] rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm focus-visible:ring-blue-500/20 resize-none"
                      />
                    </div>

                    {/* 6. Tratamento */}
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 ml-0.5">
                        <span className="w-6 h-6 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-black flex items-center justify-center">6</span>
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Tratamento</Label>
                      </div>
                      <Textarea
                        value={treatment}
                        onChange={(e) => setTreatment(e.target.value)}
                        placeholder="Protocolo medicamentoso (fármacos, posologia, frequência, duração), fluidoterapia, procedimentos realizados e instruções ao tutor..."
                        className="min-h-[110px] rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm focus-visible:ring-blue-500/20 resize-none"
                      />
                    </div>

                    {/* 7. Data de Reavaliação */}
                    <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 space-y-3">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <span className="w-6 h-6 bg-blue-600 text-white rounded-lg text-xs font-black flex items-center justify-center">7</span>
                          <div>
                            <Label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Data de Reavaliação</Label>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Apresenta aviso em pop-up quando a fatura for liquidada</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Input
                            type="date"
                            value={reassessmentDate}
                            onChange={(e) => setReassessmentDate(e.target.value)}
                            className="h-10 w-44 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-xs font-bold text-slate-900 dark:text-white shadow-sm"
                          />
                          {[
                            { label: "+3d", days: 3 },
                            { label: "+7d", days: 7 },
                            { label: "+15d", days: 15 },
                            { label: "+30d", days: 30 }
                          ].map(q => (
                            <Button
                              key={q.label}
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const d = new Date();
                                d.setDate(d.getDate() + q.days);
                                setReassessmentDate(d.toISOString().split("T")[0]);
                              }}
                              className="h-9 px-2.5 rounded-lg border-blue-200 dark:border-blue-900/40 text-blue-700 dark:text-blue-300 bg-white dark:bg-slate-900 text-xs font-bold hover:bg-blue-50"
                            >
                              {q.label}
                            </Button>
                          ))}
                          {reassessmentDate && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setReassessmentDate("")}
                              className="h-9 px-2 text-xs font-semibold text-slate-400 hover:text-slate-600"
                            >
                              Limpar
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                 </div>
                </PremiumCard>
              </div>
            </div>
          </TabsContent>

        {/* BILLING TAB */}
        <TabsContent value="billing" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="max-w-5xl mx-auto">
               <PremiumCard padding="lg">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-6">
                     <div>
                        <Badge className={
                          health?.inventorySync?.status === "active"
                            ? "bg-emerald-600 text-white font-medium text-[11px] px-3 py-1 mb-3 rounded-lg"
                            : "bg-slate-600 text-white font-medium text-[11px] px-3 py-1 mb-3 rounded-lg"
                        }>
                          {health?.inventorySync?.label || "Inventory Sync"}
                        </Badge>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-none">Prescrição & Faturação</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-sm">Registe consumíveis, medicamentos e atos clínicos.</p>
                     </div>
                  </div>
                  <ConsultationBilling onItemsChange={setBillingItems} />
               </PremiumCard>
           </div>
        </TabsContent>

        {/* EXAMS TAB - Unified with Diagnostics */}
        <TabsContent value="exams" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="space-y-6">
              {/* Request Exams */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <PremiumCard padding="lg">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600 dark:text-purple-400"><FlaskConical size={24} strokeWidth={2.5} /></div>
                        <div>
                           <h3 className="text-lg font-bold text-slate-900 dark:text-white">Laboratório</h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fuji DX-500 • HL7 Gateway</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button onClick={() => handleRequestExam("LAB", "Fuji DX-500", "Hemograma Completo")} className="h-12 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl text-xs shadow-sm">Hemograma Completo</Button>
                        <Button variant="outline" onClick={() => handleRequestExam("LAB", "Fuji DX-500", "Bioquímica 12")} className="h-12 border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 font-semibold rounded-xl text-xs">Bioquímica 12</Button>
                        <Button variant="outline" onClick={() => handleRequestExam("LAB", "Fuji DX-500", "PCR")} className="h-12 border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 font-semibold rounded-xl text-xs">PCR</Button>
                        <Button variant="outline" onClick={() => handleRequestExam("LAB", "Fuji DX-500", "Urinalise")} className="h-12 border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 font-semibold rounded-xl text-xs">Urinalise</Button>
                     </div>
                  </PremiumCard>

                  <PremiumCard padding="lg">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 dark:text-emerald-400"><ImageIcon size={24} strokeWidth={2.5} /></div>
                        <div>
                           <h3 className="text-lg font-bold text-slate-900 dark:text-white">Imagiologia</h3>
                           <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Examion RX • DICOM 1.4</p>
                        </div>
                     </div>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <Button onClick={() => handleRequestExam("IMAGING", "Examion RX", "RX Tórax")} className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs shadow-sm">RX Tórax</Button>
                        <Button variant="outline" onClick={() => handleRequestExam("IMAGING", "Examion RX", "RX Abdómen")} className="h-12 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl text-xs">RX Abdómen</Button>
                        <Button variant="outline" onClick={() => handleRequestExam("IMAGING", "Examion RX", "Ecografia")} className="h-12 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl text-xs">Ecografia</Button>
                        <Button variant="outline" onClick={() => handleRequestExam("IMAGING", "Examion RX", "RX Membros")} className="h-12 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-semibold rounded-xl text-xs">RX Membros</Button>
                     </div>
                  </PremiumCard>
              </div>

              {/* Recent Results */}
               <PremiumCard padding="none">
                  <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5">
                     <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><TrendingUp size={14} className="text-blue-600" /> Resultados Recebidos</h3>
                  </div>
                  <div className="p-6">
                     {safeDiagnostics.length === 0 ? (
                       <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-white/5">
                          <FlaskConical size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                          <p className="text-slate-500 dark:text-slate-400 font-bold text-sm">Sem resultados para este paciente</p>
                          <p className="text-slate-500 dark:text-slate-400 text-xs mt-1">Os resultados aparecerão aqui quando recebidos dos integradores.</p>
                       </div>
                    ) : (
                       <div className="space-y-3">
                           {safeDiagnostics.map((dx: DiagnosticResult) => (
                             <div key={dx.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-900/30 transition-all group">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dx.type === 'LAB' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                                      {dx.type === 'LAB' ? <FlaskConical size={18} /> : <ImageIcon size={18} />}
                                   </div>
                                   <div>
                                      <p className="font-bold text-sm text-slate-900 dark:text-white">{dx.summary ?? dx.testName ?? "—"}</p>
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 font-bold">{dx.source} • {safeFormatDistance(dx.createdAt)}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                   <Badge className={cn(
                                      "border-none font-bold text-[8px]",
                                      dx.status === "COMPLETED" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                                      dx.status === "ALERT" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" :
                                      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                   )}>{dx.status === "COMPLETED" ? "Recebido" : dx.status === "ALERT" ? "Alerta" : "Pendente"}</Badge>
                                   <Button
                                     variant="ghost"
                                     size="icon"
                                     onClick={() => setIsExamsModalOpen(true)}
                                     title="Visualizar Exame"
                                     className="h-8 w-8 rounded-lg text-slate-500 dark:text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all"
                                   >
                                      <Eye size={14} />
                                   </Button>
                                </div>
                             </div>
                          ))}
                       </div>
                    )}
                  </div>
               </PremiumCard>

               {/* Link to full diagnostics page */}
               <div className="text-center">
                  <Button variant="outline" onClick={() => router.push("/dashboard/diagnostics")} className="rounded-xl font-semibold text-xs gap-2 border-slate-200 dark:border-white/10">
                     <TrendingUp size={14} /> Ver Todos os Diagnósticos da Clínica <ChevronLeft className="rotate-180" size={14} />
                  </Button>
               </div>
            </div>
         </TabsContent>
       </Tabs>

        {/* Modal de Visualização dos Exames da Consulta e Paciente */}
        <ExamVisualizerModal
          isOpen={isExamsModalOpen}
          onClose={() => setIsExamsModalOpen(false)}
          patient={patient}
          appointmentId={appointmentId}
          consultationId={null}
          diagnostics={safeDiagnostics}
          sessionExamIds={sessionExamIds}
          onRequestExam={handleRequestExam}
          onInsertToNotes={(note) => {
            setExamNotes((prev) => (prev ? `${prev}\n\n${note}` : note));
          }}
        />

        {/* Pop-up de Aviso de Reavaliação Pós-Pagamento */}
        <Dialog
          open={!!reassessmentPopup?.open}
          onOpenChange={(open) => {
            if (!open) {
              setReassessmentPopup(null);
              router.push(`/dashboard/patients/${patientId}`);
            }
          }}
        >
          <DialogContent className="sm:max-w-md rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 shadow-2xl p-6">
            <DialogHeader className="text-center sm:text-center space-y-3">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mx-auto shadow-md">
                <CalendarCheck size={32} strokeWidth={2.5} />
              </div>
              <DialogTitle className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                Fatura Paga & Consulta Concluída
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                A fatura da consulta foi processada e liquidada com sucesso.
              </DialogDescription>
            </DialogHeader>

            <div className="my-4 p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-amber-950 dark:text-amber-200 text-center space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-widest text-amber-600 dark:text-amber-400">Aviso Clínico</p>
              <p className="text-lg font-black leading-snug">
                O paciente tem reavaliação a marcar no dia{" "}
                <span className="text-amber-700 dark:text-amber-300 underline decoration-2 font-black">
                  {(() => {
                    try {
                      if (!reassessmentPopup?.date) return "";
                      const parts = reassessmentPopup.date.split("-");
                      if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
                      return reassessmentPopup.date;
                    } catch {
                      return reassessmentPopup?.date || "";
                    }
                  })()}
                </span>
              </p>
            </div>

            <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button
                variant="outline"
                className="rounded-xl h-11 border-slate-200 dark:border-white/10 font-bold text-xs flex-1"
                onClick={() => {
                  setReassessmentPopup(null);
                  router.push(`/dashboard/patients/${patientId}`);
                }}
              >
                Concluir & Ir para Ficha
              </Button>
              <Button
                className="rounded-xl h-11 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-500/20 flex-1 gap-1.5"
                onClick={() => {
                  const targetDate = reassessmentPopup?.date;
                  setReassessmentPopup(null);
                  router.push(`/dashboard/appointments?patientId=${patientId}${targetDate ? `&date=${targetDate}` : ""}`);
                }}
              >
                <Calendar size={15} /> Agendar na Agenda
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
     </div>
   );
 }

 export default function ConsultationPage() {
   return (
     <Suspense fallback={<div className="p-12 text-center font-semibold text-slate-500 dark:text-slate-400 animate-pulse">A sincronizar contexto clínico...</div>}>
       <ConsultationContent />
     </Suspense>
   );
 }
