"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Syringe, 
  Bug, 
  Plus, 
  Calendar, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  Info,
  ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { VaccinationForm } from "@/components/forms/VaccinationForm";
import { DewormingForm } from "@/components/forms/DewormingForm";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface ClinicalVaccinesProps {
  patientId: string;
}

export function ClinicalVaccines({ patientId }: ClinicalVaccinesProps) {
  const [activeForm, setActiveForm] = useState<"vaccine" | "deworming" | null>(null);

  const { data: vaccinations, isLoading: isLoadingVaccines } = useQuery({
    queryKey: ["vaccinations", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/vaccinations`);
      if (!res.ok) throw new Error("Erro ao carregar vacinas");
      return res.json();
    }
  });

  const { data: dewormings, isLoading: isLoadingDewormings } = useQuery({
    queryKey: ["dewormings", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}/dewormings`);
      if (!res.ok) throw new Error("Erro ao carregar desparasitações");
      return res.json();
    }
  });

  const isLoading = isLoadingVaccines || isLoadingDewormings;

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Skeleton className="h-[400px] rounded-[3rem]" />
          <Skeleton className="h-[400px] rounded-[3rem]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        
        {/* VACCINATIONS COLUMN */}
        <div className="space-y-6">
          <div className="flex justify-between items-end px-4">
            <div className="group/title">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 group-hover/title:bg-emerald-500 group-hover/title:text-white transition-all duration-500 shadow-inner">
                  <Syringe size={16} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Plano de Vacinação</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-11 opacity-70">Imunização & Protocolos de Reforço</p>
            </div>
            
            <Dialog open={activeForm === "vaccine"} onOpenChange={(open) => !open && setActiveForm(null)}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setActiveForm("vaccine")}
                  className="rounded-2xl gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase text-[10px] tracking-widest px-6 h-12 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Plus size={16} strokeWidth={3} /> Nova Vacinação
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-slate-900">
                <div className="bg-emerald-600 p-8 text-white">
                  <DialogTitle className="text-2xl font-black tracking-tight uppercase">Protocolo de Vacinação</DialogTitle>
                  <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Administração de nova dose imunológica.</p>
                </div>
                <div className="p-8">
                  <VaccinationForm patientId={patientId} onSuccess={() => setActiveForm(null)} />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {vaccinations?.length > 0 ? (
              vaccinations.map((v: any) => {
                const isExpired = v.expiresAt && new Date(v.expiresAt) < new Date();
                return (
                  <div key={v.id} className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:scale-[1.02] transition-all shadow-sm">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                        isExpired ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10"
                      )}>
                        {isExpired ? <ShieldAlert size={24} /> : <Syringe size={24} />}
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{v.vaccineName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lote: {v.batchNumber || "—"}</span>
                          <span className="text-slate-200 dark:text-slate-800">|</span>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(v.appliedAt), "dd MMM yyyy", { locale: pt })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={cn(
                        "border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg mb-2",
                        isExpired ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      )}>
                        {isExpired ? "Expirada" : "Válida"}
                      </Badge>
                      {v.expiresAt && (
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Reforço: {format(new Date(v.expiresAt), "dd MMM yyyy", { locale: pt })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Syringe size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Sem registos de vacinação</p>
              </div>
            )}
          </div>
        </div>

        {/* DEWORMINGS COLUMN */}
        <div className="space-y-6">
          <div className="flex justify-between items-end px-4">
            <div className="group/title">
              <div className="flex items-center gap-3 mb-1">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover/title:bg-indigo-500 group-hover/title:text-white transition-all duration-500 shadow-inner">
                  <Bug size={16} strokeWidth={2.5} />
                </div>
                <h3 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Controlo Parasitário</h3>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-11 opacity-70">Desparasitação Interna & Externa</p>
            </div>
            
            <Dialog open={activeForm === "deworming"} onOpenChange={(open) => !open && setActiveForm(null)}>
              <DialogTrigger asChild>
                <Button 
                  onClick={() => setActiveForm("deworming")}
                  className="rounded-2xl gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest px-6 h-12 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
                >
                  <Plus size={16} strokeWidth={3} /> Registar
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl bg-white dark:bg-slate-900">
                <div className="bg-indigo-600 p-8 text-white">
                  <DialogTitle className="text-2xl font-black tracking-tight uppercase">Controlo Parasitário</DialogTitle>
                  <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-1 opacity-80">Registo de aplicação interna ou externa.</p>
                </div>
                <div className="p-8">
                  <DewormingForm patientId={patientId} onSuccess={() => setActiveForm(null)} />
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-4">
            {dewormings?.length > 0 ? (
              dewormings.map((d: any) => {
                const isExpired = d.expiresAt && new Date(d.expiresAt) < new Date();
                return (
                  <div key={d.id} className="p-6 rounded-[2.5rem] bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 flex items-center justify-between group hover:scale-[1.02] transition-all shadow-sm">
                    <div className="flex items-center gap-5">
                      <div className={cn(
                        "w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                        isExpired ? "bg-rose-50 text-rose-500 dark:bg-rose-500/10" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"
                      )}>
                        <Bug size={24} />
                      </div>
                      <div>
                        <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{d.productName}</h4>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge variant="ghost" className="text-[8px] font-black uppercase bg-slate-100 dark:bg-white/5 p-0 px-2 h-4">{d.type}</Badge>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{format(new Date(d.appliedAt), "dd MMM yyyy", { locale: pt })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={cn(
                        "border-none font-black text-[8px] uppercase tracking-widest px-3 py-1 rounded-lg mb-2",
                        isExpired ? "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400" : "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                      )}>
                        {isExpired ? "Expirada" : "Ativa"}
                      </Badge>
                      {d.expiresAt && (
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                          Validade: {format(new Date(d.expiresAt), "dd MMM yyyy", { locale: pt })}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-20 text-center bg-slate-50 dark:bg-slate-900/50 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
                <Bug size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em]">Sem registos de desparasitação</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Summary / Immunity Status Card */}
      <Card className="border-none shadow-2xl rounded-[3rem] bg-slate-900 text-white p-10 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <ShieldAlert size={120} />
        </div>
        <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Estado Preventivo</h3>
            <p className="text-slate-400 text-sm leading-relaxed max-w-md">
              O sistema monitoriza automaticamente as datas de reforço. 
              Mantenha o protocolo atualizado para garantir a máxima proteção do paciente e conformidade legal.
            </p>
          </div>
          <div className="flex gap-10">
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Próxima Vacina</span>
              <p className="text-xl font-black text-emerald-400">
                {vaccinations?.find((v: any) => v.expiresAt && new Date(v.expiresAt) > new Date()) 
                  ? format(new Date(vaccinations.find((v: any) => v.expiresAt && new Date(v.expiresAt) > new Date()).expiresAt), "dd MMM yyyy", { locale: pt })
                  : "Não Agendada"}
              </p>
            </div>
            <div className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-50">Próxima Desparasitação</span>
              <p className="text-xl font-black text-indigo-400">
                {dewormings?.find((d: any) => d.expiresAt && new Date(d.expiresAt) > new Date())
                  ? format(new Date(dewormings.find((d: any) => d.expiresAt && new Date(d.expiresAt) > new Date()).expiresAt), "dd MMM yyyy", { locale: pt })
                  : "Não Agendada"}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
