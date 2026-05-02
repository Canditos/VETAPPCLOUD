"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Receipt,
  ExternalLink,
  CheckCircle2,
  Clock,
  Download,
  FileSearch,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT");
}

function formatEur(value: number | string) {
  return `€${Number(value).toFixed(2)}`;
}

export default function BillingPage() {
  const [search, setSearch] = useState("");

  const { data, isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["billing", search],
    queryFn: async () => {
      const res = await fetch(`/api/billing?q=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Falha ao carregar faturas");
      return res.json();
    },
  });

  const invoices = data?.invoices ?? [];
  const stats = data?.stats;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Faturação &amp; Finanças
          </h1>
          <p className="text-slate-500 font-medium">
            Controlo legal via Jasmin ERP e histórico de vendas.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl gap-2">
            <Download size={16} /> Exportar SAF-T
          </Button>
          <Button
            className="rounded-xl gap-2 bg-blue-600"
            onClick={() => refetch()}
            disabled={isRefetching}
          >
            <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} />
            Sincronizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Faturado Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-28" />
            ) : (
              <>
                <p className="text-3xl font-black text-slate-900">
                  {formatEur(stats?.todayTotal ?? 0)}
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {stats?.todayCount ?? 0} documentos emitidos hoje
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Pendente Sinc.
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-28" />
            ) : (
              <>
                <p className="text-3xl font-black text-amber-600">
                  {formatEur(stats?.pendingTotal ?? 0)}
                </p>
                <p className="text-xs text-amber-600 font-bold mt-1">
                  {stats?.pendingCount ?? 0}{" "}
                  {stats?.pendingCount === 1 ? "rascunho" : "rascunhos"} por enviar
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Total Faturas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <>
                <p className="text-3xl font-black text-slate-900">{invoices.length}</p>
                <p className="text-xs text-slate-400 mt-1">documentos no sistema</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6 flex flex-row items-center justify-between space-y-0">
          <div className="flex-1 max-w-md relative">
            <FileSearch
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <Input
              placeholder="Procurar por fatura ou cliente..."
              className="pl-10 rounded-xl bg-white border-slate-200"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isError ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <AlertCircle size={32} strokeWidth={1.5} />
              <p className="font-bold">Erro ao carregar faturas</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                Tentar novamente
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Documento</TableHead>
                  <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Cliente / Paciente</TableHead>
                  <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Total</TableHead>
                  <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Estado Jasmin</TableHead>
                  <TableHead className="px-6 py-4 text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 4 }).map((_, i) => (
                    <TableRow key={i}>
                      <TableCell className="px-6 py-5"><Skeleton className="h-4 w-28" /></TableCell>
                      <TableCell className="px-6 py-5"><Skeleton className="h-4 w-36" /></TableCell>
                      <TableCell className="px-6 py-5"><Skeleton className="h-4 w-16" /></TableCell>
                      <TableCell className="px-6 py-5"><Skeleton className="h-6 w-24 rounded-full" /></TableCell>
                      <TableCell className="px-6 py-5" />
                    </TableRow>
                  ))
                ) : invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-20 text-slate-400">
                      <Receipt size={32} strokeWidth={1.5} className="mx-auto mb-3" />
                      <p className="font-bold">
                        {search ? "Nenhuma fatura encontrada" : "Ainda não há faturas"}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv: any) => {
                    const ownerName = inv.consultation?.patient?.owner?.name ?? "—";
                    const patientName = inv.consultation?.patient?.name;
                    const isSynced = !!inv.externalId || inv.status === "PAID";
                    return (
                      <TableRow key={inv.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                        <TableCell className="px-6 py-5">
                          <div>
                            <p className="font-bold text-slate-900 font-mono text-sm">
                              {inv.externalId ?? inv.id.substring(0, 8).toUpperCase()}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium">{formatDate(inv.createdAt)}</p>
                          </div>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <p className="text-sm font-medium text-slate-700">{ownerName}</p>
                          {patientName && <p className="text-[10px] text-slate-400">{patientName}</p>}
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          <p className="font-black text-slate-900">{formatEur(inv.total)}</p>
                        </TableCell>
                        <TableCell className="px-6 py-5">
                          {isSynced ? (
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
                          {inv.externalId && (
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600 hover:bg-blue-50" title="Ver no Jasmin">
                              <ExternalLink size={16} />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
