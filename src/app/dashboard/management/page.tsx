"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  TrendingUp, Users, Calendar, Euro, ArrowUpRight, 
  ArrowDownRight, PawPrint, Activity, PieChart, 
  BarChart3, RefreshCcw, Download, Receipt, 
  FileText, Briefcase, Wallet, Percent, 
  Scale, ClipboardCheck
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar,
  Cell, PieChart as RePieChart, Pie, Legend
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";

const COLORS = ["#3b82f6", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981"];

export default function ManagementDashboard() {
  const [activeTab, setActiveTab] = useState("overview");

  // BI Data
  const { data: biData, isLoading: isBiLoading, refetch: refetchBi } = useQuery({
    queryKey: ["management-bi"],
    queryFn: async () => {
      const res = await fetch("/api/management/bi");
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  // VAT Data
  const { data: vatData, isLoading: isVatLoading } = useQuery({
    queryKey: ["management-vat"],
    queryFn: async () => {
      const res = await fetch("/api/management/reports/vat");
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  if (isBiLoading) return <div className="p-8 space-y-6 animate-pulse min-h-screen">
    <div className="flex justify-between items-center">
      <div className="h-10 w-64 bg-slate-200 dark:bg-slate-800 rounded-lg" />
      <div className="h-10 w-48 bg-slate-200 dark:bg-slate-800 rounded-lg" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {[1,2,3,4].map(i => <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl" />)}
    </div>
    <div className="h-[500px] bg-slate-200 dark:bg-slate-800 rounded-2xl" />
  </div>;

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-bold text-[10px] uppercase tracking-widest px-4 py-1 mb-3 rounded-full">
            Executive Control Panel
          </Badge>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
            Relatórios e BI <Briefcase size={32} className="text-blue-500" />
          </h1>
          <p className="text-slate-500 font-medium tracking-tight mt-2 text-lg">
            Análise institucional de performance clínica e financeira.
          </p>
        </div>
        <div className="flex gap-4">
          <Button variant="outline" size="lg" className="rounded-xl h-10 px-8 font-bold text-[11px] uppercase tracking-widest gap-2 border-slate-200 dark:border-white/10 dark:bg-white/5 hover:bg-slate-50 transition-all" onClick={() => refetchBi()}>
            <RefreshCcw size={16} /> Atualizar BI
          </Button>
          <Button size="lg" className="rounded-xl h-10 px-8 font-bold text-[11px] uppercase tracking-widest gap-2 bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
            <Download size={16} /> Exportar Contabilidade
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200 dark:border-white/10 h-12 w-full max-w-2xl">
          <TabsTrigger value="overview" className="rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white transition-all flex-1 h-full">
            <Activity className="mr-2" size={14} /> Visão Geral
          </TabsTrigger>
          <TabsTrigger value="finance" className="rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white transition-all flex-1 h-full">
            <Euro className="mr-2" size={14} /> Financeiro & IVA
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-xl font-bold text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 dark:data-[state=active]:text-white transition-all flex-1 h-full">
            <TrendingUp className="mr-2" size={14} /> Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 focus-visible:outline-none outline-none">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Faturação Total", value: `${biData?.monthlyBilling[biData.monthlyBilling.length-1].total}€`, trend: "+12.5%", sub: "Mês Corrente", icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-500/10" },
              { label: "Pacientes Registados", value: biData?.metrics.totalPatients, trend: "+8", sub: "Base de Dados Total", icon: PawPrint, color: "text-blue-500", bg: "bg-blue-500/10" },
              { label: "Consultas Efetuadas", value: biData?.metrics.appointmentsThisMonth, trend: "98%", sub: "Este Mês", icon: ClipboardCheck, color: "text-amber-500", bg: "bg-amber-500/10" },
              { label: "Rácio Conversão", value: `${biData?.metrics.conversionRate}%`, trend: "+2.1%", sub: "Consultas vs Agendamentos", icon: Scale, color: "text-purple-500", bg: "bg-purple-500/10" },
            ].map((kpi, i) => (
              <Card key={i} className="border-none rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-white/5 overflow-hidden group hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500">
                <CardContent className="p-8">
                   <div className="flex justify-between items-start mb-6">
                      <div className={`p-5 rounded-2xl ${kpi.bg} ${kpi.color} shadow-sm group-hover:scale-110 transition-transform duration-500`}>
                         <kpi.icon size={24} strokeWidth={2.5} />
                      </div>
                      <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                         <ArrowUpRight size={12} /> {kpi.trend}
                      </div>
                   </div>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">{kpi.label}</p>
                   <h3 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">{kpi.value}</h3>
                   <p className="text-[11px] text-slate-500 font-bold mt-3 uppercase tracking-widest">{kpi.sub}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <Card className="lg:col-span-8 border-none rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-white/5 p-10">
               <CardHeader className="px-0 pt-0 mb-10">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-4">
                        <BarChart3 className="text-blue-500" size={28} /> Crescimento Mensal
                      </CardTitle>
                      <CardDescription className="text-slate-500 font-medium text-base mt-1">Faturação acumulada nos últimos 6 meses</CardDescription>
                    </div>
                  </div>
               </CardHeader>
               <div className="h-[400px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <AreaChart data={biData?.monthlyBilling}>
                     <defs>
                       <linearGradient id="colorBilling" x1="0" y1="0" x2="0" y2="1">
                         <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                         <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                       </linearGradient>
                     </defs>
                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f011" />
                     <XAxis 
                       dataKey="month" 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fill: '#64748b', fontSize: 11, fontWeight: 900}}
                       dy={15}
                     />
                     <YAxis 
                       axisLine={false} 
                       tickLine={false} 
                       tick={{fill: '#64748b', fontSize: 11, fontWeight: 900}}
                       tickFormatter={(val) => `${val}€`}
                     />
                     <Tooltip 
                       contentStyle={{backgroundColor: '#0f172a', border: 'none', borderRadius: '24px', padding: '20px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)'}}
                       itemStyle={{color: '#3b82f6', fontWeight: 900, textTransform: 'uppercase', fontSize: '12px'}}
                       cursor={{stroke: '#3b82f6', strokeWidth: 2, strokeDasharray: '5 5'}}
                     />
                     <Area 
                       type="monotone" 
                       dataKey="total" 
                       stroke="#3b82f6" 
                       strokeWidth={6} 
                       fillOpacity={1} 
                       fill="url(#colorBilling)" 
                       animationDuration={2000}
                     />
                   </AreaChart>
                 </ResponsiveContainer>
               </div>
            </Card>

            <Card className="lg:col-span-4 border-none rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-white/5 p-10">
               <CardHeader className="px-0 pt-0 mb-10">
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-4">
                    <PieChart className="text-purple-500" size={28} /> Mix de Receita
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium text-base mt-1">Serviços com maior impacto financeiro</CardDescription>
               </CardHeader>
               <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                   <RePieChart>
                     <Pie
                       data={biData?.topCategories}
                       innerRadius={80}
                       outerRadius={120}
                       paddingAngle={10}
                       dataKey="total"
                       animationDuration={1500}
                     >
                       {biData?.topCategories.map((entry: any, index: number) => (
                         <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                       ))}
                     </Pie>
                     <Tooltip />
                   </RePieChart>
                 </ResponsiveContainer>
               </div>
               <div className="space-y-4 mt-8">
                 {biData?.topCategories.map((cat: any, i: number) => (
                   <div key={cat.name} className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 group hover:border-blue-500/30 transition-all">
                     <div className="flex items-center gap-3">
                       <div className="w-3 h-3 rounded-full" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                       <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest truncate max-w-[150px]">{cat.name}</span>
                     </div>
                     <span className="text-sm font-bold text-slate-900 dark:text-white">{cat.total}€</span>
                   </div>
                 ))}
               </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="space-y-6 focus-visible:outline-none outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <Card className="lg:col-span-2 border-none rounded-2xl bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-200 dark:ring-white/5 p-10">
              <CardHeader className="px-0 pt-0 mb-8 flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-4">
                    <Receipt className="text-emerald-500" size={28} /> Mapa de IVA Mensal
                  </CardTitle>
                  <CardDescription className="text-slate-500 font-medium text-base mt-1">Resumo para contabilidade - Período: {vatData?.month}</CardDescription>
                </div>
                <Button variant="outline" className="rounded-2xl font-bold text-[10px] uppercase tracking-widest gap-2">
                  <Download size={14} /> Baixar PDF
                </Button>
              </CardHeader>
              <div className="rounded-2xl border border-slate-100 dark:border-white/5 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 dark:bg-white/5">
                    <TableRow className="border-none hover:bg-transparent">
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest py-6">Taxa de IVA</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Base Tributável</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Total IVA</TableHead>
                      <TableHead className="font-bold text-[10px] uppercase tracking-widest text-right">Total Bruto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow className="border-slate-100 dark:border-white/5">
                      <TableCell className="font-bold text-sm">IVA REDUZIDO (6%)</TableCell>
                      <TableCell className="text-right font-bold">{vatData?.base6.toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-bold text-blue-500">{vatData?.totalVat6.toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-bold">{(vatData?.base6 + vatData?.totalVat6).toFixed(2)}€</TableCell>
                    </TableRow>
                    <TableRow className="border-slate-100 dark:border-white/5">
                      <TableCell className="font-bold text-sm">IVA INTERMÉDIO (13%)</TableCell>
                      <TableCell className="text-right font-bold">{vatData?.base13.toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-bold text-blue-500">{vatData?.totalVat13.toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-bold">{(vatData?.base13 + vatData?.totalVat13).toFixed(2)}€</TableCell>
                    </TableRow>
                    <TableRow className="border-slate-100 dark:border-white/5">
                      <TableCell className="font-bold text-sm">IVA NORMAL (23%)</TableCell>
                      <TableCell className="text-right font-bold">{vatData?.base23.toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-bold text-blue-500">{vatData?.totalVat23.toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-bold">{(vatData?.base23 + vatData?.totalVat23).toFixed(2)}€</TableCell>
                    </TableRow>
                    <TableRow className="bg-slate-900 dark:bg-blue-600 text-white hover:bg-slate-900 dark:hover:bg-blue-600 transition-none">
                      <TableCell className="font-bold text-xs uppercase tracking-wider py-6">TOTAL ACUMULADO</TableCell>
                      <TableCell className="text-right font-bold text-lg">{(vatData?.base6 + vatData?.base13 + vatData?.base23).toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-bold text-lg">{(vatData?.totalVat6 + vatData?.totalVat13 + vatData?.totalVat23).toFixed(2)}€</TableCell>
                      <TableCell className="text-right font-bold text-lg">{vatData?.totalGross.toFixed(2)}€</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </Card>

            <Card className="border-none rounded-2xl bg-white dark:bg-slate-900 p-10 text-slate-900 dark:text-white shadow-sm ring-1 ring-slate-100 dark:ring-white/5 relative overflow-hidden group">
               <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-600/5 rounded-full blur-3xl group-hover:bg-blue-600/10 transition-all duration-1000" />
               <div className="relative z-10">
                  <CardHeader className="border-b flex flex-row items-center gap-4 mb-6 pb-6 px-0">
                    <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                     <FileText size={24} />
                    </div>
                    <CardTitle className="text-xl font-bold tracking-wider">Fluxo de Caixa</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6 p-0">
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Entradas (Este Mês)</p>
                       <h4 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">+{vatData?.totalGross.toFixed(0)}€</h4>
                    </div>
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10 opacity-50">
                       <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Saídas Estimadas</p>
                       <h4 className="text-3xl font-bold text-rose-500 dark:text-rose-400">-0.00€</h4>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter mt-2">Módulo de despesas não configurado</p>
                    </div>
                  </CardContent>
                  <Button className="w-full mt-6 h-10 rounded-2xl bg-blue-600 text-white font-bold uppercase tracking-widest text-[11px] hover:bg-blue-700 transition-all group">
                   Gerar Fecho de Mês <ArrowRight size={18} className="ml-2 group-hover:translate-x-1 transition-transform" />
                 </Button>
               </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ArrowRight({ size, className }: { size: number, className: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
    </svg>
  );
}
