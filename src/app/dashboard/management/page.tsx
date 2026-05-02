"use client";

import { 
  TrendingUp, 
  BarChart3, 
  PieChart, 
  FileText, 
  Download, 
  Calendar as CalendarIcon,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Smartphone,
  ChevronRight
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function ManagementPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gestão & Contabilidade</h1>
          <p className="text-slate-500 font-medium">Relatórios financeiros, mapas de IVA e análise de performance.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold gap-2">
            <Download size={18} /> Exportar SAF-T
          </Button>
          <Button className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-lg font-black gap-2">
            <FileText size={20} /> Relatório Mensal
          </Button>
        </div>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-none shadow-sm rounded-3xl bg-blue-600 text-white">
           <CardContent className="p-6">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Faturação Hoje</p>
              <div className="flex justify-between items-end mt-2">
                 <h3 className="text-3xl font-black">€1,240.50</h3>
                 <Badge className="bg-white/20 text-white border-none text-[10px]">+12%</Badge>
              </div>
           </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl">
           <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Pendente Jasmin</p>
              <div className="flex justify-between items-end mt-2">
                 <h3 className="text-3xl font-black text-slate-900">€450.00</h3>
                 <Badge className="bg-amber-100 text-amber-700 border-none text-[10px]">3 Docs</Badge>
              </div>
           </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl">
           <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tickets Médio</p>
              <div className="flex justify-between items-end mt-2">
                 <h3 className="text-3xl font-black text-slate-900">€65.20</h3>
                 <Badge className="bg-green-100 text-green-700 border-none text-[10px]">+5%</Badge>
              </div>
           </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-3xl">
           <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultas Mês</p>
              <div className="flex justify-between items-end mt-2">
                 <h3 className="text-3xl font-black text-slate-900">142</h3>
                 <Badge className="bg-slate-100 text-slate-500 border-none text-[10px]">Meta: 200</Badge>
              </div>
           </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vat" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100/50 p-1 rounded-2xl">
          <TabsTrigger value="vat" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            MAPA DE IVA
          </TabsTrigger>
          <TabsTrigger value="daily" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            FECHO DIÁRIO
          </TabsTrigger>
          <TabsTrigger value="performance" className="rounded-xl data-[state=active]:bg-white data-[state=active]:shadow-sm font-bold">
            PERFORMANCE CLÍNICA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vat" className="space-y-6">
           <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="bg-slate-50/50 flex flex-row justify-between items-center">
                 <div>
                    <CardTitle className="text-lg font-black">Resumo de Impostos</CardTitle>
                    <CardDescription>Detalhamento de IVA por taxa aplicada (Maio 2024)</CardDescription>
                 </div>
                 <Button variant="outline" size="sm" className="rounded-xl border-slate-200">Filtrar Data</Button>
              </CardHeader>
              <CardContent className="p-0">
                 <table className="w-full text-sm">
                    <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                       <tr>
                          <th className="px-8 py-4 text-left">Taxa de IVA</th>
                          <th className="px-8 py-4 text-right">Base Tributável</th>
                          <th className="px-8 py-4 text-right">Valor IVA</th>
                          <th className="px-8 py-4 text-right">Total</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6 font-bold">IVA Normal (23%)</td>
                          <td className="px-8 py-6 text-right font-medium">€8,450.00</td>
                          <td className="px-8 py-6 text-right font-black text-blue-600">€1,943.50</td>
                          <td className="px-8 py-6 text-right font-bold">€10,393.50</td>
                       </tr>
                       <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6 font-bold">IVA Intermédio (13%)</td>
                          <td className="px-8 py-6 text-right font-medium">€1,200.00</td>
                          <td className="px-8 py-6 text-right font-black text-blue-600">€156.00</td>
                          <td className="px-8 py-6 text-right font-bold">€1,356.00</td>
                       </tr>
                       <tr className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-8 py-6 font-bold">IVA Reduzido (6%)</td>
                          <td className="px-8 py-6 text-right font-medium">€540.00</td>
                          <td className="px-8 py-6 text-right font-black text-blue-600">€32.40</td>
                          <td className="px-8 py-6 text-right font-bold">€572.40</td>
                       </tr>
                    </tbody>
                    <tfoot className="bg-slate-900 text-white">
                       <tr>
                          <td className="px-8 py-6 font-black uppercase text-[10px] tracking-widest">Totais Acumulados</td>
                          <td className="px-8 py-6 text-right font-bold">€10,190.00</td>
                          <td className="px-8 py-6 text-right font-black text-blue-400">€2,131.90</td>
                          <td className="px-8 py-6 text-right font-black text-xl">€12,321.90</td>
                       </tr>
                    </tfoot>
                 </table>
              </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="daily" className="space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="border-none shadow-sm rounded-3xl p-6 bg-white flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                       <CreditCard size={24} />
                    </div>
                    <Badge variant="outline" className="border-blue-100 text-blue-600">Multibanco</Badge>
                 </div>
                 <div>
                    <p className="text-3xl font-black text-slate-900">€850.00</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">12 Transações realizadas hoje</p>
                 </div>
              </Card>
              <Card className="border-none shadow-sm rounded-3xl p-6 bg-white flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                       <Banknote size={24} />
                    </div>
                    <Badge variant="outline" className="border-emerald-100 text-emerald-600">Numerário</Badge>
                 </div>
                 <div>
                    <p className="text-3xl font-black text-slate-900">€240.50</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">4 Pagamentos em dinheiro</p>
                 </div>
              </Card>
              <Card className="border-none shadow-sm rounded-3xl p-6 bg-white flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-4">
                    <div className="p-3 bg-purple-50 text-purple-600 rounded-2xl">
                       <Smartphone size={24} />
                    </div>
                    <Badge variant="outline" className="border-purple-100 text-purple-600">MB Way</Badge>
                 </div>
                 <div>
                    <p className="text-3xl font-black text-slate-900">€150.00</p>
                    <p className="text-xs text-slate-500 font-medium mt-1">3 Recebimentos digitais</p>
                 </div>
              </Card>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
