"use client";

import { useState, Suspense, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Save, FileText, Activity, ClipboardCheck, Receipt, FlaskConical,
  ChevronLeft, Stethoscope, Image as ImageIcon, Thermometer, Weight,
  Clock, Plus, ShieldAlert, Search, History, Syringe, AlertCircle,
  AlertTriangle, Sparkles, Eye, TrendingUp, CheckCircle2, Pill,
  Venus, Mars, ShieldCheck, Zap, Calendar, CalendarCheck,
  Phone, Mail, User, X, Dog, Cat, PawPrint
} from "lucide-react";
import { LungsIcon } from "@/components/icons/LungsIcon";
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
import { DiagnosticProfilesModal, ClinicalProfile, CLINICAL_PROFILES_CATALOG } from "@/components/consultations/DiagnosticProfilesModal";
import { ProfileTabContent } from "@/components/consultations/ProfileTabContent";
import { DewormingSimulatorModal } from "@/components/consultations/DewormingSimulatorModal";
import { PetLink } from "@/components/PetLink";
import { useIntegrationHealth } from "@/hooks/useIntegrationHealth";
import type { BillingItem, DiagnosticResult } from "@/types";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
function normalizeTemperament(raw?: string | null): "Dócil" | "Nervoso" | "Agressivo" | null {
  if (!raw) return null;
  const s = raw.trim().toLowerCase();
  if (s.includes("dócil") || s.includes("docil") || s.includes("baixo")) return "Dócil";
  if (s.includes("nervoso") || s.includes("médio") || s.includes("medio")) return "Nervoso";
  if (s.includes("agressivo") || s.includes("alto")) return "Agressivo";
  return null;
}

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
  const [isProfilesModalOpen, setIsProfilesModalOpen] = useState(false);
  const [isDewormingModalOpen, setIsDewormingModalOpen] = useState(false);
  const [activeProfiles, setActiveProfiles] = useState<ClinicalProfile[]>([]);
  const [reassessmentPopup, setReassessmentPopup] = useState<{ open: boolean; date: string } | null>(null);
  const [patientSearch, setPatientSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Persist and load active clinical profiles with the patient
  useEffect(() => {
    if (!patientId) {
      setActiveProfiles([]);
      return;
    }
    try {
      const stored = localStorage.getItem(`vet_patient_profiles_${patientId}`);
      if (stored) {
        const raw = JSON.parse(stored);
        if (Array.isArray(raw)) {
          const matched = raw
            .map((item: any) => {
              const id = typeof item === "string" ? item : item?.id;
              const fromCatalog = CLINICAL_PROFILES_CATALOG.find((p) => p.id === id);
              if (fromCatalog) return fromCatalog;
              if (typeof item === "object" && item?.id) return item;
              return null;
            })
            .filter(Boolean) as ClinicalProfile[];
          setActiveProfiles(matched);
        } else {
          setActiveProfiles([]);
        }
      } else {
        setActiveProfiles([]);
      }
    } catch (e) {
      console.error("Error loading patient clinical profiles:", e);
    }
  }, [patientId]);

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
      const norm = normalizeTemperament(patient.aggressionLevel);
      if (norm) setTemperament(norm);
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

  const handleSelectProfile = (profile: ClinicalProfile) => {
    setActiveProfiles((prev) => {
      if (!prev.some((p) => p.id === profile.id)) {
        const updated = [...prev, profile];
        if (patientId) {
          try {
            localStorage.setItem(
              `vet_patient_profiles_${patientId}`,
              JSON.stringify(updated.map((p) => p.id))
            );
          } catch (e) {
            console.error("Error saving patient clinical profile:", e);
          }
        }
        return updated;
      }
      return prev;
    });
    updateTab(profile.id);
  };

  const handleDeactivateProfile = (profileId: string) => {
    setActiveProfiles((prev) => {
      const updated = prev.filter((p) => p.id !== profileId);
      if (patientId) {
        try {
          localStorage.setItem(
            `vet_patient_profiles_${patientId}`,
            JSON.stringify(updated.map((p) => p.id))
          );
        } catch (e) {
          console.error("Error updating patient clinical profiles:", e);
        }
      }
      return updated;
    });
    if (activeTab === profileId) {
      updateTab("clinical");
    }
    toast.success("Perfil clínico desativado com sucesso.");
  };

  const handleCloseProfileTab = (profileId: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    handleDeactivateProfile(profileId);
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
      <div className="space-y-6 animate-pulse p-4 md:p-8 w-full">
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

  const speciesLower = (patient?.species || "").toLowerCase();
  const isFeline = speciesLower.includes("gato") || speciesLower.includes("felin");
  const isDog = speciesLower.includes("cão") || speciesLower.includes("can");
  const SpeciesIcon = isDog ? Dog : isFeline ? Cat : PawPrint;

  const getVitalFeedback = (key: string, valueStr: string) => {
    if (!valueStr) return null;
    const val = parseFloat(valueStr);
    if (isNaN(val)) return null;

    if (key === "temperature") {
      if (val < 37.5) return { label: "Hipotermia", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900" };
      if (val < 38.0) return { label: "Subnormal", color: "text-sky-600 bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-900" };
      if (val > 39.5) return { label: "Febre", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900" };
      if (val > 39.2) return { label: "Alta", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900" };
      return { label: "Normal", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900" };
    }

    if (key === "heartRate") {
      const min = isFeline ? 140 : 70;
      const max = isFeline ? 220 : 140;
      if (val < min) return { label: "Bradicardia", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900" };
      if (val > max) return { label: "Taquicardia", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900" };
      return { label: "Normal", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900" };
    }

    if (key === "respiratoryRate") {
      const min = isFeline ? 20 : 15;
      const max = isFeline ? 30 : 30;
      if (val < min) return { label: "Bradipneia", color: "text-blue-600 bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-900" };
      if (val > 40) return { label: "Taquipneia ++", color: "text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900" };
      if (val > max) return { label: "Taquipneia", color: "text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900" };
      return { label: "Normal", color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900" };
    }

    return null;
  };

  return (
    <div className="space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 w-full px-4 md:px-8">
      
      {/* Header Context Bar */}
      <div className={cn(
        "flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 p-6 rounded-3xl ring-1 shadow-md w-full relative overflow-hidden",
        isFeline ? "bg-gradient-to-br from-indigo-100/80 via-white to-purple-50/50 dark:from-indigo-900/40 dark:via-slate-900 dark:to-purple-900/20 ring-indigo-200 dark:ring-indigo-800/50" : 
        isDog ? "bg-gradient-to-br from-sky-100/80 via-white to-blue-50/50 dark:from-sky-900/40 dark:via-slate-900 dark:to-blue-900/20 ring-sky-200 dark:ring-sky-800/50" :
        "bg-gradient-to-br from-emerald-100/80 via-white to-teal-50/50 dark:from-emerald-900/40 dark:via-slate-900 dark:to-teal-900/20 ring-emerald-200 dark:ring-emerald-800/50"
      )}>
        {/* Subtle background icon */}
        <div className={cn(
           "absolute right-[25%] top-1/2 -translate-y-1/2 opacity-10 dark:opacity-[0.08] pointer-events-none -rotate-12",
           isFeline ? "text-indigo-600 dark:text-indigo-400" : isDog ? "text-sky-600 dark:text-sky-400" : "text-emerald-600 dark:text-emerald-400"
        )}>
          <SpeciesIcon size={240} />
        </div>

        <div className="flex items-center gap-6 relative z-10">
          <PetLink petId={patientId} className="no-underline" stopPropagation={false}>
            <div className={cn(
              "w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl shadow-xl transition-all duration-300 hover:scale-105 hover:rotate-2 shrink-0 ring-4 ring-white/80 dark:ring-white/10 relative overflow-hidden backdrop-blur-sm",
              isFeline
                ? "bg-gradient-to-br from-indigo-500 via-violet-500 to-purple-600 text-white shadow-indigo-500/25"
                : isDog
                ? "bg-gradient-to-br from-sky-500 via-blue-500 to-indigo-600 text-white shadow-blue-500/25"
                : "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 text-white shadow-emerald-500/25"
            )}>
              <span>{patient?.name?.[0]?.toUpperCase() || "?"}</span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </PetLink>
          <div>
            <div className="flex flex-wrap items-center gap-2.5 mb-2">
              <PetLink petId={patientId}>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none hover:text-blue-600 dark:hover:text-blue-400 transition-colors">{patient?.name}</h1>
              </PetLink>
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

              {/* Raça — após a espécie e o sexo */}
              {patient?.breed && (
                <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 rounded-lg border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50">
                  {patient.breed}
                </Badge>
              )}

              {/* Temperament Badge */}
              {(() => {
                const norm = normalizeTemperament(temperament || patient?.aggressionLevel);
                if (!norm) return null;
                return (
                  <Badge className={cn("text-xs font-bold px-2.5 py-1 rounded-lg border-none flex items-center gap-1 shadow-sm",
                    norm === "Dócil" ? "bg-emerald-600 text-white shadow-emerald-500/20" :
                    norm === "Nervoso" ? "bg-amber-500 text-slate-950 font-black shadow-amber-500/20" :
                    "bg-rose-600 text-white shadow-rose-500/20"
                  )}>
                    {norm === "Dócil" ? <ShieldCheck size={12} strokeWidth={2.5} /> :
                     norm === "Nervoso" ? <Zap size={12} strokeWidth={2.5} /> :
                     <ShieldAlert size={12} strokeWidth={2.5} />}
                    {norm}
                  </Badge>
                );
              })()}

              {!appointmentId && (
                <Badge variant="outline" className="border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 font-medium text-[11px] px-3 py-1 rounded-lg animate-pulse">Walk-in</Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3.5 text-sm text-slate-600 dark:text-slate-400 font-medium">
              {/* Tutor (Nome primeiro) */}
              <Link 
                href={patient?.owner?.id ? `/dashboard/customers/${patient.owner.id}` : (patient?.ownerId ? `/dashboard/customers/${patient.ownerId}` : '#')}
                className="font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1.5 transition-colors"
                title="Ficha do Tutor"
              >
                <User size={14} className="text-slate-400 shrink-0" />
                <span>{patient?.owner?.name || "Sem tutor associado"}</span>
              </Link>

              {/* Contacto telefónico do tutor */}
              {patient?.owner?.phone && (
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
              {patient?.owner?.email && (
                <>
                  <span className="opacity-25 text-slate-300 dark:text-slate-700">|</span>
                  <a 
                    href={`mailto:${patient.owner.email}`} 
                    className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                    title="Enviar e-mail ao tutor"
                  >
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <span>{patient.owner.email}</span>
                  </a>
                </>
              )}

              {lastVitals && (
                <>
                  <span className="opacity-25 text-slate-300 dark:text-slate-700">|</span>
                  <span className="flex items-center gap-1.5 text-[11px] font-semibold bg-slate-100 dark:bg-white/5 px-2.5 py-0.5 rounded-md text-slate-600 dark:text-slate-300">
                    <Weight size={12} /> {lastVitals.weight}kg
                  </span>
                </>
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
          <TabsList className="flex w-full bg-slate-100/70 dark:bg-slate-900/60 p-1.5 rounded-2xl ring-1 ring-slate-200/60 dark:ring-white/5 gap-1.5">
            <TabsTrigger
              value="clinical"
              className="flex-1 rounded-2xl data-[state=active]:bg-blue-600 data-[state=active]:text-white dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-blue-500/25 font-bold text-xs transition-all gap-2 py-3 px-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap justify-center"
            >
              <ClipboardCheck className="w-4 h-4 shrink-0" strokeWidth={2.5} /> Atendimento Clínico
            </TabsTrigger>

            {/* Dynamic Profile Tabs placed BETWEEN Atendimento Clínico and Faturação with differentiated colors */}
            {activeProfiles.map((p, idx) => {
              // Differentiated color palette per clinical profile
              const PROFILE_THEMES: Record<string, { active: string; inactive: string; iconColor: string }> = {
                irc: {
                  active: "data-[state=active]:bg-cyan-600 data-[state=active]:text-white dark:data-[state=active]:bg-cyan-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-cyan-500/25",
                  inactive: "text-cyan-800 dark:text-cyan-300 bg-cyan-500/10 hover:bg-cyan-500/20 border-cyan-500/30",
                  iconColor: "text-cyan-600 dark:text-cyan-400 group-data-[state=active]:text-white",
                },
                leishmaniose: {
                  active: "data-[state=active]:bg-amber-600 data-[state=active]:text-white dark:data-[state=active]:bg-amber-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-amber-500/25",
                  inactive: "text-amber-800 dark:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30",
                  iconColor: "text-amber-600 dark:text-amber-400 group-data-[state=active]:text-white",
                },
                diabetes: {
                  active: "data-[state=active]:bg-purple-600 data-[state=active]:text-white dark:data-[state=active]:bg-purple-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-purple-500/25",
                  inactive: "text-purple-800 dark:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30",
                  iconColor: "text-purple-600 dark:text-purple-400 group-data-[state=active]:text-white",
                },
                pancreatite: {
                  active: "data-[state=active]:bg-rose-600 data-[state=active]:text-white dark:data-[state=active]:bg-rose-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-rose-500/25",
                  inactive: "text-rose-800 dark:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30",
                  iconColor: "text-rose-600 dark:text-rose-400 group-data-[state=active]:text-white",
                },
                cardiopatia: {
                  active: "data-[state=active]:bg-red-600 data-[state=active]:text-white dark:data-[state=active]:bg-red-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-red-500/25",
                  inactive: "text-red-800 dark:text-red-300 bg-red-500/10 hover:bg-red-500/20 border-red-500/30",
                  iconColor: "text-red-600 dark:text-red-400 group-data-[state=active]:text-white",
                },
                dermatite_atopica: {
                  active: "data-[state=active]:bg-orange-600 data-[state=active]:text-white dark:data-[state=active]:bg-orange-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-orange-500/25",
                  inactive: "text-orange-800 dark:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 border-orange-500/30",
                  iconColor: "text-orange-600 dark:text-orange-400 group-data-[state=active]:text-white",
                },
              };

              const FALLBACK_THEMES = [
                {
                  active: "data-[state=active]:bg-indigo-600 data-[state=active]:text-white dark:data-[state=active]:bg-indigo-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-indigo-500/25",
                  inactive: "text-indigo-800 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30",
                  iconColor: "text-indigo-600 dark:text-indigo-400 group-data-[state=active]:text-white",
                },
                {
                  active: "data-[state=active]:bg-teal-600 data-[state=active]:text-white dark:data-[state=active]:bg-teal-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-teal-500/25",
                  inactive: "text-teal-800 dark:text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border-teal-500/30",
                  iconColor: "text-teal-600 dark:text-teal-400 group-data-[state=active]:text-white",
                },
                {
                  active: "data-[state=active]:bg-fuchsia-600 data-[state=active]:text-white dark:data-[state=active]:bg-fuchsia-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-fuchsia-500/25",
                  inactive: "text-fuchsia-800 dark:text-fuchsia-300 bg-fuchsia-500/10 hover:bg-fuchsia-500/20 border-fuchsia-500/30",
                  iconColor: "text-fuchsia-600 dark:text-fuchsia-400 group-data-[state=active]:text-white",
                },
              ];

              const theme = PROFILE_THEMES[p.id] || FALLBACK_THEMES[idx % FALLBACK_THEMES.length];

              return (
                <TabsTrigger
                  key={p.id}
                  value={p.id}
                  className={cn(
                    "group flex-1 rounded-2xl font-bold text-xs transition-all gap-2 py-3 px-3.5 whitespace-nowrap justify-center border",
                    theme.inactive,
                    theme.active
                  )}
                >
                  <Activity className={cn("w-3.5 h-3.5 shrink-0 transition-colors", theme.iconColor)} />
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{p.shortTitle || p.title}</span>
                </TabsTrigger>
              );
            })}

            <TabsTrigger
              value="billing"
              className="flex-1 rounded-2xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white dark:data-[state=active]:bg-emerald-600 dark:data-[state=active]:text-white data-[state=active]:shadow-md data-[state=active]:shadow-emerald-500/25 font-bold text-xs transition-all gap-2 py-3 px-4 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap justify-center"
            >
              <Receipt className="w-4 h-4 shrink-0" strokeWidth={2.5} /> Faturação
            </TabsTrigger>
          </TabsList>
        </div>

        {/* CLINICAL / SOAP TAB */}
        <TabsContent value="clinical" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="w-full space-y-6">
            <div>
              <PremiumCard padding="none">
                <div className="px-6 py-6 pb-4 border-b border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Consulta</h2>
                    <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[11px] font-medium px-3 py-1 rounded-lg">Standard Workflow</Badge>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  
                  {/* Vitals Input — 4 core measurements */}
                  <div className="space-y-4 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-white/5">
                    <p className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Sinais Vitais</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { 
                          label: "Peso", 
                          icon: Weight, 
                          unit: "kg", 
                          color: "text-blue-600 dark:text-blue-400", 
                          bg: "bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400", 
                          placeholder: "12.45", 
                          key: "weight",
                          refText: lastVitals?.weight ? `Ant: ${lastVitals.weight}kg` : "Triagem",
                        },
                        { 
                          label: "Temp.", 
                          icon: Thermometer, 
                          unit: "ºC", 
                          color: "text-orange-600 dark:text-orange-400", 
                          bg: "bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400", 
                          placeholder: "38.6", 
                          key: "temperature",
                          refText: "Ref: 38.0–39.2 ºC",
                        },
                        { 
                          label: "FC", 
                          icon: Stethoscope, 
                          unit: "bpm", 
                          color: "text-purple-600 dark:text-purple-400", 
                          bg: "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400", 
                          placeholder: "100", 
                          key: "heartRate",
                          refText: isFeline ? "Ref: 140–220" : "Ref: 60–140",
                        },
                        { 
                          label: "FR", 
                          icon: LungsIcon, 
                          unit: "mpm", 
                          color: "text-rose-600 dark:text-rose-400", 
                          bg: "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400", 
                          placeholder: "24", 
                          key: "respiratoryRate",
                          refText: isFeline ? "Ref: 20–30" : "Ref: 15–30",
                        }
                      ].map((vital, i) => {
                        const feedback = getVitalFeedback(vital.key, (vitals as any)[vital.key]);
                        return (
                          <div key={i} className="flex flex-col justify-between p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-white/10 transition-all duration-200 hover:ring-blue-500/40 hover:shadow-md focus-within:ring-2 focus-within:ring-blue-500/40 focus-within:shadow-md group">
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-2">
                                <div className={cn("w-7 h-7 rounded-xl flex items-center justify-center shrink-0 transition-transform group-focus-within:scale-110", vital.bg)}>
                                  <vital.icon size={14} strokeWidth={2.5} />
                                </div>
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">{vital.label}</span>
                              </div>
                              {feedback ? (
                                <span className={cn("text-[10px] font-bold px-1.5 py-0.5 rounded-md border", feedback.color)}>
                                  {feedback.label}
                                </span>
                              ) : (
                                <span className="text-[10px] font-medium text-slate-400 dark:text-slate-500 truncate max-w-[90px]">
                                  {vital.refText}
                                </span>
                              )}
                            </div>
                            <div className="flex items-baseline gap-2 mt-2">
                               <Input type="number" step="0.1" className="border-none bg-transparent p-0 h-auto text-2xl font-black text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 focus-visible:ring-0" placeholder={vital.placeholder} value={(vitals as any)[vital.key]} onChange={(e) => setVitals({ ...vitals, [vital.key]: e.target.value })} />
                               <span className="text-xs font-bold text-slate-400 dark:text-slate-500">{vital.unit}</span>
                            </div>
                          </div>
                        );
                      })}
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
                    <div className="space-y-2 group/field transition-all">
                      <div className="flex items-center gap-2 ml-0.5">
                        <span className="w-6 h-6 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-lg text-xs font-black flex items-center justify-center transition-transform group-focus-within/field:scale-110 group-focus-within/field:shadow-sm">1</span>
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Motivo de Consulta</Label>
                        {chiefComplaint && (
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto animate-in fade-in duration-200">
                            <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                            Preenchido
                          </span>
                        )}
                      </div>
                      <Input
                        value={chiefComplaint}
                        onChange={(e) => setChiefComplaint(e.target.value)}
                        placeholder="Ex: Vacinação anual, tosse e espirros, vómitos frequentes, claudicação da pata posterior..."
                        className="h-11 rounded-xl bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm font-medium focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/40 transition-all duration-200"
                      />
                    </div>

                    {/* 2. História Pregressa */}
                    <div className="space-y-2 group/field transition-all">
                      <div className="flex items-center gap-2 ml-0.5">
                        <span className="w-6 h-6 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-black flex items-center justify-center transition-transform group-focus-within/field:scale-110 group-focus-within/field:shadow-sm">2</span>
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">História Pregressa</Label>
                        {pastHistory && (
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto animate-in fade-in duration-200">
                            <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                            {pastHistory.trim().split(/\s+/).filter(Boolean).length} {pastHistory.trim().split(/\s+/).filter(Boolean).length === 1 ? "palavra" : "palavras"}
                          </span>
                        )}
                      </div>
                      <Textarea
                        value={pastHistory}
                        onChange={(e) => setPastHistory(e.target.value)}
                        placeholder="Início e evolução dos sinais clínicos, medicação em curso, doenças prévias, cirurgias anteriores, alimentação e ambiente..."
                        className="min-h-[105px] rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/40 transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* 3. Exame Físico */}
                    <div className="space-y-2 group/field transition-all">
                      <div className="flex items-center gap-2 ml-0.5">
                        <span className="w-6 h-6 bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400 rounded-lg text-xs font-black flex items-center justify-center transition-transform group-focus-within/field:scale-110 group-focus-within/field:shadow-sm">3</span>
                        <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Exame Físico</Label>
                        {physicalExam && (
                          <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 ml-auto animate-in fade-in duration-200">
                            <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                            {physicalExam.trim().split(/\s+/).filter(Boolean).length} {physicalExam.trim().split(/\s+/).filter(Boolean).length === 1 ? "palavra" : "palavras"}
                          </span>
                        )}
                      </div>
                      <Textarea
                        value={physicalExam}
                        onChange={(e) => setPhysicalExam(e.target.value)}
                        placeholder="Alerta mental, mucosas, TRC, hidratação, auscultação cardiopulmonar, palpação abdominal, linfonodos, ouvidos, olhos, cavidade oral, pele e anexos..."
                        className="min-h-[105px] rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/40 transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* 4. Exames Complementares de Diagnóstico */}
                    <div className="space-y-2 group/field transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ml-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 rounded-lg text-xs font-black flex items-center justify-center transition-transform group-focus-within/field:scale-110 group-focus-within/field:shadow-sm">4</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Exames Complementares de Diagnóstico</Label>
                              {examNotes && (
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 animate-in fade-in duration-200">
                                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                  {examNotes.trim().split(/\s+/).filter(Boolean).length} {examNotes.trim().split(/\s+/).filter(Boolean).length === 1 ? "palavra" : "palavras"}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Resultados laboratoriais, radiografias e ecografias deste atendimento</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => setIsExamsModalOpen(true)}
                            className="h-9 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-500/20 gap-2 transition-transform active:scale-95"
                          >
                            <FlaskConical size={14} /> Ver Resultados dos Exames ({currentConsultationDiagnostics.length})
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsExamsModalOpen(true)}
                            className="h-9 px-3 rounded-xl border-slate-200 dark:border-white/10 text-xs font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 gap-1.5"
                          >
                            <Plus size={13} /> Requisitar Exame
                          </Button>
                        </div>
                      </div>

                      <Textarea
                        value={examNotes}
                        onChange={(e) => setExamNotes(e.target.value)}
                        placeholder="Resultados e observações dos exames complementares (inseridos pelo visualizador de exames ou manualmente)..."
                        className="min-h-[105px] rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/40 transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* 5. Diagnósticos Diferenciais / Definitivo */}
                    <div className="space-y-2 group/field transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ml-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-black flex items-center justify-center transition-transform group-focus-within/field:scale-110 group-focus-within/field:shadow-sm">5</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Diagnósticos Diferenciais / Definitivo</Label>
                              {diagnosticsNotes && (
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 animate-in fade-in duration-200">
                                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                  {diagnosticsNotes.trim().split(/\s+/).filter(Boolean).length} {diagnosticsNotes.trim().split(/\s+/).filter(Boolean).length === 1 ? "palavra" : "palavras"}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Hipóteses clínicas, estadiamento e perfis nosológicos</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => setIsProfilesModalOpen(true)}
                            className="h-9 px-3.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-md shadow-amber-500/20 gap-2 transition-transform active:scale-95"
                          >
                            <Sparkles size={14} /> Adicionar perfil {activeProfiles.length > 0 && `(${activeProfiles.length})`}
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={diagnosticsNotes}
                        onChange={(e) => setDiagnosticsNotes(e.target.value)}
                        placeholder="Lista de hipóteses diagnósticas, diferenciais considerados e diagnóstico definitivo..."
                        className="min-h-[105px] rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/40 transition-all duration-200 resize-none"
                      />
                    </div>

                    {/* 6. Tratamento */}
                    <div className="space-y-2 group/field transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 ml-0.5">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 bg-teal-100 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400 rounded-lg text-xs font-black flex items-center justify-center transition-transform group-focus-within/field:scale-110 group-focus-within/field:shadow-sm">6</span>
                          <div>
                            <div className="flex items-center gap-2">
                              <Label className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Tratamento</Label>
                              {treatment && (
                                <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 flex items-center gap-1 animate-in fade-in duration-200">
                                  <CheckCircle2 size={11} className="text-emerald-500 shrink-0" />
                                  {treatment.trim().split(/\s+/).filter(Boolean).length} {treatment.trim().split(/\s+/).filter(Boolean).length === 1 ? "palavra" : "palavras"}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Protocolo medicamentoso, posologias e simulações antiparasitárias</p>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <Button
                            type="button"
                            onClick={() => setIsDewormingModalOpen(true)}
                            className="h-9 px-3.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold shadow-md shadow-teal-500/20 gap-2 transition-transform active:scale-95"
                          >
                            <ShieldCheck size={14} /> Simulador de desparasitação
                          </Button>
                        </div>
                      </div>
                      <Textarea
                        value={treatment}
                        onChange={(e) => setTreatment(e.target.value)}
                        placeholder="Protocolo medicamentoso (fármacos, posologia, frequência, duração), fluidoterapia, procedimentos realizados e instruções ao tutor..."
                        className="min-h-[110px] rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border-slate-200 dark:border-white/10 text-sm focus-visible:ring-2 focus-visible:ring-blue-500/20 focus-visible:border-blue-500/40 transition-all duration-200 resize-none"
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

        {/* DYNAMIC CLINICAL PROFILE TABS */}
        {activeProfiles.map((profile) => (
          <TabsContent key={profile.id} value={profile.id} className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ProfileTabContent
              profile={profile}
              patientSpecies={patient?.species}
              onApplyToDiagnostics={(text) => {
                setDiagnosticsNotes((prev) => (prev ? `${prev}\n${text}` : text.trim()));
              }}
              onApplyToTreatment={(text) => {
                setTreatment((prev) => (prev ? `${prev}\n${text}` : text.trim()));
              }}
              onDeactivate={() => handleDeactivateProfile(profile.id)}
            />
          </TabsContent>
        ))}

        {/* BILLING TAB */}
        <TabsContent value="billing" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="flex flex-col min-h-[calc(100vh-20rem)]">
               <PremiumCard padding="lg" className="flex-1 flex flex-col">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-6">
                     <div>
                        <Badge className={
                          health?.inventorySync?.status === "active"
                            ? "bg-emerald-600 text-white font-medium text-[11px] px-3 py-1 mb-3 rounded-lg"
                            : "bg-slate-600 text-white font-medium text-[11px] px-3 py-1 mb-3 rounded-lg"
                        }>
                          {health?.inventorySync?.label || "Inventory Sync"}
                        </Badge>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-none">Faturação</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-medium mt-1 text-sm">Registe consumíveis, medicamentos e atos clínicos.</p>
                     </div>
                  </div>
                  <div className="flex-1">
                    <ConsultationBilling onItemsChange={setBillingItems} />
                  </div>
               </PremiumCard>
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

        {/* Modal de Perfis Clínicos de Diagnóstico */}
        <DiagnosticProfilesModal
          isOpen={isProfilesModalOpen}
          onClose={() => setIsProfilesModalOpen(false)}
          onSelectProfile={handleSelectProfile}
          onDeactivateProfile={handleDeactivateProfile}
          activeProfileIds={activeProfiles.map((p) => p.id)}
          patientSpecies={patient?.species}
        />

        {/* Modal do Simulador de Desparasitação */}
        <DewormingSimulatorModal
          isOpen={isDewormingModalOpen}
          onClose={() => setIsDewormingModalOpen(false)}
          patientWeight={vitals.weight || lastVitals?.weight}
          patientSpecies={patient?.species}
          patientName={patient?.name}
          onInsertTreatment={(text) => {
            setTreatment((prev) => (prev ? `${prev}\n${text}` : text.trim()));
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
