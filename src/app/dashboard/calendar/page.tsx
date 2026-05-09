"use client";

import { useState, useMemo, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, Clock, Plus, Stethoscope,
  RefreshCw, Activity, Syringe, Scissors, Zap, CalendarDays,
  User as UserIcon, Search, CheckCircle2, X, MessageSquare, Mail,
} from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  closestCorners, useDraggable, useDroppable,
} from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { format, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const hours = [
  "08:00","09:00","10:00","11:00","12:00","13:00",
  "14:00","15:00","16:00","17:00","18:00","19:00",
  "20:00","21:00","22:00","23:00",
];

const VET_COLORS = ["#3b82f6","#8b5cf6","#10b981","#f59e0b","#f43f5e","#6366f1"];

const getTypeConfig = (type: string) => {
  switch (type?.toUpperCase()) {
    case "VACINA":    return { icon: Syringe,     color: "#10b981", bg: "#ecfdf5", label: "Vacina" };
    case "CIRURGIA":  return { icon: Scissors,    color: "#f43f5e", bg: "#fff1f2", label: "Cirurgia" };
    case "URGÊNCIA":  return { icon: Zap,         color: "#f59e0b", bg: "#fffbeb", label: "Urgência" };
    case "CONSULTA":  return { icon: Stethoscope, color: "#3b82f6", bg: "#eff6ff", label: "Consulta" };
    default:          return { icon: Activity,    color: "#64748b", bg: "#f8fafc", label: "Geral" };
  }
};

// ── Draggable appointment card ──────────────────────────────────────────────
function DraggableAppointment({ app, hour, config, vetColor, onClick, isOverlay }: any) {
  const { attributes, listeners, setNodeRef, style, isDragging } = useDraggable({
    id: app.id, data: { app },
  });

  if (isDragging && !isOverlay) {
    return <div ref={setNodeRef} className="h-full w-full rounded-lg border-2 border-dashed border-blue-300 bg-blue-50/50" />;
  }

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(app); }}
      className={cn(
        "p-2.5 rounded-lg h-full border-l-[3px] transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden mb-1.5 last:mb-0 shadow-sm hover:shadow-md",
        isOverlay ? "scale-105 shadow-lg ring-2 ring-blue-400/30 z-50" : "hover:-translate-y-0.5 active:scale-[0.98]"
      )}
      style={{
        borderLeftColor: config.color,
        backgroundColor: config.bg,
      }}
    >
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded bg-white/60">
            <config.icon size={10} strokeWidth={2.5} style={{ color: config.color }} />
          </div>
          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: config.color }}>{config.label}</span>
        </div>
        <span className="text-[9px] font-medium text-slate-400 tabular-nums">{hour}</span>
      </div>
      <div className="mt-1.5 relative z-10">
        <p className="font-semibold text-sm text-slate-800 line-clamp-1 leading-tight">{app.patient?.name}</p>
        <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5">{app.patient?.owner?.name}</p>
      </div>
    </div>
  );
}

// ── Droppable time slot ─────────────────────────────────────────────────────
function DroppableSlot({ id, children, day, hour, isToday, onAddClick }: any) {
  const { setNodeRef, isOver } = useDroppable({ id, data: { day, hour } });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "p-1.5 border-l border-slate-100 transition-all min-h-[90px] flex flex-col gap-1.5 relative group/slot",
        isToday && "bg-blue-50/30",
        isOver && "bg-blue-100/50 ring-2 ring-inset ring-blue-400/30 rounded-md"
      )}
    >
      {children}
      {!children?.length && (
        <button
          onClick={() => onAddClick?.({ day, hour })}
          className="flex-1 opacity-0 group-hover/slot:opacity-100 flex items-center justify-center text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-all rounded-md border border-dashed border-slate-200"
        >
          <Plus size={16} />
        </button>
      )}
    </div>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVet, setSelectedVet] = useState<string>("all");
  const [view, setView] = useState<"week" | "day">("week");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newSlot, setNewSlot] = useState<{ day: string; hour: string } | null>(null);

  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [newVetId, setNewVetId] = useState("");
  const [newType, setNewType] = useState("CONSULTA");
  const [newDuration, setNewDuration] = useState("30");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 7 }).map((_, i) => {
      const d = addDays(start, i);
      return {
        name: format(d, "EEEE", { locale: pt }),
        shortName: format(d, "EEE", { locale: pt }),
        date: format(d, "dd"),
        month: format(d, "MMM", { locale: pt }),
        fullDate: format(d, "yyyy-MM-dd"),
        isToday: format(d, "yyyy-MM-dd") === format(new Date(), "yyyy-MM-dd"),
        isSunday: d.getDay() === 0,
      };
    });
  }, [currentDate]);

  const activeDays = view === "day"
    ? [weekDays.find(d => d.fullDate === format(currentDate, "yyyy-MM-dd")) || weekDays[0]]
    : weekDays;

  const { data: teamData = [] } = useQuery({
    queryKey: ["team"],
    queryFn: async () => {
      const res = await fetch("/api/team");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  const vets = teamData
    .filter((u: any) => ["VETERINARIAN", "ADMIN"].includes(u.role))
    .map((u: any, i: number) => ({ ...u, color: VET_COLORS[i % VET_COLORS.length] }));

  const getVetColor = (vetId: string) => {
    const vet = vets.find((v: any) => v.id === vetId);
    return vet?.color ?? "#64748b";
  };

  const { data: rawAppointments = [], isLoading, refetch } = useQuery({
    queryKey: ["appointments", weekDays[0]?.fullDate, selectedVet],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?start=${weekDays[0].fullDate}&end=${weekDays[6].fullDate}`);
      if (!res.ok) throw new Error("Erro ao carregar agenda");
      return res.json();
    },
    staleTime: 30000,
  });

  const groupedAppointments = useMemo(() => {
    const map = new Map<string, any[]>();
    rawAppointments.forEach((app: any) => {
      if (selectedVet !== "all" && app.veterinarianId !== selectedVet) return;
      const date = new Date(app.startTime);
      const key = `${format(date, "yyyy-MM-dd")}-${format(date, "HH:00")}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(app);
    });
    return map;
  }, [rawAppointments, selectedVet]);

  const { data: allPatients = [] } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients");
      if (!res.ok) return [];
      return res.json();
    },
    staleTime: 60000,
  });

  const filteredPatients = patientSearch.length > 1
    ? allPatients.filter((p: any) =>
        p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
        p.owner?.name?.toLowerCase().includes(patientSearch.toLowerCase())
      ).slice(0, 6)
    : [];

  const createAppointment = useMutation({
    mutationFn: async () => {
      if (!selectedPatient || !newVetId || !newSlot) throw new Error("Campos em falta");
      const startTime = `${newSlot.day}T${newSlot.hour}:00`;
      const endDate = new Date(startTime);
      endDate.setMinutes(endDate.getMinutes() + parseInt(newDuration));
      const endTime = endDate.toISOString();

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId: selectedPatient.id, veterinarianId: newVetId, startTime, endTime, type: newType }),
      });
      if (!res.ok) throw new Error("Erro ao criar marcação");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Marcação criada com sucesso");
      setIsAddOpen(false);
      setSelectedPatient(null);
      setPatientSearch("");
      setNewVetId("");
      setNewType("CONSULTA");
    },
    onError: (e: any) => toast.error(e.message || "Erro ao criar marcação"),
  });

  const cancelAppointment = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });
      if (!res.ok) throw new Error();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Marcação cancelada");
      setSelectedApp(null);
    },
    onError: () => toast.error("Erro ao cancelar"),
  });

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over || active.id === over.id) return;

    const [newDate, newHour] = over.id.split("T").length > 1
      ? [over.id.split("T")[0], over.id.split("T")[1]]
      : over.id.split(/-(?=\d{2}:\d{2}$)/);

    const slotKey = `${newDate}-${newHour}`;
    const [date, hour] = [over.data.current?.day, over.data.current?.hour];

    if (!date || !hour) return;

    try {
      const startTime = `${date}T${hour}:00`;
      const res = await fetch(`/api/appointments/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime }),
      });
      if (!res.ok) throw new Error();
      toast.success("Marcação reagendada");
      refetch();
    } catch {
      toast.error("Erro ao reagendar marcação");
    }
  };

  const activeApp = activeId ? rawAppointments.find((a: any) => a.id === activeId) : null;

  const colCount = activeDays.length;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToFirstScrollableAncestor]}
      collisionDetection={closestCorners}
    >
      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-white">

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div className="bg-white border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <CalendarDays size={18} />
              </div>
              <div>
                <h1 className="text-base font-semibold text-slate-900 leading-none">Agenda</h1>
                <p className="text-xs text-slate-500 mt-0.5">Gestão de Marcações</p>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() - (view === "week" ? 7 : 1));
                setCurrentDate(d);
              }}><ChevronLeft size={14} /></Button>
              <Button variant="ghost" size="sm" className="h-7 px-3 rounded-md text-xs font-medium"
                onClick={() => setCurrentDate(new Date())}>Hoje</Button>
              <span className="px-2 font-medium text-xs text-slate-700">
                {format(currentDate, "MMMM yyyy", { locale: pt })}
              </span>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-md" onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() + (view === "week" ? 7 : 1));
                setCurrentDate(d);
              }}><ChevronRight size={14} /></Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-1.5 border-r border-slate-200 pr-4 overflow-x-auto max-w-[400px]">
              <button
                onClick={() => setSelectedVet("all")}
                className={cn("px-3 h-8 rounded-lg text-xs font-medium transition-all",
                  selectedVet === "all" ? "bg-blue-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
              >Todos</button>
              {vets.map((vet: any) => (
                <button key={vet.id} onClick={() => setSelectedVet(vet.id)}
                  className={cn("px-3 h-8 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 whitespace-nowrap",
                    selectedVet === vet.id ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200")}
                >
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: vet.color }} />
                  {vet.name.split(" ").slice(-1)[0]}
                </button>
              ))}
            </div>

            <div className="flex bg-slate-100 p-0.5 rounded-lg">
              {(["day", "week"] as const).map(v => (
                <Button key={v} variant="ghost"
                  className={cn("h-7 rounded-md px-3 text-xs font-medium",
                    view === v && "bg-white shadow-sm text-blue-600")}
                  onClick={() => setView(v)}>{v === "day" ? "Dia" : "Semana"}</Button>
              ))}
            </div>

            <Button
              onClick={() => { setNewSlot(null); setIsAddOpen(true); }}
              className="h-8 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 gap-1.5 text-xs"
            >
              <Plus size={14} />
              <span>Agendar</span>
            </Button>
          </div>
        </div>

        {/* ── Calendar grid ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto bg-white">
          <div 
            className="grid sticky top-0 z-40 bg-white border-b border-slate-200"
            style={{ gridTemplateColumns: `60px repeat(${colCount}, 1fr)` }}
          >
            <div className="h-16 flex items-center justify-center border-r border-slate-100">
              <RefreshCw className={cn("w-3.5 h-3.5 text-slate-400", isLoading && "animate-spin")} />
            </div>
            {activeDays.map(day => (
              <div key={day.fullDate}
                className={cn("h-16 flex flex-col items-center justify-center border-l border-slate-100 transition-all relative",
                  day.isToday && "bg-blue-50/50",
                  day.isSunday && "bg-slate-50/50")}
              >
                {day.isToday && (
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-600" />
                )}
                <span className={cn("text-[10px] font-medium uppercase tracking-wide mb-0.5",
                  day.isToday ? "text-blue-600" : "text-slate-500")}>
                  {day.shortName}
                </span>
                <div className="flex items-center gap-1.5">
                  <div className={cn(
                    "flex items-center justify-center rounded-full w-7 h-7",
                    day.isToday ? "bg-blue-600 text-white" : ""
                  )}>
                    <span className={cn("text-sm font-semibold",
                      day.isToday ? "text-white" : "text-slate-800")}>
                      {day.date}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="relative">
            {hours.map(hour => (
              <div 
                key={hour} 
                className="grid border-b border-slate-100"
                style={{ gridTemplateColumns: `60px repeat(${colCount}, 1fr)` }}
              >
                <div className="py-6 px-2 text-xs font-medium text-slate-400 text-right pr-3 flex items-start justify-end sticky left-0 bg-white z-10 border-r border-slate-100">
                  {hour}
                </div>
                {activeDays.map(day => {
                  const apps = groupedAppointments.get(`${day.fullDate}-${hour}`);
                  return (
                    <DroppableSlot
                      key={`${day.fullDate}-${hour}`}
                      id={`${day.fullDate}-${hour}`}
                      day={day.fullDate}
                      hour={hour}
                      isToday={day.isToday}
                      onAddClick={(slot: any) => { setNewSlot(slot); setIsAddOpen(true); }}
                    >
                      {apps?.map((app: any) => (
                        <DraggableAppointment
                          key={app.id}
                          app={app}
                          hour={hour}
                          config={getTypeConfig(app.type)}
                          vetColor={getVetColor(app.veterinarianId)}
                          onClick={setSelectedApp}
                        />
                      ))}
                    </DroppableSlot>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeApp && (
            <div className="w-[180px] pointer-events-none">
              <DraggableAppointment
                app={activeApp}
                hour={format(new Date(activeApp.startTime), "HH:mm")}
                config={getTypeConfig(activeApp.type)}
                vetColor={getVetColor(activeApp.veterinarianId)}
                isOverlay
              />
            </div>
          )}
        </DragOverlay>

        {/* ── New appointment modal ─────────────────────────────────────── */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-xl p-6 bg-white border-none shadow-xl">
            <DialogHeader>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                  <CalendarDays size={18} />
                </div>
                <div>
                  <DialogTitle className="text-lg font-semibold">Nova Marcação</DialogTitle>
                  <p className="text-xs text-slate-500">
                    {newSlot ? `${newSlot.day} às ${newSlot.hour}` : "Selecione o horário"}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-600">Paciente</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                  <input
                    className="w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-200 font-medium text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 outline-none"
                    placeholder="Nome do paciente ou tutor..."
                    value={patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatient(null); }}
                  />
                </div>
                {filteredPatients.length > 0 && !selectedPatient && (
                  <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                    {filteredPatients.map((p: any) => (
                      <button key={p.id}
                        className="w-full text-left px-3 py-2.5 hover:bg-slate-50 transition-colors text-sm border-b border-slate-100 last:border-0 flex justify-between items-center"
                        onClick={() => { setSelectedPatient(p); setPatientSearch(p.name); }}
                      >
                        <span className="font-medium text-slate-800">{p.name}</span>
                        <span className="text-slate-500 text-xs">{p.species} · {p.owner?.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPatient && (
                  <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
                    <span className="font-medium text-blue-800 text-sm">{selectedPatient.name}
                      <span className="text-blue-500 font-normal ml-2 text-xs">{selectedPatient.species} · {selectedPatient.owner?.name}</span>
                    </span>
                    <button onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}>
                      <X size={14} className="text-blue-400 hover:text-blue-600" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Médico</label>
                  <Select value={newVetId} onValueChange={setNewVetId}>
                    <SelectTrigger className="h-10 rounded-lg bg-slate-50 border border-slate-200 font-medium text-xs">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      {vets.map((v: any) => (
                        <SelectItem key={v.id} value={v.id} className="font-medium">{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Tipo</label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="h-10 rounded-lg bg-slate-50 border border-slate-200 font-medium text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="CONSULTA" className="font-medium">Consulta Geral</SelectItem>
                      <SelectItem value="VACINA" className="font-medium">Vacinação</SelectItem>
                      <SelectItem value="CIRURGIA" className="font-medium">Cirurgia</SelectItem>
                      <SelectItem value="URGÊNCIA" className="font-medium">Urgência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-600">Duração</label>
                  <Select value={newDuration} onValueChange={setNewDuration}>
                    <SelectTrigger className="h-10 rounded-lg bg-slate-50 border border-slate-200 font-medium text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="15" className="font-medium">15 min</SelectItem>
                      <SelectItem value="30" className="font-medium">30 min</SelectItem>
                      <SelectItem value="45" className="font-medium">45 min</SelectItem>
                      <SelectItem value="60" className="font-medium">1 hora</SelectItem>
                      <SelectItem value="90" className="font-medium">1h 30min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!newSlot && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-600">Hora</label>
                    <Select onValueChange={(v) => setNewSlot({ day: format(new Date(), "yyyy-MM-dd"), hour: v })}>
                      <SelectTrigger className="h-10 rounded-lg bg-slate-50 border border-slate-200 font-medium text-xs">
                        <SelectValue placeholder="Hora..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {hours.map(h => <SelectItem key={h} value={h} className="font-medium">{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button
                className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs shadow-md shadow-blue-500/10"
                disabled={!selectedPatient || !newVetId || !newSlot || createAppointment.isPending}
                onClick={() => createAppointment.mutate()}
              >
                {createAppointment.isPending ? "A agendar..." : "Confirmar Agendamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Appointment detail modal ──────────────────────────────────── */}
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="sm:max-w-[480px] rounded-xl border-none shadow-xl p-0 overflow-hidden bg-white">
            {selectedApp && (() => {
              const config = getTypeConfig(selectedApp.type);
              const vet = vets.find((v: any) => v.id === selectedApp.veterinarianId);
              return (
                <div>
                  <div className="bg-slate-50 p-6 border-b border-slate-200">
                    <div className="flex justify-between items-start">
                      <div className="space-y-1.5">
                        <Badge className="font-medium text-xs px-2.5 py-0.5 rounded-full" style={{ backgroundColor: config.bg, color: config.color }}>
                          {selectedApp.type ?? "Geral"}
                        </Badge>
                        <h2 className="text-xl font-semibold text-slate-900">{selectedApp.patient?.name}</h2>
                        <p className="text-slate-500 font-medium text-sm flex items-center gap-1.5">
                          <UserIcon size={12} /> {selectedApp.patient?.owner?.name}
                        </p>
                      </div>
                      <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                        <config.icon size={18} style={{ color: config.color }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-xs font-medium text-slate-500 block mb-1">Horário</span>
                        <p className="text-lg font-semibold text-slate-900">{format(new Date(selectedApp.startTime), "HH:mm")}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{format(new Date(selectedApp.startTime), "EEEE, dd MMM", { locale: pt })}</p>
                      </div>
                      <div className="p-4 rounded-lg bg-slate-50 border border-slate-100">
                        <span className="text-xs font-medium text-slate-500 block mb-1">Médico</span>
                        <p className="text-sm font-semibold text-slate-900 line-clamp-2">{vet?.name ?? "—"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-9 rounded-lg font-medium text-xs gap-1.5 border-slate-200"
                        onClick={() => toast.info("SMS enviado para " + selectedApp.patient?.owner?.name)}>
                        <MessageSquare size={13} /> SMS
                      </Button>
                      <Button variant="outline" className="h-9 rounded-lg font-medium text-xs gap-1.5 border-slate-200"
                        onClick={() => toast.info("Email enviado")}>
                        <Mail size={13} /> Email
                      </Button>
                    </div>

                    <Button
                      className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm gap-2 shadow-md shadow-blue-500/10"
                      onClick={() => {
                        const patientId = typeof selectedApp.patientId === "object" ? selectedApp.patientId.id : selectedApp.patientId;
                        router.push(`/dashboard/consultations?patientId=${patientId}&appointmentId=${selectedApp.id}`);
                      }}
                    >
                      <Activity size={15} /> Iniciar Consulta
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" className="h-9 rounded-lg border-slate-200 font-medium text-xs"
                        onClick={() => { setSelectedApp(null); setNewSlot(null); setIsAddOpen(true); }}>
                        Remarcar
                      </Button>
                      <Button variant="outline"
                        className="h-9 rounded-lg border-rose-200 font-medium text-xs text-rose-600 hover:bg-rose-50"
                        disabled={cancelAppointment.isPending}
                        onClick={() => cancelAppointment.mutate(selectedApp.id)}>
                        {cancelAppointment.isPending ? "..." : "Cancelar"}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
}
