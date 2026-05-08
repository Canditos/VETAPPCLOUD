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
  Stethoscope
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

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
  const stats = [
    { name: "Consultas Hoje", value: "12", icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", trend: "Normal", href: "/dashboard/calendar" },
    { name: "Novos Pacientes", value: "48", icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", trend: "+15% Mês", href: "/dashboard/patients" },
    { name: "Faturação", value: "€4.250", icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Meta: 85%", href: "/dashboard/billing" },
    { name: "Stock Crítico", value: "3", icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", trend: "Urgente", href: "/dashboard/inventory" },
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
            Bem-vindo, <span className="text-blue-600 dark:text-blue-400 font-black">Dr. Marco</span>. Aqui está o resumo da clínica.
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
              <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Próximas Consultas</h2>
              <p className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Hoje, {new Date().toLocaleDateString('pt-PT', { day: 'numeric', month: 'long' })}</p>
            </div>
            <Link href="/dashboard/calendar" className="text-blue-600 dark:text-blue-400 font-black gap-1 p-0 h-auto hover:no-underline group flex items-center">
              Agenda completa <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid gap-4">
            {[
              { id: "1", patientId: "tobias", name: "Tobias", type: "Gato", breed: "Europeu Comum", time: "14:30", reason: "Check-up Vacinação", status: "Confirmado", color: "blue", icon: Activity },
              { id: "2", patientId: "rex", name: "Rex", type: "Cão", breed: "Golden Retriever", time: "15:15", reason: "Limp. Ouvidos", status: "Em Espera", color: "orange", icon: Clock },
              { id: "3", patientId: "luna", name: "Luna", type: "Gato", breed: "Persa", time: "16:00", reason: "Cirurgia (Castr.)", status: "Preparação", color: "rose", icon: Stethoscope },
            ].map((item) => (
              <div 
                key={item.id} 
                onClick={() => router.push(`/dashboard/consultations?patientId=${item.patientId}&appointmentId=${item.id}`)}
                className="group relative flex items-center bg-white dark:bg-card p-4 md:p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 cursor-pointer overflow-hidden"
              >
                <div className={cn(
                  "absolute left-0 top-0 bottom-0 w-1.5 transition-all duration-500 group-hover:w-2",
                  item.color === "blue" ? "bg-blue-500" : item.color === "orange" ? "bg-orange-500" : "bg-rose-500"
                )} />
                
                <div className="flex flex-1 items-center gap-6">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner transition-all duration-500 group-hover:scale-105",
                      item.color === "blue" ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10" : item.color === "orange" ? "bg-orange-50 text-orange-600 dark:bg-orange-500/10" : "bg-rose-50 text-rose-600 dark:bg-rose-500/10"
                    )}>
                      {item.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-black text-lg text-slate-900 dark:text-slate-100 tracking-tight leading-none truncate">{item.name}</h4>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest px-1.5 py-0 border-slate-200 dark:border-white/5 text-slate-400">
                          {item.breed}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 hidden md:grid grid-cols-3 gap-8 items-center">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center text-slate-400">
                          <item.icon size={14} />
                       </div>
                       <div>
                         <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Procedimento</p>
                         <p className="text-sm font-bold text-slate-700 dark:text-slate-300 truncate max-w-[120px]">{item.reason}</p>
                       </div>
                    </div>

                    <div className="text-center">
                       <p className="text-xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">{item.time}</p>
                       <p className="text-[9px] font-black text-blue-500 dark:text-blue-400 uppercase tracking-widest mt-1">Check-in</p>
                    </div>

                    <div className="flex justify-end">
                       <Badge className={cn(
                         "px-3 py-1 rounded-lg font-black text-[9px] uppercase tracking-widest border-none shadow-sm",
                         item.status === "Confirmado" ? "bg-emerald-500/10 text-emerald-600" : item.status === "Em Espera" ? "bg-orange-500/10 text-orange-600" : "bg-blue-500/10 text-blue-600"
                       )}>
                         {item.status}
                       </Badge>
                    </div>
                  </div>
                </div>

                <div className="ml-6 h-10 w-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-300 group-hover:bg-slate-900 dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-slate-900 transition-all duration-500">
                  <ChevronRight size={20} strokeWidth={3} />
                </div>
              </div>
            ))}
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
                
                {[
                  { title: "Resultado Lab: Fuji", desc: "Análise concluída para Rex", time: "12 MIN", icon: Activity, color: "bg-blue-500", href: "/dashboard/diagnostics" },
                  { title: "Fatura Sincronizada", desc: "Jasmin ERP: #FA/041", time: "45 MIN", icon: FileText, color: "bg-emerald-500", href: "/dashboard/billing" },
                  { title: "Internamento: Luna", desc: "Box 03 • Medicação Administrada", time: "2 HORAS", icon: ShieldCheck, color: "bg-purple-500", href: "/dashboard/internamento" },
                ].map((log, idx) => (
                  <div 
                    key={idx} 
                    onClick={() => log.href && router.push(log.href)}
                    className="relative pl-10 group cursor-pointer"
                  >
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white dark:border-slate-900 ${log.color} shadow-sm group-hover:scale-125 transition-transform duration-300 flex items-center justify-center`}>
                       <log.icon size={10} className="text-white" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 tracking-tight group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{log.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">{log.desc}</p>
                      <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 flex items-center gap-1 uppercase tracking-widest pt-1">
                        <Clock size={10} /> {log.time} ATRÁS
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-10 p-5 bg-slate-900 dark:bg-black rounded-3xl text-white">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em]">Jasmin Sync</span>
                    <div className="flex gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse delay-75" />
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse delay-150" />
                    </div>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-emerald-400">
                      <ShieldCheck size={18} />
                    </div>
                    <p className="text-xs font-bold">Serviços Operacionais</p>
                 </div>
              </div>
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
