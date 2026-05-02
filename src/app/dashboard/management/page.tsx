"use client";

import { useState } from "react";
import { 
  BarChart3, 
  FileText, 
  Calendar, 
  TrendingUp, 
  Download, 
  Filter,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Banknote,
  Smartphone,
  Wallet,
  Scale,
  RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ManagementPage() {
  const [reportPeriod, setReportPeriod] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  const { data: vatData, isLoading: loadingVat, refetch: refetchVat } = useQuery({
    queryKey: ["vat-report", reportPeriod],
    queryFn: async () => {
      const res = await fetch(`/api/management/reports/vat?month=${reportPeriod}`);
      if (!res.ok) throw new Error("Erro ao carregar mapa de IVA");
      return res.json();
    }
  });

  const { data: dailyData, isLoading: loadingDaily } = useQuery({
    queryKey: ["daily-report"],
    queryFn: async () => {
      const res = await fetch("/api/management/reports/daily");
      if (!res.ok) throw new Error("Erro ao carregar fecho diário");
      return res.json();
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestão & Auditoria</h1>
          <p className="text-slate-500 font-medium text-lg">Controlo financeiro rigoroso e relatórios para contabilidade.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl gap-2 font-bold py-6 px-6 border-slate-200" onClick={() => refetchVat()}>
            <RefreshCw size={18} /> Atualizar Dados
          </Button>
          <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 font-black py-6 px-8 text-lg">
            <Download size={20} /> Exportar SAF-T
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Card className="border-none shadow-2xl shadow-blue-100 bg-blue-600 text-white rounded-[2rem] overflow-hidden">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-blue-500/30 rounded-3xl backdrop-blur-sm">
                <TrendingUp size={32} />
              </div>
              <Badge className="bg-blue-400/30 text-white border-none rounded-lg px-3 py-1 font-bold">Hoje</Badge>
            </div>
            <p className="text-blue-100 font-bold uppercase tracking-[0.2em] text-xs">Total Faturado (Bruto)</p>
            <h3 className="text-5xl font-black mt-2">€{dailyData?.payments?.total?.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) || "0.00"}</h3>
            <div className="flex items-center gap-2 mt-4 text-blue-100 font-medium">
              <ArrowUpRight size={20} className="text-green-300" />
              <span>+12.5% em relação a ontem</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border border-slate-50">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-slate-50 text-slate-600 rounded-3xl">
                <Scale size={32} />
              </div>
              <Badge variant="outline" className="border-slate-100 text-slate-400 rounded-lg px-3 py-1 font-bold">Mês Corrente</Badge>
            </div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-xs">IVA a Liquidar (Estimado)</p>
            <h3 className="text-5xl font-black mt-2 text-slate-900">€{(vatData?.totalVat6 + vatData?.totalVat13 + vatData?.totalVat23)?.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) || "0.00"}</h3>
            <div className="flex items-center gap-2 mt-4 text-slate-400 font-medium">
              <FileText size={20} />
              <span>Cálculo baseado em faturação paga</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-slate-900 text-white rounded-[2rem] overflow-hidden">
          <CardContent className="p-8">
            <div className="flex justify-between items-start mb-6">
              <div className="p-4 bg-slate-800 text-amber-400 rounded-3xl">
                <CreditCard size={32} />
              </div>
              <Badge className="bg-slate-800 text-slate-400 border-none rounded-lg px-3 py-1 font-bold">Eficiência</Badge>
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Tickets Emitidos</p>
            <h3 className="text-5xl font-black mt-2">{dailyData?.count || 0}</h3>
            <div className="flex items-center gap-2 mt-4 text-slate-400 font-medium">
              <PieChart size={20} />
              <span>Ticket médio: €{(dailyData?.payments?.total / (dailyData?.count || 1))?.toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="vat" className="w-full">
        <TabsList className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 h-auto gap-2 mb-8">
          <TabsTrigger value="vat" className="rounded-xl px-8 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black text-sm uppercase tracking-widest transition-all">
            Mapa de IVA
          </TabsTrigger>
          <TabsTrigger value="daily" className="rounded-xl px-8 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black text-sm uppercase tracking-widest transition-all">
            Fecho Diário
          </TabsTrigger>
          <TabsTrigger value="invoices" className="rounded-xl px-8 py-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white font-black text-sm uppercase tracking-widest transition-all">
            Auditoria de Faturas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="vat">
          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="p-8 border-b border-slate-50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-black text-slate-900">Mapa de Imposto (Mensal)</CardTitle>
                <CardDescription className="text-slate-400 font-medium">Resumo segregado por taxas de IVA para o TOC.</CardDescription>
              </div>
              <div className="flex items-center gap-4">
                 <Label className="font-bold text-slate-500 uppercase text-[10px] tracking-widest">Período:</Label>
                 <Input 
                   type="month" 
                   className="rounded-xl border-slate-100 bg-slate-50 font-bold" 
                   value={reportPeriod}
                   onChange={(e) => setReportPeriod(e.target.value)}
                 />
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-slate-50">
                    <TableHead className="px-8 py-6 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Taxa de IVA</TableHead>
                    <TableHead className="px-8 py-6 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Base Tributável</TableHead>
                    <TableHead className="px-8 py-6 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Montante IVA</TableHead>
                    <TableHead className="px-8 py-6 text-right text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Total Bruto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="hover:bg-slate-50 transition-colors">
                    <TableCell className="px-8 py-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center font-black">6%</div>
                        <span className="font-bold text-slate-700">Taxa Reduzida</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-8 font-bold text-lg text-slate-900">€{vatData?.base6?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-8 py-8 font-black text-lg text-blue-600">€{vatData?.totalVat6?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-8 py-8 text-right font-black text-lg text-slate-900">€{(vatData?.base6 + vatData?.totalVat6)?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-slate-50 transition-colors">
                    <TableCell className="px-8 py-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black">13%</div>
                        <span className="font-bold text-slate-700">Taxa Intermédia</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-8 font-bold text-lg text-slate-900">€{vatData?.base13?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-8 py-8 font-black text-lg text-blue-600">€{vatData?.totalVat13?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-8 py-8 text-right font-black text-lg text-slate-900">€{(vatData?.base13 + vatData?.totalVat13)?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow className="hover:bg-slate-50 transition-colors border-b-2 border-slate-100">
                    <TableCell className="px-8 py-8">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center font-black">23%</div>
                        <span className="font-bold text-slate-700">Taxa Normal</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-8 font-bold text-lg text-slate-900">€{vatData?.base23?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-8 py-8 font-black text-lg text-blue-600">€{vatData?.totalVat23?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-8 py-8 text-right font-black text-lg text-slate-900">€{(vatData?.base23 + vatData?.totalVat23)?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                  <TableRow className="bg-slate-50/50">
                    <TableCell className="px-8 py-8 font-black text-slate-900 uppercase tracking-widest">Totais Gerais</TableCell>
                    <TableCell className="px-8 py-8 font-black text-xl text-slate-900">€{(vatData?.base6 + vatData?.base13 + vatData?.base23)?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-8 py-8 font-black text-xl text-blue-700">€{(vatData?.totalVat6 + vatData?.totalVat13 + vatData?.totalVat23)?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                    <TableCell className="px-8 py-8 text-right font-black text-2xl text-slate-900 underline decoration-blue-500 underline-offset-8">€{vatData?.totalGross?.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="daily">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="border-none shadow-lg rounded-3xl bg-white p-8 group hover:scale-[1.02] transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-100 text-slate-900 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Banknote size={24} />
                </div>
                <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Numerário</span>
              </div>
              <h4 className="text-3xl font-black text-slate-900">€{dailyData?.payments?.CASH?.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) || "0.00"}</h4>
            </Card>

            <Card className="border-none shadow-lg rounded-3xl bg-white p-8 group hover:scale-[1.02] transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-100 text-slate-900 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <CreditCard size={24} />
                </div>
                <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Multibanco</span>
              </div>
              <h4 className="text-3xl font-black text-slate-900">€{dailyData?.payments?.MULTIBANCO?.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) || "0.00"}</h4>
            </Card>

            <Card className="border-none shadow-lg rounded-3xl bg-white p-8 group hover:scale-[1.02] transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-100 text-slate-900 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Smartphone size={24} />
                </div>
                <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest">MB Way</span>
              </div>
              <h4 className="text-3xl font-black text-slate-900">€{dailyData?.payments?.MBWAY?.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) || "0.00"}</h4>
            </Card>

            <Card className="border-none shadow-lg rounded-3xl bg-white p-8 group hover:scale-[1.02] transition-all">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-slate-100 text-slate-900 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Wallet size={24} />
                </div>
                <span className="font-black text-slate-900 uppercase text-[10px] tracking-widest">Transferência</span>
              </div>
              <h4 className="text-3xl font-black text-slate-900">€{dailyData?.payments?.TRANSFER?.toLocaleString('pt-PT', { minimumFractionDigits: 2 }) || "0.00"}</h4>
            </Card>
          </div>
          
          <Card className="mt-8 border-none shadow-xl rounded-[2rem] bg-white overflow-hidden">
             <CardHeader className="p-8 border-b border-slate-50">
               <CardTitle className="text-xl font-black">Histórico de Fechos</CardTitle>
               <CardDescription>Resumo dos últimos 7 dias de faturação.</CardDescription>
             </CardHeader>
             <CardContent className="p-8">
               <div className="h-64 flex items-end justify-between gap-4">
                 {[45, 62, 55, 80, 48, 95, 70].map((h, i) => (
                   <div key={i} className="flex-1 flex flex-col items-center gap-2">
                     <div className="w-full bg-slate-50 rounded-t-xl relative overflow-hidden h-48">
                        <div 
                          className="absolute bottom-0 w-full bg-blue-600 rounded-t-xl transition-all duration-1000 ease-out"
                          style={{ height: `${h}%` }}
                        ></div>
                     </div>
                     <span className="text-[10px] font-bold text-slate-400 uppercase">{['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB', 'DOM'][i]}</span>
                   </div>
                 ))}
               </div>
             </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
