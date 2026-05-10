"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, PawPrint, User, Phone, Mail, Calendar, Activity,
  Stethoscope, Syringe, AlertCircle, Dog, Cat, FileText, Heart,
  Thermometer, Weight, Plus, Pill, Shield, TrendingUp
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
import { format, isPast, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

// ── helpers ──────────────────────────────────────────────────────────────────
const fmt = (d: string | Date) => format(new Date(d), "dd MMM yyyy", { locale: pt });

function EmptyState({ icon: Icon, text }: { icon: any; text: string }) {
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

  // ── Clinical tabs data ──────────────────────────────────────────────────
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
              {patient.birthDate && (
                <div className="flex items-center gap-2 px-3 py-1 bg-white dark:bg-slate-900 rounded-xl shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                  <Calendar size={18} className="text-amber-500" />
                  <span>{fmt(patient.birthDate)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button size="lg" className="rounded-2xl h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/20 gap-3">
            <Plus size={20} strokeWidth={3} /> Nova Consulta
          </Button>
        </div>
      </div>

      {/* ── Quick Vitals Grid (Expansive) ── */}
      {lastVital && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Weight,      color: "text-blue-600",    bg: "bg-blue-500/10",    label: "Peso",  val: lastVital.weight ? `${lastVital.weight} kg` : "—", desc: "Última pesagem" },
            { icon: Thermometer, color: "text-orange-500",  bg: "bg-orange-500/10",  label: "Temp",  val: lastVital.temperature ? `${lastVital.temperature}°C` : "—", desc: "Temperatura corporal" },
            { icon: Heart,       color: "text-rose-500",    bg: "bg-rose-500/10",    label: "FC",    val: lastVital.heartRate ? `${lastVital.heartRate} bpm` : "—", desc: "Frequência cardíaca" },
            { icon: Activity,    color: "text-emerald-500", bg: "bg-emerald-500/10", label: "FR",    val: lastVital.respiratoryRate ? `${lastVital.respiratoryRate} rpm` : "—", desc: "Frequência respiratória" },
          ].map(({ icon: Icon, color, bg, label, val, desc }) => (
            <Card key={label} className="border-none shadow-xl bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-6 hover:translate-y-[-4px] transition-all duration-300 ring-1 ring-slate-200/50 dark:ring-slate-800">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0", bg)}>
                  <Icon size={28} className={color} />
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">{label}</p>
                  <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">{val}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800/50">
                <p className="text-xs text-slate-400 font-medium">{desc}</p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* ── Main Layout (Wide) ── */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        
        {/* Sidebar Column */}
        <div className="xl:col-span-1 space-y-8">
          {/* Informações Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] pl-2">Informações</h3>
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 space-y-8 ring-1 ring-slate-200/50 dark:ring-slate-800 shadow-xl">
              {[
                { icon: Calendar, color: "text-amber-500",  bg: "bg-amber-500/10",  label: "Data de Nascimento", val: patient.birthDate ? fmt(patient.birthDate) : "—" },
                { icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10", label: "Género / Sexo",      val: patient.gender === "M" ? "Macho" : "Fêmea" },
                { icon: Weight,   color: "text-blue-500",   bg: "bg-blue-500/10",   label: "Peso Registado",     val: patient.weight ? `${patient.weight} kg` : "—" },
                { icon: FileText, color: "text-slate-500",  bg: "bg-slate-500/10",  label: "Nº de Microchip",    val: patient.microchip || "—" },
              ].map(({ icon: Icon, color, bg, label, val }) => (
                <div key={label} className="flex items-center gap-5 group">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform", bg)}>
                    <Icon size={24} className={color} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Proprietário Section */}
          <section className="space-y-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] pl-2">Proprietário</h3>
            <div className="bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 space-y-8 ring-1 ring-slate-200/50 dark:ring-slate-800 shadow-xl">
              {[
                { icon: User,  color: "text-blue-600",  bg: "bg-blue-500/10",  label: "Nome Completo",     val: patient.owner?.name || "—" },
                { icon: Phone, color: "text-green-600", bg: "bg-green-500/10", label: "Contacto Móvel",   val: patient.owner?.phone || "—" },
                { icon: Mail,  color: "text-indigo-600",bg: "bg-indigo-500/10",label: "Endereço Email",    val: patient.owner?.email || "—" },
              ].map(({ icon: Icon, color, bg, label, val }) => (
                <div key={label} className="flex items-center gap-5 group">
                  <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group-hover:scale-110 transition-transform", bg)}>
                    <Icon size={24} className={color} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                    <p className="text-lg font-black text-slate-900 dark:text-white break-all leading-tight">{val}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Content Column (Main Tabs) */}
        <div className="xl:col-span-3">
          <Card className="border-none shadow-2xl bg-white dark:bg-slate-900/50 backdrop-blur-xl rounded-[3rem] ring-1 ring-slate-200/50 dark:ring-slate-800 min-h-[800px] flex flex-col overflow-hidden">
            <Tabs defaultValue="clinical" className="w-full flex-1 flex flex-col">
              <div className="px-10 pt-10 pb-6 border-b border-slate-100 dark:border-slate-800/50">
                <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 rounded-[1.5rem] p-2 h-16 w-full max-w-2xl gap-2">
                  <TabsTrigger value="clinical" className="rounded-[1.2rem] flex-1 px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all">
                    Vacinas
                  </TabsTrigger>
                  <TabsTrigger value="vitals" className="rounded-[1.2rem] flex-1 px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all">
                    Biométricos
                  </TabsTrigger>
                  <TabsTrigger value="history" className="rounded-[1.2rem] flex-1 px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all">
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions" className="rounded-[1.2rem] flex-1 px-8 h-full font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-lg transition-all">
                    Receituário
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="flex-1 p-10 overflow-y-auto">
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

                  {vaccinations.length === 0
                    ? <EmptyState icon={Syringe} text="Sem vacinas registadas no historial." />
                    : <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {vaccinations.map((v: any) => (
                          <div key={v.id} className="group flex items-center justify-between p-6 rounded-[2rem] bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900 transition-all shadow-sm">
                            <div className="flex items-center gap-5">
                              <div className="w-16 h-16 rounded-2xl bg-blue-100/50 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Shield size={24} />
                              </div>
                              <div>
                                <p className="font-black text-slate-900 dark:text-white text-lg leading-tight">{v.vaccineName}</p>
                                <p className="text-xs text-slate-400 font-bold mt-1 uppercase tracking-tighter">
                                  {fmt(v.date)} · Dr. {v.veterinarian?.name}
                                </p>
                              </div>
                            </div>
                            <VaccineStatusBadge expiresAt={v.expiresAt} />
                          </div>
                        ))}
                      </div>
                  }
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

                  {vitals.length === 0
                    ? <EmptyState icon={TrendingUp} text="Nenhum dado biométrico recolhido." />
                    : <div className="space-y-4">
                        {vitals.map((v: any) => (
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
                              <div className="space-y-1">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">FC</p>
                                <p className="text-xl font-black">{v.heartRate || "—"} bpm</p>
                              </div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">FR</p>
                                <p className="text-xl font-black">{v.respiratoryRate || "—"} rpm</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <Badge className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full px-4 mb-2">{fmt(v.createdAt)}</Badge>
                              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Registo Automático</p>
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </TabsContent>

                {/* ── HISTÓRICO ── */}
                <TabsContent value="history" className="m-0 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex flex-col items-center justify-center py-40 bg-slate-50/30 dark:bg-slate-900/30 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800">
                    <Stethoscope size={64} className="text-slate-200 mb-6" />
                    <p className="text-xl font-black text-slate-400 tracking-tight">Histórico Clínico</p>
                    <p className="text-slate-400 font-medium">As consultas e episódios aparecerão aqui em breve.</p>
                  </div>
                </TabsContent>

                {/* ── RECEITUÁRIO ── */}
                <TabsContent value="prescriptions" className="m-0 space-y-8 animate-in fade-in slide-in-from-right-4 duration-500">
                  <div className="flex justify-between items-center bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-[2rem] ring-1 ring-emerald-100 dark:ring-emerald-900/30">
                    <div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">Prescrições Ativas</h4>
                      <p className="text-sm text-slate-500 font-medium">Medicamentos e posologias prescritas.</p>
                    </div>
                    <Button size="lg" className="rounded-2xl h-14 px-8 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg shadow-blue-500/20 gap-3"
                      onClick={() => setDialog("prescription")}>
                      <Plus size={20} strokeWidth={3} /> Nova Prescrição
                    </Button>
                  </div>

                  {prescriptions.length === 0
                    ? <EmptyState icon={Pill} text="Nenhuma receita emitida para este paciente." />
                    : <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {prescriptions.map((rx: any) => (
                          <div key={rx.id} className="p-8 rounded-[2.5rem] bg-white dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 shadow-sm space-y-6">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-100/50 text-emerald-600 flex items-center justify-center">
                                  <Pill size={24} />
                                </div>
                                <div>
                                  <p className="font-black text-slate-900 dark:text-white text-lg">
                                    {rx.items?.length} Medicamento{rx.items?.length !== 1 ? "s" : ""}
                                  </p>
                                  <p className="text-xs text-slate-400 font-bold uppercase tracking-tighter">{fmt(rx.createdAt)}</p>
                                </div>
                              </div>
                              {rx.validUntil && (
                                <Badge className={cn(
                                  "text-[10px] font-black px-3 py-1 rounded-full border-none",
                                  isPast(new Date(rx.validUntil)) ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                )}>
                                  {isPast(new Date(rx.validUntil)) ? "EXPIRADA" : "VÁLIDA"}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/50">
                              {rx.items?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                  <span className="font-black text-slate-800 dark:text-slate-200">{item.medicineName}</span>
                                  <span className="text-xs text-slate-400 font-medium">{item.dosage} · {item.frequency}</span>
                                </div>
                              ))}
                            </div>
                            <div className="pt-4 flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden">
                                <User size={12} className="text-slate-400" />
                              </div>
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dr. {rx.veterinarian?.name}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <Dialog open={dialog === "vaccine"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-blue-600 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"><Syringe size={24} /></div>
                Registar Vacinação
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8">
            <VaccinationForm patientId={patientId} onSuccess={() => { setDialog(null); refetchVax(); }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "vitals"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-slate-900 p-8 text-white">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center"><Activity size={24} /></div>
                Sinais Vitais
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8">
            <VitalSignsForm patientId={patientId} onSuccess={() => { setDialog(null); refetchVitals(); }} />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "prescription"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[720px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] flex flex-col">
          <div className="bg-emerald-600 p-8 text-white shrink-0">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black flex items-center gap-4">
                <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center"><Pill size={24} /></div>
                Nova Prescrição
              </DialogTitle>
            </DialogHeader>
          </div>
          <div className="p-8 overflow-y-auto">
            <PrescriptionForm patientId={patientId} onSuccess={() => { setDialog(null); refetchRx(); }} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
