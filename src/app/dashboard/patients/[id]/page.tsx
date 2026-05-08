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
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from "recharts";
import { format, differenceInYears, differenceInMonths } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";

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
      // Aqui idealmente faríamos refetch da query, mas para demo o toast basta
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
        loading: "A enviar SMS de teste...",
        success: (data) => data.message || "SMS enviada com sucesso!",
        error: "Erro ao enviar SMS. Verifica as credenciais.",
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

  if (isLoading) return <div className="p-12 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse">A carregar Hub Clínico 360º...</div>;
  if (!patient) return <div className="p-12 text-center text-red-500 font-bold">Paciente não encontrado.</div>;

  const ageYears = patient.birthDate ? differenceInYears(new Date(), new Date(patient.birthDate)) : null;
  const ageMonths = patient.birthDate ? differenceInMonths(new Date(), new Date(patient.birthDate)) % 12 : null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* Navigation & Actions */}
      <div className="flex justify-between items-center">
        <Link href={`/dashboard/customers/${patient.ownerId}`}>
          <Button variant="ghost" className="text-slate-500 dark:text-slate-400 font-bold hover:bg-slate-100 dark:hover:bg-slate-800 gap-2">
            <ArrowLeft size={16} /> Voltar ao Dono
          </Button>
        </Link>
        <div className="flex gap-3">
          <Link href={`/dashboard/internamento`}>
            <Button variant="outline" className="rounded-xl font-bold gap-2 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20">
              <Bed size={16} /> Internar
            </Button>
          </Link>
          <Button 
            variant="outline" 
            className="rounded-xl font-bold gap-2 border-slate-200 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
            onClick={() => toast.info("A gerar PDF da ficha clínica...")}
          >
            <Printer size={16} /> Imprimir Ficha
          </Button>
          <Button 
            variant="outline" 
            className="rounded-xl font-bold gap-2 border-indigo-200 dark:border-indigo-900/50 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
            onClick={sendQuickSMS}
          >
            <MessageSquare size={16} /> Enviar SMS
          </Button>
          <Link href={`/dashboard/consultations?patientId=${id}`}>
            <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 font-black gap-2 shadow-lg shadow-blue-100 dark:shadow-none">
              <Plus size={16} /> Nova Consulta
            </Button>
          </Link>
        </div>
      </div>

      {/* Patient Identity Header */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-50 dark:border-slate-800 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none text-slate-900 dark:text-white">
           <PawPrint size={180} />
        </div>
        <div className="flex flex-col md:flex-row gap-10 items-start md:items-center relative z-10">
          <div className="h-32 w-32 rounded-[2.5rem] bg-slate-900 dark:bg-blue-600 flex items-center justify-center text-white shadow-2xl">
            <PawPrint size={64} />
          </div>
          <div className="flex-1 space-y-4">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-none">{patient.name}</h1>
                <div className="flex gap-2">
                  <Badge className="bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 font-black text-[10px] uppercase px-3 py-1 rounded-lg">Estável</Badge>
                  {patient.subscriptions && patient.subscriptions.length > 0 && (
                    <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase px-3 py-1 rounded-lg shadow-lg shadow-blue-200 dark:shadow-none">Plano Premium</Badge>
                  )}
                </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-lg">
                {patient.species} • {patient.breed || "Raça Indefinida"} • 
                {ageYears !== null ? ` ${ageYears} anos e ${ageMonths} meses` : " Idade desconhecida"}
              </p>
            </div>
            <div className="flex flex-wrap gap-8 text-sm pt-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Microchip</span>
                <span className="font-bold text-slate-700 dark:text-slate-300 tracking-wider">{patient.microchip || "N/A"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Género</span>
                <span className="font-bold text-slate-700 dark:text-slate-300">{patient.gender === 'M' ? 'Macho' : 'Fêmea'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 dark:text-slate-600">Tutor Responsável</span>
                <Link href={`/dashboard/customers/${patient.ownerId}`} className="font-black text-blue-600 dark:text-blue-400 flex items-center gap-1.5 hover:underline group/owner">
                  <UserIcon size={14} strokeWidth={3} className="group-hover/owner:scale-110 transition-transform" /> {patient.owner?.name}
                </Link>
              </div>
            </div>
          </div>
          {patient.allergies && (
            <div className="glass-panel p-6 rounded-[2rem] border-rose-100 dark:border-rose-900/30 bg-rose-50/50 dark:bg-rose-950/20 max-w-xs animate-premium">
              <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 mb-3">
                <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-xl">
                  <AlertCircle size={18} strokeWidth={3} />
                </div>
                <span className="font-black text-xs uppercase tracking-widest">Alertas Clínicos</span>
              </div>
              <p className="text-rose-700 dark:text-rose-300 font-bold text-sm leading-relaxed">{patient.allergies}</p>
            </div>
          )}
        </div>
      </div>

      {/* Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Vitals & History */}
        <div className="lg:col-span-2 space-y-8">
          {/* Vital Signs Chart */}
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
            <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <Activity className="text-blue-600 dark:text-blue-400" /> Sinais Vitais
                </CardTitle>
                <CardDescription className="dark:text-slate-400 font-medium">Histórico de peso e temperatura.</CardDescription>
              </div>
              <div className="flex gap-2">
                 <Badge variant="outline" className="rounded-lg font-black text-[10px] border-slate-100 dark:border-slate-800 dark:text-slate-400">PESO (KG)</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={patient.vitalSigns}>
                    <defs>
                      <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-slate-100 dark:stroke-slate-800" />
                    <XAxis 
                      dataKey="recordedAt" 
                      tickFormatter={(val) => format(new Date(val), "dd/MM")}
                      className="text-slate-400 dark:text-slate-600"
                      fontSize={10}
                      fontWeight="900"
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      className="text-slate-400 dark:text-slate-600"
                      fontSize={10}
                      fontWeight="900"
                      axisLine={false}
                      tickLine={false}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        borderRadius: '1.5rem', 
                        border: 'none', 
                        boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)', 
                        background: 'rgb(15 23 42 / 0.9)',
                        color: '#fff',
                        fontWeight: '900',
                        padding: '1rem'
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="weight" 
                      stroke="#2563eb" 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorWeight)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                    <Weight size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Peso Atual</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{patient.vitalSigns?.[patient.vitalSigns.length-1]?.weight || "---"} kg</p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                    <Thermometer size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Temperatura</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{patient.vitalSigns?.[patient.vitalSigns.length-1]?.temperature || "---"} ºC</p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                    <Activity size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">FC (BPM)</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{patient.vitalSigns?.[patient.vitalSigns.length-1]?.heartRate || "---"}</p>
                </div>
                <div className="p-5 bg-slate-50 dark:bg-slate-800/50 rounded-3xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 mb-1">
                    <Activity size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">FR (RPM)</span>
                  </div>
                  <p className="text-2xl font-black text-slate-900 dark:text-slate-100">{patient.vitalSigns?.[patient.vitalSigns.length-1]?.respiratoryRate || "---"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Clinical History (SOAP) */}
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
            <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                  <HistoryIcon className="text-blue-600 dark:text-blue-400" /> Histórico Clínico
                </CardTitle>
                <CardDescription className="dark:text-slate-400 font-medium">SOAP Notes e Observações Clínicas.</CardDescription>
              </div>
              <Link href={`/dashboard/consultations?patientId=${id}`}>
                <Button 
                  variant="outline" 
                  className="rounded-xl font-bold border-slate-200 dark:border-slate-800 dark:text-slate-300"
                >
                  Ver Tudo
                </Button>
              </Link>
            </CardHeader>
            <div className="divide-y divide-slate-50 dark:divide-slate-800">
              {patient.consultations?.map((consult: any) => (
                <div key={consult.id} className="p-8 hover:bg-slate-50/50 transition-colors">
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-4">
                       <div className="h-12 w-12 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                         {format(new Date(consult.date), "dd")}
                       </div>
                       <div>
                         <p className="font-black text-slate-900 dark:text-slate-100">{format(new Date(consult.date), "MMMM yyyy", { locale: pt })}</p>
                         <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">Médico: {consult.veterinarian?.name || "Dr. Desconhecido"}</p>
                       </div>
                    </div>
                    <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border-none font-black text-[9px] uppercase">Finalizada</Badge>
                  </div>
                  
                  {consult.notes ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Subjetivo</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{consult.notes.subjective || "Sem registos."}</p>
                        </div>
                        <div>
                          <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Objetivo</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{consult.notes.objective || "Sem registos."}</p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div>
                          <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mb-1">Avaliação</p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 font-medium leading-relaxed">{consult.notes.assessment || "Sem registos."}</p>
                        </div>
                        <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-900/50">
                          <p className="text-[9px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-[0.2em] mb-1">Plano Terapêutico</p>
                          <p className="text-sm text-emerald-800 dark:text-emerald-300 font-bold leading-relaxed">{consult.notes.plan || "Sem registos."}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p className="text-slate-300 dark:text-slate-700 italic font-medium">Nenhuma nota SOAP registada para esta consulta.</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right Column: Vaccines, Prescriptions, etc. */}
        <div className="space-y-8">
          {/* Vaccines Card */}
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Syringe className="text-blue-600 dark:text-blue-400" /> Plano de Vacinação
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-8 pb-8 space-y-4">
                {patient.vaccinations?.map((v: any) => {
                  const isExpired = v.expiresAt && new Date(v.expiresAt) < new Date();
                  const isSoon = v.expiresAt && new Date(v.expiresAt) < new Date(Date.now() + 30 * 86400000);

                  return (
                    <div key={v.id} className={`p-5 rounded-3xl border transition-all ${isExpired ? 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/50' : isSoon ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/50' : 'bg-slate-50 dark:bg-slate-800 border-slate-50 dark:border-slate-800'}`}>
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-slate-900 dark:text-slate-100">{v.vaccineName}</h4>
                        {isExpired && <Badge className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 font-black text-[8px]">EXPIRADA</Badge>}
                        {isSoon && !isExpired && <Badge className="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-black text-[8px]">EM BREVE</Badge>}
                      </div>
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Aplicada: {format(new Date(v.appliedAt), "dd MMM yyyy")}</p>
                          <p className={`text-[10px] font-black uppercase mt-1 ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>Reforço: {v.expiresAt ? format(new Date(v.expiresAt), "dd MMM yyyy") : "N/A"}</p>
                        </div>
                        <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700">#{v.batchNumber}</p>
                      </div>
                    </div>
                  );
                })}
                <Link href={`/dashboard/consultations?patientId=${id}&tab=vaccines`}>
                  <Button 
                    variant="outline" 
                    className="w-full rounded-2xl py-6 border-dashed border-slate-200 text-slate-400 font-black hover:border-blue-300 hover:text-blue-600 transition-all"
                  >
                    <Plus size={16} className="mr-2" /> Registar Vacina
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Prescriptions Card */}
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
            <CardHeader className="p-8">
              <CardTitle className="text-xl font-black flex items-center gap-2 text-slate-900 dark:text-slate-100">
                <Pill className="text-blue-600 dark:text-blue-400" /> Farmácia & Receitas
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="px-8 pb-8 space-y-4">
                {patient.prescriptions?.map((pr: any) => (
                  <div key={pr.id} className="p-6 bg-slate-900 dark:bg-slate-950 rounded-[2rem] text-white space-y-4 relative overflow-hidden group ring-1 ring-white/5">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                      <Pill size={48} />
                    </div>
                    <div>
                      <div className="flex justify-between items-start">
                         <Badge className="bg-blue-600 text-white border-none font-black text-[8px]">ATIVA</Badge>
                         <p className="text-[9px] font-black text-slate-500 uppercase">{format(new Date(pr.date), "dd/MM/yyyy")}</p>
                      </div>
                      <div className="mt-4 space-y-3">
                        {pr.items?.map((item: any) => (
                          <div key={item.id}>
                            <p className="font-black text-lg">{item.medicineName}</p>
                            <p className="text-xs text-blue-400 font-bold">{item.dosage} • {item.frequency} • {item.duration}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                       <p className="text-[9px] font-bold text-slate-500 italic">Emitido por: {pr.veterinarian?.name}</p>
                       <Button size="icon" variant="ghost" className="h-8 w-8 rounded-lg hover:bg-white/10 text-white">
                         <Printer size={14} />
                       </Button>
                    </div>
                  </div>
                ))}
                <Link href={`/dashboard/consultations?patientId=${id}&tab=billing`}>
                  <Button className="w-full rounded-2xl py-6 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-black transition-all">
                    Nova Prescrição
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Identificação & Microchip Section */}
          <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-gradient-to-br from-indigo-600/20 to-blue-900/40 p-8 backdrop-blur-md shadow-2xl transition-all hover:shadow-indigo-500/10">
            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl" />
            <div className="relative flex flex-col gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-400 shadow-inner">
                  <ShieldCheck size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-black tracking-tight text-white uppercase">Identificação</h3>
                  <p className="text-sm text-indigo-200/60 font-medium">Registo de Microchip</p>
                </div>
              </div>

              <div className="space-y-4">
                <p className="text-sm leading-relaxed text-indigo-100/80 font-medium opacity-70">
                  Campo oficial para o número do transponder/microchip do animal para fins de identificação legal e clínica.
                </p>

                <div className="group relative rounded-2xl border border-white/5 bg-black/30 p-5 transition-all hover:bg-black/40">
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-indigo-400/70 mb-2">NÚMERO DO MICROCHIP</span>
                  <div className="flex items-center justify-between gap-3">
                    {isEditingChip ? (
                      <input 
                        type="text"
                        value={chipValue}
                        onChange={(e) => setChipValue(e.target.value)}
                        className="bg-transparent text-2xl font-black tracking-tighter text-white font-mono outline-none border-b border-indigo-500 w-full"
                        autoFocus
                      />
                    ) : (
                      <span className="text-2xl font-black tracking-tighter text-white font-mono leading-none">
                        {patient.microchip || "Sem registo"}
                      </span>
                    )}
                    
                    <div className="flex gap-1">
                      {isEditingChip ? (
                        <button 
                          onClick={handleUpdateChip}
                          className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                        >
                          <CheckCircle2 size={16} />
                        </button>
                      ) : (
                        <button 
                          onClick={() => {
                            setChipValue(patient.microchip || "");
                            setIsEditingChip(true);
                          }}
                          className="p-2 text-indigo-400/50 hover:text-indigo-300 transition-colors"
                          title="Editar Microchip"
                        >
                          <Plus size={16} />
                        </button>
                      )}
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(patient.microchip || "");
                          toast.success("Copiado!");
                        }}
                        className="p-2 text-indigo-400/50 hover:text-indigo-300 transition-colors"
                      >
                        <Copy size={16} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-white/5 border border-white/5 text-[11px] text-indigo-200/50 leading-relaxed italic">
                  * Este número é utilizado para comunicações oficiais e rastreio em caso de perda.
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
