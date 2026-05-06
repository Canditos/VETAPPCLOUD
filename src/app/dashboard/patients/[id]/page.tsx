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
  ShieldCheck
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
  const [isValidatingSIAC, setIsValidatingSIAC] = useState(false);
  const [siacStatus, setSiacStatus] = useState<"IDLE" | "SUCCESS" | "ERROR">("IDLE");

  const validateSIAC = () => {
    setIsValidatingSIAC(true);
    setSiacStatus("IDLE");
    setTimeout(() => {
      setIsValidatingSIAC(false);
      setSiacStatus("SUCCESS");
      toast.success("SIAC: Animal validado com sucesso na base de dados nacional.");
    }, 2000);
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
          <Link href={`/dashboard/hospitalization`}>
            <Button variant="outline" className="rounded-xl font-bold gap-2 border-amber-200 dark:border-amber-900/50 text-amber-600 dark:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20">
              <Bed size={16} /> Internar
            </Button>
          </Link>
          <Button variant="outline" className="rounded-xl font-bold gap-2 border-slate-200 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800">
            <Printer size={16} /> Imprimir Ficha
          </Button>
          <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 font-black gap-2 shadow-lg shadow-blue-100 dark:shadow-none">
            <Plus size={16} /> Nova Consulta
          </Button>
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
              <Button variant="outline" className="rounded-xl font-bold border-slate-200 dark:border-slate-800 dark:text-slate-300">Ver Tudo</Button>
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
                <Button variant="outline" className="w-full rounded-2xl py-6 border-dashed border-slate-200 text-slate-400 font-black hover:border-blue-300 hover:text-blue-600 transition-all">
                  <Plus size={16} className="mr-2" /> Registar Vacina
                </Button>
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
                <Button className="w-full rounded-2xl py-6 bg-slate-100 dark:bg-slate-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 font-black transition-all">
                  Nova Prescrição
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* SIAC / Identification Mock */}
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-blue-800 text-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <ShieldCheck size={24} className="text-blue-300" />
              <h3 className="text-xl font-black">Registo SIAC</h3>
            </div>
            <p className="text-blue-100 text-sm font-medium leading-relaxed opacity-80">
              Animal identificado eletronicamente e registado na base de dados nacional.
            </p>
            <div className="mt-6 p-4 bg-white/10 rounded-2xl border border-white/10">
              <p className="text-[9px] font-black uppercase tracking-widest text-blue-300">Número do Microchip</p>
              <p className="text-lg font-black tracking-wider mt-1">{patient.microchip || "628090001234567"}</p>
            </div>
            <Button 
              variant="ghost" 
              className="w-full mt-6 rounded-xl text-white font-black text-xs hover:bg-white/10 border border-white/20 gap-2"
              onClick={validateSIAC}
              disabled={isValidatingSIAC}
            >
               {isValidatingSIAC ? (
                 <>Validando no SIAC... <RefreshCw className="animate-spin" size={14} /></>
               ) : siacStatus === "SUCCESS" ? (
                 <>Validado com Sucesso <CheckCircle2 size={14} className="text-emerald-400" /></>
               ) : (
                 <>Validar no SIAC <ChevronRight size={14} /></>
               )}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}
