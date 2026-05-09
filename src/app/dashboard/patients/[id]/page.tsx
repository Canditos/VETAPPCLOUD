"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft, PawPrint, User, Phone, Mail, Calendar, Activity,
  Stethoscope, Syringe, AlertCircle, Dog, Cat, FileText, Heart,
  Thermometer, Weight, Plus, Shield, ChevronDown, ChevronUp,
  TrendingUp, Pill, RefreshCw,
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
  const patientId = params.id as string;
  const [dialog, setDialog] = useState<"vaccine" | "vitals" | "prescription" | null>(null);

  // ── Patient base data ─────────────────────────────────────────────────────
  const { data: patient, isLoading, isError, error } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.error || "Erro"); }
      return res.json();
    },
  });

  // ── Clinical tabs data (all fetched in parallel) ──────────────────────────
  const { data: vaccinations = [], refetch: refetchVax } = useQuery({
    queryKey: ["vaccinations", patientId],
    queryFn: async () => { const r = await fetch(`/api/patients/${patientId}/vaccinations`); return r.ok ? r.json() : []; },
    enabled: !!patientId,
  });

  const { data: dewormings = [] } = useQuery({
    queryKey: ["dewormings", patientId],
    queryFn: async () => { const r = await fetch(`/api/patients/${patientId}/dewormings`); return r.ok ? r.json() : []; },
    enabled: !!patientId,
  });

  const { data: vitals = [], refetch: refetchVitals } = useQuery({
    queryKey: ["vitals", patientId],
    queryFn: async () => { const r = await fetch(`/api/patients/${patientId}/vitals`); return r.ok ? r.json() : []; },
    enabled: !!patientId,
  });

  const { data: history } = useQuery({
    queryKey: ["history", patientId],
    queryFn: async () => { const r = await fetch(`/api/patients/${patientId}/history`); return r.ok ? r.json() : null; },
    enabled: !!patientId,
  });

  const { data: prescriptions = [], refetch: refetchRx } = useQuery({
    queryKey: ["prescriptions-patient", patientId],
    queryFn: async () => { const r = await fetch(`/api/prescriptions?patientId=${patientId}`); return r.ok ? r.json() : []; },
    enabled: !!patientId,
  });

  // ── Loading / Error ───────────────────────────────────────────────────────
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

  const isDog = patient.species?.toLowerCase().includes("cão") || patient.species?.toLowerCase().includes("can");
  const isCat = patient.species?.toLowerCase().includes("gato") || patient.species?.toLowerCase().includes("fel");
  const SpeciesIcon = isDog ? Dog : isCat ? Cat : PawPrint;
  const lastVital = vitals[0];

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8 animate-in fade-in duration-500">

      {/* ── Header ── */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl shrink-0">
          <ArrowLeft size={20} />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <div className="w-14 h-14 rounded-2xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
            <SpeciesIcon size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{patient.name}</h1>
            <p className="text-slate-500 flex items-center gap-2 text-sm font-medium">
              <span className="capitalize">{patient.species}</span>
              {patient.breed && <><span>·</span><span>{patient.breed}</span></>}
              {patient.birthDate && <><span>·</span><span>{fmt(patient.birthDate)}</span></>}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Badge variant={patient.status === "ACTIVE" ? "default" : "secondary"} className="rounded-xl px-4 py-1.5">
            {patient.status === "ACTIVE" ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>

      {/* ── Quick vitals bar ── */}
      {lastVital && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Weight,      color: "text-blue-600",    bg: "bg-blue-50",    label: "Peso",  val: lastVital.weight ? `${lastVital.weight} kg` : "—" },
            { icon: Thermometer, color: "text-orange-500",  bg: "bg-orange-50",  label: "Temp",  val: lastVital.temperature ? `${lastVital.temperature}°C` : "—" },
            { icon: Heart,       color: "text-rose-500",    bg: "bg-rose-50",    label: "FC",    val: lastVital.heartRate ? `${lastVital.heartRate} bpm` : "—" },
            { icon: Activity,    color: "text-emerald-500", bg: "bg-emerald-50", label: "FR",    val: lastVital.respiratoryRate ? `${lastVital.respiratoryRate} rpm` : "—" },
          ].map(({ icon: Icon, color, bg, label, val }) => (
            <div key={label} className="flex items-center gap-3 bg-white dark:bg-slate-900 rounded-2xl p-4 ring-1 ring-slate-100 dark:ring-slate-800">
              <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", bg)}>
                <Icon size={18} className={color} />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
                <p className="font-black text-slate-900 dark:text-white">{val}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Info cards */}
        <div className="space-y-5">
          {/* Patient info */}
          <Card className="border-none shadow-sm rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Calendar,    color: "bg-amber-50 text-amber-600",   label: "Nascimento", val: patient.birthDate ? fmt(patient.birthDate) : "—" },
                { icon: Activity,    color: "bg-purple-50 text-purple-600", label: "Género",     val: patient.gender === "M" ? "Macho" : patient.gender === "F" ? "Fêmea" : "—" },
                { icon: Weight,      color: "bg-blue-50 text-blue-600",     label: "Peso atual", val: patient.weight ? `${patient.weight} kg` : "—" },
                { icon: FileText,    color: "bg-slate-100 text-slate-600",  label: "Microchip",  val: patient.microchip || "—" },
              ].map(({ icon: Icon, color, label, val }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", color)}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm font-mono">{val}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Owner */}
          <Card className="border-none shadow-sm rounded-3xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest">Proprietário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: User,  color: "bg-blue-50 text-blue-600",  label: "Nome",     val: patient.owner?.name || "—" },
                { icon: Phone, color: "bg-green-50 text-green-600", label: "Telefone", val: patient.owner?.phone || "—" },
                { icon: Mail,  color: "bg-indigo-50 text-indigo-600", label: "Email", val: patient.owner?.email || "—" },
              ].map(({ icon: Icon, color, label, val }) => (
                <div key={label} className="flex items-center gap-3 p-3 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", color)}>
                    <Icon size={16} />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{label}</p>
                    <p className="font-bold text-slate-800 dark:text-slate-200 text-sm truncate">{val}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Allergies */}
          {patient.allergies && (
            <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 flex gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-black text-red-700 dark:text-red-400 text-xs uppercase tracking-widest mb-1">Alergias / Alertas</p>
                <p className="text-sm text-red-800 dark:text-red-300">{patient.allergies}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right: Tabs */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <Tabs defaultValue="vaccines">
              <div className="px-6 pt-6 border-b border-slate-100 dark:border-slate-800">
                <TabsList className="bg-slate-100 dark:bg-slate-800 rounded-xl p-1 w-full grid grid-cols-4">
                  <TabsTrigger value="vaccines" className="rounded-lg text-xs font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                    Vacinas
                  </TabsTrigger>
                  <TabsTrigger value="vitals" className="rounded-lg text-xs font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                    Biométricos
                  </TabsTrigger>
                  <TabsTrigger value="history" className="rounded-lg text-xs font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                    Histórico
                  </TabsTrigger>
                  <TabsTrigger value="prescriptions" className="rounded-lg text-xs font-black data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">
                    Receituário
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* ── VACINAS ── */}
              <TabsContent value="vaccines" className="m-0">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{vaccinations.length} registos</p>
                    <Button size="sm" className="rounded-xl h-9 gap-2 bg-blue-600 text-white text-xs font-black"
                      onClick={() => setDialog("vaccine")}>
                      <Plus size={14} strokeWidth={3} /> Registar
                    </Button>
                  </div>

                  {/* Deworming section */}
                  {dewormings.length > 0 && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/20">
                      <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-3 flex items-center gap-2">
                        <Shield size={12} /> Desparasitação
                      </p>
                      <div className="space-y-2">
                        {dewormings.slice(0, 3).map((d: any) => (
                          <div key={d.id} className="flex justify-between items-center text-sm">
                            <span className="font-bold text-emerald-800 dark:text-emerald-300">{d.productName}</span>
                            <span className="text-emerald-600 text-xs">{fmt(d.appliedAt)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {vaccinations.length === 0
                    ? <EmptyState icon={Syringe} text="Sem vacinas registadas" />
                    : <div className="space-y-2">
                        {vaccinations.map((v: any) => (
                          <div key={v.id} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors group">
                            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                              <Syringe size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-black text-slate-900 dark:text-white text-sm truncate">{v.vaccineName}</p>
                              <p className="text-[11px] text-slate-400 font-medium">
                                Aplicada: {fmt(v.appliedAt)}
                                {v.batchNumber && ` · Lote: ${v.batchNumber}`}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <VaccineStatusBadge expiresAt={v.expiresAt} />
                              {v.expiresAt && (
                                <p className="text-[10px] text-slate-400 mt-1">{fmt(v.expiresAt)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </TabsContent>

              {/* ── BIOMÉTRICOS ── */}
              <TabsContent value="vitals" className="m-0">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{vitals.length} registos</p>
                    <Button size="sm" className="rounded-xl h-9 gap-2 bg-slate-900 dark:bg-blue-600 text-white text-xs font-black"
                      onClick={() => setDialog("vitals")}>
                      <Plus size={14} strokeWidth={3} /> Registar
                    </Button>
                  </div>

                  {vitals.length === 0
                    ? <EmptyState icon={Activity} text="Sem biométricos registados" />
                    : <div className="space-y-3">
                        {vitals.map((v: any, i: number) => (
                          <div key={v.id} className={cn(
                            "p-4 rounded-2xl border transition-colors",
                            i === 0
                              ? "bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-800/20"
                              : "bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5"
                          )}>
                            <div className="flex justify-between items-center mb-3">
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                {i === 0 && <Badge className="bg-blue-600 text-white border-none text-[8px] px-2">Último</Badge>}
                                {format(new Date(v.recordedAt), "dd MMM yyyy · HH:mm", { locale: pt })}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {[
                                { icon: Weight,      color: "text-blue-600",    label: "Peso",  val: v.weight ? `${v.weight} kg` : null },
                                { icon: Thermometer, color: "text-orange-500",  label: "Temp",  val: v.temperature ? `${v.temperature}°C` : null },
                                { icon: Heart,       color: "text-rose-500",    label: "FC",    val: v.heartRate ? `${v.heartRate} bpm` : null },
                                { icon: Activity,    color: "text-emerald-500", label: "FR",    val: v.respiratoryRate ? `${v.respiratoryRate} rpm` : null },
                              ].filter(x => x.val).map(({ icon: Icon, color, label, val }) => (
                                <div key={label} className="text-center p-2 bg-white dark:bg-slate-900 rounded-xl">
                                  <Icon size={14} className={cn("mx-auto mb-1", color)} />
                                  <p className="font-black text-slate-900 dark:text-white text-sm">{val}</p>
                                  <p className="text-[9px] text-slate-400 uppercase font-bold">{label}</p>
                                </div>
                              ))}
                            </div>
                            {v.notes && <p className="text-xs text-slate-500 mt-3 italic border-t border-slate-100 dark:border-slate-800 pt-2">{v.notes}</p>}
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </TabsContent>

              {/* ── HISTÓRICO ── */}
              <TabsContent value="history" className="m-0">
                <div className="p-6 space-y-3">
                  {!history?.consultations?.length
                    ? <EmptyState icon={Stethoscope} text="Sem consultas registadas" />
                    : history.consultations.map((c: any) => (
                        <div key={c.id} className="flex gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors cursor-pointer"
                          onClick={() => router.push(`/dashboard/consultations?patientId=${patientId}`)}>
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center shrink-0">
                            <Stethoscope size={18} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                              <p className="font-black text-slate-900 dark:text-white text-sm">{c.type || "Consulta Geral"}</p>
                              <p className="text-[10px] text-slate-400 shrink-0 ml-2">{fmt(c.date)}</p>
                            </div>
                            {c.veterinarian && (
                              <p className="text-xs text-slate-400 font-medium mt-0.5">Dr. {c.veterinarian.name}</p>
                            )}
                            {c.notes?.[0]?.content && (
                              <p className="text-xs text-slate-500 mt-1 line-clamp-2 italic">{c.notes[0].content}</p>
                            )}
                          </div>
                        </div>
                      ))
                  }
                </div>
              </TabsContent>

              {/* ── RECEITUÁRIO ── */}
              <TabsContent value="prescriptions" className="m-0">
                <div className="p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">{prescriptions.length} prescrições</p>
                    <Button size="sm" className="rounded-xl h-9 gap-2 bg-blue-600 text-white text-xs font-black"
                      onClick={() => setDialog("prescription")}>
                      <Plus size={14} strokeWidth={3} /> Nova Prescrição
                    </Button>
                  </div>

                  {prescriptions.length === 0
                    ? <EmptyState icon={Pill} text="Sem prescrições registadas" />
                    : <div className="space-y-3">
                        {prescriptions.map((rx: any) => (
                          <div key={rx.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <p className="font-black text-slate-900 dark:text-white text-sm">
                                  {rx.items?.length} medicamento{rx.items?.length !== 1 ? "s" : ""}
                                </p>
                                <p className="text-[11px] text-slate-400">{fmt(rx.createdAt)} · Dr. {rx.veterinarian?.name}</p>
                              </div>
                              {rx.validUntil && (
                                <Badge className={cn(
                                  "text-[9px] border-none",
                                  isPast(new Date(rx.validUntil)) ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                )}>
                                  {isPast(new Date(rx.validUntil)) ? "Expirada" : `Válida até ${fmt(rx.validUntil)}`}
                                </Badge>
                              )}
                            </div>
                            <div className="space-y-1">
                              {rx.items?.map((item: any, i: number) => (
                                <div key={i} className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
                                  <span className="font-bold">{item.medicineName}</span>
                                  <span>{item.dosage} · {item.frequency} · {item.duration}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                  }
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>
      </div>

      {/* ── Dialogs ── */}
      <Dialog open={dialog === "vaccine"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><Syringe size={20} /></div>
              Registar Vacinação
            </DialogTitle>
          </DialogHeader>
          <VaccinationForm patientId={patientId} onSuccess={() => { setDialog(null); refetchVax(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "vitals"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-100 text-slate-700 rounded-2xl flex items-center justify-center"><Activity size={20} /></div>
              Registar Biométricos
            </DialogTitle>
          </DialogHeader>
          <VitalSignsForm patientId={patientId} onSuccess={() => { setDialog(null); refetchVitals(); }} />
        </DialogContent>
      </Dialog>

      <Dialog open={dialog === "prescription"} onOpenChange={(o) => !o && setDialog(null)}>
        <DialogContent className="sm:max-w-[640px] rounded-3xl border-none shadow-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-black flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center"><Pill size={20} /></div>
              Nova Prescrição
            </DialogTitle>
          </DialogHeader>
          <PrescriptionForm patientId={patientId} onSuccess={() => { setDialog(null); refetchRx(); }} />
        </DialogContent>
      </Dialog>
    </div>
  );
}
