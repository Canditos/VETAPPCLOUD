"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Pill, Plus, Search, AlertCircle, RefreshCw,
  User, Calendar, ChevronRight, CheckCircle2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PrescriptionForm } from "@/components/forms/PrescriptionForm";
import { format, isPast, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { PremiumCard } from "@/components/PremiumCard";
import { PageHeader } from "@/components/PageHeader";
import { StatsGrid } from "@/components/StatsGrid";
import { EmptyState } from "@/components/EmptyState";

const fmt = (d: string) => format(new Date(d), "dd MMM yyyy", { locale: pt });

function StatusBadge({ validUntil }: { validUntil: string | null }) {
  if (!validUntil) return <Badge variant="outline" className="text-[10px] border-slate-200 dark:border-white/10 text-slate-400">Sem validade</Badge>;
  if (isPast(new Date(validUntil))) {
    return <Badge className="bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-none text-[10px] gap-1 font-medium"><AlertCircle size={10} /> Expirada</Badge>;
  }
  const days = differenceInDays(new Date(validUntil), new Date());
  if (days <= 7) {
    return <Badge className="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-none text-[10px] gap-1 font-medium"><Clock size={10} /> Expira em {days}d</Badge>;
  }
  return <Badge className="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-none text-[10px] gap-1 font-medium"><CheckCircle2 size={10} /> Válida</Badge>;
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
      <PageHeader
        title="Receituário"
        description="Prescrições médico-veterinárias emitidas pela clínica."
      >
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl gap-2 border-slate-200 dark:border-slate-800 font-medium" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw size={16} className={isRefetching ? "animate-spin" : ""} /> Atualizar
          </Button>
          <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 font-semibold" onClick={() => { setSelectedPatientId(null); setIsDialogOpen(true); }}>
            <Plus size={16} strokeWidth={3} /> Nova Prescrição
          </Button>
        </div>
      </PageHeader>

      {/* Stats */}
      <StatsGrid
        items={[
          { label: "Total", value: filtered.length, icon: Pill, color: "slate", sub: "prescrições emitidas" },
          { label: "Ativas", value: active.length, icon: CheckCircle2, color: "emerald", sub: "dentro da validade" },
          { label: "Expiradas", value: expired.length, icon: AlertCircle, color: "rose", sub: "fora de validade" },
        ]}
      />

      {/* Search + list */}
      <PremiumCard padding="none">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <Input
              className="pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              placeholder="Paciente, médico ou medicamento..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="p-0">
          {isError && (
            <div className="flex items-center gap-3 m-6 p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/30 rounded-2xl text-rose-600 dark:text-rose-400">
              <AlertCircle size={18} />
              <p className="font-semibold text-sm">Erro ao carregar prescrições</p>
              <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">Tentar novamente</Button>
            </div>
          )}

          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Pill}
                title={search ? "Nenhuma prescrição encontrada" : "Ainda não há prescrições"}
                action={!search ? (
                  <Button className="rounded-xl bg-blue-600 text-white gap-2 mt-2" onClick={() => setIsDialogOpen(true)}>
                    <Plus size={15} /> Criar primeira prescrição
                  </Button>
                ) : undefined}
              />
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.map((rx: any) => (
                <div
                  key={rx.id}
                  className="flex items-start gap-5 px-6 py-5 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                  onClick={() => router.push(`/dashboard/patients/${rx.patientId}`)}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Pill size={22} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-1">
                      <p className="font-bold text-slate-900 dark:text-white">{rx.patient?.name ?? "—"}</p>
                      <StatusBadge validUntil={rx.validUntil} />
                    </div>
                    <div className="flex flex-wrap gap-1 mb-2">
                      {rx.items?.map((item: any, i: number) => (
                        <span key={i} className="text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-lg">
                          {item.medicineName}
                        </span>
                      ))}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1"><User size={11} /> {rx.veterinarian?.name ?? "—"}</span>
                      <span className="flex items-center gap-1"><Calendar size={11} /> {fmt(rx.createdAt)}</span>
                      {rx.validUntil && (
                        <span className="flex items-center gap-1"><Calendar size={11} /> válida até {fmt(rx.validUntil)}</span>
                      )}
                    </div>
                  </div>

                  <ChevronRight size={18} className="text-slate-300 dark:text-slate-600 group-hover:text-blue-400 transition-colors shrink-0 mt-1" />
                </div>
              ))}
            </div>
          )}
        </div>
      </PremiumCard>

      {/* New prescription dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[640px] rounded-3xl border-none shadow-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-white/10">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
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
