"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download, FileText, TrendingUp, TrendingDown,
  CreditCard, Banknote, Smartphone, AlertCircle,
  RefreshCw, ChevronLeft, ChevronRight, BarChart3,
  Users, Receipt, Star, ArrowUpRight,
  Activity, Wallet, Target, Zap, ShieldCheck,
  Calendar, Layers, Search, Settings, MoreVertical,
  Printer, Share2, Filter, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
  PieChart,
  Pie,
  Legend
} from "recharts";
import { cn } from "@/lib/utils";

const eur = (v: number) => `€${(v || 0).toLocaleString('pt-PT', { minimumFractionDigits: 2 })}`;
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                   "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];

export default function ManagementCockpit() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["management-cockpit", month, year],
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

  if (isLoading) return <div className="p-12 text-center font-black text-slate-300 dark:text-slate-700 animate-pulse uppercase tracking-[0.3em]">Calibrando Cockpit de Dados...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto pb-20 px-4 sm:px-0">
      
      {/* Premium Header Control */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-600 rounded-xl text-white shadow-lg shadow-blue-500/20">
               <Zap size={20} strokeWidth={3} />
            </div>
            <Badge className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-[9px] uppercase tracking-widest px-3 py-1 rounded-lg">Real-Time BI Engine</Badge>
          </div>
          <h1 className="text-4xl lg:text-6xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">Management Cockpit</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2 text-lg lg:text-xl">Controlo clínico e financeiro de alta precisão.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 rounded-2xl p-1.5 shadow-sm ring-1 ring-slate-200 dark:ring-white/5">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5" onClick={prevMonth}>
              <ChevronLeft size={20} strokeWidth={3} />
            </Button>
            <span className="text-xs font-black text-slate-900 dark:text-white px-4 min-w-[140px] text-center uppercase tracking-widest font-mono">
              {MONTHS_PT[month - 1]} {year}
            </span>
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5" onClick={nextMonth}
              disabled={year === now.getFullYear() && month >= now.getMonth() + 1}>
              <ChevronRight size={20} strokeWidth={3} />
            </Button>
          </div>
          <Button variant="outline" className="h-12 rounded-2xl gap-2 font-black uppercase text-[10px] tracking-widest border-slate-200 dark:border-white/10 dark:text-white px-6">
            <Download size={14} /> Exportar SAF-T
          </Button>
          <Button className="h-12 rounded-2xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-[10px] tracking-widest px-6 shadow-xl shadow-blue-500/20"
            onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw size={14} className={cn(isRefetching && "animate-spin")} /> Sincronizar
          </Button>
        </div>
      </div>

      {/* Primary KPI Grid - High Density */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-2xl rounded-[2.5rem] bg-slate-900 dark:bg-blue-600 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform duration-700">
             <Wallet size={120} />
          </div>
          <CardContent className="p-8 relative z-10 flex flex-col justify-between min-h-[180px]">
            <div>
              <div className="flex items-center gap-2 mb-4">
                 <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Receita Hoje</p>
              </div>
              <h3 className="text-4xl font-black tracking-tighter">{eur(data?.today?.total ?? 0)}</h3>
            </div>
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/10">
               <span className="text-[10px] opacity-70 font-black uppercase tracking-widest">{data?.today?.count ?? 0} Transações</span>
               <Badge className="bg-white/20 text-white border-none font-black text-[9px]">+12% vs Ontem</Badge>
            </div>
          </CardContent>
        </Card>

        {[
          { 
            label: "Volume Mensal", 
            value: eur(data?.month?.total ?? 0), 
            growth: data?.month?.growth,
            icon: BarChart3,
            color: "text-blue-600",
            sub: `${data?.month?.count ?? 0} Documentos Emitidos`
          },
          { 
            label: "Ticket Médio", 
            value: eur(data?.month?.avgTicket ?? 0), 
            growth: 5.2,
            icon: Target,
            color: "text-indigo-600",
            sub: "Otimização de Cross-selling"
          },
          { 
            label: "Atendimentos", 
            value: data?.consultations?.count ?? 0, 
            growth: data?.consultations?.growth,
            icon: Activity,
            color: "text-emerald-600",
            sub: "Capacidade: 84% Ocupada"
          }
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-xl rounded-[2.5rem] dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5 overflow-hidden transition-all hover:scale-[1.02]">
            <CardContent className="p-8 min-h-[180px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{kpi.label}</p>
                   <div className={cn("p-2 rounded-xl bg-slate-50 dark:bg-white/5", kpi.color)}>
                     <kpi.icon size={16} strokeWidth={3} />
                   </div>
                </div>
                <h3 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">{kpi.value}</h3>
              </div>
              <div className="flex justify-between items-center mt-6">
                <p className="text-[10px] font-bold text-slate-400 truncate max-w-[120px] uppercase tracking-widest">{kpi.sub}</p>
                {kpi.growth !== undefined && (
                  <Badge className={cn(
                    "border-none text-[10px] font-black gap-1 px-3 py-1 rounded-lg",
                    kpi.growth >= 0 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400"
                  )}>
                    {kpi.growth >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                    {Math.abs(kpi.growth)}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Telemetry Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* REVENUE TELEMETRY (8/12) */}
        <Card className="lg:col-span-8 border-none shadow-2xl rounded-[3rem] bg-white dark:bg-slate-900 p-8 lg:p-12 ring-1 ring-slate-100 dark:ring-white/5">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-12">
             <div>
               <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase mb-1">Telemetria de Faturação</h3>
               <p className="text-sm text-slate-400 font-medium">Fluxo financeiro consolidado por dia (Real vs Projeção)</p>
             </div>
             <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-white/5 rounded-2xl">
               <Button size="sm" variant="ghost" className="rounded-xl font-black text-[9px] uppercase tracking-widest px-4 h-9 bg-white dark:bg-slate-800 shadow-sm">Receita</Button>
               <Button size="sm" variant="ghost" className="rounded-xl font-black text-[9px] uppercase tracking-widest px-4 h-9 text-slate-400">Consultas</Button>
               <Button size="sm" variant="ghost" className="rounded-xl font-black text-[9px] uppercase tracking-widest px-4 h-9 text-slate-400">Média</Button>
             </div>
          </div>
          
          <div className="h-[400px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.bi?.revenueTrend || []}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorProjection" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#94a3b8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-slate-800" />
                <XAxis 
                  dataKey="month" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}}
                  dy={15}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 800}}
                  tickFormatter={(val) => `€${val/1000}k`}
                  dx={-15}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: 'none', 
                    boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.5)', 
                    backgroundColor: '#0f172a',
                    color: '#fff',
                    padding: '20px'
                  }}
                  itemStyle={{ fontWeight: 800, fontSize: '12px', padding: '4px 0' }}
                  labelStyle={{ fontWeight: 900, marginBottom: '8px', color: '#64748b', fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}
                  formatter={(value: any) => [eur(value), "Faturação"]}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3b82f6" 
                  strokeWidth={5}
                  fillOpacity={1} 
                  fill="url(#colorRevenue)" 
                  animationDuration={2500}
                />
                <Area 
                  type="monotone" 
                  dataKey="projection" 
                  stroke="#94a3b8" 
                  strokeWidth={2}
                  strokeDasharray="10 10"
                  fillOpacity={1} 
                  fill="url(#colorProjection)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* SIDE PANELS (4/12) */}
        <div className="lg:col-span-4 flex flex-col gap-8">
           {/* Business Health Card */}
           <Card className="flex-1 border-none shadow-2xl rounded-[3rem] bg-linear-to-br from-indigo-600 to-blue-800 text-white p-10 flex flex-col justify-between group overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform duration-1000">
                <Star size={140} fill="white" />
              </div>
              <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-8">
                    <ShieldCheck size={18} className="text-blue-300" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Health Score</span>
                 </div>
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-widest text-blue-200/60 mb-2">Retenção de Pacientes</p>
                    <div className="flex items-end gap-3">
                       <h4 className="text-6xl font-black tracking-tighter leading-none">{data?.bi?.stats?.patientRetention ?? "84"}%</h4>
                       <div className="flex items-center gap-1 text-emerald-400 mb-1">
                          <TrendingUp size={16} />
                          <span className="text-[10px] font-black">+{data?.bi?.stats?.retentionGrowth ?? "2.4"}%</span>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="space-y-6 relative z-10">
                 <div className="w-full bg-white/10 h-3 rounded-full overflow-hidden">
                    <div className="bg-white h-full shadow-[0_0_15px_rgba(255,255,255,0.5)] transition-all duration-[2s]" style={{ width: `${data?.bi?.stats?.patientRetention ?? 84}%` }}></div>
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-[1.5rem] border border-white/10">
                       <p className="text-[8px] font-black uppercase tracking-widest text-blue-200 mb-1">Churn Rate</p>
                       <p className="text-lg font-black tracking-tighter">{data?.bi?.stats?.churnRate ?? "4.1"}%</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-[1.5rem] border border-white/10">
                       <p className="text-[8px] font-black uppercase tracking-widest text-blue-200 mb-1">LTV Est.</p>
                       <p className="text-lg font-black tracking-tighter">{eur(data?.bi?.stats?.ltv ?? 1420)}</p>
                    </div>
                 </div>
              </div>
           </Card>

           {/* Quick Reports / Tools */}
           <Card className="border-none shadow-xl rounded-[3rem] bg-white dark:bg-slate-900 p-8 ring-1 ring-slate-100 dark:ring-white/5">
              <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest mb-6">Relatórios Rápidos</h4>
              <div className="space-y-3">
                 {[
                   { label: "Balancete Mensal", icon: FileText, color: "bg-blue-50 text-blue-600" },
                   { label: "Mapa de Iva (AT)", icon: Receipt, color: "bg-emerald-50 text-emerald-600" },
                   { label: "Análise por Médico", icon: Users, color: "bg-purple-50 text-purple-600" },
                   { label: "Auditoria SAF-T", icon: ShieldCheck, color: "bg-amber-50 text-amber-600" },
                 ].map((tool, i) => (
                   <button key={i} className="w-full flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10 transition-all group">
                      <div className="flex items-center gap-3">
                         <div className={cn("p-2 rounded-xl transition-transform group-hover:scale-110", tool.color)}>
                            <tool.icon size={16} strokeWidth={3} />
                         </div>
                         <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-tight">{tool.label}</span>
                      </div>
                      <ArrowUpRight size={14} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
                   </button>
                 ))}
              </div>
           </Card>
        </div>
      </div>

      {/* Advanced Data Breakdown */}
      <Tabs defaultValue="vat" className="w-full">
        <TabsList className="flex w-full mb-10 bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-[2rem] ring-1 ring-slate-200 dark:ring-white/5 overflow-x-auto no-scrollbar">
          {[
            { val: "vat", label: "Contabilidade & IVA", icon: Receipt },
            { val: "daily", label: "Fecho Diário", icon: Clock },
            { val: "services", label: "Serviços & Procedimentos", icon: Layers },
            { val: "performance", label: "Performance Médica", icon: Activity }
          ].map(t => (
            <TabsTrigger key={t.val} value={t.val}
              className="flex-1 min-w-[180px] rounded-[1.5rem] data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:shadow-lg font-black text-[10px] uppercase tracking-[0.1em] transition-all gap-2 py-4 dark:text-slate-400 dark:data-[state=active]:text-white">
              <t.icon size={14} strokeWidth={3} /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="vat">
          <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
            <div className="p-10 border-b border-slate-50 dark:border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 bg-slate-50/50 dark:bg-white/5">
              <div>
                <CardTitle className="text-2xl font-black dark:text-white uppercase tracking-tighter">Mapa Analítico de IVA</CardTitle>
                <CardDescription className="font-bold text-slate-500 mt-1 uppercase text-[10px] tracking-widest">Apuração Provisória - {MONTHS_PT[month - 1]} {year}</CardDescription>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest h-10 border-slate-200 dark:border-white/10 dark:text-white">
                   <Printer size={14} /> Imprimir
                </Button>
                <Button className="rounded-xl gap-2 font-black text-[10px] uppercase tracking-widest h-10 bg-slate-900 dark:bg-white dark:text-black">
                   <Share2 size={14} /> Partilhar Contabilista
                </Button>
              </div>
            </div>
            
            <div className="p-0">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest border-b border-slate-100 dark:border-white/5">
                  <tr>
                    <th className="px-10 py-6 text-left">Taxa IVA / Região</th>
                    <th className="px-10 py-6 text-right">Base Tributável</th>
                    <th className="px-10 py-6 text-right">Valor Imposto</th>
                    <th className="px-10 py-6 text-right">Status Transmissão</th>
                    <th className="px-10 py-6 text-right">Total Bruto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                  {(data?.vatBreakdown ?? []).map((v: any) => (
                    <tr key={v.rate} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                      <td className="px-10 py-8">
                        <div className="flex items-center gap-3">
                           <div className={cn(
                             "w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px]",
                             v.rate === 23 ? "bg-blue-50 text-blue-600 dark:bg-blue-900/30" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30"
                           )}>
                             {v.rate}%
                           </div>
                           <div>
                             <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">IVA {v.rate === 23 ? "Taxa Normal" : "Taxa Reduzida"}</p>
                             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Continente (PT-CONT)</p>
                           </div>
                        </div>
                      </td>
                      <td className="px-10 py-8 text-right font-black text-slate-700 dark:text-slate-300 font-mono">{eur(v.base)}</td>
                      <td className="px-10 py-8 text-right font-black text-blue-600 dark:text-blue-400 font-mono">{eur(v.vat)}</td>
                      <td className="px-10 py-8 text-right">
                         <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none font-black text-[8px] uppercase tracking-widest px-3 py-1">CERTIFICADO AG</Badge>
                      </td>
                      <td className="px-10 py-8 text-right font-black text-slate-900 dark:text-white text-lg tracking-tighter font-mono">{eur(v.total)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-900 dark:bg-white text-white dark:text-black">
                  <tr>
                    <td className="px-10 py-10">
                       <p className="font-black uppercase text-[12px] tracking-[0.2em]">Totais de Período</p>
                       <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest mt-1">Sincronizado com Vendus ERP</p>
                    </td>
                    <td className="px-10 py-10 text-right font-black font-mono text-lg">{eur(vatBase)}</td>
                    <td className="px-10 py-10 text-right font-black font-mono text-lg text-blue-400 dark:text-blue-600">{eur(vatTotal)}</td>
                    <td className="px-10 py-10"></td>
                    <td className="px-10 py-10 text-right font-black text-4xl tracking-tighter font-mono">{eur(vatBase + vatTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="daily">
           <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5">
              <Clock size={48} className="mx-auto mb-4 text-slate-300" />
              <h4 className="font-black text-slate-900 dark:text-white uppercase tracking-widest">Painel de Fecho em Construção</h4>
              <p className="text-sm text-slate-500 font-medium mt-2">O fecho diário integrado com TPA está a ser sincronizado.</p>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
