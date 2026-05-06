"use client";

import { useState } from "react";
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
  PawPrint
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
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { HospitalizationMap } from "@/components/HospitalizationMap";

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
  if (ratio > 0) return "Em tratamento";
  return "Estável";
}

function StatCard({ label, value, icon: Icon, trend, color }: any) {
  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div className={`p-3 rounded-2xl ${color} bg-opacity-10 dark:bg-opacity-20`}>
            <Icon className={color.replace('bg-', 'text-')} size={24} />
          </div>
          {trend && (
            <span className={`text-xs font-black ${trend.startsWith('+') ? 'text-emerald-500' : 'text-rose-500'}`}>
              {trend}
            </span>
          )}
        </div>
        <div className="mt-4">
          <h4 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</h4>
          <p className="text-3xl font-black text-slate-900 dark:text-slate-100 mt-1 tracking-tight">{value}</p>
        </div>
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

  const filteredPatients = (patients ?? []).filter((p: any) =>
    p.name.toLowerCase().includes(patientSearch.toLowerCase())
  );

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
        <DialogHeader>
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100">
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
              <div className="border border-slate-100 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm bg-white dark:bg-slate-950">
                {filteredPatients.slice(0, 5).map((p: any) => (
                  <button
                    key={p.id}
                    className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors text-sm border-b border-slate-50 dark:border-slate-800 last:border-0"
                    onClick={() => {
                      setSelectedPatient(p);
                      setPatientSearch(p.name);
                    }}
                  >
                    <span className="font-bold text-slate-800 dark:text-slate-200">{p.name}</span>
                    <span className="text-slate-400 dark:text-slate-500 ml-2 text-xs">
                      {p.species} • {p.owner?.name}
                    </span>
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
            className="w-full h-12 rounded-xl bg-blue-600 font-black"
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
      <div className="text-xs font-black text-slate-400 dark:text-slate-500 w-12 shrink-0">
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
        <span className="text-xs text-slate-400 dark:text-slate-600 shrink-0 uppercase font-black tracking-tighter">Saltado</span>
      ) : (
        <Button
          size="sm"
          className="h-7 rounded-lg text-[10px] font-black uppercase shrink-0 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-400"
          onClick={() => onComplete(task.id)}
        >
          Fazer
        </Button>
      )}
    </div>
  );
}

export default function HospitalizationPage() {
  const queryClient = useQueryClient();
  const [selectedHosp, setSelectedHosp] = useState<any>(null);
  const [admitBox, setAdmitBox] = useState<string | null>(null);
  const [view, setView] = useState<"grid" | "map">("grid");
  const [selectedZone, setSelectedZone] = useState<string>("TODAS");

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
    refetchInterval: 30000, // refresh every 30s
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
      // Also refresh the selected hosp detail
      if (selectedHosp) {
        const updated = hospitalizations.find((h: any) => h.id === selectedHosp.id);
        if (updated) setSelectedHosp(updated);
      }
      toast.success("Tarefa concluída");
    },
    onError: () => toast.error("Erro ao registar tarefa"),
  });

  // Build a grid: occupied boxes + empty slots up to TOTAL_BOXES
  const occupiedBoxNumbers = hospitalizations.map((h: any) => h.boxNumber).filter(Boolean);
  const emptyBoxes = Array.from({ length: TOTAL_BOXES - hospitalizations.length }, (_, i) => {
    let num = i + 1;
    while (occupiedBoxNumbers.includes(`Box ${String(num).padStart(2, "0")}`)) num++;
    return `Box ${String(hospitalizations.length + i + 1).padStart(2, "0")}`;
  });

  // After task completion, sync selected dialog
  const selectedHospLive = hospitalizations.find((h: any) => h.id === selectedHosp?.id) ?? selectedHosp;

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Internamento</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Gestão de boxes, planos de tratamento e monitorização 24h.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex mr-2">
            <Button
              variant={view === "grid" ? "default" : "ghost"}
              size="sm"
              className={`rounded-lg font-black text-[10px] uppercase gap-2 ${view === "grid" ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm hover:bg-white dark:hover:bg-slate-700' : 'text-slate-400 dark:text-slate-500'}`}
              onClick={() => setView("grid")}
            >
              <LayoutGrid size={14} /> Boxes
            </Button>
            <Button
              variant={view === "map" ? "default" : "ghost"}
              size="sm"
              className={`rounded-lg font-black text-[10px] uppercase gap-2 ${view === "map" ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm hover:bg-white dark:hover:bg-slate-700' : 'text-slate-400 dark:text-slate-500'}`}
              onClick={() => setView("map")}
            >
              <List size={14} /> Mapa
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
            className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 dark:shadow-none font-black gap-2"
            onClick={() => setAdmitBox("Box 01")}
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
            <span className="text-[10px] font-black uppercase tracking-widest">{zone.name}</span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {/* Occupied boxes */}
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="border-none shadow-sm rounded-3xl overflow-hidden">
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
            : (hospitalizations || []).map((hosp: any) => {
                const tasks = hosp.tasks ?? [];
                const completed = tasks.filter((t: any) => t.status === "COMPLETED").length;
                const dotColor = vitalColor(tasks);
                const label = vitalLabel(tasks);
                return (
                  <Card
                    key={hosp.id}
                    className="border-none shadow-sm transition-all rounded-3xl overflow-hidden group cursor-pointer ring-1 ring-slate-100 dark:ring-slate-800 bg-white dark:bg-slate-900 hover:ring-blue-100 dark:hover:ring-blue-900"
                    onClick={() => setSelectedHosp(hosp)}
                  >
                    <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
                      <Badge className="font-black text-[10px] uppercase bg-blue-100 text-blue-700 border-none">
                        {hosp.boxNumber ?? "Box —"}
                      </Badge>
                      <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">{hosp.patient.name}</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-tight">
                            {hosp.patient.species}
                            {hosp.patient.breed ? ` • ${hosp.patient.breed}` : ""}
                          </p>
                        </div>
                        {tasks.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                              <span>Tratamentos</span>
                              <span>{completed}/{tasks.length}</span>
                            </div>
                            <Progress
                              value={(completed / tasks.length) * 100}
                              className="h-1.5 bg-slate-100"
                            />
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex gap-2">
                            <Thermometer size={14} className="text-slate-300" />
                            <Heart size={14} className="text-slate-300" />
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 rounded-lg"
                          >
                            Ver Plano <ChevronRight size={12} />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

          {/* Empty boxes */}
          {!isLoading &&
            emptyBoxes.map((boxLabel) => (
              <Card
                key={boxLabel}
                className="border-none bg-slate-50/50 dark:bg-slate-800/10 border-2 border-dashed border-slate-200 dark:border-slate-800 shadow-none rounded-3xl overflow-hidden cursor-pointer hover:border-blue-200 dark:hover:border-blue-900 transition-colors"
                onClick={() => setAdmitBox(boxLabel)}
              >
                <CardContent className="flex flex-col items-center justify-center py-12 text-slate-300 space-y-2">
                  <Bed size={32} strokeWidth={1.5} />
                  <p className="text-xs font-bold uppercase tracking-widest">{boxLabel}</p>
                  <p className="text-xs text-slate-400">Disponível</p>
                </CardContent>
              </Card>
            ))}
        </div>
      ) : (
        <HospitalizationMap hospitalizations={hospitalizations || []} />
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
                      <DialogTitle className="text-3xl font-black">
                        {selectedHospLive.patient.name}
                      </DialogTitle>
                      <p className="text-blue-100 font-medium">
                        Internado em{" "}
                        {new Date(selectedHospLive.admissionDate).toLocaleDateString("pt-PT")} •{" "}
                        {selectedHospLive.reason}
                      </p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                      <Activity className="text-blue-200" size={24} />
                    </div>
                  </div>
                </DialogHeader>
              </div>

              <div className="p-8 space-y-6">
                {selectedHospLive.tasks?.length > 0 ? (
                  <div>
                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">
                      Plano de Tratamento
                    </h4>
                    <div className="space-y-3">
                      {selectedHospLive.tasks.map((task: any) => (
                        <TaskItem
                          key={task.id}
                          task={task}
                          onComplete={(id) => completeTask.mutate(id)}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-slate-400">
                    <ClipboardList size={32} strokeWidth={1.5} className="mx-auto mb-2" />
                    <p className="text-sm font-bold">Sem tarefas agendadas</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <Button className="flex-1 rounded-xl bg-blue-600 font-black h-12">
                    Nova Medicação
                  </Button>
                  <Button variant="outline" className="flex-1 rounded-xl font-black h-12">
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
    </div>
  );
}
