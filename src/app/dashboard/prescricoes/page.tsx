"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Pill, Plus, Search, FileText, AlertCircle, RefreshCw,
  User, Calendar, ChevronRight, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PrescriptionForm } from "@/components/forms/PrescriptionForm";
import { format, isPast, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

const fmt = (d: string) => format(new Date(d), "dd MMM yyyy", { locale: pt });

function StatusBadge({ validUntil }: { validUntil: string | null }) {
  if (!validUntil) return <Badge variant="outline" className="text-[10px] border-white/10 text-slate-400">Sem validade</Badge>;
  if (isPast(new Date(validUntil))) {
    return <Badge className="bg-red-500/10 text-red-400 border-none text-[10px] gap-1"><AlertCircle size={10} /> Expirada</Badge>;
  }
  const days = differenceInDays(new Date(validUntil), new Date());
  if (days <= 7) {
    return <Badge className="bg-amber-500/10 text-amber-400 border-none text-[10px] gap-1"><Clock size={10} /> Expira em {days}d</Badge>;
  }
  return <Badge className="bg-green-500/10 text-green-400 border-none text-[10px] gap-1"><CheckCircle2 size={10} /> Válida</Badge>;
}

export default function PrescricoesPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  const { data: prescriptions = [], isLoading, isError, refetch, isRefetching } = useQuery({
    queryKey: ["prescriptions", search],
    queryFn: async () => {
      const res = await fetch("/api/prescriptions");
      if (!res.ok) throw new Error("Erro ao carregar prescrições");
      return res.json();
    },
  });

  const filtered = prescriptions.filter((rx: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      rx.patient?.name?.toLowerCase().includes(q) ||
      rx.veterinarian?.name?.toLowerCase().includes(q) ||
      rx.items?.some((i: any) => i.medicineName?.toLowerCase().includes(q))
    );
  });

  const active = filtered.filter((rx: any) => rx.validUntil && !isPast(new Date(rx.validUntil)));
  const expired = filtered.filter((rx: any) => !rx.validUntil || isPast(new Date(rx.validUntil)));

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Receituário</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Prescrições médico-veterinárias emitidas pela clínica.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl gap-2 border-slate-200 dark:border-slate-800" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} /> Atualizar
          </Button>
          <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 font-black" onClick={() => { setSelectedPatientId(null); setIsDialogOpen(true); }}>
            <Plus size={16} strokeWidth={3} /> Nova Prescrição
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Total", value: filtered.length, color: "text-slate-900 dark:text-white", sub: "prescrições emitidas" },
          { label: "Ativas", value: active.length, color: "text-green-600", sub: "dentro da validade" },
          { label: "Expiradas", value: expired.length, color: "text-red-500", sub: "fora de validade" },
        ].map(({ label, value, color, sub }) => (
          <Card key={label} className="border-none shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
            <CardContent className="p-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
              {isLoading
                ? <Skeleton className="h-9 w-16 mt-2" />
                : <p className={cn("text-4xl font-black mt-2 tracking-tighter", color)}>{value}</p>
              }
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Search + list */}
      <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
        <CardHeader className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              placeholder="Paciente, médico ou medicamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isError && (
            <div className="flex items-center gap-3 m-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-2xl text-red-600 dark:text-red-400">
              <AlertCircle size={18} />
              <p className="font-bold text-sm">Erro ao carregar prescrições</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">Tentar novamente</Button>
            </div>
          )}

          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
              <Pill size={36} strokeWidth={1.2} />
              <p className="font-bold">{search ? "Nenhuma prescrição encontrada" : "Ainda não há prescrições"}</p>
              {!search && (
                <Button className="rounded-xl bg-blue-600 text-white gap-2 mt-2" onClick={() => setIsDialogOpen(true)}>
                  <Plus size={15} /> Criar primeira prescrição
                </Button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((rx: any) => (
                <div
                  key={rx.id}
                  className="flex items-start gap-5 px-6 py-5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  onClick={() => router.push(`/dashboard/patients/${rx.patientId}`)}
                >
                  {/* Icon */}
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Pill size={22} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <p className="font-black text-slate-900 dark:text-white">{rx.patient?.name ?? "—"}</p>
                      <StatusBadge validUntil={rx.validUntil} />
                    </div>
                    {/* Medicines */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {rx.items?.map((item: any, i: number) => (
                        <span key={i} className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg">
                          {item.medicineName}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><User size={11} /> {rx.veterinarian?.name ?? "—"}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {fmt(rx.createdAt)}</span>
                      {rx.validUntil && (
                        <span className="flex items-center gap-1"><FileText size={11} /> válida até {fmt(rx.validUntil)}</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* New prescription dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[640px] rounded-[2rem] border-none shadow-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-900 dark:text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center">
                <Pill size={20} />
              </div>
              Nova Prescrição
            </DialogTitle>
          </DialogHeader>
          <PrescriptionForm
            patientId={selectedPatientId ?? ""}
            onSuccess={() => { setIsDialogOpen(false); refetch(); }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
