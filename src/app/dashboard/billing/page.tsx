"use client";

import { 
  Receipt, 
  ExternalLink, 
  CheckCircle2, 
  Clock, 
  Download,
  FileSearch,
  RefreshCw,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

const invoices = [
  { id: "FA 2024/041", date: "2024-05-02", total: "50.00", status: "SENT", jasminId: "INV-12345", client: "João Silva" },
  { id: "FA 2024/040", date: "2024-05-01", total: "35.00", status: "DRAFT", jasminId: null, client: "Maria Oliveira" },
  { id: "FA 2024/039", date: "2024-04-30", total: "120.50", status: "SENT", jasminId: "INV-12340", client: "Carlos Santos" },
  { id: "FA 2024/038", date: "2024-04-28", total: "15.00", status: "SENT", jasminId: "INV-12335", client: "Fernanda Lima" },
];

export default function BillingPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Faturação & Finanças</h1>
          <p className="text-slate-500 font-medium">Controlo legal via Jasmin ERP e histórico de vendas.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-xl gap-2">
              <Download size={16} /> Exportar SAF-T
           </Button>
           <Button className="rounded-xl gap-2 bg-blue-600">
              <RefreshCw size={16} /> Sincronizar Tudo
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Faturado Hoje</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-3xl font-black text-slate-900">€425.00</p>
             <p className="text-xs text-slate-400 mt-1">12 documentos emitidos</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pendente Sinc.</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-3xl font-black text-amber-600">€35.00</p>
             <p className="text-xs text-amber-600 font-bold mt-1">1 rascunho por enviar</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between space-y-0">
          <div className="flex-1 max-w-md relative">
            <FileSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Procurar por fatura ou cliente..."
              className="pl-10 rounded-xl bg-white border-slate-200"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Documento</TableHead>
                <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Cliente</TableHead>
                <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Total</TableHead>
                <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Estado Jasmin</TableHead>
                <TableHead className="px-6 py-4 text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((inv) => (
                <TableRow key={inv.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                  <TableCell className="px-6 py-5">
                    <div>
                      <p className="font-bold text-slate-900">{inv.id}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{inv.date}</p>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-sm font-medium text-slate-700">{inv.client}</TableCell>
                  <TableCell className="px-6 py-5">
                    <p className="font-black text-slate-900">€{inv.total}</p>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    {inv.status === "SENT" ? (
                      <Badge variant="secondary" className="bg-green-100 text-green-700 border-none gap-1 py-1">
                        <CheckCircle2 size={12} /> Sincronizado
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-none gap-1 py-1">
                        <Clock size={12} /> Rascunho
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-2">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50">
                          <ExternalLink size={16} />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreVertical size={16} />
                       </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
