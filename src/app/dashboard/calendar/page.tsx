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

const VET_COLORS = ["blue","purple","emerald","orange","rose","indigo"];

const getTypeConfig = (type: string) => {
  switch (type?.toUpperCase()) {
    case "VACINA":    return { icon: Syringe,     color: "emerald", label: "Vacina" };
    case "CIRURGIA":  return { icon: Scissors,    color: "rose",    label: "Cirurgia" };
    case "URGÊNCIA":  return { icon: Zap,         color: "orange",  label: "Urgência" };
    case "CONSULTA":  return { icon: Stethoscope, color: "blue",    label: "Consulta" };
    default:          return { icon: Activity,    color: "slate",   label: "Geral" };
  }
};

const vetColorClass = (color: string) => {
  const map: Record<string, string> = {
    blue:    "border-blue-600 bg-blue-50/80 dark:bg-blue-900/40 text-blue-950 dark:text-blue-50 ring-1 ring-blue-200",
    purple:  "border-purple-600 bg-purple-50/80 dark:bg-purple-900/40 text-purple-950 dark:text-purple-50 ring-1 ring-purple-200",
    emerald: "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-900/40 text-emerald-950 dark:text-emerald-50 ring-1 ring-emerald-200",
    orange:  "border-orange-500 bg-orange-50/80 dark:bg-orange-900/40 text-orange-950 dark:text-orange-50 ring-1 ring-orange-200",
    rose:    "border-rose-600 bg-rose-50/80 dark:bg-rose-900/40 text-rose-950 dark:text-rose-50 ring-1 ring-rose-200",
    indigo:  "border-indigo-600 bg-indigo-50/80 dark:bg-indigo-900/40 text-indigo-950 dark:text-indigo-50 ring-1 ring-indigo-200",
    slate:   "border-slate-500 bg-slate-50 dark:bg-slate-900/20 text-slate-950 dark:text-slate-50 ring-1 ring-slate-200",
  };
  return map[color] ?? map.slate;
};

const dotClass = (color: string) => {
  const map: Record<string, string> = {
    blue: "bg-blue-500", purple: "bg-purple-500", emerald: "bg-emerald-500",
    orange: "bg-orange-400", rose: "bg-rose-500", indigo: "bg-indigo-500",
  };
  return map[color] ?? "bg-slate-400";
};

// ── Draggable appointment card ──────────────────────────────────────────────
function DraggableAppointment({ app, hour, config, vetColor, onClick, isOverlay }: any) {
  const { attributes, listeners, setNodeRef, style, isDragging } = useDraggable({
    id: app.id, data: { app },
  });

  if (isDragging && !isOverlay) {
    return <div ref={setNodeRef} className="opacity-10 h-full w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800" />;
  }

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(app); }}
      className={cn(
        "p-3 rounded-2xl h-full border-l-[4px] transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden mb-1 last:mb-0",
        vetColorClass(vetColor),
        isOverlay ? "scale-105 rotate-1 shadow-2xl cursor-grabbing ring-4 ring-blue-500/20 z-[1000]" : "hover:brightness-95 active:scale-95"
      )}
    >
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-1.5">
          <config.icon size={12} strokeWidth={4} />
          <span className="text-[8px] font-black uppercase tracking-widest">{config.label}</span>
        </div>
        <span className="text-[8px] font-black opacity-60">{hour}</span>
      </div>
      <div className="mt-1 relative z-10">
        <p className="font-black text-xs tracking-tight line-clamp-1">{app.patient?.name}</p>
        <p className="text-[9px] font-bold opacity-70 uppercase tracking-tighter line-clamp-1">{app.patient?.owner?.name}</p>
      </div>
      <div className="absolute -bottom-2 -right-2 opacity-5 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
        <config.icon size={60} strokeWidth={2} />
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
        "p-1 border-l border-slate-100 dark:border-slate-800/50 transition-all duration-200 min-h-[100px] flex flex-col gap-1 relative group/slot",
        isToday && "bg-blue-600/[0.02]",
        isOver && "bg-blue-600/10 ring-2 ring-inset ring-blue-600/20 z-40"
      )}
    >
      {children}
      {!children?.length && (
        <button
          onClick={() => onAddClick?.({ day, hour })}
          className="flex-1 opacity-0 group-hover/slot:opacity-100 flex items-center justify-center text-blue-400 hover:text-blue-600 transition-all active:scale-95 bg-slate-50 dark:bg-white/5 rounded-xl border border-dashed border-slate-200 dark:border-white/10"
        >
          <Plus size={20} strokeWidth={3} />
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

  // New appointment form state
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [newVetId, setNewVetId] = useState("");
  const [newType, setNewType] = useState("CONSULTA");
  const [newDuration, setNewDuration] = useState("30");

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }));

  // ── Week days (7 days Mon–Sun) ──────────────────────────────────────────
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

  // ── Fetch team (vets) ───────────────────────────────────────────────────
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
    return vet?.color ?? "slate";
  };

  // ── Fetch appointments ──────────────────────────────────────────────────
  const { data: rawAppointments = [], isLoading, refetch } = useQuery({
    queryKey: ["appointments", weekDays[0].fullDate, selectedVet],
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

  // ── Fetch patients (for search in modal) ───────────────────────────────
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

  // ── Create appointment mutation ─────────────────────────────────────────
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

  // ── Cancel appointment mutation ─────────────────────────────────────────
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

  // ── Drag end (reschedule) ───────────────────────────────────────────────
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
      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">

        {/* ── Top bar ──────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-white/5 p-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <CalendarDays size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Agenda Clínica</h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gestão de Marcações</p>
              </div>
            </div>

            {/* Week nav */}
            <div className="hidden xl:flex items-center gap-1 bg-slate-50 dark:bg-white/5 p-1 rounded-xl">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() - (view === "week" ? 7 : 1));
                setCurrentDate(d);
              }}><ChevronLeft size={16} strokeWidth={3} /></Button>
              <Button variant="ghost" size="sm" className="h-8 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest"
                onClick={() => setCurrentDate(new Date())}>Hoje</Button>
              <span className="px-3 font-black text-[10px] uppercase tracking-widest text-slate-900 dark:text-slate-300">
                {format(currentDate, "MMMM yyyy", { locale: pt })}
              </span>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() + (view === "week" ? 7 : 1));
                setCurrentDate(d);
              }}><ChevronRight size={16} strokeWidth={3} /></Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Vet filters — from API */}
            <div className="flex gap-2 border-r border-slate-100 dark:border-white/5 pr-4 overflow-x-auto max-w-[420px]">
              <button
                onClick={() => setSelectedVet("all")}
                className={cn("px-4 h-9 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                  selectedVet === "all" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-50 dark:bg-white/5 text-slate-400")}
              >Todos</button>
              {vets.map((vet: any) => (
                <button key={vet.id} onClick={() => setSelectedVet(vet.id)}
                  className={cn("px-4 h-9 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap",
                    selectedVet === vet.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-50 dark:bg-white/5 text-slate-400")}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full", dotClass(vet.color))} />
                  {vet.name.split(" ").slice(-1)[0]}
                </button>
              ))}
            </div>

            {/* View toggle */}
            <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-xl">
              {(["day", "week"] as const).map(v => (
                <Button key={v} variant="ghost"
                  className={cn("h-8 rounded-lg px-4 text-[9px] font-black uppercase tracking-widest",
                    view === v && "bg-white dark:bg-slate-800 shadow-sm text-blue-600")}
                  onClick={() => setView(v)}>{v === "day" ? "Dia" : "Semana"}</Button>
              ))}
            </div>

            <Button
              onClick={() => { setNewSlot(null); setIsAddOpen(true); }}
              className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black px-6 shadow-lg shadow-blue-500/20 gap-2 active:scale-95"
            >
              <Plus size={16} strokeWidth={3} />
              <span className="text-[10px] uppercase tracking-widest">Agendar</span>
            </Button>
          </div>
        </div>

        {/* ── Calendar grid ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950">
          {/* Day headers */}
          <div className={cn("grid sticky top-0 z-40 bg-white/90 dark:bg-slate-950/90 backdrop-blur-xl border-b border-slate-100 dark:border-white/5",
            `grid-cols-[70px_repeat(${colCount},1fr)]`)}>
            <div className="h-16 flex items-center justify-center border-r border-slate-100 dark:border-white/5">
              <RefreshCw className={cn("w-3.5 h-3.5 text-slate-300", isLoading && "animate-spin")} />
            </div>
            {activeDays.map(day => (
              <div key={day.fullDate}
                className={cn("h-16 flex flex-col items-center justify-center border-l border-slate-100 dark:border-white/5",
                  day.isToday && "bg-blue-600/[0.03]",
                  day.isSunday && "bg-slate-50/50 dark:bg-white/[0.01]")}
              >
                <span className={cn("text-[8px] font-black uppercase tracking-widest mb-0.5",
                  day.isToday ? "text-blue-600" : day.isSunday ? "text-slate-400" : "text-slate-400")}>
                  {day.shortName}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className={cn("text-xl font-black tracking-tighter",
                    day.isToday ? "text-blue-600" : "text-slate-900 dark:text-white")}>
                    {day.date}
                  </span>
                  <span className="text-[9px] font-bold text-slate-300 uppercase">{day.month}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Time rows */}
          <div className="relative">
            {hours.map(hour => (
              <div key={hour} className={cn("grid border-b border-slate-50 dark:border-white/[0.02]",
                `grid-cols-[70px_repeat(${colCount},1fr)]`)}>
                <div className="py-8 px-2 text-[9px] font-black text-slate-300 dark:text-slate-700 text-right pr-4 flex items-start justify-end sticky left-0 bg-white dark:bg-slate-950 z-10 border-r border-slate-50 dark:border-white/[0.02]">
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
            <div className="w-[200px] pointer-events-none opacity-90">
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
          <DialogContent className="sm:max-w-[460px] rounded-[2rem] p-8 bg-white dark:bg-slate-900 border-none shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                  <CalendarDays size={24} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black tracking-tighter uppercase">Nova Marcação</DialogTitle>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {newSlot ? `${newSlot.day} às ${newSlot.hour}` : "Selecione o horário"}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5">
              {/* Patient search */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Paciente</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    className="w-full h-12 pl-10 pr-4 rounded-2xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold text-sm focus:ring-2 focus:ring-blue-500/30 outline-none"
                    placeholder="Nome do paciente ou tutor..."
                    value={patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatient(null); }}
                  />
                </div>
                {filteredPatients.length > 0 && !selectedPatient && (
                  <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                    {filteredPatients.map((p: any) => (
                      <button key={p.id}
                        className="w-full text-left px-4 py-3 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-sm border-b border-slate-50 last:border-0 flex justify-between items-center"
                        onClick={() => { setSelectedPatient(p); setPatientSearch(p.name); }}
                      >
                        <span className="font-bold text-slate-800 dark:text-white">{p.name}</span>
                        <span className="text-slate-400 text-xs">{p.species} · {p.owner?.name}</span>
                      </button>
                    ))}
                  </div>
                )}
                {selectedPatient && (
                  <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/30 border border-blue-100 rounded-2xl px-4 py-2.5">
                    <span className="font-bold text-blue-800 dark:text-blue-200 text-sm">{selectedPatient.name}
                      <span className="text-blue-400 font-normal ml-2 text-xs">{selectedPatient.species} · {selectedPatient.owner?.name}</span>
                    </span>
                    <button onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}>
                      <X size={14} className="text-blue-400 hover:text-blue-600" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Vet */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Médico</label>
                  <Select value={newVetId} onValueChange={setNewVetId}>
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold text-xs">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {vets.map((v: any) => (
                        <SelectItem key={v.id} value={v.id} className="font-bold">{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type */}
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Tipo</label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="CONSULTA" className="font-bold">Consulta Geral</SelectItem>
                      <SelectItem value="VACINA" className="font-bold">Vacinação</SelectItem>
                      <SelectItem value="CIRURGIA" className="font-bold">Cirurgia</SelectItem>
                      <SelectItem value="URGÊNCIA" className="font-bold">Urgência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Duration + time slot */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Duração</label>
                  <Select value={newDuration} onValueChange={setNewDuration}>
                    <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      <SelectItem value="15" className="font-bold">15 min</SelectItem>
                      <SelectItem value="30" className="font-bold">30 min</SelectItem>
                      <SelectItem value="45" className="font-bold">45 min</SelectItem>
                      <SelectItem value="60" className="font-bold">1 hora</SelectItem>
                      <SelectItem value="90" className="font-bold">1h 30min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!newSlot && (
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Hora</label>
                    <Select onValueChange={(v) => setNewSlot({ day: format(new Date(), "yyyy-MM-dd"), hour: v })}>
                      <SelectTrigger className="h-12 rounded-2xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold text-xs">
                        <SelectValue placeholder="Hora..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {hours.map(h => <SelectItem key={h} value={h} className="font-bold">{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button
                className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95"
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
          <DialogContent className="sm:max-w-[560px] rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
            {selectedApp && (() => {
              const config = getTypeConfig(selectedApp.type);
              const vetColor = getVetColor(selectedApp.veterinarianId);
              const vet = vets.find((v: any) => v.id === selectedApp.veterinarianId);
              return (
                <div className="animate-in fade-in zoom-in-95 duration-300">
                  <div className="bg-slate-900 p-8 text-white">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <Badge className="bg-blue-600 text-white border-none font-black text-[9px] uppercase px-4 py-1.5 rounded-full">
                          {selectedApp.type ?? "Geral"}
                        </Badge>
                        <h2 className="text-3xl font-black tracking-tighter">{selectedApp.patient?.name}</h2>
                        <p className="text-slate-400 font-bold flex items-center gap-2">
                          <UserIcon size={14} className="text-blue-500" /> {selectedApp.patient?.owner?.name}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center">
                        <config.icon size={28} className="text-blue-400" />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Horário</span>
                        <p className="text-2xl font-black text-slate-900 dark:text-white">{format(new Date(selectedApp.startTime), "HH:mm")}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{format(new Date(selectedApp.startTime), "EEEE, dd MMM", { locale: pt })}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                        <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Médico</span>
                        <p className="text-lg font-black text-slate-900 dark:text-white line-clamp-2">{vet?.name ?? "—"}</p>
                      </div>
                    </div>

                    {/* Notifications row */}
                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-11 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 border-slate-100 dark:border-white/10"
                        onClick={() => toast.info("SMS enviado para " + selectedApp.patient?.owner?.name)}>
                        <MessageSquare size={15} /> SMS Lembrete
                      </Button>
                      <Button variant="outline" className="h-11 rounded-xl font-black text-[10px] uppercase tracking-widest gap-2 border-slate-100 dark:border-white/10"
                        onClick={() => toast.info("Email enviado")}>
                        <Mail size={15} /> Enviar Email
                      </Button>
                    </div>

                    {/* Actions */}
                    <Button
                      className="w-full h-14 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-blue-500/20 active:scale-95"
                      onClick={() => {
                        const patientId = typeof selectedApp.patientId === "object" ? selectedApp.patientId.id : selectedApp.patientId;
                        router.push(`/dashboard/consultations?patientId=${patientId}&appointmentId=${selectedApp.id}`);
                      }}
                    >
                      <Activity size={18} strokeWidth={3} /> Iniciar Consulta
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                      <Button variant="outline" className="h-12 rounded-2xl border-slate-100 dark:border-white/10 font-black text-[10px] uppercase tracking-widest dark:text-white"
                        onClick={() => { setSelectedApp(null); setNewSlot(null); setIsAddOpen(true); }}>
                        Remarcar
                      </Button>
                      <Button variant="outline"
                        className="h-12 rounded-2xl border-rose-100 font-black text-[10px] uppercase tracking-widest text-rose-500 hover:bg-rose-50"
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
