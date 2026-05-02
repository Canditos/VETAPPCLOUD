"use client";

import { useState } from "react";
import { 
  Users, 
  Stethoscope, 
  CreditCard, 
  FileText, 
  History as HistoryIcon,
  Plus,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  FilePlus,
  ArrowUpRight,
  PawPrint,
  Clock,
  ExternalLink
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";

export default function CustomerProfilePage({ params }: { params: { id: string } }) {
  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer-hub", params.id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${params.id}`);
      if (!res.ok) throw new Error("Erro ao carregar hub do cliente");
      return res.json();
    }
  });

  if (isLoading) return <div className="p-12 text-center font-black text-slate-300 animate-pulse">A carregar Hub 360º...</div>;
  if (!customer) return <div className="p-12 text-center text-red-500 font-bold">Cliente não encontrado.</div>;

  const balance = customer.stats?.outstandingBalance || 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* 360º Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div className="flex gap-6 items-center">
          <div className="h-24 w-24 rounded-[2rem] bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-2xl shadow-blue-200">
            {customer.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-black text-slate-900 tracking-tight">{customer.name}</h1>
              <Badge variant="outline" className="bg-blue-50 text-blue-600 border-none font-black text-[10px] uppercase">Cliente Ativo</Badge>
            </div>
            <div className="flex flex-wrap gap-6 mt-3 text-slate-500 font-bold">
              <span className="flex items-center gap-2"><Phone size={16} className="text-slate-300" /> {customer.phone || "Sem telefone"}</span>
              <span className="flex items-center gap-2"><Mail size={16} className="text-slate-300" /> {customer.email || "Sem email"}</span>
              <span className="flex items-center gap-2"><MapPin size={16} className="text-slate-300" /> {customer.address || "Sem morada"}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
          <Card className={`border-none shadow-xl ${balance > 0 ? 'bg-red-50 text-red-600 ring-1 ring-red-100' : 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100'} p-6 rounded-[2rem] flex-1 lg:min-w-[240px]`}>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-60">Saldo em Dívida</p>
            <div className="flex items-end justify-between mt-1">
              <p className="text-4xl font-black">€{balance.toFixed(2)}</p>
              {balance > 0 ? <AlertCircle size={32} /> : <CheckCircle2 size={32} />}
            </div>
          </Card>
          
          <div className="grid grid-cols-2 gap-3 h-fit">
            <Button className="rounded-2xl h-full py-6 font-black bg-slate-900 hover:bg-blue-600 transition-all gap-2 shadow-xl shadow-slate-200">
              <Plus size={18} /> Nova Consulta
            </Button>
            <Button variant="outline" className="rounded-2xl h-full py-6 font-black border-slate-100 bg-white hover:bg-slate-50 transition-all gap-2">
              <FilePlus size={18} /> Criar Fatura
            </Button>
          </div>
        </div>
      </div>

      {/* Main Hub Tabs */}
      <Tabs defaultValue="animals" className="w-full">
        <TabsList className="bg-slate-100/50 p-1.5 rounded-[2rem] h-auto gap-2 mb-8">
          <TabsTrigger value="animals" className="rounded-2xl px-8 py-3 font-black text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all gap-2">
            <PawPrint size={18} /> Animais
          </TabsTrigger>
          <TabsTrigger value="financial" className="rounded-2xl px-8 py-3 font-black text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all gap-2">
            <CreditCard size={18} /> Financeiro
          </TabsTrigger>
          <TabsTrigger value="budgets" className="rounded-2xl px-8 py-3 font-black text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all gap-2">
            <FileText size={18} /> Orçamentos
          </TabsTrigger>
          <TabsTrigger value="history" className="rounded-2xl px-8 py-3 font-black text-slate-500 data-[state=active]:bg-white data-[state=active]:text-blue-600 data-[state=active]:shadow-lg transition-all gap-2">
            <HistoryIcon size={18} /> Histórico Clínico
          </TabsTrigger>
        </TabsList>

        {/* Animals Tab */}
        <TabsContent value="animals" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {customer.patients?.map((animal: any) => (
              <Card key={animal.id} className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500">
                <div className="bg-slate-50 p-8 flex items-center gap-6">
                  <div className="h-20 w-20 rounded-3xl bg-white shadow-sm flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                    <PawPrint size={40} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">{animal.name}</h3>
                    <div className="flex gap-2 mt-1">
                      <Badge variant="outline" className="border-slate-200 text-slate-400 font-black text-[9px] uppercase">{animal.species}</Badge>
                      <Badge variant="outline" className="border-slate-200 text-slate-400 font-black text-[9px] uppercase">{animal.breed || "Indefinida"}</Badge>
                    </div>
                  </div>
                </div>
                <CardContent className="p-8 space-y-6 bg-white">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Peso Atual</p>
                      <p className="text-lg font-black text-slate-900 mt-1">{animal.weight ? `${animal.weight} kg` : "---"}</p>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-2xl">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Consultas</p>
                      <p className="text-lg font-black text-slate-900 mt-1">{animal._count?.consultations || 0}</p>
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-50 flex gap-2">
                    <Button className="flex-1 rounded-xl bg-slate-900 font-black py-6 text-xs gap-2">
                      Ver Histórico <ArrowUpRight size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 bg-slate-50 text-slate-400">
                      <MoreHorizontal size={20} />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            <button className="border-2 border-dashed border-slate-200 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 text-slate-300 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50/30 transition-all group">
              <div className="p-6 bg-slate-50 rounded-full group-hover:bg-blue-100 transition-colors">
                <Plus size={32} />
              </div>
              <span className="font-black text-sm uppercase tracking-[0.2em]">Adicionar Animal</span>
            </button>
          </div>
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                <CardHeader className="bg-white border-b border-slate-50 p-8 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black">Histórico de Faturação</CardTitle>
                    <CardDescription className="font-medium">Últimos documentos emitidos no sistema.</CardDescription>
                  </div>
                  <Button variant="outline" className="rounded-xl font-bold border-slate-100">Ver Todas</Button>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-50">
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Nº Documento</TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Data</TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Total</TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</TableHead>
                      <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.invoices?.map((inv: any) => (
                      <TableRow key={inv.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                        <TableCell className="px-8 py-6 font-black text-slate-900">{inv.jasminInvoiceId || "Provisória"}</TableCell>
                        <TableCell className="px-8 py-6 font-bold text-slate-500">{format(new Date(inv.createdAt), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="px-8 py-6 font-black text-slate-900">€{Number(inv.total).toFixed(2)}</TableCell>
                        <TableCell className="px-8 py-6">
                          <Badge className={`rounded-lg font-black text-[9px] uppercase ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right">
                          <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 hover:text-blue-600">
                             <ExternalLink size={18} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!customer.invoices || customer.invoices.length === 0) && (
                      <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-300 font-bold">Sem faturas registadas.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-slate-900 text-white overflow-hidden">
                <CardHeader className="p-8 border-b border-white/5">
                  <CardTitle className="text-xl font-black flex items-center gap-2"><TrendingUp className="text-blue-400" /> Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Faturado</p>
                    <p className="text-3xl font-black text-white">€{customer.stats?.totalInvoiced.toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Liquidado</p>
                    <p className="text-3xl font-black text-emerald-400">€{customer.stats?.totalPaid.toFixed(2)}</p>
                  </div>
                  <div className="pt-8 border-t border-white/5">
                    <Button className="w-full rounded-2xl py-7 bg-blue-600 hover:bg-blue-700 font-black text-lg gap-2 shadow-2xl shadow-blue-500/20">
                       Liquidado Dívida
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] bg-white overflow-hidden">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black">Pagamentos Recentes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="px-8 pb-8 space-y-4">
                    {customer.payments?.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                        <div>
                          <p className="font-black text-slate-900">€{Number(p.amount).toFixed(2)}</p>
                          <p className="text-[10px] font-bold text-slate-400 uppercase">{p.method} • {format(new Date(p.paidAt), "dd MMM")}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                          <CheckCircle2 size={18} />
                        </div>
                      </div>
                    ))}
                    {(!customer.payments || customer.payments.length === 0) && (
                      <p className="text-center py-4 text-slate-300 font-bold">Sem pagamentos.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="animate-in fade-in slide-in-from-top-2 duration-500">
           <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-8 bg-white">
              <div className="space-y-12 relative before:absolute before:left-10 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
                <div className="relative pl-24 group">
                  <div className="absolute left-6 top-0 h-8 w-8 rounded-full bg-blue-600 border-4 border-white shadow-lg z-10 group-hover:scale-125 transition-transform"></div>
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Clock size={12} /> 12 Maio 2026 • 14:30</p>
                    <h4 className="text-xl font-black text-slate-900">Consulta de Rotina - Bolinha</h4>
                    <p className="text-slate-500 font-medium max-w-2xl leading-relaxed bg-slate-50 p-4 rounded-2xl italic">"Paciente apresenta bom estado geral. Vacinação em dia. Recomendado reforço de desparasitação interna."</p>
                    <div className="flex gap-2 pt-2">
                      <Badge className="bg-blue-50 text-blue-600 border-none font-black text-[9px]">VACINAÇÃO</Badge>
                      <Badge className="bg-slate-100 text-slate-400 border-none font-black text-[9px]">CHECK-UP</Badge>
                    </div>
                  </div>
                </div>
                {/* Timeline content would be dynamic based on consultations linked via patients */}
                <div className="text-center py-20">
                  <p className="text-slate-300 font-bold">Timeline clínica completa em desenvolvimento...</p>
                </div>
              </div>
           </Card>
        </TabsContent>
        
        {/* Budgets Tab */}
        <TabsContent value="budgets" className="animate-in fade-in slide-in-from-top-2 duration-500">
           <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
              <CardHeader className="p-8 border-b border-slate-50">
                 <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-black">Orçamentos e Planos</CardTitle>
                      <CardDescription className="font-medium">Propostas clínicas aceites e pendentes.</CardDescription>
                    </div>
                    <Button className="rounded-xl gap-2 bg-slate-900 font-black"><Plus size={18} /> Novo Orçamento</Button>
                 </div>
              </CardHeader>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {customer.budgets?.map((budget: any) => (
                   <div key={budget.id} className="p-6 border border-slate-100 rounded-3xl hover:bg-slate-50/50 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <p className="font-black text-slate-900 text-lg">€{Number(budget.totalAmount).toFixed(2)}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">Emitido em {format(new Date(budget.createdAt), "dd MMM")}</p>
                         </div>
                         <Badge className={`rounded-lg font-black text-[9px] ${budget.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            {budget.status}
                         </Badge>
                      </div>
                      <div className="pt-4 border-t border-slate-50 flex gap-2">
                         <Button className="flex-1 rounded-xl py-5 bg-blue-600 font-black text-xs gap-2 shadow-xl shadow-blue-100 opacity-0 group-hover:opacity-100 transition-all">
                            Converter em Fatura
                         </Button>
                      </div>
                   </div>
                 ))}
                 {(!customer.budgets || customer.budgets.length === 0) && (
                   <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                      <FileText size={48} className="text-slate-100" />
                      <p className="text-slate-300 font-bold">Nenhum orçamento emitido para este cliente.</p>
                   </div>
                 )}
              </div>
           </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
