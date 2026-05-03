"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Download, FileText, TrendingUp, TrendingDown,
  CreditCard, Banknote, Smartphone, AlertCircle,
  RefreshCw, ChevronLeft, ChevronRight, BarChart3,
  Users, Receipt, Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const eur = (v: number) => `€${v.toFixed(2)}`;
const MONTHS_PT = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho",
                   "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const METHOD_LABEL: Record<string, string> = {
  MULTIBANCO:"Multibanco", CASH:"Numerário", MBWAY:"MB Way", OTHER:"Outro",
};
const METHOD_COLOR: Record<string, string> = {
  MULTIBANCO:"text-blue-600 bg-blue-50", CASH:"text-emerald-600 bg-emerald-50",
  MBWAY:"text-purple-600 bg-purple-50", OTHER:"text-slate-500 bg-slate-50",
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
            <rect x={x} y={y} width={barW} height={bh} rx={3} fill={isLast ? "#2563EB" : "#E2E8F0"} />
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
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão & Contabilidade</h1>
          <p className="text-slate-500 font-medium">Relatórios financeiros, IVA e performance clínica.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={prevMonth}>
              <ChevronLeft size={16} />
            </Button>
            <span className="text-sm font-bold text-slate-700 px-2 min-w-[120px] text-center">
              {MONTHS_PT[month - 1]} {year}
            </span>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={nextMonth}
              disabled={year === now.getFullYear() && month >= now.getMonth() + 1}>
              <ChevronRight size={16} />
            </Button>
          </div>
          <Button variant="outline" className="rounded-xl gap-2"><Download size={16} /> SAF-T</Button>
          <Button className="rounded-xl gap-2 bg-slate-900 hover:bg-slate-800 text-white"
            onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} /> Atualizar
          </Button>
        </div>
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700">
          <AlertCircle size={18} />
          <p className="font-bold text-sm">Erro ao carregar dados</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">Tentar novamente</Button>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-blue-600 text-white">
          <CardContent className="p-6">
            <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Faturação Hoje</p>
            <div className="flex justify-between items-end mt-2">
              {isLoading ? <Skeleton className="h-9 w-28 bg-white/20" /> :
                <h3 className="text-3xl font-black">{eur(data?.today?.total ?? 0)}</h3>}
              {!isLoading && <span className="text-[10px] opacity-70">{data?.today?.count ?? 0} docs</span>}
            </div>
          </CardContent>
        </Card>
        {[
          { label:"Faturação do Mês", value: eur(data?.month?.total ?? 0), growth: data?.month?.growth },
          { label:"Ticket Médio", value: eur(data?.month?.avgTicket ?? 0) },
          { label:"Consultas", value: data?.consultations?.count ?? 0, growth: data?.consultations?.growth },
        ].map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm rounded-3xl">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{kpi.label}</p>
              <div className="flex justify-between items-end mt-2">
                {isLoading ? <Skeleton className="h-9 w-28" /> :
                  <h3 className="text-3xl font-black text-slate-900">{kpi.value}</h3>}
                {kpi.growth !== undefined && !isLoading && (
                  <Badge className={`border-none text-[10px] gap-1 ${kpi.growth >= 0 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                    {kpi.growth >= 0 ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
                    {kpi.growth >= 0 ? "+" : ""}{kpi.growth}%
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-slate-700">Receita Diária (30 dias)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-28 w-full" /> : <MiniLineChart data={data?.dailyRevenue ?? []} />}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-black text-slate-700">Faturação Mensal (6 meses)</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? <Skeleton className="h-28 w-full" /> : (
              <MiniBarChart data={(data?.monthlyRevenue ?? []).map((m: any) => ({ label: m.month, value: m.total }))} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="vat" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-8 bg-slate-100/50 p-1 rounded-2xl">
          {["vat:MAPA DE IVA","daily:FECHO DIÁRIO","services:SERVIÇOS","performance:PERFORMANCE"].map(t => {
            const [val, label] = t.split(":");
            return (
              <TabsTrigger key={val} value={val}
                className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold text-xs">
                {label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {/* VAT */}
        <TabsContent value="vat">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50 flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg font-black">Mapa de IVA</CardTitle>
                <CardDescription>{MONTHS_PT[month - 1]} {year}</CardDescription>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl gap-2"><Download size={14}/> Exportar</Button>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-12 w-full"/>)}</div>
              ) : (data?.vatBreakdown ?? []).length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <Receipt size={32} strokeWidth={1.5} className="mx-auto mb-3"/>
                  <p className="font-bold">Sem faturas neste período</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-4 text-left">Taxa IVA</th>
                      <th className="px-8 py-4 text-right">Base Tributável</th>
                      <th className="px-8 py-4 text-right">Valor IVA</th>
                      <th className="px-8 py-4 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(data?.vatBreakdown ?? []).map((v: any) => (
                      <tr key={v.rate} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-8 py-6 font-bold">
                          IVA {v.rate === 23 ? "Normal" : v.rate === 13 ? "Intermédio" : "Reduzido"} ({v.rate}%)
                        </td>
                        <td className="px-8 py-6 text-right font-medium">{eur(v.base)}</td>
                        <td className="px-8 py-6 text-right font-black text-blue-600">{eur(v.vat)}</td>
                        <td className="px-8 py-6 text-right font-bold">{eur(v.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-slate-900 text-white">
                    <tr>
                      <td className="px-8 py-6 font-black uppercase text-[10px] tracking-widest">Totais</td>
                      <td className="px-8 py-6 text-right font-bold">{eur(vatBase)}</td>
                      <td className="px-8 py-6 text-right font-black text-blue-400">{eur(vatTotal)}</td>
                      <td className="px-8 py-6 text-right font-black text-xl">{eur(vatBase + vatTotal)}</td>
                    </tr>
                  </tfoot>
                </table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Daily close */}
        <TabsContent value="daily">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {isLoading ? [1,2,3].map(i => <Skeleton key={i} className="h-36 rounded-3xl"/>) :
               payMethods.length === 0 ? (
                <div className="col-span-3 text-center py-20 text-slate-400">
                  <Banknote size={32} strokeWidth={1.5} className="mx-auto mb-3"/>
                  <p className="font-bold">Sem movimentos hoje</p>
                </div>
              ) : payMethods.map(([method, total]) => {
                  const Icon = METHOD_ICON[method] ?? Receipt;
                  const [textColor, bgColor] = (METHOD_COLOR[method] ?? "text-slate-500 bg-slate-50").split(" ");
                  return (
                    <Card key={method} className="border-none shadow-sm rounded-3xl p-6 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 ${bgColor} ${textColor} rounded-2xl`}><Icon size={24}/></div>
                        <Badge variant="outline" className="text-xs">{METHOD_LABEL[method] ?? method}</Badge>
                      </div>
                      <div>
                        <p className="text-3xl font-black text-slate-900">{eur(total)}</p>
                        <p className="text-xs text-slate-500 font-medium mt-1">
                          {Math.round((total / payTotal) * 100)}% do total de hoje
                        </p>
                      </div>
                    </Card>
                  );
                })}
            </div>
            {!isLoading && data?.today && (
              <Card className="border-none shadow-sm rounded-3xl">
                <CardContent className="p-6 flex justify-between items-center">
                  <div>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Total Fecho Diário</p>
                    <p className="text-4xl font-black text-slate-900 mt-1">{eur(data.today.total)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Documentos</p>
                    <p className="text-4xl font-black text-slate-900 mt-1">{data.today.count}</p>
                  </div>
                  <Button className="rounded-xl bg-slate-900 text-white gap-2"><FileText size={16}/> Imprimir Fecho</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Top services */}
        <TabsContent value="services">
          <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-lg font-black">Top Serviços</CardTitle>
              <CardDescription>Por receita — {MONTHS_PT[month - 1]} {year}</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 space-y-4">{[1,2,3,4,5].map(i => <Skeleton key={i} className="h-14 w-full"/>)}</div>
              ) : (data?.topServices ?? []).length === 0 ? (
                <div className="text-center py-20 text-slate-400">
                  <Star size={32} strokeWidth={1.5} className="mx-auto mb-3"/>
                  <p className="font-bold">Sem serviços registados</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-50">
                  {(data?.topServices ?? []).map((s: any, i: number) => {
                    const maxRev = data.topServices[0]?.revenue ?? 1;
                    const pct = Math.round((s.revenue / maxRev) * 100);
                    return (
                      <div key={i} className="px-8 py-5 flex items-center gap-6 hover:bg-slate-50/50 transition-colors">
                        <span className="text-2xl font-black text-slate-200 w-8 text-center">{i + 1}</span>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-sm">{s.name}</p>
                          <div className="mt-2 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-500 rounded-full" style={{ width:`${pct}%` }}/>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-black text-slate-900">{eur(s.revenue)}</p>
                          <p className="text-[10px] text-slate-400">{s.count}× realizados</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance */}
        <TabsContent value="performance">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-lg font-black flex items-center gap-2"><Users size={18}/> Performance por Médico</CardTitle>
                <CardDescription>{MONTHS_PT[month - 1]} {year}</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {isLoading ? (
                  <div className="p-8 space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-14 w-full"/>)}</div>
                ) : (data?.vetPerformance ?? []).length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Users size={32} strokeWidth={1.5} className="mx-auto mb-3"/>
                    <p className="font-bold">Sem consultas registadas</p>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-50">
                    {(data?.vetPerformance ?? []).map((v: any, i: number) => {
                      const maxC = data.vetPerformance[0]?.consultations ?? 1;
                      const pct = Math.round((v.consultations / maxC) * 100);
                      return (
                        <div key={i} className="px-6 py-5 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                          <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm shrink-0">
                            {v.name.split(" ").map((n: string) => n[0]).join("").slice(0,2).toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-slate-900 text-sm">{v.name}</p>
                            <div className="mt-1.5 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width:`${pct}%` }}/>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-black text-slate-900">{v.consultations}</p>
                            <p className="text-[10px] text-slate-400">consultas</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50">
                <CardTitle className="text-lg font-black flex items-center gap-2"><BarChart3 size={18}/> Resumo do Mês</CardTitle>
                <CardDescription>{MONTHS_PT[month - 1]} {year}</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                {isLoading ? [1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full"/>) : (
                  [
                    { label:"Total faturado", value: eur(data?.month?.total ?? 0), color:"text-slate-900" },
                    { label:"Pendente no Jasmin", value: eur(data?.month?.pendingTotal ?? 0), color:"text-amber-600", sub:`${data?.month?.pendingCount ?? 0} rascunhos` },
                    { label:"Ticket médio", value: eur(data?.month?.avgTicket ?? 0), color:"text-slate-900" },
                    { label:"Consultas realizadas", value: data?.consultations?.count ?? 0, color:"text-blue-600" },
                  ].map((row, i) => (
                    <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 last:border-0">
                      <p className="text-sm text-slate-500 font-medium">{row.label}</p>
                      <div className="text-right">
                        <p className={`font-black text-lg ${row.color}`}>{row.value}</p>
                        {row.sub && <p className="text-[10px] text-amber-500">{row.sub}</p>}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
