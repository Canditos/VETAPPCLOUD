"use client";

import { useState, use } from "react";
import { 
  PawPrint, 
  Stethoscope, 
  Syringe, 
  Pill, 
  LineChart as ChartIcon, 
  Calendar,
  History as HistoryIcon,
  Plus,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  ArrowLeft,
  Activity,
  Thermometer,
  Weight,
  FileText,
  User as UserIcon,
  ChevronRight,
  Printer,
  RefreshCw,
  Bed,
  ShieldCheck,
  MessageSquare,
  Copy,
  Clock,
  Heart
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { VaccinationForm } from "@/components/forms/VaccinationForm";
import { DewormingForm } from "@/components/forms/DewormingForm";
import { VitalSignsForm } from "@/components/forms/VitalSignsForm";
import { PrescriptionForm } from "@/components/forms/PrescriptionForm";
import { PrescriptionDownloadButton } from "@/components/clinical/PrescriptionDownloadButton";
import { toast } from "sonner";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import { ClinicalTimeline } from "@/components/ClinicalTimeline";
import { cn } from "@/lib/utils";

export default function PatientProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [isEditingChip, setIsEditingChip] = useState(false);
  const [chipValue, setChipValue] = useState("");

  const handleUpdateChip = async () => {
    try {
      const res = await fetch(`/api/patients/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ microchip: chipValue }),
      });
      if (!res.ok) throw new Error();
      toast.success("Microchip atualizado com sucesso!");
      setIsEditingChip(false);
    } catch (error) {
      toast.error("Erro ao atualizar microchip.");
    }
  };

  const sendQuickSMS = () => {
    if (!patient?.owner?.phone) {
      toast.error("Tutor sem número de telefone registado.");
      return;
    }

    toast.promise(
      fetch("/api/notifications/send", {
        method: "POST",
        body: JSON.stringify({
          type: "SMS",
          patientName: patient.name,
          ownerPhone: patient.owner.phone,
          customMessage: `Olá ${patient.owner.name}, aqui é da VetConnect. Tudo bem com o ${patient.name}?`
        }),
        headers: { "Content-Type": "application/json" },
      }).then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      }),
      {
        loading: "A enviar SMS via RUT240...",
        success: (data) => data.message || "SMS enviada com sucesso!",
        error: "Erro ao enviar SMS. Verifica a ligação ao RUT240.",
      }
    );
  };

  const { data: patient, isLoading } = useQuery({
    queryKey: ["patient-hub", id],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${id}`);
      if (!res.ok) throw new Error("Erro ao carregar hub clínico");
      return res.json();
    }
  });

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ["patient-history", id],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${id}/history`);
      if (!res.ok) throw new Error("Erro ao carregar histórico");
      return res.json();
    }
  });

  const { data: clinic } = useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => {
      const res = await fetch("/api/clinic");
      if (!res.ok) throw new Error("Erro ao carregar dados da clínica");
      return res.json();
    }
  });

  if (isLoading) return <div className="p-12 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse uppercase tracking-[0.3em]">Sincronizando Hub Clínico 360º...</div>;
  if (!patient) return <div className="p-12 text-center text-red-500 font-bold">Paciente não encontrado.</div>;

  const ageYears = patient.birthDate ? differenceInYears(new Date(), new Date(patient.birthDate)) : null;
  const ageMonths = patient.birthDate ? differenceInMonths(new Date(), new Date(patient.birthDate)) % 12 : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20 max-w-[1600px] mx-auto px-4 sm:px-0">
      {/* Top Navigation & Fast Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link href={`/dashboard/customers/${patient.ownerId}`}>
          <Button variant="ghost" className="text-slate-500 dark:text-slate-400 font-black hover:bg-slate-100 dark:hover:bg-white/5 gap-2 uppercase text-[10px] tracking-widest px-0 hover:px-4 transition-all">
            <ArrowLeft size={14} strokeWidth={3} /> Voltar ao Dono
          </Button>
        </Link>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button 
            variant="outline" 
            className="rounded-xl font-black gap-2 border-slate-200 dark:border-white/10 dark:text-white flex-1 sm:flex-none uppercase text-[10px] tracking-widest"
            onClick={() => toast.info("A gerar PDF da ficha clínica...")}
          >
            <Printer size={14} /> Ficha
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl font-black gap-2 border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 flex-1 sm:flex-none uppercase text-[10px] tracking-widest"
            onClick={sendQuickSMS}
          >
            <MessageSquare size={14} /> SMS
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1 sm:flex-none rounded-xl font-black gap-2 border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 uppercase text-[10px] tracking-widest">
                <Activity size={14} /> Sinais Vitais
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[450px] rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden bg-white dark:bg-slate-900">
              <div className="bg-emerald-600 p-8 text-white">
                <DialogTitle className="text-2xl font-black tracking-tight">Sinais Vitais</DialogTitle>
                <p className="text-emerald-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Registe os parâmetros biométricos do paciente.</p>
              </div>
              <div className="p-8">
                <VitalSignsForm patientId={id} onSuccess={() => {}} />
              </div>
            </DialogContent>
          </Dialog>
          <Link href={`/dashboard/consultations?patientId=${id}`} className="flex-1 sm:flex-none">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black gap-2 shadow-lg shadow-blue-500/20 dark:shadow-none uppercase text-[10px] tracking-widest">
              <Plus size={14} strokeWidth={3} /> Nova Consulta
            </Button>
          </Link>
        </div>
      </div>

      {/* Patient Premium Header */}
      <div className="relative group">
        <div className="absolute -inset-1 bg-linear-to-r from-blue-600 to-indigo-600 rounded-[3rem] blur opacity-10 dark:opacity-20 group-hover:opacity-20 dark:group-hover:opacity-30 transition duration-1000"></div>
        <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-6 sm:p-10 border border-slate-100 dark:border-white/5 relative overflow-hidden shadow-2xl shadow-slate-200/50 dark:shadow-none">
          {/* Large Background Icon */}
          <div className="absolute top-1/2 -translate-y-1/2 right-0 p-12 opacity-[0.03] dark:opacity-[0.05] pointer-events-none text-slate-900 dark:text-white scale-150">
             <PawPrint size={240} />
          </div>

          <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-start md:items-center relative z-10">
            {/* Profile Picture / Icon */}
            <div className="relative">
              <div className="h-32 w-32 sm:h-40 sm:w-40 rounded-[2.5rem] bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white shadow-2xl ring-4 ring-white dark:ring-slate-800">
                <PawPrint size={64} />
              </div>
              <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-2xl bg-emerald-500 border-4 border-white dark:border-slate-900 flex items-center justify-center text-white shadow-lg">
                <ShieldCheck size={20} strokeWidth={3} />
              </div>
            </div>

            {/* Info Grid */}
            <div className="flex-1 space-y-6">
              <div>
                <div className="flex items-center gap-4 flex-wrap">
                  <h1 className="text-4xl sm:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{patient.name}</h1>
                  <div className="flex gap-2">
                    <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 font-black text-[10px] uppercase px-4 py-1.5 rounded-xl">Estável</Badge>
                    {patient.subscriptions && patient.subscriptions.length > 0 && (
                      <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase px-4 py-1.5 rounded-xl shadow-lg shadow-blue-500/20">Plano Premium</Badge>
                    )}
                  </div>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-bold mt-3 text-lg sm:text-xl">
                  {patient.species} • {patient.breed || "Raça Indefinida"} • 
                  {ageYears !== null ? ` ${ageYears}a ${ageMonths}m` : " Idade desconhecida"}
                </p>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Género</span>
                  <p className="font-black text-slate-900 dark:text-slate-100">{patient.gender === 'M' ? 'Macho' : 'Fêmea'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Esterilizado</span>
                  <p className="font-black text-slate-900 dark:text-slate-100">
                    {patient.reproductiveStatus === 'Castrado' || patient.reproductiveStatus === 'Esterilizado' ? 'Sim' : 'Não'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Tutor Responsável</span>
                  <Link href={`/dashboard/customers/${patient.ownerId}`} className="font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline decoration-2 underline-offset-4">
                    {patient.owner?.name} <ChevronRight size={14} strokeWidth={3} />
                  </Link>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">ID Cliente</span>
                  <p className="font-black text-slate-900 dark:text-slate-100">#VC-{patient.ownerId?.slice(-4).toUpperCase()}</p>
                </div>
              </div>
            </div>

            {/* Medical Alerts Container */}
            {patient.allergies && (
              <div className="glass-panel p-6 rounded-[2rem] border-rose-100 dark:border-rose-900/30 bg-rose-50/30 dark:bg-rose-950/20 max-w-sm w-full animate-premium ring-1 ring-rose-200/50 dark:ring-rose-500/20">
                <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
                  <div className="p-2.5 bg-rose-100 dark:bg-rose-500/20 rounded-xl shadow-inner">
                    <AlertCircle size={20} strokeWidth={3} />
                  </div>
                  <span className="font-black text-[11px] uppercase tracking-widest">Alertas Críticos</span>
                </div>
                <p className="text-rose-700 dark:text-rose-300 font-bold text-sm leading-relaxed">{patient.allergies}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Clinical Cockpit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN (8/12): Medical Intelligence */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Vital Signs Cockpit */}
          <Card className="border-none shadow-xl shadow-slate-200/40 dark:shadow-none rounded-[2.5rem] bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden">
            <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between flex-wrap gap-4">
              <div>
                <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-tight">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                    <Activity size={20} strokeWidth={3} />
                  </div>
                  Painel Biométrico
                </CardTitle>
                <CardDescription className="dark:text-slate-400 font-medium ml-11">Monitorização contínua de parâmetros vitais.</CardDescription>
              </div>
              <div className="flex gap-2">
                 <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-widest px-4 py-1.5 rounded-lg">Tendência 30d</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[280px] w-full flex items-center justify-center bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                <div className="text-center space-y-2">
                  <Activity size={32} className="text-slate-300 dark:text-slate-700 mx-auto" />
                  <p className="text-sm font-bold text-slate-400 dark:text-slate-600">Gráfico de Sinais Vitais</p>
                  <p className="text-xs text-slate-300 dark:text-slate-700">{patient.vitalSigns?.length || 0} registos disponíveis</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                {[
                  { label: "Peso", value: `${patient.weight ? `${Number(patient.weight).toFixed(1)} kg` : "---"}`, icon: Weight, color: "text-blue-500" },
                  { label: "Temp", value: `${patient.vitalSigns?.[patient.vitalSigns.length-1]?.temperature || "---"} ºC`, icon: Thermometer, color: "text-orange-500" },
                  { label: "FC (BPM)", value: patient.vitalSigns?.[patient.vitalSigns.length-1]?.heartRate || "---", icon: Heart, color: "text-rose-500" },
                  { label: "FR (RPM)", value: patient.vitalSigns?.[patient.vitalSigns.length-1]?.respiratoryRate || "---", icon: Activity, color: "text-indigo-500" },
                ].map((stat, i) => (
                  <div key={i} className="p-5 bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-slate-100 dark:border-white/5 transition-all hover:scale-105 group cursor-default">
                    <div className="flex items-center gap-2 mb-2">
                      <stat.icon size={14} className={cn("transition-transform group-hover:scale-125", stat.color)} />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-600">{stat.label}</span>
                    </div>
                    <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">{stat.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Clinical Timeline / SOAP Section */}
          <Card className="border-none shadow-xl shadow-slate-200/40 dark:shadow-none rounded-[2.5rem] bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50 dark:border-white/5 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-tight">
                  <div className="p-2 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
                    <HistoryIcon size={20} strokeWidth={3} />
                  </div>
                  Histórico Clínico Interativo
                </CardTitle>
                <CardDescription className="dark:text-slate-400 font-medium ml-11">Linha cronológica de atos clínicos e exames.</CardDescription>
              </div>
              <Link href={`/dashboard/consultations?patientId=${id}`}>
                <Button variant="ghost" className="rounded-xl font-black text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10">
                  Ver Tudo <ChevronRight size={14} className="ml-1" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-8">
              <ClinicalTimeline history={history} isLoading={isHistoryLoading} />
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN (4/12): Preventive & Admin */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Vaccines Card */}
          <Card className="border-none shadow-xl shadow-slate-200/40 dark:shadow-none rounded-[2.5rem] bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-tight">
                <div className="p-2 bg-amber-50 dark:bg-amber-500/10 rounded-xl text-amber-600 dark:text-amber-400">
                  <Syringe size={18} strokeWidth={3} />
                </div>
                Plano de Vacinação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-2 space-y-4">
              {patient.vaccinations?.length > 0 ? (
                patient.vaccinations.map((v: any) => {
                  const isExpired = v.expiresAt && new Date(v.expiresAt) < new Date();
                  const isSoon = v.expiresAt && new Date(v.expiresAt) < new Date(Date.now() + 30 * 86400000);

                  return (
                    <div key={v.id} className={cn(
                      "p-5 rounded-3xl border transition-all relative overflow-hidden group",
                      isExpired 
                        ? "bg-rose-50/50 dark:bg-rose-500/5 border-rose-100 dark:border-rose-500/20" 
                        : isSoon 
                          ? "bg-amber-50/50 dark:bg-amber-500/5 border-amber-100 dark:border-amber-500/20" 
                          : "bg-slate-50/50 dark:bg-white/5 border-slate-100 dark:border-white/10"
                    )}>
                      <div className="flex justify-between items-start mb-3">
                        <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">{v.vaccineName}</h4>
                        {isExpired && <Badge className="bg-rose-600 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-lg shadow-lg shadow-rose-200 dark:shadow-none">Expirada</Badge>}
                        {isSoon && !isExpired && <Badge className="bg-amber-500 text-white border-none font-black text-[8px] uppercase tracking-widest px-2 py-0.5 rounded-lg shadow-lg shadow-amber-200 dark:shadow-none">Aviso</Badge>}
                      </div>
                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Aplicada: {format(new Date(v.appliedAt), "dd MMM yyyy")}</p>
                          <p className={cn("text-[10px] font-black uppercase flex items-center gap-1", isExpired ? 'text-rose-600 dark:text-rose-400' : 'text-slate-600 dark:text-slate-400')}>
                            <RefreshCw size={10} /> Reforço: {v.expiresAt ? format(new Date(v.expiresAt), "dd MMM yyyy") : "N/A"}
                          </p>
                        </div>
                        <p className="text-[10px] font-black text-slate-300 dark:text-slate-700 tracking-widest opacity-40 group-hover:opacity-100 transition-opacity">LOT {v.batchNumber}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 opacity-30">
                  <Syringe size={32} className="mx-auto mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">Sem vacinas</p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full rounded-2xl py-6 border-dashed border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-600 font-black uppercase text-[9px] tracking-widest hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all bg-transparent"
                    >
                      <Plus size={14} className="mr-1" /> Vacina
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden bg-white dark:bg-slate-900">
                    <div className="bg-amber-500 p-8 text-white">
                      <DialogTitle className="text-2xl font-black tracking-tight">Nova Vacinação</DialogTitle>
                      <p className="text-amber-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Registe a aplicação e validade do reforço.</p>
                    </div>
                    <div className="p-8">
                      <VaccinationForm patientId={id} onSuccess={() => {}} />
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full rounded-2xl py-6 border-dashed border-slate-200 dark:border-white/10 text-slate-400 dark:text-slate-600 font-black uppercase text-[9px] tracking-widest hover:border-indigo-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all bg-transparent"
                    >
                      <Plus size={14} className="mr-1" /> Desp.
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px] rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden bg-white dark:bg-slate-900">
                    <div className="bg-indigo-600 p-8 text-white">
                      <DialogTitle className="text-2xl font-black tracking-tight">Nova Desparasitação</DialogTitle>
                      <p className="text-indigo-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Registe o tratamento interno ou externo.</p>
                    </div>
                    <div className="p-8">
                      <DewormingForm patientId={id} onSuccess={() => {}} />
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          {/* Prescriptions & Meds */}
          <Card className="border-none shadow-xl shadow-slate-200/40 dark:shadow-none rounded-[2.5rem] bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-black flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-tight">
                <div className="p-2 bg-rose-50 dark:bg-rose-500/10 rounded-xl text-rose-600 dark:text-rose-400">
                  <Pill size={18} strokeWidth={3} />
                </div>
                Terapêutica Ativa
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 pt-2 space-y-4">
              {patient.prescriptions?.length > 0 ? (
                patient.prescriptions.map((pr: any) => (
                  <div key={pr.id} className="p-6 bg-slate-900 dark:bg-slate-950 rounded-3xl text-white space-y-4 relative overflow-hidden group shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                      <Pill size={56} />
                    </div>
                    <div>
                      <div className="flex justify-between items-center">
                         <Badge className="bg-blue-600 text-white border-none font-black text-[9px] px-3 py-1 rounded-lg">ACTIVA</Badge>
                         <div className="flex items-center gap-1.5 text-slate-500">
                            <Calendar size={10} />
                            <p className="text-[9px] font-black uppercase tracking-widest">{format(new Date(pr.date), "dd MMM yyyy")}</p>
                         </div>
                      </div>
                      <div className="mt-4 space-y-4">
                        {pr.items?.map((item: any) => (
                          <div key={item.id} className="relative z-10">
                            <p className="font-black text-xl tracking-tight leading-tight">{item.medicineName}</p>
                            <p className="text-xs text-blue-400 font-black uppercase tracking-tighter mt-1">{item.dosage} • {item.frequency} • {item.duration}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center relative z-10">
                       <p className="text-[9px] font-bold text-slate-500 italic">Dr. {pr.veterinarian?.name.split(' ')[0]}</p>
                       <PrescriptionDownloadButton prescription={pr} clinic={clinic} />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 opacity-30">
                  <Pill size={32} className="mx-auto mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">Sem medicação activa</p>
                </div>
              )}
              <Dialog>
                <DialogTrigger asChild>
                  <Button className="w-full rounded-2xl py-6 bg-slate-100 dark:bg-white/5 hover:bg-blue-100 dark:hover:bg-blue-500/20 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 font-black uppercase text-[9px] tracking-widest transition-all">
                    Nova Prescrição
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[700px] rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden bg-white dark:bg-slate-900 max-h-[90vh] overflow-y-auto">
                  <div className="bg-slate-900 p-8 text-white">
                    <DialogTitle className="text-2xl font-black tracking-tight">Emitir Prescrição Médica</DialogTitle>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Documento oficial com validade legal.</p>
                  </div>
                  <div className="p-8">
                    <PrescriptionForm patientId={id} onSuccess={() => {}} />
                  </div>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* ID & Microchip - Refined Glass Style */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-linear-to-br from-indigo-600 to-blue-800 p-8 shadow-2xl transition-all hover:scale-[1.02] duration-500">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
            <div className="relative flex flex-col gap-6">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-white shadow-inner backdrop-blur-md">
                  <ShieldCheck size={24} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white uppercase leading-none">Identificação</h3>
                  <p className="text-[10px] text-white/60 font-black uppercase tracking-widest mt-1">Transponder Oficial</p>
                </div>
              </div>

              <div className="space-y-5">
                <div className="group relative rounded-2xl border border-white/10 bg-black/20 p-5 transition-all hover:bg-black/30 backdrop-blur-sm">
                  <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/50 mb-3">Nº MICROCHIP</span>
                  <div className="flex items-center justify-between gap-4">
                    {isEditingChip ? (
                      <input 
                        type="text"
                        value={chipValue}
                        onChange={(e) => setChipValue(e.target.value)}
                        className="bg-transparent text-2xl font-black tracking-tighter text-white font-mono outline-none border-b-2 border-white/50 w-full pb-1"
                        autoFocus
                      />
                    ) : (
                      <span className="text-2xl font-black tracking-tighter text-white font-mono leading-none truncate">
                        {patient.microchip || "SEM REGISTO"}
                      </span>
                    )}
                    
                    <div className="flex gap-1.5">
                      {isEditingChip ? (
                        <button 
                          onClick={handleUpdateChip}
                          className="p-2.5 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 shadow-lg transition-all active:scale-90"
                        >
                          <CheckCircle2 size={16} strokeWidth={3} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setChipValue(patient.microchip || "");
                            setIsEditingChip(true);
                          }}
                          className="p-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all active:scale-90"
                          title="Editar Microchip"
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(patient.microchip || "");
                          toast.success("Copiado para o clipboard!");
                        }}
                        className="p-2.5 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-all active:scale-90"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-black/10 border border-white/5 text-[10px] text-white/60 leading-relaxed italic font-medium">
                  * Verificado no último check-up. Obrigatório para viagens internacionais e registo SIAC.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
