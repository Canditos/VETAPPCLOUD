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
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

function SmartAlerts({ patientId }: { patientId: string }) {
  const { data: alerts } = useQuery({
    queryKey: ["clinical-alerts", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/alerts`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!patientId,
  });

  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      {alerts.map((alert: any, i: number) => (
        <div key={i} className={cn(
          "flex items-center gap-3 px-4 py-3 rounded-2xl border text-sm font-bold",
          alert.level === "critical" 
            ? "bg-rose-50 dark:bg-rose-900/20 border-rose-200 dark:border-rose-800/30 text-rose-700 dark:text-rose-400"
            : alert.level === "warning"
            ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800/30 text-amber-700 dark:text-amber-400"
            : "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800/30 text-blue-700 dark:text-blue-400"
        )}>
          {alert.level === "critical" ? <AlertCircle size={16} className="shrink-0" /> : 
           alert.level === "warning" ? <AlertTriangle size={16} className="shrink-0" /> : 
           <Clock size={16} className="shrink-0" />}
          <span className="flex-1">{alert.message}</span>
          {alert.action && (
            <span className="text-[10px] font-black uppercase tracking-widest underline cursor-pointer hover:opacity-70">
              {alert.action}
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

function ConsultationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get("patientId");
  const appointmentId = searchParams.get("appointmentId");
  const urlTab = searchParams.get("tab") || "clinical";
  
  const [activeTab, setActiveTab] = useState(urlTab);
  const [billingItems, setBillingItems] = useState<any[]>([]);
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

  const handleRequestExam = async (type: "LAB" | "IMAGING", source: string, testName: string) => {
    toast.promise(
      fetch("/api/diagnostics/request", {
        method: "POST",
        body: JSON.stringify({ patientId, consultationId: "current", type, source, testName }),
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
          <Button onClick={() => router.push("/dashboard/appointments")} className="h-16 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 px-10 font-black transition-all active:scale-95 shadow-2xl shadow-blue-500/20 uppercase tracking-widest text-xs">
            Abrir Agenda
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/patients")} className="h-16 rounded-[2rem] bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 text-slate-900 dark:text-white hover:scale-105 px-10 font-black transition-all active:scale-95 uppercase tracking-widest text-xs">
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
            <div className="space-y-4"><Skeleton className="h-10 w-80" /><Skeleton className="h-5 w-60" /></div>
          </div>
          <div className="flex gap-3"><Skeleton className="h-14 w-32 rounded-2xl" /><Skeleton className="h-14 w-48 rounded-2xl" /></div>
        </div>
        <Skeleton className="h-[500px] w-full rounded-[3rem]" />
      </div>
    );
  }

  const allergies = patient?.allergies;
  const lastVitals = history?.find((h: any) => h.type === "VITALS")?.data;

  return (
    <div className="space-y-8 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto px-4 sm:px-0">
      
      {/* Header Context Bar */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] ring-1 ring-slate-100 dark:ring-white/5 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-[2rem] flex items-center justify-center text-white dark:text-slate-900 font-black text-3xl shadow-xl shadow-slate-900/10 transition-transform hover:rotate-3">
            {patient?.name?.[0] || "?"}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{patient?.name}</h1>
              <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl">{patient?.species}</Badge>
              {!appointmentId && (
                <Badge variant="outline" className="border-amber-200 dark:border-amber-900/30 text-amber-600 dark:text-amber-400 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg animate-pulse">Walk-in</Badge>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm">
              <p className="text-slate-500 dark:text-slate-400 font-bold">{patient?.breed} <span className="mx-2 opacity-10">|</span> {patient?.owner?.name}</p>
              {allergies && (
                <span className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-black text-[10px] uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 px-3 py-1 rounded-lg">
                  <ShieldAlert size={12} /> {allergies}
                </span>
              )}
              {lastVitals && (
                <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                  <Weight size={12} /> {lastVitals.weight}kg
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 w-full lg:w-auto">
          <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all flex-1 lg:flex-none" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" strokeWidth={3} /> Cancelar
          </Button>
          <Button onClick={handleSave} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-blue-500/30 transition-all active:scale-95 flex-1 lg:flex-none">
            <Save className="w-4 h-4 mr-2" strokeWidth={3} /> Finalizar Visita
          </Button>
        </div>
      </div>

      {/* Smart Alerts */}
      <SmartAlerts patientId={patientId!} />

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
                <t.icon className="w-4 h-4 shrink-0" strokeWidth={3} />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* CLINICAL / SOAP TAB */}
        <TabsContent value="clinical" className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 space-y-8">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
                <CardHeader className="p-8 pb-4 border-b border-slate-50 dark:border-white/5 bg-slate-50/30 dark:bg-white/5">
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Protocolo Clínico SOAP</CardTitle>
                    <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[8px] font-black uppercase px-3 py-1">Standard Workflow</Badge>
                  </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  
                  {/* Vitals Input */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-slate-50 dark:bg-slate-800/40 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-inner">
                    {[
                      { label: "Peso", icon: Weight, unit: "kg", color: "text-blue-500", placeholder: "12.45", key: "weight" },
                      { label: "Temp.", icon: Thermometer, unit: "ºC", color: "text-orange-500", placeholder: "38.6", key: "temperature" },
                      { label: "FC", icon: Clock, unit: "bpm", color: "text-purple-500", placeholder: "100", key: "heartRate" },
                      { label: "FR", icon: Activity, unit: "mpm", color: "text-rose-500", placeholder: "24", key: "respiratoryRate" }
                    ].map((vital, i) => (
                      <div key={i} className="flex flex-col gap-2 p-4 bg-white dark:bg-slate-900 rounded-3xl shadow-sm ring-1 ring-slate-100 dark:ring-white/5 transition-all hover:ring-blue-500/30">
                        <div className="flex items-center gap-2">
                           <vital.icon size={14} className={vital.color} strokeWidth={3} />
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{vital.label}</span>
                        </div>
                        <div className="flex items-baseline gap-2 mt-1">
                           <input type="number" step="0.1" className="w-full bg-transparent border-none p-0 focus:ring-0 font-black text-2xl text-slate-900 dark:text-white placeholder:opacity-20" placeholder={vital.placeholder} value={(vitals as any)[vital.key]} onChange={(e) => setVitals({ ...vitals, [vital.key]: e.target.value })} />
                           <span className="text-xs font-bold text-slate-400 uppercase">{vital.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">S: Subjective</Label>
                      <textarea className="w-full min-h-[140px] p-6 rounded-[2.5rem] border-none bg-slate-50 dark:bg-slate-800/40 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm outline-none font-medium dark:text-white shadow-inner" value={notes.subjective} onChange={(e) => setNotes({ ...notes, subjective: e.target.value })} placeholder="Relato do proprietário, motivo da consulta..." />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">O: Objective</Label>
                      <textarea className="w-full min-h-[140px] p-6 rounded-[2.5rem] border-none bg-slate-50 dark:bg-slate-800/40 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm outline-none font-medium dark:text-white shadow-inner" value={notes.objective} onChange={(e) => setNotes({ ...notes, objective: e.target.value })} placeholder="Mucosas, TRC, auscultação, palpação..." />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-4">A: Assessment</Label>
                      <textarea className="w-full min-h-[140px] p-6 rounded-[2.5rem] border-none bg-slate-50 dark:bg-slate-800/40 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm outline-none font-medium dark:text-white shadow-inner" value={notes.assessment} onChange={(e) => setNotes({ ...notes, assessment: e.target.value })} placeholder="Conclusões clínicas, diferenciais..." />
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between ml-4">
                        <Label className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] font-bold">P: Plan</Label>
                        <Button variant="ghost" size="sm" className="h-7 text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 gap-2" onClick={() => { if (!notes.plan) { toast.error("Escreva o plano primeiro!"); return; } updateTab("prescriptions"); toast.success("Plano transferido!"); }}>
                          <Sparkles size={12} strokeWidth={3} /> Gerar Prescrição
                        </Button>
                      </div>
                      <textarea className="w-full min-h-[140px] p-6 rounded-[2.5rem] border-none bg-blue-50/30 dark:bg-blue-900/10 focus:ring-2 focus:ring-blue-500/20 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm outline-none font-black dark:text-white shadow-inner ring-1 ring-blue-100 dark:ring-blue-900/20" value={notes.plan} onChange={(e) => setNotes({ ...notes, plan: e.target.value })} placeholder="Medicamentos, exames, recomendações..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-4 space-y-8">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-100 dark:ring-white/5 h-full flex flex-col">
                <CardHeader className="p-6 pb-4 bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><History size={14} className="text-blue-600" /> Histórico</CardTitle>
                    <Badge variant="ghost" className="text-[9px] font-bold text-slate-400 uppercase">{history?.length || 0} Eventos</Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto max-h-[700px] p-6 no-scrollbar">
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
                 <Card className="border-none shadow-sm rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 ring-1 ring-slate-100 dark:ring-white/5">
                    <div className="mb-8">
                       <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Emissão de Prescrição</h3>
                       <p className="text-sm text-slate-400 font-medium">Registo de medicamentos e protocolos de tratamento.</p>
                    </div>
                    {patientId && <PrescriptionForm patientId={patientId} consultationId={appointmentId || undefined} />}
                 </Card>
              </div>
              <div className="space-y-8">
                 <Card className="border-none shadow-sm rounded-[2.5rem] bg-slate-900 dark:bg-slate-800 text-white p-8 overflow-hidden relative ring-1 ring-white/5">
                    <div className="absolute top-0 right-0 p-8 opacity-10"><Pill size={80} /></div>
                    <div className="relative z-10">
                       <h3 className="text-lg font-black uppercase tracking-tighter mb-4">Notas Legais</h3>
                       <p className="text-slate-400 text-sm leading-relaxed mb-6">Prescrições de antibióticos requerem todos os campos para conformidade legal.</p>
                       <div className="space-y-3">
                          <div className="flex items-start gap-3"><div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" /><p className="text-xs text-slate-300">Válido por 30 dias por defeito.</p></div>
                          <div className="flex items-start gap-3"><div className="mt-1 w-2 h-2 rounded-full bg-blue-500 shrink-0" /><p className="text-xs text-slate-300">Gera PDF assinado digitalmente.</p></div>
                       </div>
                    </div>
                 </Card>
              </div>
           </div>
        </TabsContent>

        {/* BILLING TAB */}
        <TabsContent value="billing" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="max-w-5xl mx-auto">
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6 mb-8">
                    <div>
                       <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-[0.2em] px-3 py-1 mb-3">Inventory Sync Active</Badge>
                       <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Prescrição & Faturação</h2>
                       <p className="text-slate-500 dark:text-slate-400 font-bold mt-1">Registe consumíveis, medicamentos e atos clínicos.</p>
                    </div>
                 </div>
                 <ConsultationBilling onItemsChange={setBillingItems} />
              </Card>
           </div>
        </TabsContent>

        {/* EXAMS TAB - Unified with Diagnostics */}
        <TabsContent value="exams" className="animate-in fade-in slide-in-from-bottom-2 duration-500">
           <div className="space-y-8">
              {/* Request Exams */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="border-none shadow-sm rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 ring-1 ring-slate-100 dark:ring-white/5">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl text-purple-600 dark:text-purple-400"><FlaskConical size={24} strokeWidth={2.5} /></div>
                       <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Laboratório</h3>
                          <p className="text-xs text-slate-400 font-bold">Fuji DX-500 • HL7 Gateway</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <Button onClick={() => handleRequestExam("LAB", "Fuji DX-500", "Hemograma Completo")} className="h-12 bg-purple-600 hover:bg-purple-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-sm">Hemograma Completo</Button>
                       <Button variant="outline" onClick={() => handleRequestExam("LAB", "Fuji DX-500", "Bioquímica 12")} className="h-12 border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 font-black rounded-2xl text-[10px] uppercase tracking-widest">Bioquímica 12</Button>
                       <Button variant="outline" onClick={() => handleRequestExam("LAB", "Fuji DX-500", "PCR")} className="h-12 border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 font-black rounded-2xl text-[10px] uppercase tracking-widest">PCR</Button>
                       <Button variant="outline" onClick={() => handleRequestExam("LAB", "Fuji DX-500", "Urinalise")} className="h-12 border-purple-200 dark:border-purple-900/30 text-purple-700 dark:text-purple-400 font-black rounded-2xl text-[10px] uppercase tracking-widest">Urinalise</Button>
                    </div>
                 </Card>

                 <Card className="border-none shadow-sm rounded-[2.5rem] bg-white dark:bg-slate-900 p-8 ring-1 ring-slate-100 dark:ring-white/5">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl text-emerald-600 dark:text-emerald-400"><ImageIcon size={24} strokeWidth={2.5} /></div>
                       <div>
                          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Imagiologia</h3>
                          <p className="text-xs text-slate-400 font-bold">Examion RX • DICOM 1.4</p>
                       </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                       <Button onClick={() => handleRequestExam("IMAGING", "Examion RX", "RX Tórax")} className="h-12 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-2xl text-[10px] uppercase tracking-widest shadow-sm">RX Tórax</Button>
                       <Button variant="outline" onClick={() => handleRequestExam("IMAGING", "Examion RX", "RX Abdómen")} className="h-12 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black rounded-2xl text-[10px] uppercase tracking-widest">RX Abdómen</Button>
                       <Button variant="outline" onClick={() => handleRequestExam("IMAGING", "Examion RX", "Ecografia")} className="h-12 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black rounded-2xl text-[10px] uppercase tracking-widest">Ecografia</Button>
                       <Button variant="outline" onClick={() => handleRequestExam("IMAGING", "Examion RX", "RX Membros")} className="h-12 border-emerald-200 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 font-black rounded-2xl text-[10px] uppercase tracking-widest">RX Membros</Button>
                    </div>
                 </Card>
              </div>

              {/* Recent Results */}
              <Card className="border-none shadow-sm rounded-[2.5rem] bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden">
                 <CardHeader className="p-6 pb-4 border-b border-slate-100 dark:border-white/5">
                    <CardTitle className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2"><TrendingUp size={14} className="text-blue-600" /> Resultados Recebidos</CardTitle>
                 </CardHeader>
                 <CardContent className="p-6">
                    {!diagnostics || diagnostics.length === 0 ? (
                       <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/50 rounded-[2rem] border-2 border-dashed border-slate-100 dark:border-white/5">
                          <FlaskConical size={32} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
                          <p className="text-slate-400 font-bold text-sm">Sem resultados para este paciente</p>
                          <p className="text-slate-400 text-xs mt-1">Os resultados aparecerão aqui quando recebidos dos integradores.</p>
                       </div>
                    ) : (
                       <div className="space-y-3">
                          {diagnostics.map((dx: any) => (
                             <div key={dx.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-blue-200 dark:hover:border-blue-900/30 transition-all group">
                                <div className="flex items-center gap-4">
                                   <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${dx.type === 'LAB' ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-600' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600'}`}>
                                      {dx.type === 'LAB' ? <FlaskConical size={18} /> : <ImageIcon size={18} />}
                                   </div>
                                   <div>
                                      <p className="font-black text-sm text-slate-900 dark:text-white">{dx.summary ?? dx.testName ?? "—"}</p>
                                      <p className="text-[10px] text-slate-400 font-bold">{dx.source} • {dx.createdAt ? formatDistanceToNow(new Date(dx.createdAt), { addSuffix: true, locale: pt }) : "—"}</p>
                                   </div>
                                </div>
                                <div className="flex items-center gap-3">
                                   <Badge className={cn(
                                      "border-none font-black text-[8px] uppercase",
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
                 </CardContent>
              </Card>

              {/* Link to full diagnostics page */}
              <div className="text-center">
                 <Button variant="outline" onClick={() => router.push("/dashboard/diagnostics")} className="rounded-2xl font-black text-[10px] uppercase tracking-widest gap-2 border-slate-200 dark:border-white/10">
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
    <Suspense fallback={<div className="p-12 text-center font-black text-slate-300 animate-pulse uppercase tracking-widest">A Sincronizar Contexto Clínico...</div>}>
      <ConsultationContent />
    </Suspense>
  );
}
