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
  Stethoscope
} from "lucide-react";
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
  
  const [activeTab, setActiveTab] = useState("clinical");
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

  if (!patientId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">
           <Stethoscope size={32} />
        </div>
        <div className="text-center">
          <h2 className="text-xl font-bold text-slate-900">Nenhuma consulta ativa</h2>
          <p className="text-slate-500">Selecione um paciente na agenda para iniciar.</p>
        </div>
        <Button onClick={() => router.push("/dashboard/calendar")} className="rounded-xl bg-blue-600">
          Ir para Agenda
        </Button>
      </div>
    );
  }

  if (isPatientLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="flex justify-between">
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-start gap-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ring-4 ring-blue-50">
            {patient.name[0]}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{patient.name}</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200 uppercase font-black text-[10px]">{patient.species}</Badge>
            </div>
            <p className="text-slate-500 font-medium">
              {patient.breed} • {patient.owner?.name} • {patient.owner?.phone}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300 rounded-xl font-bold" onClick={() => router.back()}>
            <ChevronLeft className="w-4 h-4" />
            Voltar
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700 rounded-xl shadow-lg shadow-blue-100 font-black">
            <Save className="w-4 h-4" />
            Finalizar & Faturar
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100/50 p-1 rounded-2xl">
          <TabsTrigger value="clinical" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            HISTÓRICO & SOAP
          </TabsTrigger>
          <TabsTrigger value="exams" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
            <FlaskConical className="w-4 h-4 mr-2" />
            EXAMES & LAB
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
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
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">S: Subjective (Relato)</Label>
                      <textarea 
                        className="w-full min-h-[80px] p-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm outline-none font-medium"
                        value={notes.subjective}
                        onChange={(e) => setNotes({ ...notes, subjective: e.target.value })}
                        placeholder="Anamnese..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">O: Objective (Exame Físico)</Label>
                      <textarea 
                        className="w-full min-h-[80px] p-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm outline-none font-medium"
                        value={notes.objective}
                        onChange={(e) => setNotes({ ...notes, objective: e.target.value })}
                        placeholder="Sinais vitais..."
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A: Assessment (Diagnóstico)</Label>
                      <textarea 
                        className="w-full min-h-[80px] p-4 rounded-2xl border border-slate-100 bg-slate-50/50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm outline-none font-medium"
                        value={notes.assessment}
                        onChange={(e) => setNotes({ ...notes, assessment: e.target.value })}
                        placeholder="Hipóteses diagnósticas..."
                      />
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
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-black rounded-xl h-12 shadow-lg shadow-purple-100"
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
                      className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-12 shadow-lg shadow-emerald-100"
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
