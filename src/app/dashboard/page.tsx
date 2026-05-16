"use client";

import {
  Users, Calendar, TrendingUp, AlertCircle, Clock,
  ChevronRight, Activity, ShieldCheck, Plus, Stethoscope,
  RefreshCw, Bed, Syringe, Package, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { format, isAfter } from "date-fns";
import { pt } from "date-fns/locale";

// ── helpers ──────────────────────────────────────────────────────────────────
const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 19) return "Boa tarde";
  return "Boa noite";
};

const eur = (v: number) =>
  v.toLocaleString("pt-PT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });

// ── KPI card ─────────────────────────────────────────────────────────────────
function StatCard({ name, value, icon: Icon, color, bg, trend, href, loading }: any) {
  const router = useRouter();
  return (
    <Card
      onClick={() => href && router.push(href)}
      className={cn(
        "border-none shadow-sm transition-all duration-300 group overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 rounded-2xl",
        href && "cursor-pointer hover:ring-blue-500/30 hover:shadow-md"
      )}
    >
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className={`p-3 rounded-xl ${bg} dark:bg-blue-500/10 ${color} group-hover:scale-110 transition-all duration-300`}>
            <Icon size={22} strokeWidth={2} />
          </div>
          <Badge variant="outline" className="text-[10px] font-bold border-slate-100 dark:border-slate-700 text-slate-400 uppercase tracking-wider px-2 py-0.5">
            {trend}
          </Badge>
        </div>
        <div className="mt-5">
          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{name}</p>
          {loading
            ? <Skeleton className="h-9 w-20 mt-1" />
            : <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{value}</p>
          }
        </div>
      </CardContent>
    </Card>
  );
}

// ── Alert banner ──────────────────────────────────────────────────────────────
function AlertBanner({ alert }: { alert: any }) {
  const router = useRouter();
  const isError = alert.level === "error";
  return (
    <div
      onClick={() => alert.href && router.push(alert.href)}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 rounded-xl cursor-pointer transition-all hover:brightness-95 active:scale-[0.99]",
        isError
          ? "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30"
          : "bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30"
      )}
    >
      <AlertTriangle size={15} className={isError ? "text-red-500 shrink-0" : "text-amber-500 shrink-0"} />
      <div className="flex-1 min-w-0">
        <span className={cn("font-bold text-sm", isError ? "text-red-700 dark:text-red-400" : "text-amber-700 dark:text-amber-400")}>
          {alert.title}
        </span>
        {alert.desc && (
          <span className={cn("text-xs ml-2 truncate", isError ? "text-red-500" : "text-amber-500")}>
            — {alert.desc}
          </span>
        )}
      </div>
      <ChevronRight size={14} className={isError ? "text-red-400 shrink-0" : "text-amber-400 shrink-0"} />
    </div>
  );
}

// ── Appointment row ───────────────────────────────────────────────────────────
function AppointmentRow({ appt, now }: { appt: any; now: Date }) {
  const router = useRouter();
  const start = new Date(appt.startTime);
  const isPast = isAfter(now, start);
  const isNext = !isPast && isAfter(new Date(now.getTime() + 60 * 60 * 1000), start);

  return (
    <div
      onClick={() => router.push(`/dashboard/consultations?patientId=${appt.patientId}&appointmentId=${appt.id}`)}
      className={cn(
        "group relative flex items-center p-4 rounded-xl border transition-all duration-200 cursor-pointer overflow-hidden",
        isNext
          ? "border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-900/10 hover:border-blue-400"
          : isPast
          ? "border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02] opacity-60 hover:opacity-80"
          : "border-slate-100 dark:border-white/5 bg-white dark:bg-slate-900 hover:border-blue-300 hover:shadow-md"
      )}
    >
      {/* left accent */}
      <div className={cn("absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
        isNext ? "bg-blue-500" : isPast ? "bg-slate-200" : "bg-slate-100 group-hover:bg-blue-400 transition-colors")} />

      <div className="pl-3 flex flex-1 items-center gap-4">
        {/* Avatar */}
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base transition-all duration-200 group-hover:scale-105 shrink-0",
          isNext ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600" : "bg-slate-100 dark:bg-slate-800 text-slate-500")}>
          {appt.patient?.name?.[0]?.toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{appt.patient?.name}</p>
            {isNext && <Badge className="bg-blue-600 text-white border-none text-[9px] font-bold px-2 py-0">A seguir</Badge>}
            {isPast && <Badge variant="outline" className="text-[9px] font-bold text-slate-400 border-slate-200 px-2 py-0">Passou</Badge>}
          </div>
          <p className="text-xs text-slate-400 font-medium truncate">{appt.patient?.owner?.name} · {appt.type ?? "Consulta"}</p>
        </div>

        {/* Time */}
        <div className="text-right shrink-0">
          <p className={cn("text-lg font-bold tracking-tight", isNext ? "text-blue-600" : "text-slate-700 dark:text-slate-300")}>
            {format(start, "HH:mm")}
          </p>
        </div>
      </div>

      <ChevronRight size={16} className="ml-2 text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all shrink-0" />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const now = new Date();

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard/stats");
      if (!res.ok) throw new Error("Erro ao carregar dados");
      return res.json();
    },
    refetchInterval: 60000, // auto-refresh every 60s
    staleTime: 30000,
  });

  const stats = [
    { name: "Consultas Hoje", value: data?.consultationsToday ?? 0, icon: Calendar, color: "text-blue-600", bg: "bg-blue-50", trend: "Hoje", href: "/dashboard/appointments" },
    { name: "Novos Pacientes", value: data?.newPatients ?? 0, icon: Users, color: "text-indigo-600", bg: "bg-indigo-50", trend: "30 dias", href: "/dashboard/patients" },
    { name: "Faturação Hoje", value: eur(data?.revenueToday ?? 0), icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50", trend: "Real", href: "/dashboard/billing" },
    { name: "Stock Crítico", value: data?.criticalStock ?? 0, icon: AlertCircle, color: "text-rose-600", bg: "bg-rose-50", trend: "Urgente", href: "/dashboard/inventory" },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-0.5">
          {isLoading
            ? <Skeleton className="h-10 w-56" />
            : (
              <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                {greeting()}{data?.userName ? `, ${data.userName.split(" ")[0]}` : ""} <span className="text-2xl">👋</span>
              </h1>
            )}
          <p className="text-slate-500 dark:text-slate-400 font-medium text-base capitalize">
            {format(now, "EEEE, d 'de' MMMM", { locale: pt })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-xl border-slate-200 dark:border-slate-800"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
          </Button>
          <Button variant="outline" onClick={() => router.push("/dashboard/management")}
            className="h-10 rounded-xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 font-bold px-5 text-sm">
            Relatórios
          </Button>
          <Button onClick={() => router.push("/dashboard/appointments")}
            className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 gap-1.5 text-sm active:scale-95">
            <Plus size={16} strokeWidth={2.5} /> Nova Consulta
          </Button>
        </div>
      </div>

      {/* ── Error state ── */}
      {isError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30 rounded-xl">
          <AlertCircle size={18} className="text-red-500 shrink-0" />
          <p className="font-bold text-red-700 dark:text-red-400 text-sm flex-1">Não foi possível carregar os dados do painel.</p>
          <Button variant="outline" size="sm" className="rounded-lg border-red-200 text-red-600 hover:bg-red-50" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {/* ── Alerts ── */}
      {!isLoading && (data?.alerts?.length ?? 0) > 0 && (
        <div className="space-y-2">
          {data.alerts.map((alert: any, i: number) => (
            <AlertBanner key={i} alert={alert} />
          ))}
        </div>
      )}

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <StatCard key={stat.name} {...stat} loading={isLoading} />
        ))}
      </div>

      {/* ── Main content ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

        {/* Appointments today */}
        <div className="lg:col-span-8 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Agenda de Hoje</h2>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                {isLoading ? "..." : `${data?.todayAppointments?.length ?? 0} marcações`}
              </p>
            </div>
            <Link href="/dashboard/appointments" className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1 group text-sm hover:underline">
              Ver agenda <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {isLoading ? (
              Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)
            ) : (data?.todayAppointments?.length ?? 0) > 0 ? (
              data.todayAppointments.map((appt: any) => (
                <AppointmentRow key={appt.id} appt={appt} now={now} />
              ))
            ) : (
              <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/50 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Calendar className="mx-auto text-slate-300 mb-3" size={36} strokeWidth={1.5} />
                <p className="text-slate-500 font-medium text-sm">Sem marcações para hoje.</p>
                <Button onClick={() => router.push("/dashboard/appointments")} variant="link" className="text-blue-600 font-bold mt-1 text-sm">
                  Abrir agenda →
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-4 space-y-4">

          {/* Internamentos ativos */}
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 rounded-2xl overflow-hidden">
            <CardHeader className="px-5 py-4 pb-2 flex flex-row justify-between items-center space-y-0 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Bed size={14} strokeWidth={2} /> Internamentos
              </CardTitle>
              <Link href="/dashboard/internamento" className="text-xs font-bold text-blue-600 uppercase tracking-wider hover:underline">
                Ver tudo
              </Link>
            </CardHeader>
            <CardContent className="px-5 py-4 space-y-2.5">
              {isLoading ? (
                <Skeleton className="h-14 rounded-xl" />
              ) : (data?.activeHospitalizations?.length ?? 0) > 0 ? (
                data.activeHospitalizations.slice(0, 4).map((h: any) => (
                  <div key={h.id}
                    onClick={() => router.push("/dashboard/internamento")}
                    className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition-colors group"
                  >
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300 text-sm shadow-sm shrink-0 ring-1 ring-slate-100 dark:ring-slate-700">
                      {h.patientName?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 dark:text-slate-100 text-sm truncate">{h.patientName}</p>
                      <p className="text-xs text-slate-400 truncate">{h.boxNumber ?? "Sem box"}</p>
                    </div>
                    {(h.pendingTasks ?? 0) > 0 && (
                      <Badge className="bg-amber-100 text-amber-700 border-none text-[10px] font-bold shrink-0">
                        {h.pendingTasks} tarefa{h.pendingTasks > 1 ? "s" : ""}
                      </Badge>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400 font-medium py-3 text-center">Nenhum animal internado</p>
              )}
            </CardContent>
          </Card>

          {/* Activity feed */}
          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 rounded-2xl overflow-hidden">
            <CardHeader className="px-5 py-4 pb-2 flex flex-row justify-between items-center space-y-0 border-b border-slate-100 dark:border-slate-800/60">
              <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Atividade Recente</CardTitle>
              <Button variant="ghost" size="sm" onClick={() => router.push("/dashboard/appointments")}
                className="text-xs font-bold uppercase text-blue-600 h-7 px-2 rounded-lg hover:bg-blue-50">
                Ver Tudo
              </Button>
            </CardHeader>
            <CardContent className="px-5 py-4">
              <div className="space-y-4 relative">
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-slate-100 dark:bg-slate-800" />
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="pl-9 space-y-1">
                      <Skeleton className="h-3.5 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))
                ) : (data?.activity?.length ?? 0) > 0 ? (
                  data.activity.map((log: any, idx: number) => {
                    const Icon = log.icon === "Stethoscope" ? Stethoscope : TrendingUp;
                    return (
                      <div key={idx} onClick={() => log.href && router.push(log.href)}
                        className="relative pl-9 group cursor-pointer">
                        <div className={`absolute left-0 top-0 w-5 h-5 rounded-lg border-[3px] border-white dark:border-slate-900 ${log.color} shadow-sm group-hover:scale-110 transition-transform duration-300 flex items-center justify-center z-10`}>
                          <Icon size={9} className="text-white" strokeWidth={2.5} />
                        </div>
                        <p className="text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-tight">{log.title}</p>
                        <p className="text-xs text-slate-400 font-medium">{log.desc}</p>
                        <p className="text-[10px] font-bold text-slate-300 flex items-center gap-1 mt-0.5">
                          <Clock size={10} strokeWidth={2} />
                          {log.time ? format(new Date(log.time), "HH:mm") : "—"}
                        </p>
                      </div>
                    );
                  })
                ) : (
                  <p className="pl-9 text-slate-400 font-medium text-sm py-3">Sem atividade recente</p>
                )}
              </div>

              {/* Vendus badge */}
              <div className="mt-4 p-4 bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl text-white shadow-lg shadow-blue-500/20 relative overflow-hidden group">
                <div className="absolute -right-3 -bottom-3 opacity-10 group-hover:scale-110 transition-transform duration-700">
                  <ShieldCheck size={64} />
                </div>
                <div className="flex justify-between items-center mb-2 relative z-10">
                  <span className="text-[10px] font-bold opacity-70 uppercase tracking-wider">Vendus Cloud</span>
                  <Badge className="bg-emerald-400/20 text-emerald-300 border-none text-[10px] px-2">Online</Badge>
                </div>
                <div className="flex items-center gap-2.5 relative z-10">
                  <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                    <ShieldCheck size={16} strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Faturação Ativa</p>
                    <p className="text-[10px] opacity-60 font-medium">Sistema certificado AT</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
