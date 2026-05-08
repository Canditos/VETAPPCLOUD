"use client";

import { useState, Suspense } from "react";
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
  Clock
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

function ConsultationContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get("patientId");
  const appointmentId = searchParams.get("appointmentId");
  const initialTab = searchParams.get("tab") || "clinical";
  
  const [activeTab, setActiveTab] = useState(initialTab);
  const [billingItems, setBillingItems] = useState<any[]>([]);
  const [notes, setNotes] = useState({
    subjective: "",
    objective: "",
    assessment: "",
    plan: ""
  });

  const { data: patient, isLoading: isPatientLoading } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      if (!patientId) return null;
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) throw new Error("Erro ao carregar paciente");
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
          consultationId: "current", // In a real app, this would be the actual ID
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
    if (billingItems.length === 0) {
      toast.error("Adicione pelo menos um item para faturar.");
      return;
    }

    toast.promise(
      fetch("/api/consultations", {
        method: "POST",
        body: JSON.stringify({
          patientId,
          appointmentId,
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
        loading: 'A gravar consulta e a comunicar com o Jasmin...',
        success: (data) => {
          router.push("/dashboard/billing");
          return `Consulta finalizada! Fatura Jasmin: ${data.jasminInvoiceId || 'Gerada em background'}`;
        },
        error: 'Erro ao gravar a consulta.',
      }
    );
  };

  if (!patientId || patientId === "undefined" || (!isPatientLoading && !patient)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] gap-8 animate-in fade-in zoom-in-95 duration-1000">
        <div className="relative">
          <div className="absolute inset-0 bg-blue-500/20 blur-[60px] rounded-full animate-pulse" />
          <div className="w-32 h-32 bg-white dark:bg-slate-900 rounded-[3rem] flex items-center justify-center text-blue-600 dark:text-blue-400 border border-slate-100 dark:border-white/5 shadow-2xl relative z-10">
             <Stethoscope size={64} strokeWidth={1} />
          </div>
          <div className="absolute -right-2 -bottom-2 w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white shadow-lg z-20 animate-bounce delay-500">
             <Plus size={24} strokeWidth={3} />
          </div>
        </div>
        <div className="text-center space-y-3 relative z-10">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Ambiente Clínico</h2>
          <p className="text-slate-500 dark:text-slate-400 font-bold max-w-sm mx-auto text-lg leading-relaxed">
            Nenhuma consulta ativa no momento. Inicie um atendimento através da <span className="text-blue-600">Agenda Mestre</span>.
          </p>
        </div>
        <Button 
          onClick={() => router.push("/dashboard/calendar")} 
          className="h-16 rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:scale-105 px-10 font-black transition-all active:scale-95 shadow-2xl shadow-blue-500/20"
        >
          Abrir Agenda Mestre
        </Button>
      </div>
    );
  }

  if (isPatientLoading) {
    return (
      <div className="space-y-10 animate-pulse p-8">
        <div className="flex justify-between">
          <div className="flex gap-6">
            <Skeleton className="h-20 w-20 rounded-3xl" />
            <div className="space-y-3">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
        <Skeleton className="h-[200px] w-full rounded-[2.5rem]" />
        <div className="grid grid-cols-3 gap-6">
           <Skeleton className="h-14 rounded-2xl" />
           <Skeleton className="h-14 rounded-2xl" />
           <Skeleton className="h-14 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 bg-slate-900 dark:bg-white rounded-3xl flex items-center justify-center text-white dark:text-slate-900 font-black text-3xl shadow-sm ring-1 ring-slate-200 dark:ring-white/10">
            {patient?.name?.[0] || "?"}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{patient?.name}</h1>
              <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-none font-black text-[10px] uppercase tracking-widest px-3 py-1 rounded-lg">
                {patient?.species}
              </Badge>
            </div>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-slate-500 dark:text-slate-400 font-bold text-lg">
                {patient?.breed} <span className="mx-2 opacity-20">|</span> {patient?.owner?.name}
              </p>
              <div className="h-8 w-[1px] bg-slate-100 dark:bg-white/10 mx-2" />
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Médico:</span>
                <Select defaultValue={appointmentId ? "vet-1" : undefined}>
                  <SelectTrigger className="h-8 border-none bg-slate-100 dark:bg-slate-800 rounded-lg text-xs font-black px-3 focus:ring-0">
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-2xl">
                    <SelectItem value="vet-1">Dr. Marco</SelectItem>
                    <SelectItem value="vet-2">Dra. Ana</SelectItem>
                    <SelectItem value="vet-3">Dr. João</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="h-12 px-6 rounded-2xl border-slate-200 dark:border-white/10 font-bold hover:bg-slate-50 dark:hover:bg-white/5 transition-all" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <Button onClick={handleSave} className="h-12 px-8 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black shadow-lg shadow-blue-500/20 dark:shadow-none transition-all active:scale-95">
            <Save className="w-4 h-4 mr-2" />
            Finalizar Visita
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100/50 dark:bg-slate-900/50 p-1 rounded-2xl ring-1 ring-slate-200/50 dark:ring-white/5">
          <TabsTrigger value="clinical" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-bold text-xs dark:text-slate-400 dark:data-[state=active]:text-white">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            HISTÓRICO & SOAP
          </TabsTrigger>
          <TabsTrigger value="exams" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-bold text-xs dark:text-slate-400 dark:data-[state=active]:text-white">
            <FlaskConical className="w-4 h-4 mr-2" />
            EXAMES & LAB
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-sm font-bold text-xs dark:text-slate-400 dark:data-[state=active]:text-white">
            <Receipt className="w-4 h-4 mr-2" />
            FARMÁCIA & FATURAÇÃO
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
            <div className="lg:col-span-3 space-y-6">
              <Card className="border-none shadow-sm rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    Notas da Visita
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">S: Subjective (Relato)</Label>
                      <textarea 
                        className="w-full min-h-[80px] p-4 rounded-2xl border border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-800 transition-all text-sm outline-none font-medium dark:text-white"
                        value={notes.subjective}
                        onChange={(e) => setNotes({ ...notes, subjective: e.target.value })}
                        placeholder="Anamnese..."
                      />
                    </div>
                    {/* Premium Vital Signs Toolbar */}
                    <div className="flex flex-wrap items-center gap-2 p-2 bg-slate-100/40 dark:bg-slate-800/30 rounded-[2rem] border border-slate-200/50 dark:border-white/5 mb-8">
                      <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-100 dark:ring-white/5 transition-all hover:shadow-md group">
                        <Weight className="text-blue-500 group-hover:scale-110 transition-transform" size={16} />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Peso</span>
                          <div className="flex items-baseline gap-1">
                            <input type="number" step="0.01" className="w-12 bg-transparent border-none p-0 focus:ring-0 font-black text-sm text-slate-900 dark:text-white" placeholder="0.00" />
                            <span className="text-[10px] font-bold text-slate-400">kg</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-100 dark:ring-white/5 transition-all hover:shadow-md group">
                        <Thermometer className="text-orange-500 group-hover:scale-110 transition-transform" size={16} />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Temp</span>
                          <div className="flex items-baseline gap-1">
                            <input type="number" step="0.1" className="w-10 bg-transparent border-none p-0 focus:ring-0 font-black text-sm text-slate-900 dark:text-white" placeholder="38.5" />
                            <span className="text-[10px] font-bold text-slate-400">ºC</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-100 dark:ring-white/5 transition-all hover:shadow-md group min-w-[120px]">
                        <Eye className="text-emerald-500 group-hover:scale-110 transition-transform" size={16} />
                        <div className="flex flex-col flex-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Mucosas</span>
                          <Select defaultValue="normal">
                            <SelectTrigger className="h-4 p-0 border-none shadow-none focus:ring-0 text-sm font-black text-slate-900 dark:text-white bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
                              <SelectItem value="normal">Normocoradas</SelectItem>
                              <SelectItem value="pale">Pálidas</SelectItem>
                              <SelectItem value="icteric">Ictéricas</SelectItem>
                              <SelectItem value="cyanotic">Cianóticas</SelectItem>
                              <SelectItem value="congested">Congestas</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-100 dark:ring-white/5 transition-all hover:shadow-md group">
                        <Clock className="text-purple-500 group-hover:scale-110 transition-transform" size={16} />
                        <div className="flex flex-col">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">TRC</span>
                          <div className="flex items-baseline gap-1">
                            <input type="number" step="1" className="w-8 bg-transparent border-none p-0 focus:ring-0 font-black text-sm text-slate-900 dark:text-white" placeholder="2" />
                            <span className="text-[10px] font-bold text-slate-400">seg</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-100 dark:ring-white/5 transition-all hover:shadow-md group min-w-[120px]">
                        <Droplets className="text-sky-500 group-hover:scale-110 transition-transform" size={16} />
                        <div className="flex flex-col flex-1">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Hidratação</span>
                          <Select defaultValue="normal">
                            <SelectTrigger className="h-4 p-0 border-none shadow-none focus:ring-0 text-sm font-black text-slate-900 dark:text-white bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-2xl border-none shadow-2xl bg-white/90 dark:bg-slate-800/90 backdrop-blur-xl">
                              <SelectItem value="normal">Normal</SelectItem>
                              <SelectItem value="low">Ligeira (&lt;5%)</SelectItem>
                              <SelectItem value="moderate">Moderada (5-8%)</SelectItem>
                              <SelectItem value="severe">Grave (&gt;10%)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="grid gap-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Subjective (Relato / Anamnese)</Label>
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-slate-200 dark:border-white/5 text-slate-400">Obrigatório</Badge>
                        </div>
                        <textarea 
                          className="w-full min-h-[120px] p-5 rounded-[2rem] border-none bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/30 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm outline-none font-medium dark:text-white shadow-inner"
                          value={notes.subjective}
                          onChange={(e) => setNotes({ ...notes, subjective: e.target.value })}
                          placeholder="Ex: Animal prostrado, falta de apetite há 2 dias..."
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Objective (Exame Físico Dirigido)</Label>
                        <textarea 
                          className="w-full min-h-[120px] p-5 rounded-[2rem] border-none bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/30 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm outline-none font-medium dark:text-white shadow-inner"
                          value={notes.objective}
                          onChange={(e) => setNotes({ ...notes, objective: e.target.value })}
                          placeholder="Ex: Auscultação cardiopulmonar sem alterações, palpação abdominal..."
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Assessment (Diagnóstico / Diferenciais)</Label>
                        <textarea 
                          className="w-full min-h-[120px] p-5 rounded-[2rem] border-none bg-slate-50 dark:bg-slate-900/50 focus:ring-2 focus:ring-blue-500/30 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm outline-none font-medium dark:text-white shadow-inner"
                          value={notes.assessment}
                          onChange={(e) => setNotes({ ...notes, assessment: e.target.value })}
                          placeholder="Ex: Suspeita de Gastroenterite Viral vs Ingestão de corpo estranho..."
                        />
                      </div>

                      <div className="space-y-3">
                        <Label className="text-[10px] font-black text-blue-400 dark:text-blue-500 uppercase tracking-[0.2em]">Plan (Plano Terapêutico & Recomendações)</Label>
                        <textarea 
                          className="w-full min-h-[140px] p-5 rounded-[2rem] border-none bg-blue-50/20 dark:bg-blue-900/10 focus:ring-2 focus:ring-blue-500/30 focus:bg-white dark:focus:bg-slate-900 transition-all text-sm outline-none font-medium dark:text-white shadow-inner ring-1 ring-blue-100/50 dark:ring-blue-900/20"
                          value={notes.plan}
                          onChange={(e) => setNotes({ ...notes, plan: e.target.value })}
                          placeholder="Ex: Protocolo fluido, Maropitant SC, Dieta Gastrointestinal..."
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm h-full flex flex-col rounded-3xl overflow-hidden">
                <CardHeader className="pb-4 bg-slate-50/50">
                  <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Histórico Completo</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-y-auto max-h-[600px] p-6">
                  <ClinicalTimeline history={history} isLoading={isHistoryLoading} />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="max-w-4xl mx-auto">
              <Card className="border-none shadow-sm rounded-3xl p-8">
                 <div className="mb-8">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">Prescrição e Venda</h2>
                    <p className="text-sm text-slate-500 font-medium">Os itens adicionados aqui serão automaticamente integrados com o inventário e faturados no Jasmin.</p>
                 </div>
                 <ConsultationBilling onItemsChange={setBillingItems} />
              </Card>
           </div>
        </TabsContent>

        <TabsContent value="exams" className="animate-in fade-in slide-in-from-bottom-2 duration-300">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-sm rounded-3xl p-8 bg-purple-50/30">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <h3 className="text-lg font-black text-slate-900">Laboratório Fuji</h3>
                       <p className="text-xs text-slate-500 font-medium">Análises clínicas automatizadas via HL7.</p>
                    </div>
                    <FlaskConical className="text-purple-600" size={24} />
                 </div>
                 
                 <div className="space-y-4">
                    <Button 
                      onClick={() => handleRequestExam("LAB", "Fuji DX-500")}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-12"
                    >
                       Solicitar Hemograma
                    </Button>
                    <Button variant="outline" className="w-full border-purple-200 text-purple-700 font-bold rounded-xl h-12 bg-white">
                       Bioquímica Completa
                    </Button>
                 </div>
                 
                 <div className="mt-8 pt-6 border-t border-purple-100">
                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-3">Pedidos Recentes</p>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center bg-white p-3 rounded-xl border border-purple-50">
                          <span className="text-xs font-bold text-slate-700">Hemograma #732</span>
                          <Badge className="bg-amber-100 text-amber-700 border-none text-[8px]">Pendente</Badge>
                       </div>
                    </div>
                 </div>
              </Card>

              <Card className="border-none shadow-sm rounded-3xl p-8 bg-emerald-50/30">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                       <h3 className="text-lg font-black text-slate-900">Imagiologia Examion</h3>
                       <p className="text-xs text-slate-500 font-medium">RX Digital e Ecografia via DICOM MWL.</p>
                    </div>
                    <ImageIcon className="text-emerald-600" size={24} />
                 </div>
                 
                 <div className="space-y-4">
                    <Button 
                      onClick={() => handleRequestExam("IMAGING", "Examion RX")}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-12"
                    >
                       Solicitar RX Tórax (Lat/VD)
                    </Button>
                    <Button variant="outline" className="w-full border-emerald-200 text-emerald-700 font-bold rounded-xl h-12 bg-white">
                       Ecografia Abdominal
                    </Button>
                 </div>

                 <div className="mt-8 pt-6 border-t border-emerald-100">
                    <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3">Estudos Pendentes</p>
                    <div className="text-center py-4 bg-white/50 rounded-xl border border-dashed border-emerald-200">
                       <p className="text-[10px] text-emerald-600 font-medium italic">Nenhum estudo em espera no MWL.</p>
                    </div>
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
    <Suspense fallback={<div className="p-8">Carregando ambiente clínico...</div>}>
      <ConsultationContent />
    </Suspense>
  );
}
