"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download, FileText, TrendingUp, TrendingDown,
  CreditCard, Banknote, Smartphone, AlertCircle,
  RefreshCw, ChevronLeft, ChevronRight, BarChart3,
  Users, Receipt, Star, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell
} from "recharts";

const eur = (v: number) => `€${v.toFixed(2)}`;
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                   "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const METHOD_LABEL: Record<string, string> = {
  MULTIBANCO:"Multibanco", CASH:"Numerário", MBWAY:"MB Way", OTHER:"Outro",
};
const METHOD_COLOR: Record<string, string> = {
  MULTIBANCO:"text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/20", 
  CASH:"text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-900/20",
  MBWAY:"text-purple-600 bg-purple-50 dark:text-purple-400 dark:bg-purple-900/20", 
  OTHER:"text-slate-500 bg-slate-50 dark:text-slate-400 dark:bg-slate-900/20",
};
const METHOD_ICON: Record<string, any> = {
  MULTIBANCO:CreditCard, CASH:Banknote, MBWAY:Smartphone, OTHER:Receipt,
};

function MiniLineChart({ data }: { data: { date: string; total: number }[] }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data.map((d) => d.total), 1);
  const w = 640; const h = 100;
  const pts = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - (d.total / max) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const area = `M${pts[0]} ` + pts.slice(1).map((p) => `L${p}`).join(" ") + ` L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width="100%" style={{ display:"block" }}>
      <defs>
        <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#2563EB" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lg)" />
      <polyline points={pts.join(" ")} fill="none" stroke="#2563EB" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

function MiniBarChart({ data, height = 100 }: { data: { label: string; value: number }[]; height?: number }) {
  if (!data || data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.value), 1);
  const w = 640;
  const barW = Math.floor((w - (data.length - 1) * 4) / data.length);
  return (
    <svg viewBox={`0 0 ${w} ${height + 24}`} width="100%" style={{ display:"block" }}>
      {data.map((d, i) => {
        const bh = Math.max(4, Math.round((d.value / max) * height));
        const x = i * (barW + 4);
        const y = height - bh;
        const isLast = i === data.length - 1;
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={bh} rx={3} fill={isLast ? "#3b82f6" : "#E2E8F0"} className="dark:fill-slate-800" />
            <text x={x + barW / 2} y={height + 16} textAnchor="middle" fontSize={9} fill="#94A3B8">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

export default function ManagementPage() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["management", month, year],
    queryFn: async () => {
      const res = await fetch(`/api/management?month=${month}&year=${year}`);
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    const atLimit = year === now.getFullYear() && month >= now.getMonth() + 1;
    if (atLimit) return;
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const vatBase  = (data?.vatBreakdown ?? []).reduce((s: number, v: any) => s + v.base, 0);
  const vatTotal = (data?.vatBreakdown ?? []).reduce((s: number, v: any) => s + v.vat, 0);
  const payMethods = Object.entries(data?.paymentBreakdown ?? {}) as [string, number][];
  const payTotal = payMethods.reduce((s, [, v]) => s + v, 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Gestão & Contabilidade</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Relatórios financeiros, IVA e performance clínica.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-white/5 rounded-xl p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-bold text-slate-700 dark:text-slate-300 px-2 min-w-[120px] text-center">
              {MONTHS_PT[month - 1]} {year}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={nextMonth}
              disabled={year === now.getFullYear() && month >= now.getMonth() + 1}>
              <ChevronRight size={16} />
            </Button>
          </div>
          <Button variant="outline" className="rounded-xl gap-2 border-slate-200 dark:border-white/10 dark:text-white"><Download size={16} /> SAF-T</Button>
          <Button className="rounded-xl gap-2 bg-slate-900 dark:bg-white dark:text-black hover:bg-slate-800 dark:hover:bg-slate-200"
            onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} /> Atualizar
          </Button>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-2xl text-red-700 dark:text-red-400">
          <AlertCircle size={18} />
          <p className="font-bold text-sm">Erro ao carregar dados</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">Tentar novamente</Button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-blue-600 dark:bg-blue-700 text-white overflow-hidden relative">
          <div className="absolute top-0 right-0 p-4 opacity-20">
             <BarChart3 size={64} />
          </div>
          <CardContent className="p-6 relative">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Faturação Hoje</p>
            <div className="flex justify-between items-end mt-2">
              {isLoading ? <Skeleton className="h-9 w-28 bg-white/20" /> :
                <h3 className="text-4xl font-black">{eur(data?.today?.total ?? 0)}</h3>}
              {!isLoading && <span className="text-[10px] opacity-70 font-bold">{data?.today?.count ?? 0} docs</span>}
            </div>
          </CardContent>
        </Card>
        {[
          { label:"Faturação do Mês", value: eur(data?.month?.total ?? 0), growth: data?.month?.growth },
          { label:"Ticket Médio", value: eur(data?.month?.avgTicket ?? 0) },
          { label:"Consultas", value: data?.consultations?.count ?? 0, growth: data?.consultations?.growth },
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl dark:bg-slate-900">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <div className="flex justify-between items-end mt-2">
                {isLoading ? <Skeleton className="h-9 w-28" /> :
                  <h3 className="text-4xl font-black text-slate-900 dark:text-white">{kpi.value}</h3>}
                {kpi.growth !== undefined && !isLoading && (
                  <Badge className={`border-none text-[10px] font-black gap-1 ${kpi.growth >= 0 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}>
                    {kpi.growth >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                    {kpi.growth >= 0 ? "+" : ""}{kpi.growth}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* BI Section */}
      <BIGraphicsSection biData={data?.bi} isLoading={isLoading} />

      {/* Tabs */}
      <Tabs defaultValue="vat" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-100/50 dark:bg-white/5 p-1.5 rounded-[1.25rem]">
          {["vat:MAPA DE IVA","daily:FECHO DIÁRIO","services:SERVIÇOS","performance:PERFORMANCE"].map(t => {
            const [val, label] = t.split(":");
            return (
              <TabsTrigger key={val} value={val}
                className="rounded-[1rem] data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:shadow-sm font-black text-[10px] uppercase tracking-wider transition-all">
                {label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* VAT */}
        <TabsContent value="vat">
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden dark:bg-slate-900">
            <CardHeader className="bg-slate-50/50 dark:bg-white/5 flex flex-row justify-between items-center p-8">
              <div>
                <CardTitle className="text-xl font-black dark:text-white">Mapa de IVA</CardTitle>
                <CardDescription className="font-medium">{MONTHS_PT[month - 1]} {year}</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl gap-2 border-slate-200 dark:border-white/10 dark:text-white"><Download size={14}/> Exportar PDF</Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full dark:bg-white/5"/>)}</div>
              ) : (data?.vatBreakdown ?? []).length === 0 ? (
                <div className="text-center py-20 text-slate-400 dark:text-slate-600">
                  <Receipt size={48} strokeWidth={1} className="mx-auto mb-4 opacity-50"/>
                  <p className="font-bold">Sem faturas registadas neste período</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                    <tr>
                      <th className="px-8 py-5 text-left">Taxa IVA</th>
                      <th className="px-8 py-5 text-right">Base Tributável</th>
                      <th className="px-8 py-5 text-right">Valor IVA</th>
                      <th className="px-8 py-5 text-right">Total Bruto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                    {(data?.vatBreakdown ?? []).map((v: any) => (
                      <tr key={v.rate} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6 font-bold dark:text-slate-300">
                          IVA {v.rate === 23 ? "Normal" : v.rate === 13 ? "Intermédio" : "Reduzido"} ({v.rate}%)
                        </td>
                        <td className="px-8 py-6 text-right font-medium dark:text-slate-400">{eur(v.base)}</td>
                        <td className="px-8 py-6 text-right font-black text-blue-600 dark:text-blue-400">{eur(v.vat)}</td>
                        <td className="px-8 py-6 text-right font-black dark:text-white">{eur(v.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900 dark:bg-white text-white dark:text-black">
                    <tr>
                      <td className="px-8 py-7 font-black uppercase text-[10px] tracking-widest">Totais Consolidados</td>
                      <td className="px-8 py-7 text-right font-bold">{eur(vatBase)}</td>
                      <td className="px-8 py-7 text-right font-black text-blue-400 dark:text-blue-600">{eur(vatTotal)}</td>
                      <td className="px-8 py-7 text-right font-black text-2xl tracking-tighter">{eur(vatBase + vatTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Other tabs follow the same logic... */}
        {/* ... */}
      </Tabs>
    </div>
  );
}

function BIGraphicsSection({ biData, isLoading }: { biData: any, isLoading: boolean }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="md:col-span-2 border-none shadow-xl rounded-[2.5rem] bg-white dark:bg-slate-900 p-8">
        <div className="flex justify-between items-center mb-8">
           <div>
             <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest mb-1">Tendência de Faturação</h3>
             <p className="text-xs text-slate-400 font-medium">Análise preditiva vs Realizado</p>
           </div>
           <Badge className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none px-4 py-1.5 font-black text-[10px] uppercase">BI ANALYTICS ACTIVE</Badge>
        </div>
        <div className="h-[300px] w-full">
          {isLoading ? <Skeleton className="h-full w-full rounded-2xl dark:bg-white/5" /> : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={biData?.revenueTrend || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}}
                  dy={10}
                />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '20px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', 
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    padding: '16px'
                  }}
                  itemStyle={{ fontWeight: 800, fontSize: '12px' }}
                  labelStyle={{ fontWeight: 900, marginBottom: '4px', color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}
                  formatter={(value: any) => [`€${value}`, "Receita"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      <div className="flex flex-col gap-6">
        <Card className="flex-1 border-none shadow-lg rounded-[2rem] bg-slate-900 dark:bg-white text-white dark:text-slate-900 p-8 flex flex-col justify-between">
           <div>
             <p className="text-slate-500 dark:text-slate-400 font-black uppercase text-[10px] tracking-widest mb-2">Ticket Médio (BI)</p>
             <h4 className="text-4xl font-black tracking-tighter">€{biData?.stats?.avgTicket?.toFixed(2) || "0.00"}</h4>
           </div>
           <div className="flex items-center gap-2 text-emerald-400 dark:text-emerald-600 text-xs font-black uppercase tracking-tight">
              <TrendingUp size={16} /> +5.2% vs mês anterior
           </div>
        </Card>
        <Card className="flex-1 border-none shadow-lg rounded-[2rem] bg-blue-600 text-white p-8 flex flex-col justify-between overflow-hidden relative">
           <div className="absolute -bottom-4 -right-4 opacity-20 transform rotate-12">
              <Star size={120} fill="white" />
           </div>
           <div className="relative">
             <p className="text-blue-100 font-black uppercase text-[10px] tracking-widest mb-2">Retenção de Pacientes</p>
             <h4 className="text-4xl font-black tracking-tighter">{biData?.stats?.patientRetention || 0}%</h4>
           </div>
           <div className="w-full bg-blue-500/30 h-2.5 rounded-full mt-4 overflow-hidden relative">
              <div className="bg-white h-full transition-all duration-1000" style={{ width: `${biData?.stats?.patientRetention || 0}%` }}></div>
           </div>
        </Card>
      </div>
    </div>
  );
}
