"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle2, XCircle, BarChart3, TrendingUp, Clock, Smartphone, Euro, PiggyBank, CalendarDays, ArrowUpRight, ArrowDownRight, Activity, Zap, Target, Users, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend, AreaChart, Area,
} from "recharts";

const STATUS_COLORS = { SENT: "#22c55e", FAILED: "#ef4444", PENDING: "#f59e0b" };
const TYPE_COLORS: Record<string, string> = { MANUAL: "#3b82f6", REMINDER_24H: "#8b5cf6", VACCINE_ALERT: "#06b6d4", MARKETING: "#f97316" };
const TYPE_LABELS: Record<string, string> = { MANUAL: "Manual", REMINDER_24H: "Lembrete 24h", VACCINE_ALERT: "Vacinação", MARKETING: "Marketing" };

const PERIODS = [
  { key: "7d", label: "7 dias", days: 7 },
  { key: "30d", label: "30 dias", days: 30 },
  { key: "90d", label: "90 dias", days: 90 },
  { key: "all", label: "Todo", days: 0 },
];

export default function SmsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  const periodDays = PERIODS.find(p => p.key === period)?.days ?? 30;

  useEffect(() => {
    setLoading(true);
    fetch(`/api/settings/sms-stats?days=${periodDays}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [period, periodDays]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <div className="relative">
        <div className="h-16 w-16 rounded-full border-4 border-blue-100 dark:border-blue-900/50" />
        <div className="absolute inset-0 h-16 w-16 rounded-full border-4 border-transparent border-t-blue-600 animate-spin" />
      </div>
      <p className="text-sm font-bold text-slate-400 animate-pulse">A carregar dashboard...</p>
    </div>
  );
  if (!data) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-slate-400">
      <BarChart3 size={48} className="opacity-30" />
      <p className="text-lg font-bold">Sem dados disponíveis</p>
      <p className="text-sm">Envie SMS para começar a ver as estatísticas.</p>
    </div>
  );

  const statusPie = Object.entries(STATUS_COLORS).map(([k, v]) => ({
    name: k === "SENT" ? "Enviados" : k === "FAILED" ? "Falhas" : "Pendentes",
    value: data.byStatus?.find((s: any) => s.status === k)?._count || 0,
    color: v,
  })).filter((s: any) => s.value > 0);

  const typeBar = (data.byType || []).map((t: any) => ({
    name: TYPE_LABELS[t.type] || t.type,
    value: t._count,
    color: TYPE_COLORS[t.type] || "#94a3b8",
  }));

  const dailyRev = [...(data.daily || [])].reverse();
  const monthlyRev = [...(data.monthly || [])].reverse();

  const totalSent = data.totalSent || 0;
  const totalFailed = data.totalFailed || 0;
  const successRate = data.successRate || 0;

  const avgPerDay = dailyRev.length > 0 ? Math.round(dailyRev.reduce((a: number, d: any) => a + d.sent, 0) / Math.max(dailyRev.length, 1)) : 0;
  const busiestDay = dailyRev.length > 0 ? dailyRev.reduce((max: any, d: any) => d.sent > (max?.sent || 0) ? d : max, dailyRev[0]) : null;
  const lastWeekTotal = dailyRev.slice(-7).reduce((a: number, d: any) => a + d.sent, 0);
  const prevWeekTotal = dailyRev.slice(-14, -7).reduce((a: number, d: any) => a + d.sent, 0);
  const weekChange = prevWeekTotal > 0 ? Math.round(((lastWeekTotal - prevWeekTotal) / prevWeekTotal) * 100) : 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BarChart3 size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">SMS Analytics</h1>
              <p className="text-xs text-slate-500 font-medium">Métricas e estatísticas de envio</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 dark:bg-slate-900 rounded-2xl p-1 ring-1 ring-slate-200 dark:ring-white/5">
            {PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)}
                className={cn("px-4 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all",
                  period === p.key ? "bg-white dark:bg-slate-800 text-blue-600 shadow-sm" : "text-slate-400 hover:text-slate-600"
                )}>{p.label}</button>
            ))}
          </div>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0 rounded-xl" onClick={() => window.location.reload()}><RefreshCw size={14} /></Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <KpiCard icon={<Send size={16} />} label="Enviados" value={totalSent} sub={data.last30Days + " nos últimos 30d"} color="emerald" />
        <KpiCard icon={<XCircle size={16} />} label="Falhas" value={totalFailed} sub={data.total > 0 ? Math.round(totalFailed / data.total * 100) + "% taxa" : "0%"} color="rose" />
        <KpiCard icon={<Activity size={16} />} label="Sucesso" value={successRate + "%"} sub={avgPerDay + "/dia em média"} color="blue" />
        <KpiCard icon={<TrendingUp size={16} />} label="Variação semanal" value={(weekChange >= 0 ? "+" : "") + weekChange + "%"} sub={lastWeekTotal + " esta / " + prevWeekTotal + " anterior"} color={weekChange >= 0 ? "emerald" : "rose"} />
        <KpiCard icon={<Target size={16} />} label="Dia + movimentado" value={busiestDay ? busiestDay.sent : 0} sub={busiestDay ? busiestDay.date?.slice(5) || "" : "-"} color="violet" />
        <KpiCard icon={<Clock size={16} />} label="Total Geral" value={data.total} sub={data.byType?.length + " categorias"} color="slate" />
      </div>

      {/* Costs Row */}
      <Card className="border-none shadow-xl rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/40 dark:to-teal-950/40 ring-1 ring-emerald-100 dark:ring-emerald-900/30 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-200/20 dark:bg-emerald-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-7 w-7 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center"><Euro size={14} /></div>
            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400">Análise de Custos</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Custo Mensal (fixo)", value: "€" + (data.custos?.mensal?.toFixed(2) || "5.00"), sub: "Plano SMS", color: "text-slate-900 dark:text-white" },
              { label: "Custo por SMS", value: "€" + (data.custos?.porSms?.toFixed(2) || "0.20"), sub: "Com plano incluído", color: "text-slate-900 dark:text-white" },
              { label: "Custo s/ plano (0.20€/sms)", value: "€" + (data.custos?.custoSemPlano?.toFixed(2) || "0.00"), sub: data.custos?.smsNoMes + " SMS enviados", color: "text-rose-600 dark:text-rose-400" },
              { label: "Economia", value: "€" + (data.custos?.economia?.toFixed(2) || "0.00"), sub: "Poupança total", color: "text-emerald-600 dark:text-emerald-400", icon: <PiggyBank size={18} className="text-emerald-500" /> },
            ].map((c, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/60 backdrop-blur-sm ring-1 ring-white/50 dark:ring-white/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">{c.label}</p>
                <p className={cn("text-2xl font-black mt-1 flex items-center gap-1.5", c.color)}>{c.icon}{c.value}</p>
                <p className="text-[9px] text-slate-400 font-medium mt-0.5">{c.sub}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Category Bar */}
        <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 col-span-1">
          <CardHeader className="pb-0 px-6 pt-6">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <BarChart3 size={14} className="text-blue-600" /> Categorias
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeBar.length > 0 ? typeBar : [{ name: "Sem dados", value: 0 }]} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8", fontWeight: 700 }} width={100} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {typeBar.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              {typeBar.map((t: any) => (
                <div key={t.name} className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: t.color }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-slate-500 truncate">{t.name}</p>
                    <p className="text-xs font-black text-slate-900 dark:text-white">{t.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Trend Area */}
        <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 col-span-1 lg:col-span-2">
          <CardHeader className="pb-0 px-6 pt-6">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <TrendingUp size={14} className="text-blue-600" /> Tendência Diária <span className="text-[9px] text-slate-300 font-medium normal-case">(últimos 30 dias)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyRev.length > 0 ? dailyRev : [{ date: "Sem dados", total: 0, sent: 0, failed: 0 }]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sentGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/><stop offset="95%" stopColor="#22c55e" stopOpacity={0}/></linearGradient>
                    <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15}/><stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#94a3b8" }} tickFormatter={(v) => v?.slice(5) || ""} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.15)", fontSize: 12 }} />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={1} fill="url(#totalGrad)" strokeDasharray="4 4" dot={false} name="Total" />
                  <Area type="monotone" dataKey="sent" stroke="#22c55e" strokeWidth={2.5} fill="url(#sentGrad)" dot={{ r: 3, fill: "#22c55e", strokeWidth: 0 }} activeDot={{ r: 5, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }} name="Enviados" />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={1.5} dot={false} strokeDasharray="3 3" name="Falhas" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4 text-[10px] font-bold">
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Enviados: <span className="text-slate-900 dark:text-white">{dailyRev.slice(-7).reduce((a: number, d: any) => a + d.sent, 0)}</span></span>
                <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Falhas: <span className="text-slate-900 dark:text-white">{dailyRev.slice(-7).reduce((a: number, d: any) => a + d.failed, 0)}</span></span>
              </div>
              <Badge className={cn("text-[9px] font-bold uppercase border-none", weekChange >= 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-rose-50 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300")}>
                {weekChange >= 0 ? <ArrowUpRight size={12} className="inline" /> : <ArrowDownRight size={12} className="inline" />}
                {(weekChange >= 0 ? "+" : "") + weekChange + "% vs semana anterior"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Monthly bars */}
        {monthlyRev.length > 0 && (
          <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 col-span-1 lg:col-span-2">
            <CardHeader className="pb-0 px-6 pt-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <CalendarDays size={14} className="text-blue-600" /> Mensal
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRev} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#94a3b8" }} />
                    <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
                    <Bar dataKey="sent" name="Enviados" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#22c55e" />
                    <Bar dataKey="failed" name="Falhas" radius={[4, 4, 0, 0]} maxBarSize={40} fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Status Pie + Recent */}
        <div className="space-y-6 col-span-1">
          {statusPie.length > 0 && (
            <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
              <CardHeader className="pb-0 px-6 pt-6">
                <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                  <Smartphone size={14} className="text-blue-600" /> Distribuição
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={statusPie} cx="50%" cy="50%" outerRadius={70} innerRadius={40} paddingAngle={4} dataKey="value">
                        {statusPie.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
                      <Legend formatter={(v) => <span className="text-[10px] font-bold text-slate-600">{v}</span>} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
            <CardHeader className="pb-0 px-6 pt-6">
              <CardTitle className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Clock size={14} className="text-blue-600" /> Últimos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scroll">
                {(data.recent || []).length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Nenhum envio registado</p>
                ) : (data.recent || []).slice(0, 6).map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {log.status === "SENT" ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0" /> : <XCircle size={12} className="text-rose-500 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate">{log.phone}</p>
                        <p className="text-[8px] text-slate-400 truncate">{(log.message || "").slice(0, 30)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={cn("text-[8px] font-bold px-1.5 py-0.5 rounded-md uppercase",
                        TYPE_COLORS[log.type] ? "bg-opacity-20" : "bg-slate-100 text-slate-500")}
                        style={TYPE_COLORS[log.type] ? { backgroundColor: TYPE_COLORS[log.type] + "20", color: TYPE_COLORS[log.type] } : {}}>
                        {TYPE_LABELS[log.type] || "—"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon, label, value, sub, color }: { icon: React.ReactNode; label: string; value: string | number; sub: string; color: string }) {
  return (
    <Card className={cn("border-none shadow-lg rounded-2xl ring-1 ring-slate-100 dark:ring-white/5 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5",
      color === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/30" :
      color === "rose" ? "bg-rose-50 dark:bg-rose-950/30" :
      color === "blue" ? "bg-blue-50 dark:bg-blue-950/30" :
      color === "violet" ? "bg-violet-50 dark:bg-violet-950/30" :
      "bg-white dark:bg-slate-900"
    )}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className={cn("p-1.5 rounded-lg",
            color === "emerald" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
            color === "rose" ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
            color === "blue" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
            color === "violet" ? "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400" :
            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          )}>{icon}</span>
        </div>
        <p className={cn(
          color === "emerald" ? "text-emerald-900 dark:text-emerald-300" :
          color === "rose" ? "text-rose-900 dark:text-rose-300" :
          color === "blue" ? "text-blue-900 dark:text-blue-300" :
          color === "violet" ? "text-violet-900 dark:text-violet-300" :
          "text-slate-900 dark:text-white"
        )}>
          <span className="text-2xl font-black">{value}</span>
        </p>
        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-0.5 truncate">{label}</p>
        <p className="text-[8px] text-slate-400 mt-0.5 truncate">{sub}</p>
      </CardContent>
    </Card>
  );
}
