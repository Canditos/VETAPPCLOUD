"use client";

import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Clock,
  ArrowRight,
  ChevronRight,
  Activity,
  FileText,
  ShieldCheck,
  Plus,
  Stethoscope,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

// Custom Stat Card for Dashboard
const StatCard = ({ name, value, icon: Icon, color, bg, trend, href }: any) => {
  const router = useRouter();
  return (
    <Card 
      onClick={() => href && router.push(href)}
      className={cn(
        "border-none shadow-sm transition-all duration-300 group overflow-hidden bg-white dark:bg-card ring-1 ring-slate-100 dark:ring-white/10 rounded-[2rem]",
        href && "cursor-pointer hover:ring-blue-500/30"
      )}
    >
      <CardContent className="p-7">
        <div className="flex justify-between items-start">
          <div className={`p-4 rounded-2xl ${bg} dark:bg-blue-500/10 ${color} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
            <Icon size={26} strokeWidth={2.5} />
          </div>
          <Badge variant="outline" className="text-[10px] font-black border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1">
            {trend}
          </Badge>
        </div>
        <div className="mt-6">
          <p className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{name}</p>
          <p className="text-4xl font-black text-slate-900 dark:text-slate-100 mt-2 tracking-tighter">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const stats = await response.json();
        setData(stats);
      }
    } catch (error) {
      console.error("Error fetching stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-[600px] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  const stats = [
    { name: "Consultas Hoje", value: data?.consultationsToday || "0", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", trend: "Hoje", href: "/dashboard/calendar" },
    { name: "Novos Pacientes", value: data?.newPatients || "0", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", trend: "30 dias", href: "/dashboard/patients" },
    { name: "Faturação Hoje", value: data?.revenueToday?.toLocaleString('pt-PT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }) || "€0", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Real", href: "/dashboard/billing" },
    { name: "Stock Crítico", value: data?.criticalStock || "0", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", trend: "Urgente", href: "/dashboard/inventory" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-12 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Painel Geral
          </h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            Sessão ativa para <span className="text-blue-600 dark:text-blue-400 font-black">Área Clínica</span>. Aqui está o resumo real.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <Button 
             variant="outline" 
             onClick={() => router.push("/dashboard/management")}
             className="h-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm font-black px-6 hover:shadow-md transition-all active:scale-95"
           >
              Relatórios
           </Button>
           <Button 
             onClick={() => router.push("/dashboard/calendar")}
             className="h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-sm font-black px-8 transition-all active:scale-95 gap-2"
           >
              <Plus size={20} strokeWidth={3} />
              <span>Nova Consulta</span>
           </Button>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.name} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main List Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end px-2">
            <div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Próximas Marcações</h2>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Sincronizado em tempo real</p>
            </div>
            <Link href="/dashboard/calendar" className="text-blue-600 dark:text-blue-400 font-black gap-1 p-0 h-auto hover:no-underline group flex items-center">
              Agenda completa <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid gap-4">
            {data?.upcomingAppointments?.length > 0 ? (
              data.upcomingAppointments.map((appt: any) => (
                <div 
                  key={appt.id} 
                  onClick={() => router.push(`/dashboard/consultations?patientId=${appt.patientId}&appointmentId=${appt.id}`)}
                  className="group relative flex items-center bg-white dark:bg-card p-4 md:p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 cursor-pointer overflow-hidden"
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 group-hover:w-2 bg-blue-500" />
                  
                  <div className="flex flex-1 items-center gap-6">
                    <div className="flex items-center gap-4 min-w-[200px]">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner transition-all duration-500 group-hover:scale-105 bg-blue-50 text-blue-600 dark:bg-blue-500/10">
                        {appt.patient.name[0]}
                      </div>
                      <div className="min-w-0 flex flex-col justify-center">
                        <h4 className="font-black text-lg text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate mb-1.5">{appt.patient.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0 border-slate-200 dark:border-white/5 text-slate-400 bg-slate-50/50">
                            {appt.patient.breed || appt.patient.species}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 hidden md:grid grid-cols-3 gap-8 items-center">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400">
                            <Activity size={18} strokeWidth={2.5} />
                         </div>
                         <div>
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Motivo</p>
                           <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{appt.type || "Consulta"}</p>
                         </div>
                      </div>

                      <div className="text-center">
                         <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none mb-1">
                           {new Date(appt.startTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                         </p>
                         <p className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest">Início</p>
                      </div>

                      <div className="flex justify-end">
                         <Badge className="px-4 py-1.5 rounded-xl font-black text-[9px] uppercase tracking-widest border-none shadow-sm bg-blue-500 text-white">
                           {appt.status === 'SCHEDULED' ? 'Agendado' : appt.status}
                         </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="ml-6 h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-blue-600 dark:group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 shadow-sm">
                    <ChevronRight size={24} strokeWidth={3} />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[2rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Calendar className="mx-auto text-slate-300 mb-4" size={48} />
                <p className="text-slate-500 font-bold">Não há marcações agendadas para hoje.</p>
                <Button 
                  onClick={() => router.push("/dashboard/calendar")}
                  variant="link" 
                  className="text-blue-600 font-black mt-2"
                >
                  Abrir agenda para marcar
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Activity */}
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-8 pb-0">
               <div className="flex justify-between items-center">
                 <CardTitle className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">Fluxo de Atividade</CardTitle>
                 <Button 
                   variant="ghost" 
                   size="sm" 
                   onClick={() => router.push("/dashboard/calendar")}
                   className="text-[10px] font-black uppercase text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg h-7 px-2"
                 >
                   Ver Tudo
                 </Button>
               </div>
            </CardHeader>
            <CardContent className="p-8">
              <div className="space-y-8 relative">
                {/* Timeline Line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                
                {data?.activity?.length > 0 ? (
                  data.activity.map((log: any, idx: number) => {
                    const Icon = log.icon === "Stethoscope" ? Stethoscope : log.icon === "TrendingUp" ? TrendingUp : Activity;
                    return (
                      <div 
                        key={idx} 
                        onClick={() => log.href && router.push(log.href)}
                        className="relative pl-12 group cursor-pointer pb-6"
                      >
                        <div className={`absolute left-0 top-0 w-8 h-8 rounded-xl border-4 border-white dark:border-slate-900 ${log.color} shadow-lg group-hover:scale-110 transition-transform duration-300 flex items-center justify-center z-10`}>
                           <Icon size={14} className="text-white" strokeWidth={3} />
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{log.title}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium line-clamp-1">{log.desc}</p>
                          <p className="text-[9px] font-black text-slate-400 dark:text-slate-600 flex items-center gap-1 uppercase tracking-widest pt-1">
                            <Clock size={10} strokeWidth={3} /> {new Date(log.time).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-10 text-center">
                    <p className="text-slate-400 font-bold text-sm italic">Sem atividade recente</p>
                  </div>
                )}
              </div>

              <div className="mt-6 p-6 bg-linear-to-br from-blue-600 to-blue-800 rounded-[2rem] text-white shadow-xl shadow-blue-500/20 relative overflow-hidden group">
                 <div className="absolute -right-4 -bottom-4 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <ShieldCheck size={100} />
                 </div>
                 <div className="flex justify-between items-center mb-4 relative z-10">
                    <span className="text-[9px] font-black opacity-80 uppercase tracking-[0.2em]">Vendus Cloud</span>
                    <Badge className="bg-emerald-400/20 text-emerald-300 border-none text-[8px] px-2">Online</Badge>
                 </div>
                 <div className="flex items-center gap-3 relative z-10">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                      <ShieldCheck size={20} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-xs font-black">Faturação Ativa</p>
                      <p className="text-[10px] opacity-70 font-medium">Sistema certificado AT</p>
                    </div>
                 </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

