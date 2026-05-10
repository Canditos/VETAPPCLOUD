"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
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
    return <div ref={setNodeRef} className="opacity-20 h-full w-full rounded-2xl border-2 border-dashed border-blue-500/50 bg-blue-50/50 dark:bg-blue-500/10" />;
  }

  return (
    <div
      ref={setNodeRef} style={style} {...attributes} {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick(app); }}
      className={cn(
        "p-3 rounded-xl h-full border-l-4 transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden mb-1.5 last:mb-0 shadow-sm",
        isOverlay ? "scale-105 rotate-1 shadow-2xl cursor-grabbing ring-4 ring-blue-500/20 z-[1000]" : "hover:shadow-md hover:-translate-y-0.5 active:scale-95"
      )}
      style={{
        borderLeftColor: config.color,
        backgroundColor: `color-mix(in srgb, ${config.color}, transparent 92%)`,
      }}
    >
      <div className="flex justify-between items-start relative z-10">
        <div className="flex items-center gap-1.5">
          <div className="p-1 rounded-md bg-white/60 dark:bg-black/40 shadow-sm">
            <config.icon size={11} strokeWidth={3} style={{ color: config.color }} />
          </div>
          <span className="text-[8px] font-black uppercase tracking-[0.15em]" style={{ color: config.color }}>{config.label}</span>
        </div>
        <span className="text-[8px] font-black opacity-40 tabular-nums dark:text-white/60">{hour}</span>
      </div>
      <div className="mt-2 relative z-10">
        <p className="font-black text-[12px] tracking-tight line-clamp-1 leading-tight text-slate-900 dark:text-white">{app.patient?.name}</p>
        <p className="text-[9px] font-bold opacity-60 uppercase tracking-tighter line-clamp-1 mt-0.5 text-slate-500 dark:text-slate-400">{app.patient?.owner?.name}</p>
      </div>
      {/* Background Micro-Icon */}
      <div className="absolute -bottom-1 -right-1 opacity-10 group-hover:opacity-20 transition-all duration-700 pointer-events-none -rotate-12 group-hover:rotate-0">
        <config.icon size={45} strokeWidth={1.5} style={{ color: config.color }} />
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
        "p-2 border-l border-slate-100 dark:border-white/[0.04] transition-all duration-300 min-h-[110px] flex flex-col gap-1.5 relative group/slot",
        isToday && "bg-blue-600/[0.015] dark:bg-blue-400/[0.01]",
        isOver && "bg-blue-600/10 ring-2 ring-inset ring-blue-600/30 z-40 scale-[1.01] rounded-lg shadow-lg shadow-blue-500/10 dark:shadow-none"
      )}
    >
      {children}
      {!children?.length && (
        <button
          onClick={() => onAddClick?.({ day, hour })}
          className="flex-1 opacity-0 group-hover/slot:opacity-100 flex items-center justify-center text-blue-400/40 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all active:scale-90 rounded-xl border-2 border-dashed border-slate-100 dark:border-white/5"
        >
          <Plus size={24} strokeWidth={2.5} />
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
  const [now, setNow] = useState<Date | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

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
    .filter((u: any) => ["VETERINARIAN", "ADMIN", "RECEPTIONIST"].includes(u.role))
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
      try {
        const date = new Date(app.startTime);
        if (isNaN(date.getTime())) return;
        const key = `${format(date, "yyyy-MM-dd")}-${format(date, "HH:00")}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(app);
      } catch (e) {
        console.error("Error formatting appointment date:", e);
      }
    });
    return map;
  }, [rawAppointments, selectedVet]);

  const { data: patientsResponse } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients?limit=200");
      if (!res.ok) return { data: [] };
      return res.json();
    },
    staleTime: 60000,
  });

  // API returns { data: [], pagination: {} } — extract the array safely
  const allPatients: any[] = Array.isArray(patientsResponse)
    ? patientsResponse
    : (patientsResponse?.data ?? []);

  const filteredPatients = patientSearch.length > 1
    ? allPatients.filter((p: any) =>
        p.name?.toLowerCase().includes(patientSearch.toLowerCase()) ||
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
      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-slate-50/30 dark:bg-slate-950">
        {/* ── Top Bar ─────────────────────────────────────────────────── */}
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 p-5 flex flex-wrap items-center justify-between gap-6 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
                <Stethoscope size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Agenda Clínica</h1>
                <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mt-1.5">Gestão de Marcações e Fluxo</p>
              </div>
            </div>

            <div className="flex items-center gap-4 bg-slate-100/50 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-inner">
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() - (view === "week" ? 7 : 1));
                  setCurrentDate(d);
                }} className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-all text-slate-600 dark:text-slate-400">
                  <ChevronLeft size={18} strokeWidth={3} />
                </Button>
                <Button variant="ghost" onClick={() => setCurrentDate(new Date())} className="h-9 px-4 font-black text-[10px] uppercase tracking-widest hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-slate-900 dark:text-white">
                  Hoje
                </Button>
                <Button variant="ghost" size="icon" onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() + (view === "week" ? 7 : 1));
                  setCurrentDate(d);
                }} className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-all text-slate-600 dark:text-slate-400">
                  <ChevronRight size={18} strokeWidth={3} />
                </Button>
              </div>
              <div className="h-4 w-px bg-slate-200 dark:bg-white/10 mx-2" />
              <span className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-widest px-2 min-w-[140px] text-center">
                {format(currentDate, "MMMM yyyy", { locale: pt })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Vet filters */}
            <div className="flex gap-2 border-r border-slate-200/60 dark:border-white/10 pr-6 overflow-x-auto max-w-[500px] no-scrollbar">
              <button
                onClick={() => setSelectedVet("all")}
                className={cn("px-5 h-10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-sm",
                  selectedVet === "all" ? "bg-blue-600 text-white" : "bg-white dark:bg-white/5 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10")}
              >Todos</button>
              {vets.map((vet: any) => (
                <button key={vet.id} onClick={() => setSelectedVet(vet.id)}
                  className={cn("px-5 h-10 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 whitespace-nowrap shadow-sm border border-transparent",
                    selectedVet === vet.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white" : "bg-white dark:bg-white/5 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10")}
                >
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]" style={{ backgroundColor: vet.color }} />
                  {vet.name.split(" ").slice(-1)[0]}
                </button>
              ))}
            </div>

            <div className="flex bg-slate-100/50 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
              <button onClick={() => setView("day")} className={cn("px-5 h-9 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all", view === "day" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}>Dia</button>
              <button onClick={() => setView("week")} className={cn("px-5 h-9 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all", view === "week" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}>Semana</button>
            </div>

            <Button onClick={() => { setNewSlot(null); setIsAddOpen(true); }} className="h-12 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2">
              <Plus size={18} strokeWidth={3} />
              Agendar
            </Button>
          </div>
        </div>

        {/* ── Calendar grid ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto bg-white/50 dark:bg-slate-950/50">
          {/* Day headers */}
          <div 
            className="grid sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200/60 dark:border-white/10 shadow-sm"
            style={{ gridTemplateColumns: `80px repeat(${colCount}, 1fr)` }}
          >
            <div className="h-24 flex items-center justify-center border-r border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
              <RefreshCw className={cn("w-4 h-4 text-slate-400 dark:text-slate-600", isLoading && "animate-spin")} />
            </div>
            {activeDays.map(day => (
              <div key={day.fullDate}
                className={cn("h-24 flex flex-col items-center justify-center border-l border-slate-200/40 dark:border-white/5 transition-all relative overflow-hidden",
                  day.isToday && "bg-blue-600/[0.04] dark:bg-blue-400/[0.02]",
                  day.isSunday && "bg-slate-50/50 dark:bg-white/[0.02]")}
              >
                {day.isToday && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.4)]" />
                )}
                <span className={cn("text-[10px] font-black uppercase tracking-[0.25em] mb-2",
                  day.isToday ? "text-blue-600" : "text-slate-400 dark:text-slate-500")}>
                  {day.name}
                </span>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center justify-center rounded-2xl transition-all duration-500",
                    day.isToday ? "bg-blue-600 text-white w-12 h-12 shadow-lg shadow-blue-500/30" : ""
                  )}>
                    <span className={cn("text-2xl font-black tracking-tighter leading-none",
                      day.isToday ? "text-white" : "text-slate-900 dark:text-white")}>
                      {day.date}
                    </span>
                  </div>
                  <span className={cn("text-[10px] font-black uppercase tracking-widest",
                    day.isToday ? "text-blue-600" : "text-slate-400 dark:text-slate-600")}>
                    {day.month}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="relative">
            {/* Now Indicator Line */}
            {mounted && now && activeDays.some(d => d.isToday) && (
              <div 
                className="absolute left-0 right-0 z-30 pointer-events-none transition-all duration-1000"
                style={{ 
                  top: `${((now.getHours() - 8) * 60 + now.getMinutes()) * (128 / 60) + 1}px`,
                  display: now.getHours() >= 8 && now.getHours() < 24 ? "block" : "none"
                }}
              >
                <div className="flex items-center">
                  <div className="w-20 pr-3 flex justify-end">
                    <span className="bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg shadow-rose-500/30 animate-pulse uppercase tracking-widest">Agora</span>
                  </div>
                  <div className="flex-1 h-0.5 bg-rose-500/40 relative">
                    <div className="absolute -left-1 -top-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 ring-4 ring-rose-500/20 shadow-lg shadow-rose-500/40" />
                  </div>
                </div>
              </div>
            )}

            {hours.map(hour => (
              <div 
                key={hour} 
                className="grid border-b border-slate-200/40 dark:border-white/[0.03] group/row"
                style={{ gridTemplateColumns: `80px repeat(${colCount}, 1fr)` }}
              >
                <div className="py-12 px-2 text-[10px] font-black text-slate-400 dark:text-slate-600 text-right pr-6 flex items-start justify-end sticky left-0 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md z-10 border-r border-slate-200/60 dark:border-white/10 group-hover/row:bg-slate-100 dark:group-hover/row:bg-slate-800/80 transition-colors shadow-[4px_0_12px_-4px_rgba(0,0,0,0.05)] dark:shadow-none">
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
                hour={activeApp?.startTime ? format(new Date(activeApp.startTime), "HH:mm") : "--:--"}
                config={getTypeConfig(activeApp?.type)}
                vetColor={getVetColor(activeApp?.veterinarianId)}
                onClick={() => {}}
                isOverlay
              />
            </div>
          )}
        </DragOverlay>

        {/* ── New appointment modal ─────────────────────────────────────── */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-[420px] rounded-3xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl">
            <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                  <CalendarDays size={22} strokeWidth={2.5} />
                </div>
                <div>
                  <DialogTitle className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter">Nova Marcação</DialogTitle>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">
                    {newSlot
                      ? `${format(new Date(newSlot.day), "d 'de' MMMM", { locale: pt })} às ${newSlot.hour}`
                      : "Selecione o horário"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Paciente</label>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={16} />
                  <input
                    className="w-full h-12 pl-12 pr-4 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 font-bold text-sm text-slate-900 dark:text-white focus:ring-4 focus:ring-blue-500/10 focus:border-blue-400 outline-none transition-all"
                    placeholder="Procurar paciente..."
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
          <DialogContent className="sm:max-w-[480px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
            {selectedApp && (() => {
              const config = getTypeConfig(selectedApp.type);
              const vet = vets.find((v: any) => v.id === selectedApp.veterinarianId);
              return (
                <div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-8 border-b border-slate-200 dark:border-white/10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <Badge className="font-black text-[9px] px-3 py-1 rounded-full uppercase tracking-widest shadow-sm" style={{ backgroundColor: config.color, color: "#fff" }}>
                          {selectedApp.type ?? "Geral"}
                        </Badge>
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{selectedApp.patient?.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center gap-2 uppercase tracking-wide">
                          <UserIcon size={14} strokeWidth={3} className="text-blue-600" /> {selectedApp.patient?.owner?.name}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl ring-1 ring-slate-200 dark:ring-white/10">
                        <config.icon size={24} strokeWidth={2.5} style={{ color: config.color }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-inner">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Horário</span>
                        <p className="text-xl font-black text-slate-900 dark:text-white tabular-nums">{format(new Date(selectedApp.startTime), "HH:mm")}</p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 uppercase tracking-tighter">{format(new Date(selectedApp.startTime), "EEEE, dd MMM", { locale: pt })}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-inner">
                        <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-2">Médico</span>
                        <p className="text-sm font-black text-slate-900 dark:text-white line-clamp-2 uppercase tracking-tight">{vet?.name ?? "—"}</p>
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
