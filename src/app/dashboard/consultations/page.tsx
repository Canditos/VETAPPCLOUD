"use client";

import { useState, Suspense, useEffect } from "react";
import { 
  useSearchParams, 
  useRouter 
} from "next/navigation";
import { 
  Save, 
  FileText, 
  Activity, 
  ClipboardCheck, 
  Receipt,
  FlaskConical,
  ChevronLeft,
  Stethoscope,
  Image as ImageIcon,
  Thermometer,
  Weight,
  Droplets,
  Eye,
  Clock,
  Plus,
  ShieldAlert,
  Search,
  History,
  Syringe,
  AlertCircle
} from "lucide-react";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { ClinicalTimeline } from "@/components/ClinicalTimeline";
import { ConsultationBilling } from "@/components/ConsultationBilling";
import { ClinicalVaccines } from "@/components/ClinicalVaccines";
import { PrescriptionForm } from "@/components/forms/PrescriptionForm";
import { cn } from "@/lib/utils";
import { Pill } from "lucide-react";

function ConsultationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get("patientId");
  const appointmentId = searchParams.get("appointmentId");
  const urlTab = searchParams.get("tab") || "clinical";
  
  const [activeTab, setActiveTab] = useState(urlTab);
  const [billingItems, setBillingItems] = useState<any[]>([]);
  const [notes, setNotes] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });

  // Sync activeTab with URL if it changes (e.g. from a link)
  useEffect(() => {
    setActiveTab(urlTab);
  }, [urlTab]);

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

  const handleRequestExam = async (type: "LAB" | "IMAGING", source: string) => {
    toast.promise(
      fetch("/api/diagnostics/request", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          consultationId: "current",
          type,
          source
        }),
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
        success: (data) => {
          router.push(`/dashboard/patients/${patientId}`);
          return `Consulta finalizada com sucesso!`;
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

  // Error or Empty State
  if (!patientId || patientError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-in fade-in zoom-in-95 duration-1000">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/10 blur-[80px] rounded-full animate-pulse" />
          <div className="w-40 h-40 bg-white dark:bg-slate-900 rounded-[3.5rem] flex items-center justify-center text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-white/5 shadow-2xl relative z-10">
             <Stethoscope size={80} strokeWidth={1} />
          </div>
          <div className="absolute -right-4 -bottom-4 w-16 h-16 bg-slate-900 dark:bg-white rounded-3xl flex items-center justify-center text-white dark:text-slate-900 shadow-2xl z-20 animate-bounce delay-500">
             <Plus size={32} strokeWidth={3} />
          </div>
        </div>
        <div className="text-center space-y-4 relative z-10">
          <h2 className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Clinical Environment</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold max-w-md mx-auto text-xl leading-relaxed">
            Selecione um paciente na <span className="text-blue-600">Agenda</span> ou <span className="text-blue-600">Base de Dados</span> para iniciar um atendimento clínico de alta performance.
          </p>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={() => router.push("/dashboard/calendar")} 
            className="h-16 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 px-10 font-black transition-all active:scale-95 shadow-2xl shadow-blue-500/20 uppercase tracking-widest text-xs"
          >
            Abrir Agenda
          </Button>
          <Button 
            variant="outline"
            onClick={() => router.push("/dashboard/patients")} 
            className="h-16 rounded-[2rem] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:scale-105 px-10 font-black transition-all active:scale-95 uppercase tracking-widest text-xs"
          >
            Procurar Paciente
          </Button>
        </div>
      </div>
    );
  }

  if (isPatientLoading) {
    return (
      <div className="space-y-10 animate-pulse p-8 max-w-[1600px] mx-auto">
        <div className="flex justify-between items-end">
          <div className="flex gap-8">
            <Skeleton className="h-24 w-24 rounded-[2.5rem]" />
            <div className="space-y-4">
              <Skeleton className="h-10 w-80" />
              <Skeleton className="h-5 w-60" />
            </div>
          </div>
          <div className="flex gap-3">
             <Skeleton className="h-14 w-32 rounded-2xl" />
             <Skeleton className="h-14 w-48 rounded-2xl" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           <Skeleton className="h-20 rounded-[1.5rem]" />
           <Skeleton className="h-20 rounded-[1.5rem]" />
           <Skeleton className="h-20 rounded-[1.5rem]" />
           <Skeleton className="h-20 rounded-[1.5rem]" />
        </div>
        <Skeleton className="h-[500px] w-full rounded-[3rem]" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto px-4 sm:px-0">
      
      {/* Header Context Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[3rem] ring-1 ring-slate-100 dark:ring-white/5 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-slate-900 dark:bg-white rounded-[2.5rem] flex items-center justify-center text-white dark:text-slate-900 font-black text-4xl shadow-xl shadow-slate-900/10 transition-transform hover:rotate-3">
            {patient?.name?.[0] || "?"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{patient?.name}</h1>
              <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl">
                {patient?.species}
              </Badge>
              {!appointmentId && (
                <Badge variant="outline" className="border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg animate-pulse">
                  Walk-in Protocol Active
                </Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-6">
              <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">
                {patient?.breed} <span className="mx-2 opacity-10">|</span> <span className="text-slate-400">Proprietário:</span> {patient?.owner?.name}
              </p>
              <div className="hidden sm:flex items-center gap-3 pl-6 border-l border-slate-100 dark:border-white/5">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável:</span>
                <Select defaultValue="vet-1">
                  <SelectTrigger className="h-10 min-w-[160px] border-none bg-slate-50 dark:bg-white/5 rounded-xl text-[11px] font-black uppercase tracking-widest px-4 focus:ring-2 focus:ring-blue-500/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="vet-1">Dr. Marco (Clinical Lead)</SelectItem>
                    <SelectItem value="vet-2">Dra. Ana (Cirurgia)</SelectItem>
                    <SelectItem value="vet-3">Dr. João (Geral)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 w-full lg:w-auto">
          <Button variant="outline" className="h-14 px-8 rounded-2xl border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex-1 lg:flex-none" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" strokeWidth={3} />
            Cancelar
          </Button>
          <Button onClick={handleSave} className="h-14 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-blue-500/30 transition-all active:scale-95 flex-1 lg:flex-none">
            <Save className="w-4 h-4 mr-2" strokeWidth={3} />
            Finalizar Visita
          </Button>
        </div>
      </div>

      {/* Main Clinical Navigation */}
      <Tabs value={activeTab} onValueChange={updateTab} className="w-full">
        <div className="mb-10 overflow-x-auto -mx-4 px-4 md:-mx-8 md:px-8 no-scrollbar">
          <TabsList className="inline-flex w-auto min-w-full bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-[2.5rem] ring-1 ring-slate-200/50 dark:ring-white/5 gap-1">
            {[
              { val: "clinical", label: "Histórico & SOAP", icon: ClipboardCheck },
              { val: "vaccines", label: "Vacinação & Prevenção", icon: Syringe },
              { val: "prescriptions", label: "Prescrições", icon: Pill },
              { val: "exams", label: "Meios Complementares", icon: FlaskConical },
              { val: "billing", label: "Farmácia & Faturação", icon: Receipt }
            ].map(t => (
              <TabsTrigger key={t.val} value={t.val} 
                className="rounded-[2rem] data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg font-black text-[10px] uppercase tracking-widest transition-all gap-2 py-4 px-5 dark:text-slate-400 dark:data-[state=active]:text-white whitespace-nowrap shrink-0">
                <t.icon className="w-4 h-4 shrink-0" strokeWidth={3} />
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>


        {/* CLINICAL / SOAP TAB */}
        <TabsContent value="clinical" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-xl rounded-[3rem] bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
                <CardHeader className="p-10 pb-4 border-b border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Protocolo Clínico SOAP</CardTitle>
                    <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] font-black uppercase px-3 py-1">Standard Veterinary Workflow</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-10 space-y-10">
                  
                  {/* High Precision Vitals Input */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-inner">
                    {[
                      { label: "Peso Corporal", icon: Weight, unit: "kg", color: "text-blue-500", placeholder: "12.45" },
                      { label: "Temp. Rectal", icon: Thermometer, unit: "ºC", color: "text-orange-500", placeholder: "38.6" },
                      { label: "TRC (S)", icon: Clock, unit: "seg", color: "text-purple-500", placeholder: "2" },
                      { label: "Respiração", icon: Activity, unit: "mpm", color: "text-rose-500", placeholder: "24" }
                    ].map((vital, i) => (
                      <div key={i} className="flex flex-col gap-2 p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm ring-1 ring-slate-100 dark:ring-white/5 transition-all hover:ring-blue-500/30">
                        <div className="flex items-center gap-2">
                           <vital.icon size={14} className={vital.color} strokeWidth={3} />
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{vital.label}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                           <input type="number" step="0.1" className="w-full bg-transparent border-none p-0 focus:ring-0 font-black text-2xl text-slate-900 dark:text-white placeholder:opacity-20" placeholder={vital.placeholder} />
                           <span className="text-xs font-bold text-slate-400 uppercase">{vital.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">S: Subjective (Anamnese)</Label>
                      <textarea 
                        className="w-full min-h-[160px] p-6 rounded-[2.5rem] border-none bg-slate-50 dark:bg-slate-800/40 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm outline-none font-medium dark:text-white shadow-inner"
                        value={notes.subjective}
                        onChange={(e) => setNotes({ ...notes, subjective: e.target.value })}
                        placeholder="Relato do proprietário, motivo da consulta, evolução do quadro..."
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">O: Objective (Exame Físico)</Label>
                      <textarea 
                        className="w-full min-h-[160px] p-6 rounded-[2.5rem] border-none bg-slate-50 dark:bg-slate-800/40 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm outline-none font-medium dark:text-white shadow-inner"
                        value={notes.objective}
                        onChange={(e) => setNotes({ ...notes, objective: e.target.value })}
                        placeholder="Mucosas, TRC, auscultação, palpação, linfonodos..."
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">A: Assessment (Diagnóstico)</Label>
                      <textarea 
                        className="w-full min-h-[160px] p-6 rounded-[2.5rem] border-none bg-slate-50 dark:bg-slate-800/40 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm outline-none font-medium dark:text-white shadow-inner"
                        value={notes.assessment}
                        onChange={(e) => setNotes({ ...notes, assessment: e.target.value })}
                        placeholder="Conclusões clínicas, diferenciais prioritários..."
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] ml-4 font-bold">P: Plan (Plano de Tratamento)</Label>
                      <textarea 
                        className="w-full min-h-[160px] p-6 rounded-[2.5rem] border-none bg-blue-50/30 dark:bg-blue-900/10 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm outline-none font-black dark:text-white shadow-inner ring-1 ring-blue-100 dark:ring-blue-900/20"
                        value={notes.plan}
                        onChange={(e) => setNotes({ ...notes, plan: e.target.value })}
                        placeholder="Medicamentos prescritos, exames solicitados, recomendações ao tutor..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card className="border-none shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-100 dark:ring-white/5 h-full flex flex-col">
                <CardHeader className="p-8 pb-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                       <History size={16} className="text-blue-600" /> Histórico Chronos
                    </CardTitle>
                    <Badge variant="ghost" className="text-[9px] font-bold text-slate-400 uppercase">{history?.length || 0} Eventos</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto max-h-[800px] p-8 no-scrollbar">
                  <ClinicalTimeline history={history} isLoading={isHistoryLoading} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* VACCINES TAB */}
        <TabsContent value="vaccines" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           {patientId && <ClinicalVaccines patientId={patientId} />}
        </TabsContent>

        {/* PRESCRIPTIONS TAB */}
        <TabsContent value="prescriptions" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                 <Card className="border-none shadow-xl rounded-[3rem] bg-white dark:bg-slate-900 p-10 ring-1 ring-slate-100 dark:ring-white/5">
                    <div className="mb-10">
                       <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Emissão de Prescrição</h3>
                       <p className="text-sm text-slate-400 font-medium">Registo de medicamentos e protocolos de tratamento.</p>
                    </div>
                    {patientId && (
                      <PrescriptionForm 
                        patientId={patientId} 
                        consultationId={appointmentId || undefined} 
                      />
                    )}
                 </Card>
              </div>
              <div className="space-y-8">
                 <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white p-10 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                       <Pill size={100} />
                    </div>
                    <div className="relative z-10">
                       <h3 className="text-xl font-black uppercase tracking-tighter mb-4">Notas Legais</h3>
                       <p className="text-slate-400 text-sm leading-relaxed mb-6">
                         As prescrições de antibióticos requerem o preenchimento de todos os campos para conformidade legal em Portugal.
                       </p>
                       <div className="space-y-4">
                         <div className="flex items-start gap-3">
                           <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                           <p className="text-xs text-slate-300">Válido por 30 dias por defeito.</p>
                         </div>
                         <div className="flex items-start gap-3">
                           <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                           <p className="text-xs text-slate-300">Gera PDF assinado digitalmente.</p>
                         </div>
                       </div>
                    </div>
                 </Card>
              </div>
           </div>
        </TabsContent>

        <TabsContent value="billing" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="max-w-5xl mx-auto">
              <Card className="border-none shadow-2xl rounded-[4rem] bg-white dark:bg-slate-900 p-12 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-12">
                    <div>
                       <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 mb-4">Inventory Sync Active</Badge>
                       <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Prescrição & Faturação</h2>
                       <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-lg">Registe consumíveis, medicamentos e atos clínicos.</p>
                    </div>
                    <div className="flex items-center gap-3 p-1 bg-slate-50 dark:bg-white/5 rounded-2xl">
                       <Button variant="ghost" className="rounded-xl font-black text-[9px] uppercase tracking-widest px-6 h-10 bg-white dark:bg-slate-800 shadow-sm">Atos Médicos</Button>
                       <Button variant="ghost" className="rounded-xl font-black text-[9px] uppercase tracking-widest px-6 h-10 text-slate-400">Produtos</Button>
                    </div>
                 </div>
                 <ConsultationBilling onItemsChange={setBillingItems} />
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="exams" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="border-none shadow-2xl rounded-[3rem] bg-linear-to-br from-purple-50 to-white dark:from-slate-900 dark:to-slate-900/50 p-12 ring-1 ring-purple-100/50 dark:ring-white/5 group hover:scale-[1.01] transition-all">
                 <div className="flex justify-between items-start mb-10">
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Laboratório Fuji</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-2">Automação total via HL7 Gateway.</p>
                    </div>
                    <div className="p-4 bg-purple-600 rounded-3xl text-white shadow-xl shadow-purple-500/20 group-hover:rotate-12 transition-transform">
                       <FlaskConical size={32} strokeWidth={2.5} />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                    <Button 
                      onClick={() => handleRequestExam("LAB", "Fuji DX-500")}
                      className="h-16 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-purple-500/20"
                    >
                       Hemograma Completo
                    </Button>
                    <Button variant="outline" className="h-16 border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 font-black rounded-2xl bg-white dark:bg-white/5 text-[10px] uppercase tracking-widest">
                       Bioquímica 12 (Panel)
                    </Button>
                 </div>
                 
                 <div className="bg-white/50 dark:bg-black/20 rounded-[2.5rem] p-8 border border-purple-100 dark:border-purple-900/10">
                    <div className="flex items-center justify-between mb-4">
                       <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest">Pedidos Ativos</p>
                       <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    </div>
                    <div className="space-y-3">
                       <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-sm">
                          <div className="flex items-center gap-3">
                             <Search size={14} className="text-slate-400" />
                             <span className="text-[11px] font-black text-slate-700 dark:text-slate-300">HEMOGRAMA #F-7329</span>
                          </div>
                          <Badge className="bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-none font-black text-[8px] uppercase">A aguardar hardware</Badge>
                       </div>
                    </div>
                 </div>
              </Card>

              <Card className="border-none shadow-2xl rounded-[3rem] bg-linear-to-br from-emerald-50 to-white dark:from-slate-900 dark:to-slate-900/50 p-12 ring-1 ring-emerald-100/50 dark:ring-white/5 group hover:scale-[1.01] transition-all">
                 <div className="flex justify-between items-start mb-10">
                    <div>
                       <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Imagiologia RX</h3>
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-bold mt-2">Integração DICOM Examion 1.4.</p>
                    </div>
                    <div className="p-4 bg-emerald-600 rounded-3xl text-white shadow-xl shadow-emerald-500/20 group-hover:rotate-12 transition-transform">
                       <ImageIcon size={32} strokeWidth={2.5} />
                    </div>
                 </div>
                 
                 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
                    <Button 
                      onClick={() => handleRequestExam("IMAGING", "Examion RX")}
                      className="h-16 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20"
                    >
                       Solicitar RX Tórax
                    </Button>
                    <Button variant="outline" className="h-16 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black rounded-2xl bg-white dark:bg-white/5 text-[10px] uppercase tracking-widest">
                       Ecografia Abdominal
                    </Button>
                 </div>

                 <div className="bg-white/50 dark:bg-black/20 rounded-[2.5rem] p-10 border border-emerald-100 dark:border-emerald-900/10 text-center">
                    <Badge variant="ghost" className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-black text-[9px] uppercase tracking-widest mb-2 px-4 py-1">Modalidade: DX/US</Badge>
                    <p className="text-xs font-bold text-slate-400 mt-2">Gateway Examion detetado em 192.168.1.55</p>
                 </div>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default function ConsultationPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest">A Sincronizar Contexto Clínico...</div>}>
      <ConsultationContent />
    </Suspense>
  );
}
