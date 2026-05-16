"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Bed, 
  Plus, 
  Activity, 
  Clock, 
  CheckCircle2, 
  Thermometer, 
  Heart, 
  ChevronRight, 
  ClipboardList, 
  AlertCircle, 
  RefreshCw, 
  Search,
  LayoutGrid,
  List,
  Users,
  Package,
  PawPrint,
  Stethoscope,
  ArrowUpRight,
  DoorOpen
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { HospitalizationMap } from "@/components/HospitalizationMap";
import Link from "next/link";

const TOTAL_BOXES = 8;

function vitalColor(tasks: any[]) {
  if (!tasks || tasks.length === 0) return "bg-green-500";
  const pending = tasks.filter((t) => t.status === "PENDING");
  const ratio = pending.length / tasks.length;
  if (ratio > 0.5) return "bg-red-500 animate-pulse";
  if (ratio > 0) return "bg-amber-400";
  return "bg-green-500";
}

function vitalLabel(tasks: any[]) {
  if (!tasks || tasks.length === 0) return "Estável";
  const pending = tasks.filter((t) => t.status === "PENDING");
  const ratio = pending.length / tasks.length;
  if (ratio > 0.5) return "Crítico";
  if (ratio > 0) return "Monitorização";
  return "Estável";
}

function StatCard({ label, value, icon: Icon, trend, color, bg }: any) {
  return (
    <Card className="border-none shadow-sm transition-all duration-300 group overflow-hidden bg-white dark:bg-card ring-1 ring-slate-100 dark:ring-white/10 rounded-2xl">
      <CardHeader className="flex flex-row items-start justify-between border-b pb-4">
        <div className={`p-4 rounded-2xl ${bg || 'bg-blue-50'} dark:bg-blue-500/10 ${color || 'text-blue-600'} group-hover:scale-110 group-hover:rotate-3 transition-all duration-500`}>
          <Icon size={26} strokeWidth={2.5} />
        </div>
        {trend && (
          <Badge variant="outline" className="text-[10px] font-bold border-slate-100 dark:border-white/10 text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2 py-1">
            {trend}
          </Badge>
        )}
      </CardHeader>
      <CardContent className="pt-4">
        <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</p>
        <p className="text-4xl font-bold text-slate-900 dark:text-slate-100 mt-2 tracking-tighter">{value}</p>
      </CardContent>
    </Card>
  );
}

function AdmitDialog({
  open,
  onClose,
  boxNumber,
}: {
  open: boolean;
  onClose: () => void;
  boxNumber: string;
}) {
  const queryClient = useQueryClient();
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [reason, setReason] = useState("");

  const { data: patients } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
  });

  const admit = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/hospitalization", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          boxNumber,
          reason,
        }),
      });
      if (!res.ok) throw new Error("Falha ao internar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitalization"] });
      toast.success(`${selectedPatient.name} internado com sucesso`);
      onClose();
      setSelectedPatient(null);
      setReason("");
      setPatientSearch("");
    },
    onError: () => toast.error("Erro ao internar paciente"),
  });

  const filteredPatients = (patients?.data ?? []).filter((p: any) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">
            Admitir Paciente — {boxNumber}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
              Paciente
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={16} />
              <Input
                className="pl-9 rounded-xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"
                placeholder="Procurar paciente..."
                value={patientSearch}
                onChange={(e) => {
                  setPatientSearch(e.target.value);
                  setSelectedPatient(null);
                }}
              />
            </div>
            {patientSearch && !selectedPatient && filteredPatients.length > 0 && (
              <div className="border-none shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-950 ring-1 ring-slate-100 dark:ring-white/5 animate-in fade-in zoom-in-95 duration-200">
                {filteredPatients.slice(0, 5).map((p: any) => (
                  <button
                    key={p.id}
                    className="w-full text-left px-5 py-4 hover:bg-slate-50 dark:hover:bg-slate-900 transition-all text-sm border-b border-slate-50 dark:border-white/5 last:border-0 group"
                    onClick={() => {
                      setSelectedPatient(p);
                      setPatientSearch(p.name);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        {p.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-slate-200 leading-none mb-1">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">
                          {p.species} <span className="mx-1 opacity-20">|</span> {p.owner?.name}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            {selectedPatient && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl px-4 py-3 text-sm">
                <span className="font-bold text-blue-800 dark:text-blue-400">{selectedPatient.name}</span>
                <span className="text-blue-500 dark:text-blue-500/70 ml-2 text-xs">
                  {selectedPatient.species} • {selectedPatient.owner?.name}
                </span>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              Motivo de Internamento
            </Label>
            <Textarea
              className="rounded-xl resize-none"
              placeholder="Descreva o motivo..."
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
          <Button
            className="w-full h-10 rounded-xl bg-blue-600 font-bold"
            disabled={!selectedPatient || !reason || admit.isPending}
            onClick={() => admit.mutate()}
          >
            {admit.isPending ? "A internar..." : "Confirmar Internamento"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function TaskItem({ task, onComplete }: { task: any; onComplete: (id: string) => void }) {
  const isDone = task.status === "COMPLETED";
  const isSkipped = task.status === "SKIPPED";
  return (
    <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 transition-colors">
      <div className="text-xs font-bold text-slate-400 dark:text-slate-500 w-12 shrink-0">
        {new Date(task.scheduledTime).toLocaleTimeString("pt-PT", {
          hour: "2-digit",
          minute: "2-digit",
        })}
      </div>
      <div className={`flex-1 font-bold text-sm ${isSkipped ? "line-through text-slate-400 dark:text-slate-600" : "text-slate-700 dark:text-slate-300"}`}>
        {task.description}
      </div>
      {isDone ? (
        <CheckCircle2 size={18} className="text-green-500 shrink-0" />
      ) : isSkipped ? (
        <span className="text-xs text-slate-400 dark:text-slate-600 shrink-0 uppercase font-bold tracking-tighter">Saltado</span>
      ) : (
        <Button
          size="sm"
          className="h-7 rounded-lg text-[10px] font-bold uppercase shrink-0 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400"
          onClick={() => onComplete(task.id)}
        >
          Fazer
        </Button>
      )}
    </div>
  );
}

function AddTaskDialog({
  open,
  onClose,
  hospitalizationId,
}: {
  open: boolean;
  onClose: () => void;
  hospitalizationId: string;
}) {
  const queryClient = useQueryClient();
  const [description, setDescription] = useState("");
  const [scheduledHour, setScheduledHour] = useState("08:00");

  const createTask = useMutation({
    mutationFn: async () => {
      const today = new Date();
      const [h, m] = scheduledHour.split(":");
      const scheduledTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), parseInt(h), parseInt(m)).toISOString();
      const res = await fetch("/api/hospitalization/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalizationId, description, scheduledTime }),
      });
      if (!res.ok) throw new Error("Falha");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitalization"] });
      toast.success("Tarefa adicionada ao plano");
      onClose();
      setDescription("");
      setScheduledHour("08:00");
    },
    onError: () => toast.error("Erro ao criar tarefa"),
  });

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0") + ":00");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[420px] rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900 dark:text-slate-100">Nova Tarefa</DialogTitle>
          <DialogDescription className="text-slate-400">Adicionar ao plano de tratamento.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-2">
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Descrição</Label>
            <Textarea
              className="rounded-xl resize-none"
              placeholder="Ex: Administrar Amoxicilina 50mg..."
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Hora Agendada</Label>
            <select
              value={scheduledHour}
              onChange={(e) => setScheduledHour(e.target.value)}
              className="w-full h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold text-sm px-4 outline-none"
            >
              {hours.map((h) => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
          <Button
            className="w-full h-10 rounded-xl bg-blue-600 font-bold"
            disabled={!description || createTask.isPending}
            onClick={() => createTask.mutate()}
          >
            {createTask.isPending ? "A criar..." : "Adicionar Tarefa"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default function InternamentoPage() {
  const queryClient = useQueryClient();
  const [selectedHosp, setSelectedHosp] = useState<any>(null);
  const [admitBox, setAdmitBox] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "list" | "map">("grid");
  const [selectedZone, setSelectedZone] = useState<string>("TODAS");
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);

  const zones = [
    { id: "TODAS", name: "Todas as Zonas", icon: LayoutGrid },
    { id: "CANIL", name: "Canil", icon: PawPrint },
    { id: "GATIL", name: "Gatil", icon: Heart },
    { id: "ISOLAMENTO", name: "Isolamento", icon: AlertCircle },
  ];

  const { data: hospitalizations = [], isLoading, isError, refetch } = useQuery({
    queryKey: ["hospitalization"],
    queryFn: async () => {
      const res = await fetch("/api/hospitalization");
      if (!res.ok) throw new Error("Falha ao carregar internamentos");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const completeTask = useMutation({
    mutationFn: async (taskId: string) => {
      const res = await fetch("/api/hospitalization/tasks", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId, status: "COMPLETED" }),
      });
      if (!res.ok) throw new Error("Falha");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["hospitalization"] });
      toast.success("Tarefa concluída");
    },
    onError: () => toast.error("Erro ao registar tarefa"),
  });

  const dischargePatient = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/hospitalization/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DISCHARGED" }),
      });
      if (!res.ok) throw new Error("Falha");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["hospitalization"] });
      toast.success(`${data.patient.name} teve alta com sucesso`);
      setSelectedHosp(null);
    },
    onError: () => toast.error("Erro ao dar alta"),
  });

  // Filter by zone (species-based)
  const filteredHospitalizations = useMemo(() => {
    if (selectedZone === "TODAS") return hospitalizations;
    if (selectedZone === "CANIL") return hospitalizations.filter((h: any) => h.patient?.species?.toLowerCase().includes("cão") || h.patient?.species?.toLowerCase().includes("can"));
    if (selectedZone === "GATIL") return hospitalizations.filter((h: any) => h.patient?.species?.toLowerCase().includes("gato") || h.patient?.species?.toLowerCase().includes("fel"));
    return hospitalizations;
  }, [hospitalizations, selectedZone]);

  // Real stats
  const stats = useMemo(() => {
    const filtered = selectedZone === "TODAS" ? hospitalizations : filteredHospitalizations;
    const criticos = filtered.filter((h: any) => vitalLabel(h.tasks || []) === "Crítico").length;
    const today = new Date().toISOString().split("T")[0];
    const tratamentosHoje = filtered.reduce((acc: number, h: any) => {
      return acc + (h.tasks || []).filter((t: any) => {
        if (t.status !== "COMPLETED") return false;
        const taskDate = new Date(t.completedAt || t.scheduledTime).toISOString().split("T")[0];
        return taskDate === today;
      }).length;
    }, 0);
    const aguardando = filtered.reduce((acc: number, h: any) => {
      return acc + (h.tasks || []).filter((t: any) => t.status === "PENDING").length;
    }, 0);
    return { criticos, tratamentosHoje, aguardando };
  }, [hospitalizations, filteredHospitalizations, selectedZone]);

  // Box calculation: track real occupied boxes
  const occupiedBoxNumbers = useMemo(() => {
    return hospitalizations.map((h: any) => h.boxNumber).filter(Boolean);
  }, [hospitalizations]);

  const emptyBoxes = useMemo(() => {
    const result: string[] = [];
    for (let i = 1; i <= TOTAL_BOXES; i++) {
      const label = `Box ${String(i).padStart(2, "0")}`;
      if (!occupiedBoxNumbers.includes(label)) result.push(label);
    }
    return result;
  }, [occupiedBoxNumbers]);

  const firstAvailableBox = emptyBoxes[0] || "Box 01";

  // Live sync for detail dialog
  const selectedHospLive = useMemo(() => {
    if (!selectedHosp) return null;
    return hospitalizations.find((h: any) => h.id === selectedHosp.id) ?? selectedHosp;
  }, [hospitalizations, selectedHosp]);

  return (
    <div className="max-w-[1600px] mx-auto space-y-6 animate-in fade-in duration-700 p-4 md:p-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Ocupação" value={`${hospitalizations.length}/${TOTAL_BOXES}`} icon={Bed} color="text-blue-600" bg="bg-blue-50" trend={`${Math.round((hospitalizations.length / TOTAL_BOXES) * 100)}% Capacidade`} />
        <StatCard label="Críticos" value={stats.criticos} icon={AlertCircle} color="text-rose-600" bg="bg-rose-50" trend="Atenção" />
        <StatCard label="Tratamentos Hoje" value={stats.tratamentosHoje} icon={Activity} color="text-emerald-600" bg="bg-emerald-50" trend="Concluídos" />
        <StatCard label="Aguardando" value={stats.aguardando} icon={Clock} color="text-amber-600" bg="bg-amber-50" trend="Pendentes" />
      </div>

      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">Internamento</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Gestão de boxes, planos de tratamento e monitorização 24h.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex mr-2">
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="sm"
              className={`rounded-lg font-bold text-[10px] uppercase gap-2 ${view === "grid" ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm hover:bg-white dark:hover:bg-slate-700' : 'text-slate-400 dark:text-slate-500'}`}
              onClick={() => setView("grid")}
            >
              <LayoutGrid size={14} /> Grelha
            </Button>
            <Button
              variant={view === "list" ? "default" : "ghost"}
              size="sm"
              className={`rounded-lg font-bold text-[10px] uppercase gap-2 ${view === "list" ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm hover:bg-white dark:hover:bg-slate-700' : 'text-slate-400 dark:text-slate-500'}`}
              onClick={() => setView("list")}
            >
              <List size={14} /> Lista
            </Button>
            <Button
              variant={view === "map" ? "default" : "ghost"}
              size="sm"
              className={`rounded-lg font-bold text-[10px] uppercase gap-2 ${view === "map" ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm hover:bg-white dark:hover:bg-slate-700' : 'text-slate-400 dark:text-slate-500'}`}
              onClick={() => setView("map")}
            >
              <Activity size={14} /> Mapa
            </Button>
          </div>
          <Button
            variant="outline"
            className="rounded-xl border-slate-200 dark:border-slate-800 font-bold gap-2 dark:text-slate-300"
            onClick={() => refetch()}
          >
            <RefreshCw size={16} /> Atualizar
          </Button>
          <Button
            className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none font-bold gap-2"
            onClick={() => setAdmitBox(firstAvailableBox)}
          >
            <Plus size={20} /> Admitir Paciente
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
        {zones.map((zone) => (
          <Button
            key={zone.id}
            variant="ghost"
            className={`rounded-2xl px-6 py-6 h-auto flex flex-col items-center gap-2 border-2 transition-all ${
              selectedZone === zone.id
                ? "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400"
                : "bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-200"
            }`}
            onClick={() => setSelectedZone(zone.id)}
          >
            <zone.icon size={20} />
            <span className="text-[10px] font-bold uppercase tracking-widest">{zone.name}</span>
          </Button>
        ))}
      </div>

      {isError && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-100 rounded-2xl text-red-700">
          <AlertCircle size={18} />
          <p className="font-bold text-sm">Erro ao carregar internamentos</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="ml-auto">
            Tentar novamente
          </Button>
        </div>
      )}

      {view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
                  <CardHeader className="pb-3">
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2 w-full rounded-full" />
                  </CardContent>
                </Card>
              ))
            : filteredHospitalizations.map((hosp: any) => {
                const tasks = hosp.tasks ?? [];
                const completed = tasks.filter((t: any) => t.status === "COMPLETED").length;
                const dotColor = vitalColor(tasks);
                const label = vitalLabel(tasks);
                return (
                  <Card
                    key={hosp.id}
                    className="border-none shadow-sm transition-all rounded-2xl overflow-hidden group cursor-pointer ring-1 ring-slate-100 dark:ring-white/10 bg-white dark:bg-slate-900 hover:ring-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 duration-500"
                    onClick={() => setSelectedHosp(hosp)}
                  >
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <Badge className="font-bold text-[10px] uppercase bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-none px-3 h-7 rounded-xl">
                        {hosp.boxNumber ?? "Box —"}
                      </Badge>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</span>
                        <div className={`w-2.5 h-2.5 rounded-full ${dotColor} ring-4 ring-white dark:ring-slate-900 shadow-sm`} />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                           <div className="w-14 h-10 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-900 dark:text-white font-bold text-xl shadow-inner">
                             {hosp.patient.name[0]}
                           </div>
                           <div>
                             <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none mb-1">{hosp.patient.name}</h3>
                             <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                               {hosp.patient.species}
                               {hosp.patient.breed ? ` • ${hosp.patient.breed}` : ""}
                             </p>
                           </div>
                        </div>
                        {tasks.length > 0 && (
                          <div className="space-y-2 bg-slate-50/50 dark:bg-slate-800/30 p-4 rounded-2xl border border-slate-100/50 dark:border-white/5">
                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">
                              <span>Tratamentos</span>
                              <span>{completed}/{tasks.length}</span>
                            </div>
                            <Progress
                              value={(completed / tasks.length) * 100}
                              className="h-1.5 bg-slate-100 dark:bg-slate-800"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex gap-3">
                            <Link href={`/dashboard/patients/${hosp.patientId}`} onClick={(e) => e.stopPropagation()} className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
                              <ArrowUpRight size={14} />
                            </Link>
                            <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400">
                              <Stethoscope size={14} />
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl px-4"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedHosp(hosp);
                            }}
                          >
                            Detalhes <ChevronRight size={12} className="ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

          {!isLoading &&
            emptyBoxes.map((boxLabel) => (
              <Card
                key={boxLabel}
                className="border-none bg-slate-50/30 dark:bg-slate-800/10 border-2 border-dashed border-slate-200 dark:border-white/5 shadow-none rounded-2xl overflow-hidden cursor-pointer hover:border-blue-500/30 hover:bg-blue-50/20 dark:hover:bg-blue-900/5 transition-all duration-500"
                onClick={() => setAdmitBox(boxLabel)}
              >
                <CardContent className="flex flex-col items-center justify-center py-12 text-slate-300 dark:text-slate-700 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-white dark:bg-slate-900 shadow-sm flex items-center justify-center ring-1 ring-slate-100 dark:ring-white/5">
                    <Bed size={28} strokeWidth={1.5} className="text-slate-200 dark:text-slate-800" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-600">{boxLabel}</p>
                    <p className="text-[10px] font-bold text-slate-300 dark:text-slate-700 uppercase tracking-widest mt-1">Disponível</p>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : view === "list" ? (
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/10">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-900">
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Status</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Box</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Paciente</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Proprietário</th>
                  <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-slate-400">Tratamentos</th>
                  <th className="px-8 py-5 text-right"></th>
                </tr>
              </thead>
              <tbody>
                {filteredHospitalizations.map((hosp: any) => (
                  <tr 
                    key={hosp.id} 
                    className="border-b border-slate-50 dark:border-white/5 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
                    onClick={() => setSelectedHosp(hosp)}
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${vitalColor(hosp.tasks || [])}`} />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{vitalLabel(hosp.tasks || [])}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                       <Badge variant="outline" className="rounded-lg font-bold text-[10px] border-slate-200 dark:border-white/10 text-slate-500 uppercase tracking-tighter">
                         {hosp.boxNumber}
                       </Badge>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-900 dark:text-white">
                          {hosp.patient.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white leading-none mb-1">{hosp.patient.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{hosp.patient.species} • {hosp.patient.breed}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-slate-700 dark:text-slate-300">{hosp.patient.owner?.name}</p>
                      <p className="text-[10px] text-slate-400 font-medium">{hosp.patient.owner?.phone}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <Progress 
                            value={((hosp.tasks?.filter((t:any) => t.status === "COMPLETED").length || 0) / (hosp.tasks?.length || 1)) * 100} 
                            className="w-24 h-1.5" 
                          />
                          <span className="text-[10px] font-bold text-slate-400 uppercase">
                            {hosp.tasks?.filter((t:any) => t.status === "COMPLETED").length || 0}/{hosp.tasks?.length || 0}
                          </span>
                       </div>
                    </td>
                    <td className="px-8 py-6 text-right">
                       <Button variant="ghost" size="icon" className="rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 text-slate-300 group-hover:text-blue-500 transition-colors">
                         <ChevronRight size={18} />
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <HospitalizationMap hospitalizations={filteredHospitalizations} />
      )}

      {/* Detail Dialog */}
      <Dialog open={!!selectedHosp} onOpenChange={() => setSelectedHosp(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
          {selectedHospLive && (
            <>
              <div className="bg-blue-600 p-8 text-white">
                <DialogHeader className="p-0">
                  <div className="flex justify-between items-start">
                    <div>
                      <Badge className="bg-white/20 text-white border-none mb-2">
                        {selectedHospLive.boxNumber ?? "Box —"}
                      </Badge>
                      <DialogTitle className="text-3xl font-bold">
                        {selectedHospLive.patient.name}
                      </DialogTitle>
                      <p className="text-blue-100 font-medium">
                        Internado em{" "}
                        {new Date(selectedHospLive.admissionDate).toLocaleDateString("pt-PT")} •{" "}
                        {selectedHospLive.reason}
                      </p>
                    </div>
                    <Link href={`/dashboard/patients/${selectedHospLive.patientId}`}>
                      <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md hover:bg-white/20 transition-colors">
                        <ArrowUpRight className="text-blue-200" size={24} />
                      </div>
                    </Link>
                  </div>
                </DialogHeader>
              </div>

              <div className="p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Plano de Tratamento
                  </h4>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 rounded-lg text-[10px] font-bold uppercase text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    onClick={() => setIsAddTaskOpen(true)}
                  >
                    <Plus size={14} className="mr-1" /> Adicionar
                  </Button>
                </div>

                {selectedHospLive.tasks?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedHospLive.tasks.map((task: any) => (
                      <TaskItem
                        key={task.id}
                        task={task}
                        onComplete={(id) => completeTask.mutate(id)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <ClipboardList size={32} strokeWidth={1.5} className="mx-auto mb-2" />
                    <p className="text-sm font-bold">Sem tarefas agendadas</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button 
                    className="flex-1 rounded-xl bg-rose-600 hover:bg-rose-700 font-bold h-10 gap-2"
                    disabled={dischargePatient.isPending}
                    onClick={() => dischargePatient.mutate(selectedHospLive.id)}
                  >
                    <DoorOpen size={18} />
                    {dischargePatient.isPending ? "A processar..." : "Dar Alta"}
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1 rounded-xl font-bold h-10 border-slate-200 dark:border-white/10 dark:text-white"
                    onClick={() => toast.info("Funcionalidade de biométricos em desenvolvimento")}
                  >
                    Registar Biométricos
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Admit Dialog */}
      {admitBox && (
        <AdmitDialog
          open={!!admitBox}
          onClose={() => setAdmitBox(null)}
          boxNumber={admitBox}
        />
      )}

      {/* Add Task Dialog */}
      {selectedHospLive && (
        <AddTaskDialog
          open={isAddTaskOpen}
          onClose={() => setIsAddTaskOpen(false)}
          hospitalizationId={selectedHospLive.id}
        />
      )}
    </div>
  );
}
