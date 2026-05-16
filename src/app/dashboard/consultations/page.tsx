"use client";

import { useState, Suspense, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { 
  Save, FileText, Activity, ClipboardCheck, Receipt, FlaskConical,
  ChevronLeft, Stethoscope, Image as ImageIcon, Thermometer, Weight,
  Clock, Plus, ShieldAlert, Search, History, Syringe, AlertCircle,
  AlertTriangle, Sparkles, Eye, TrendingUp, CheckCircle2, Pill
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
import { ClinicalTimeline } from "@/components/ClinicalTimeline";
import { ConsultationBilling } from "@/components/ConsultationBilling";
import { ClinicalVaccines } from "@/components/ClinicalVaccines";
import { PrescriptionForm } from "@/components/forms/PrescriptionForm";
import { SmartAlertsFetcher } from "@/components/SmartAlertsFetcher";
import { PremiumCard } from "@/components/PremiumCard";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  const [notes, setNotes] = useState({ subjective: "", objective: "", assessment: "", plan: "" });
  const [vitals, setVitals] = useState({ weight: "", temperature: "", heartRate: "", respiratoryRate: "" });

  useEffect(() => { setActiveTab(urlTab); }, [urlTab]);

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

  const { data: diagnostics } = useQuery({
    queryKey: ["patient-diagnostics", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/diagnostics?patientId=${patientId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!patientId,
  });

  const { data: health } = useIntegrationHealth();

  const handleRequestExam = async (type: "LAB" | "IMAGING", source: string, testName: string) => {
    toast.promise(
      fetch("/api/diagnostics/request", {
        method: "POST",
        body: JSON.stringify({ patientId, type, source, testName }),
        headers: { "Content-Type": "application/json" },
      }).then(res => res.json()),
      {
        loading: `A comunicar com ${source}...`,
        success: (data) => data.message,
        error: `Erro ao solicitar exame em ${source}.`,
      }
    );
  };

  const handleSave = async () => {
    if (billingItems.length === 0 && !notes.plan) {
      toast.error("Adicione notas clínicas ou itens para faturar.");
      return;
    }
    toast.promise(
      fetch("/api/consultations", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          appointmentId: appointmentId || "walk-in-" + Date.now(),
          notes,
          vitals: {
            weight: vitals.weight ? parseFloat(vitals.weight) : null,
            temperature: vitals.temperature ? parseFloat(vitals.temperature) : null,
            heartRate: vitals.heartRate ? parseFloat(vitals.heartRate) : null,
            respiratoryRate: vitals.respiratoryRate ? parseFloat(vitals.respiratoryRate) : null,
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
        success: () => { router.push(`/dashboard/patients/${patientId}`); return "Consulta finalizada com sucesso!"; },
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
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-6 animate-in fade-in zoom-in-95 duration-1000">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full animate-pulse" />
          <div className="w-40 h-40 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-white/5 shadow-2xl relative z-10">
             <Stethoscope size={80} strokeWidth={1} />
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-slate-900 dark:bg-white rounded-3xl flex items-center justify-center text-white dark:text-slate-900 shadow-2xl z-20 animate-bounce delay-500">
             <Plus size={32} strokeWidth={3} />
          </div>
        </div>
        <div className="text-center space-y-4 relative z-10">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tighter">Clinical Environment</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md mx-auto text-xl leading-relaxed">
            Selecione um paciente na <span className="text-blue-600">Agenda</span> ou <span className="text-blue-600">Base de Dados</span> para iniciar um atendimento clínico de alta performance.
          </p>
        </div>
        <div className="flex gap-4">
          <Button onClick={() => router.push("/dashboard/appointments")} className="h-16 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 px-10 font-bold transition-all active:scale-95 shadow-2xl shadow-blue-500/20 tracking-widest text-xs">
            Abrir Agenda
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/patients")} className="h-16 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:scale-105 px-10 font-bold transition-all active:scale-95 tracking-widest text-xs">
            Procurar Paciente
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
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-6 rounded-3xl ring-1 ring-slate-100 dark:ring-white/5 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-2xl flex items-center justify-center text-white dark:text-slate-900 font-bold text-3xl shadow-lg transition-transform hover:rotate-3">
            {patient?.name?.[0] || "?"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight leading-none">{patient?.name}</h1>
               <Badge className="bg-blue-600 text-white border-none font-semibold text-xs px-3 py-1 rounded-lg">{patient?.species}</Badge>
               {!appointmentId && (
                 <Badge variant="outline" className="border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 font-medium text-[10px] px-3 py-1 rounded-lg animate-pulse">Walk-in</Badge>
               )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <p className="text-slate-500 dark:text-slate-400 font-medium">{patient?.breed} <span className="mx-2 opacity-10">|</span> {patient?.owner?.name}</p>
               {allergies && (
                 <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold text-[10px] bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-lg">
                   <ShieldAlert size={12} /> {allergies}
                 </span>
               )}
               {lastVitals && (
                 <span className="flex items-center gap-1.5 text-slate-400 font-medium text-[10px]">
                   <Weight size={12} /> {lastVitals.weight}kg
                 </span>
               )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 w-full lg:w-auto">
           <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 dark:border-white/10 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex-1 lg:flex-none" onClick={() => router.back()}>
             <ChevronLeft className="w-4 h-4 mr-2" strokeWidth={3} /> Cancelar
           </Button>
           <Button onClick={handleSave} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-semibold text-sm shadow-lg shadow-blue-500/20 transition-all active:scale-95 flex-1 lg:flex-none">
             <Save className="w-4 h-4 mr-2" strokeWidth={3} /> Finalizar Visita
           </Button>
        </div>
      </div>

      {/* Smart Alerts */}
      <SmartAlertsFetcher patientId={patientId!} />

      {/* Main Clinical Navigation */}
      <Tabs value={activeTab} onValueChange={updateTab} className="w-full">
        <div className="mb-10 overflow-x-auto -mx-4 px-4 md:-mx-8 md:px-8 no-scrollbar">
          <TabsList className="inline-flex w-auto min-w-full bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl ring-1 ring-slate-200/50 dark:ring-white/5 gap-1">
            {[
              { val: "clinical", label: "Histórico & SOAP", icon: ClipboardCheck },
              { val: "vaccines", label: "Vacinação & Prevenção", icon: Syringe },
              { val: "prescriptions", label: "Prescrições", icon: Pill },
              { val: "exams", label: "Meios Complementares", icon: FlaskConical },
              { val: "billing", label: "Farmácia & Faturação", icon: Receipt }
            ].map(t => (
              <TabsTrigger key={t.val} value={t.val}
                className="rounded-2xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-md font-semibold text-xs transition-all gap-2 py-3 px-4 dark:text-slate-400 dark:data-[state=active]:text-white whitespace-nowrap shrink-0">
                <t.icon className="w-4 h-4 shrink-0" strokeWidth={2.5} />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* CLINICAL / SOAP TAB */}
        <TabsContent value="clinical" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 space-y-6">
              <PremiumCard padding="none">
                <div className="px-6 py-6 pb-4 border-b border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
                  <div className="flex justify-between items-center">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">Protocolo Clínico SOAP</h2>
                    <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-medium px-3 py-1 rounded-lg">Standard Workflow</Badge>
                  </div>
                </div>
                <div className="p-6 space-y-6">
                  
                  {/* Vitals Input */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-slate-100 dark:border-white/5">
                    {[
                      { label: "Peso", icon: Weight, unit: "kg", color: "text-blue-500", placeholder: "12.45", key: "weight" },
                      { label: "Temp.", icon: Thermometer, unit: "ºC", color: "text-orange-500", placeholder: "38.6", key: "temperature" },
                      { label: "FC", icon: Clock, unit: "bpm", color: "text-purple-500", placeholder: "100", key: "heartRate" },
                      { label: "FR", icon: Activity, unit: "mpm", color: "text-rose-500", placeholder: "24", key: "respiratoryRate" }
                    ].map((vital, i) => (
                      <div key={i} className="flex flex-col gap-2 p-4 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-100 dark:ring-white/5 transition-all hover:ring-blue-500/30">
                        <div className="flex items-center gap-2">
                           <vital.icon size={14} className={vital.color} strokeWidth={3} />
                           <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{vital.label}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                           <Input type="number" step="0.1" className="border-none bg-transparent p-0 h-auto text-2xl font-bold text-slate-900 dark:text-white placeholder:text-slate-200 dark:placeholder:text-slate-700 focus-visible:ring-0" placeholder={vital.placeholder} value={(vitals as any)[vital.key]} onChange={(e) => setVitals({ ...vitals, [vital.key]: e.target.value })} />
                           <span className="text-xs font-medium text-slate-400">{vital.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">S: Subjective</Label>
                      <Textarea className="min-h-[140px] rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5 focus-visible:ring-blue-500/20 resize-none text-sm" value={notes.subjective} onChange={(e) => setNotes({ ...notes, subjective: e.target.value })} placeholder="Relato do proprietário, motivo da consulta..." />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">O: Objective</Label>
                      <Textarea className="min-h-[140px] rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5 focus-visible:ring-blue-500/20 resize-none text-sm" value={notes.objective} onChange={(e) => setNotes({ ...notes, objective: e.target.value })} placeholder="Mucosas, TRC, auscultação, palpação..." />
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs font-semibold text-slate-500 dark:text-slate-400 ml-1">A: Assessment</Label>
                      <Textarea className="min-h-[140px] rounded-2xl bg-slate-50 dark:bg-slate-800/40 border-slate-100 dark:border-white/5 focus-visible:ring-blue-500/20 resize-none text-sm" value={notes.assessment} onChange={(e) => setNotes({ ...notes, assessment: e.target.value })} placeholder="Conclusões clínicas, diferenciais..." />
                    </div>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between ml-1">
                        <Label className="text-xs font-semibold text-blue-600 dark:text-blue-400">P: Plan</Label>
                        <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-2" onClick={() => { if (!notes.plan) { toast.error("Escreva o plano primeiro!"); return; } updateTab("prescriptions"); toast.success("Plano transferido!"); }}>
                          <Sparkles size={12} strokeWidth={3} /> Gerar Prescrição
                        </Button>
                      </div>
                      <Textarea className="min-h-[140px] rounded-2xl bg-blue-50/30 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20 focus-visible:ring-blue-500/20 resize-none text-sm" value={notes.plan} onChange={(e) => setNotes({ ...notes, plan: e.target.value })} placeholder="Medicamentos, exames, recomendações..." />
                    </div>
                  </div>
                 </div>
               </PremiumCard>
             </div>

            <div className="lg:col-span-4 space-y-6">
              <PremiumCard padding="none" className="h-full flex flex-col">
                <div className="px-6 py-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2"><History size={14} className="text-blue-600" /> Histórico</h3>
                    <Badge variant="ghost" className="text-[10px] font-medium text-slate-400">{history?.length || 0} Eventos</Badge>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto max-h-[700px] p-6 no-scrollbar">
                   <ClinicalTimeline history={history} isLoading={isHistoryLoading} />
                 </div>
               </PremiumCard>
             </div>
           </div>
         </TabsContent>

        {/* VACCINES TAB */}
        <TabsContent value="vaccines" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           {patientId && <ClinicalVaccines patientId={patientId} />}
        </TabsContent>

        {/* PRESCRIPTIONS TAB */}
        <TabsContent value="prescriptions" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                  <PremiumCard padding="lg">
                     <div className="mb-6">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Emissão de Prescrição</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-1">Registo de medicamentos e protocolos de tratamento.</p>
                     </div>
                     {patientId && <PrescriptionForm patientId={patientId} consultationId={appointmentId || undefined} />}
                  </PremiumCard>
               </div>
               <div className="space-y-6">
                  <PremiumCard variant="purple" className="!bg-slate-900 dark:!bg-slate-800 text-white overflow-hidden relative">
                     <div className="absolute top-0 right-0 p-6 opacity-10"><Pill size={80} /></div>
                     <div className="relative z-10">
                        <h3 className="text-base font-bold mb-4">Notas Legais</h3>
                        <p className="text-slate-400 text-sm leading-relaxed mb-6">Prescrições de antibióticos requerem todos os campos para conformidade legal.</p>
                        <div className="space-y-3">
                           <div className="flex items-start gap-3"><div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" /><p className="text-xs text-slate-300">Válido por 30 dias por defeito.</p></div>
                           <div className="flex items-start gap-3"><div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" /><p className="text-xs text-slate-300">Gera PDF assinado digitalmente.</p></div>
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
                            ? "bg-emerald-600 text-white font-medium text-[10px] px-3 py-1 mb-3 rounded-lg"
                            : "bg-slate-600 text-white font-medium text-[10px] px-3 py-1 mb-3 rounded-lg"
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
                           <p className="text-xs text-slate-400 font-medium">Fuji DX-500 • HL7 Gateway</p>
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
                           <p className="text-xs text-slate-400 font-medium">Examion RX • DICOM 1.4</p>
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
                     {!diagnostics || diagnostics.length === 0 ? (
                       <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-100 dark:border-white/5">
                          <FlaskConical size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                          <p className="text-slate-400 font-bold text-sm">Sem resultados para este paciente</p>
                          <p className="text-slate-400 text-xs mt-1">Os resultados aparecerão aqui quando recebidos dos integradores.</p>
                       </div>
                    ) : (
                       <div className="space-y-3">
                           {diagnostics.map((dx: DiagnosticResult) => (
                             <div key={dx.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-900/30 transition-all group">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dx.type === 'LAB' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                                      {dx.type === 'LAB' ? <FlaskConical size={18} /> : <ImageIcon size={18} />}
                                   </div>
                                   <div>
                                      <p className="font-bold text-sm text-slate-900 dark:text-white">{dx.summary ?? dx.testName ?? "—"}</p>
                                      <p className="text-[10px] text-slate-400 font-bold">{dx.source} • {dx.createdAt ? formatDistanceToNow(new Date(dx.createdAt), { addSuffix: true, locale: pt }) : "—"}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                   <Badge className={cn(
                                      "border-none font-bold text-[8px]",
                                      dx.status === "COMPLETED" ? "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400" :
                                      dx.status === "ALERT" ? "bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400" :
                                      "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
                                   )}>{dx.status === "COMPLETED" ? "Recebido" : dx.status === "ALERT" ? "Alerta" : "Pendente"}</Badge>
                                   <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 group-hover:text-blue-600 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20 transition-all">
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
     </div>
   );
 }

 export default function ConsultationPage() {
   return (
     <Suspense fallback={<div className="p-12 text-center font-semibold text-slate-400 animate-pulse">A sincronizar contexto clínico...</div>}>
       <ConsultationContent />
     </Suspense>
   );
 }
