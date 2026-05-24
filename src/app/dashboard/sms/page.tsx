"use client";

import { useState, useEffect } from "react";
import { Send, CheckCircle2, XCircle, BarChart3, TrendingUp, Clock, Smartphone, CalendarDays, Euro, PiggyBank } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const STATUS_COLORS = { SENT: "#22c55e", FAILED: "#ef4444", PENDING: "#f59e0b" };
const TYPE_COLORS: Record<string, string> = { MANUAL: "#3b82f6", REMINDER_24H: "#8b5cf6", VACCINE_ALERT: "#06b6d4", MARKETING: "#f97316" };
const TYPE_LABELS: Record<string, string> = { MANUAL: "Manual", REMINDER_24H: "Lembrete 24h", VACCINE_ALERT: "Vacinação", MARKETING: "Marketing" };

export default function SmsDashboard() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/settings/sms-stats")
      .then(r => r.ok ? r.json() : null)
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full" /></div>;
  if (!data) return <p className="text-center py-20 text-slate-400 text-sm">Sem dados disponíveis</p>;

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

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-3">
            <BarChart3 size={24} className="text-blue-600" /> Dashboard SMS
          </p>
          <p className="text-xs text-slate-500 font-bold mt-1">Métricas e estatísticas de envio</p>
        </div>
        <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[9px] font-bold uppercase border-none">{data.last30Days} nos últimos 30 dias</Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={<Send size={18} />} label="Total Enviados" value={data.totalSent} color="emerald" />
        <StatCard icon={<XCircle size={18} />} label="Falhas" value={data.totalFailed} color="rose" />
        <StatCard icon={<TrendingUp size={18} />} label="Taxa de Sucesso" value={`${data.successRate}%`} color="blue" />
        <StatCard icon={<Clock size={18} />} label="Total Geral" value={data.total} color="slate" />
      </div>

      {/* Custos */}
      <Card className="border-none shadow-xl rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30 ring-1 ring-emerald-100 dark:ring-emerald-900/30 overflow-hidden">
        <CardContent className="p-6">
          <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2"><Euro size={14} /> Análise de Custos SMS</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Custo Mensal</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">€{data.custos?.mensal?.toFixed(2) || "5.00"}</p>
              <p className="text-[9px] text-slate-400 font-medium mt-1">Plano SMS</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Custo p/ SMS</p>
              <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">€{data.custos?.porSms?.toFixed(2) || "0.20"}</p>
              <p className="text-[9px] text-slate-400 font-medium mt-1">Sem plano seria</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Custo se fosse c/ preço normal</p>
              <p className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">€{data.custos?.custoSemPlano?.toFixed(2) || "0.00"}</p>
              <p className="text-[9px] text-slate-400 font-medium mt-1">{data.custos?.smsNoMes || 0} SMS enviados</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/70 dark:bg-slate-900/50 backdrop-blur">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Economia</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1">
                <PiggyBank size={20} /> €{data.custos?.economia?.toFixed(2) || "0.00"}
              </p>
              <p className="text-[9px] text-emerald-500 font-medium mt-1">Poupança total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
          <CardHeader className="pb-0"><CardTitle className="text-sm font-bold flex items-center gap-2"><BarChart3 size={16} className="text-blue-600" /> Por Categoria</CardTitle></CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={typeBar.length > 0 ? typeBar : [{ name: "Sem dados", value: 0 }]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
                    {typeBar.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
          <CardHeader className="pb-0"><CardTitle className="text-sm font-bold flex items-center gap-2"><TrendingUp size={16} className="text-blue-600" /> Tendência Diária (30 dias)</CardTitle></CardHeader>
          <CardContent className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyRev.length > 0 ? dailyRev : [{ date: "Sem dados", total: 0, sent: 0 }]} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: "#94a3b8" }} tickFormatter={(v) => v?.slice(5) || ""} />
                  <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 20px rgba(0,0,0,0.1)", fontSize: 12 }} />
                  <Line type="monotone" dataKey="sent" stroke="#22c55e" strokeWidth={2} dot={false} name="Enviados" />
                  <Line type="monotone" dataKey="failed" stroke="#ef4444" strokeWidth={2} dot={false} name="Falhas" />
                  <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Total" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {statusPie.length > 0 && (
          <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
            <CardHeader className="pb-0"><CardTitle className="text-sm font-bold flex items-center gap-2"><Smartphone size={16} className="text-blue-600" /> Distribuição de Estado</CardTitle></CardHeader>
            <CardContent className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={statusPie} cx="50%" cy="50%" outerRadius={80} innerRadius={45} paddingAngle={4} dataKey="value">
                      {statusPie.map((e: any, i: number) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", fontSize: 12 }} />
                    <Legend formatter={(v) => <span className="text-xs font-bold text-slate-600">{v}</span>} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
          <CardHeader className="pb-0"><CardTitle className="text-sm font-bold flex items-center gap-2"><Clock size={16} className="text-blue-600" /> Últimos Envios</CardTitle></CardHeader>
          <CardContent className="p-6">
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {(data.recent || []).length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-8">Nenhum envio registado</p>
              ) : (data.recent || []).map((log: any) => (
                <div key={log.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 min-w-0">
                    {log.status === "SENT" ? <CheckCircle2 size={14} className="text-emerald-500 shrink-0" /> : <XCircle size={14} className="text-rose-500 shrink-0" />}
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 truncate">{log.phone}</p>
                      <p className="text-[9px] text-slate-400 font-medium truncate">{(log.message || "").slice(0, 40)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge className={cn("text-[8px] font-bold uppercase border-none", TYPE_COLORS[log.type] ? "" : "bg-slate-100 text-slate-600")} style={{ backgroundColor: TYPE_COLORS[log.type] + "20", color: TYPE_COLORS[log.type] }}>
                      {TYPE_LABELS[log.type] || log.type}
                    </Badge>
                    <span className="text-[9px] text-slate-400 font-mono">{new Date(log.createdAt).toLocaleDateString("pt-PT")}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string | number; color: string }) {
  return (
    <Card className={cn("border-none shadow-xl rounded-2xl ring-1 ring-slate-100 dark:ring-white/5",
      color === "emerald" ? "bg-emerald-50 dark:bg-emerald-950/30" :
      color === "rose" ? "bg-rose-50 dark:bg-rose-950/30" :
      color === "blue" ? "bg-blue-50 dark:bg-blue-950/30" :
      "bg-white dark:bg-slate-900"
    )}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-2">
          <span className={cn("p-2 rounded-xl",
            color === "emerald" ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" :
            color === "rose" ? "bg-rose-100 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400" :
            color === "blue" ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400" :
            "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
          )}>{icon}</span>
          <span className={cn("text-[9px] font-bold uppercase tracking-widest",
            color === "emerald" ? "text-emerald-600 dark:text-emerald-400" :
            color === "rose" ? "text-rose-600 dark:text-rose-400" :
            color === "blue" ? "text-blue-600 dark:text-blue-400" :
            "text-slate-400"
          )}>{label}</span>
        </div>
        <p className={cn("text-3xl font-black",
          color === "emerald" ? "text-emerald-700 dark:text-emerald-300" :
          color === "rose" ? "text-rose-700 dark:text-rose-300" :
          color === "blue" ? "text-blue-700 dark:text-blue-300" :
          "text-slate-900 dark:text-white"
        )}>{value}</p>
      </CardContent>
    </Card>
  );
}
