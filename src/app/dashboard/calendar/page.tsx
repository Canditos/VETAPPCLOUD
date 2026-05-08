"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus,
  MoreVertical,
  Stethoscope,
  RefreshCw,
  Activity,
  Syringe,
  Scissors,
  Zap,
  CheckCircle2,
  CalendarDays,
  PawPrint,
  User as UserIcon
} from "lucide-react";
import { 
  DndContext, 
  DragOverlay, 
  PointerSensor, 
  useSensor, 
  useSensors,
  closestCorners,
  useDraggable, 
  useDroppable 
} from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

const hours = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00", "19:00"];

const VETS = [
  { id: "v1", name: "Dr. Marco Cândido", color: "blue" },
  { id: "v2", name: "Dra. Ana Silva", color: "purple" },
  { id: "v3", name: "Dr. Roberto", color: "emerald" },
];

const getTypeConfig = (type: string) => {
  switch (type?.toUpperCase()) {
    case "VACINA": return { icon: Syringe, color: "emerald", label: "Vacina" };
    case "CIRURGIA": return { icon: Scissors, color: "rose", label: "Cirurgia" };
    case "URGÊNCIA": return { icon: Zap, color: "orange", label: "Urgência" };
    case "CONSULTA": return { icon: Stethoscope, color: "blue", label: "Consulta" };
    default: return { icon: Activity, color: "slate", label: "Geral" };
  }
};

const getVetColor = (vetId: string) => {
  const vet = VETS.find(v => v.id === vetId);
  switch (vet?.color) {
    case "blue": return "border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-950 dark:text-blue-50";
    case "purple": return "border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-950 dark:text-purple-50";
    case "emerald": return "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-950 dark:text-emerald-50";
    default: return "border-slate-500 bg-slate-50 dark:bg-slate-900/20 text-slate-950 dark:text-slate-50";
  }
};

function DraggableAppointment({ app, hour, config, onClick, isOverlay }: any) {
  const { attributes, listeners, setNodeRef, style, isDragging } = useDraggable({
    id: app.id,
    data: { app }
  });

  if (isDragging && !isOverlay) {
    return <div ref={setNodeRef} className="opacity-10 grayscale scale-95 h-full w-full rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800" />;
  }

  return (
    <div 
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick(app);
      }}
      className={cn(
        "p-4 rounded-[2rem] h-full border-l-[4px] transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden backdrop-blur-sm mb-2 last:mb-0 shadow-sm",
        getVetColor(app.veterinarianId),
        isOverlay 
          ? "scale-105 rotate-1 shadow-md bg-white dark:bg-slate-800 border-blue-600 ring-2 ring-blue-500/20 z-[1000] cursor-grabbing" 
          : "hover:scale-[1.01] active:scale-95 ring-1 ring-inset ring-black/5 dark:ring-white/5"
      )}
    >
      <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-2">
             <div className={cn("p-2 rounded-xl shadow-inner bg-white bg-opacity-20 dark:bg-slate-900 dark:bg-opacity-40")}>
               <config.icon size={16} strokeWidth={3} className={cn({
                 "text-blue-600 dark:text-blue-400": config.color === "blue",
                 "text-rose-600 dark:text-rose-400": config.color === "rose",
                 "text-emerald-600 dark:text-emerald-400": config.color === "emerald",
                 "text-orange-600 dark:text-orange-400": config.color === "orange",
               })} />
             </div>
             <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{config.label}</span>
          </div>
          <div className="flex items-center gap-1 bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-10 px-3 py-1 rounded-full">
            <Clock size={12} strokeWidth={3} className="opacity-60" />
            <span className="text-[10px] font-black">{hour}</span>
          </div>
      </div>

      <div className="mt-4 space-y-1 relative z-10">
        <p className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-tight line-clamp-1">{app.patient?.name}</p>
        <p className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-[0.1em] opacity-70 line-clamp-1">
          {app.patient?.owner?.name}
        </p>
      </div>

      <div className="mt-4 pt-4 border-t border-black border-opacity-5 dark:border-white dark:border-opacity-10 flex items-center justify-between relative z-10">
         <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-lg bg-blue-600 text-white flex items-center justify-center text-[10px] font-black shadow-sm">
               {app.vetName?.charAt(0)}
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{app.vetName || "Médico N-D"}</span>
         </div>
         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
      </div>

      <div className="absolute -bottom-4 -right-4 opacity-[0.03] dark:opacity-[0.08] group-hover:scale-125 transition-transform duration-700 pointer-events-none">
         <config.icon size={120} strokeWidth={1} />
      </div>
    </div>
  );
}

function DroppableSlot({ id, children, day, hour, isToday }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { day, hour }
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "p-2 border-l border-slate-100 dark:border-slate-800 transition-all duration-300 min-h-[140px] flex flex-col gap-2 relative",
        isToday ? "bg-blue-600/5 dark:bg-blue-400/5" : "bg-transparent",
        isOver && "bg-blue-600/10 dark:bg-blue-400/20 ring-2 ring-inset ring-blue-600/20 scale-[0.99] rounded-2xl z-40"
      )}
    >
      {isToday && (
        <div className="absolute top-0 right-0 w-1 h-1 bg-blue-600 rounded-full m-1 animate-ping" />
      )}
      {children}
      {!children?.length && (
        <button className="flex-1 opacity-0 group-hover:opacity-100 flex items-center justify-center text-blue-400 dark:text-blue-600 hover:text-blue-600 transition-all active:scale-95 bg-blue-50 dark:bg-slate-800 dark:bg-opacity-50 rounded-2xl border-2 border-dashed border-blue-200 dark:border-slate-700">
          <Plus size={24} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVet, setSelectedVet] = useState<string | "all">("all");
  const [view, setView] = useState<"week" | "day">("week");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        name: d.toLocaleDateString('pt-PT', { weekday: 'long' }),
        shortName: d.toLocaleDateString('pt-PT', { weekday: 'short' }),
        date: d.toLocaleDateString('pt-PT', { day: '2-digit' }),
        month: d.toLocaleDateString('pt-PT', { month: 'short' }),
        fullDate: d.toISOString().split('T')[0],
        isToday: d.toISOString().split('T')[0] === new Date().toISOString().split('T')[0]
      };
    });
  }, [currentDate]);

  const activeDays = view === "day" ? [weekDays.find(d => d.fullDate === currentDate.toISOString().split('T')[0]) || weekDays[0]] : weekDays;

  const { data: rawAppointments, isLoading, refetch } = useQuery({
    queryKey: ["appointments", weekDays[0].fullDate, selectedVet],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?start=${weekDays[0].fullDate}&end=${weekDays[5].fullDate}`);
      if (!res.ok) throw new Error("Erro ao carregar agenda");
      return res.json();
    },
    staleTime: 30000,
  });

  const groupedAppointments = useMemo(() => {
    const map = new Map();
    if (!rawAppointments) return map;

    rawAppointments.forEach((app: any) => {
      if (selectedVet !== "all" && app.veterinarianId !== selectedVet) return;
      const key = `${app.startDate}-${app.startTime}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(app);
    });
    return map;
  }, [rawAppointments, selectedVet]);

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      const appointmentId = active.id;
      const [newDate, newHour] = over.id.split('-');
      
      try {
        const res = await fetch(`/api/appointments/${appointmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            startDate: newDate,
            startTime: newHour
          }),
        });

        if (!res.ok) throw new Error();
        toast.success("Marcação reagendada com sucesso");
        refetch();
      } catch (error) {
        toast.error("Erro ao reagendar marcação");
      }
    }
  };

  const handleUpdateVet = async (appointmentId: string, vetId: string) => {
    try {
      const newVet = VETS.find(v => v.id === vetId);
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          veterinarianId: vetId,
          vetName: newVet?.name
        }),
      });

      if (!res.ok) throw new Error();
      toast.success(`Médico atualizado para ${newVet?.name}`);
      setSelectedAppointment(prev => prev ? { ...prev, veterinarianId: vetId, vetName: newVet?.name } : null);
      refetch();
    } catch (error) {
      toast.error("Erro ao atualizar médico");
    }
  };

  const handleSendNotification = async (type: string) => {
    toast.success(`Notificação ${type} enviada para o proprietário`);
  };

  const handleStartConsultation = (appointmentId: string, patientId: any) => {
    const finalPatientId = typeof patientId === 'object' ? patientId.id : patientId;
    router.push(`/dashboard/consultations?patientId=${finalPatientId}&appointmentId=${appointmentId}`);
  };

  const activeApp = activeId ? rawAppointments?.find((a: any) => a.id === activeId) : null;

  return (
    <DndContext 
      sensors={sensors} 
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
      modifiers={[restrictToFirstScrollableAncestor]}
      collisionDetection={closestCorners}
    >
      <div className="max-w-full mx-auto space-y-6 p-4 md:p-6 animate-premium">
        {/* Header Superior - Consolidado */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white dark:bg-slate-900 p-8 rounded-[3rem] shadow-sm ring-1 ring-slate-100 dark:ring-white/5">
          <div className="space-y-1">
            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">Agenda Mestre</h1>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest">
               <CalendarDays size={14} className="text-blue-600" />
               <span>Controlo Total de Consultórios</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* View Toggle */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
              <Button 
                variant="ghost"
                className={cn("rounded-xl px-5 font-black text-[10px] uppercase tracking-widest h-10", view === "day" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-400")}
                onClick={() => setView("day")}
              >
                Dia
              </Button>
              <Button 
                variant="ghost"
                className={cn("rounded-xl px-5 font-black text-[10px] uppercase tracking-widest h-10", view === "week" ? "bg-white dark:bg-slate-700 shadow-sm text-blue-600" : "text-slate-400")}
                onClick={() => setView("week")}
              >
                Semana
              </Button>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-500" onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() - (view === "week" ? 7 : 1));
                setCurrentDate(d);
              }}>
                <ChevronLeft size={20} strokeWidth={3} />
              </Button>
              <span className="px-4 font-black text-xs uppercase tracking-tighter min-w-[120px] text-center text-slate-700 dark:text-slate-300">
                {currentDate.toLocaleDateString('pt-PT', { month: 'short', year: 'numeric' })}
              </span>
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white dark:hover:bg-slate-700 text-slate-500" onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() + (view === "week" ? 7 : 1));
                setCurrentDate(d);
              }}>
                <ChevronRight size={20} strokeWidth={3} />
              </Button>
            </div>

            <Button className="h-12 rounded-2xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-6 shadow-sm transition-all active:scale-95">
              <Plus size={18} strokeWidth={3} />
              <span className="text-xs uppercase tracking-widest">Nova Marcação</span>
            </Button>
          </div>
        </div>

        {/* Filtros e Legenda - Compacto e Integrado */}
        <div className="grid lg:grid-cols-4 gap-4">
          <Card className="lg:col-span-3 border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] p-4 ring-1 ring-slate-100 dark:ring-white/5 flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 border-r border-slate-100 dark:border-slate-800 py-1 shrink-0">
              <UserIcon size={16} className="text-blue-600" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Médicos</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button 
                onClick={() => setSelectedVet("all")}
                className={cn(
                  "px-4 py-2 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2 ring-1",
                  selectedVet === "all" ? "bg-blue-600 text-white ring-blue-600 shadow-sm" : "bg-slate-50 dark:bg-slate-800 text-slate-500 ring-slate-100 dark:ring-slate-800"
                )}
              >
                Todos
              </button>
              {VETS.map(vet => (
                <button 
                  key={vet.id}
                  onClick={() => setSelectedVet(vet.id)}
                  className={cn(
                    "px-4 py-2 rounded-xl transition-all font-black text-[9px] uppercase tracking-widest flex items-center gap-2 ring-1",
                    selectedVet === vet.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 ring-slate-900 dark:ring-white shadow-sm" : "bg-slate-50 dark:bg-slate-800 text-slate-500 ring-slate-100 dark:ring-slate-800"
                  )}
                >
                  <div className={cn("w-1.5 h-1.5 rounded-full", {
                    "bg-blue-500": vet.color === "blue",
                    "bg-purple-500": vet.color === "purple",
                    "bg-emerald-500": vet.color === "emerald",
                  })} />
                  {vet.name}
                </button>
              ))}
            </div>
          </Card>

          <Card className="border-none shadow-sm bg-white dark:bg-slate-900 rounded-[2rem] p-4 ring-1 ring-slate-100 dark:ring-white/5 flex items-center justify-around">
            {["Consulta", "Cirurgia", "Vacina", "Urgência"].map(type => {
              const config = getTypeConfig(type);
              return (
                <div key={type} className="group relative cursor-help">
                  <config.icon size={18} className={cn({
                    "text-blue-500": config.color === "blue",
                    "text-rose-500": config.color === "rose",
                    "text-emerald-500": config.color === "emerald",
                    "text-orange-500": config.color === "orange",
                  })} />
                  <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 dark:bg-slate-800 text-white text-[8px] font-black rounded-md opacity-0 group-hover:opacity-100 transition-all scale-75 group-hover:scale-100 pointer-events-none whitespace-nowrap ring-1 ring-white/10">
                    {type}
                  </div>
                </div>
              );
            })}
          </Card>
        </div>

        {/* Main Calendar Grid */}
        <Card className="border-none shadow-sm overflow-hidden bg-white dark:bg-slate-900 rounded-[3rem] ring-1 ring-slate-100 dark:ring-white/5">
            <div className="p-0">
              {/* Header Dias */}
              <div className={cn(
                "grid border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-sm sticky top-0 z-30",
                view === "week" ? "grid-cols-[80px_repeat(6,1fr)]" : "grid-cols-[80px_1fr]"
              )}>
                <div className="p-4 border-r border-slate-100 dark:border-slate-800 flex items-center justify-center">
                  <button onClick={() => refetch()} className="text-slate-400 hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-white dark:hover:bg-slate-800">
                    <RefreshCw className={cn("w-4 h-4", isLoading && "animate-spin")} />
                  </button>
                </div>
                {activeDays.map((day: any) => (
                  <div key={day.fullDate} className={cn(
                    "p-4 text-center border-l border-slate-100 dark:border-slate-800 transition-all",
                    day.isToday ? "bg-blue-600 bg-opacity-5" : ""
                  )}>
                    <p className={cn(
                      "text-[9px] font-black uppercase tracking-[0.2em] mb-1",
                      day.isToday ? "text-blue-600" : "text-slate-400 dark:text-slate-500"
                    )}>{day.name}</p>
                    <div className="flex items-center justify-center gap-2">
                      <span className={cn(
                        "text-2xl font-black tracking-tighter leading-none",
                        day.isToday ? "text-blue-600" : "text-slate-900 dark:text-white"
                      )}>{day.date}</span>
                      <span className="text-[9px] font-bold text-slate-400 uppercase">{day.month}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Grid Body */}
              <div className="relative max-h-[900px] overflow-y-auto no-scrollbar scroll-smooth">
                {isLoading ? (
                  <div className="p-10 space-y-4">
                    <Skeleton className="h-20 w-full rounded-3xl" />
                    <Skeleton className="h-40 w-full rounded-3xl" />
                    <Skeleton className="h-40 w-full rounded-3xl" />
                  </div>
                ) : hours.map((hour) => (
                  <div key={hour} className={cn(
                    "grid border-b border-slate-50 dark:border-slate-800/50 group/row",
                    view === "week" ? "grid-cols-[80px_repeat(6,1fr)]" : "grid-cols-[80px_1fr]"
                  )}>
                    <div className="p-4 text-[10px] font-black text-slate-400 dark:text-slate-600 text-right bg-slate-50 dark:bg-slate-950 flex flex-col justify-center border-r border-slate-100 dark:border-slate-800">
                      <span>{hour}</span>
                    </div>
                    {activeDays.map((day: any) => {
                      const slotAppointments = groupedAppointments.get(`${day.fullDate}-${hour}`);

                      return (
                        <DroppableSlot 
                          key={`${day.fullDate}-${hour}`} 
                          id={`${day.fullDate}-${hour}`}
                          day={day.fullDate}
                          hour={hour}
                          isToday={day.isToday}
                        >
                          {slotAppointments?.map((app: any) => {
                            const config = getTypeConfig(app.type);
                            return (
                              <DraggableAppointment 
                                key={app.id}
                                app={app}
                                hour={hour}
                                config={config}
                                onClick={setSelectedAppointment}
                              />
                            );
                          })}
                        </DroppableSlot>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>

        <DragOverlay>
          {activeApp && (
            <div className="w-[300px] pointer-events-none opacity-90 drop-shadow-md">
              <DraggableAppointment 
                app={activeApp}
                hour={activeApp.startTime}
                config={getTypeConfig(activeApp.type)}
                isOverlay
              />
            </div>
          )}
        </DragOverlay>

        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="sm:max-w-[700px] rounded-[3rem] border-none shadow-xl p-0 overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-black ring-opacity-10">
            {selectedAppointment && (
              <>
                <div className="bg-slate-900 dark:bg-slate-950 p-10 text-white relative overflow-hidden">
                  <div className="flex justify-between items-start relative z-10">
                    <div className="space-y-4">
                      <Badge className="bg-blue-600 text-white border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                        {selectedAppointment.type}
                      </Badge>
                      <DialogTitle className="text-5xl font-black tracking-tighter leading-none">
                        {selectedAppointment.patient?.name}
                      </DialogTitle>
                      <p className="text-slate-400 font-bold text-xl flex items-center gap-2">
                        <UserIcon size={20} className="text-blue-500" /> {selectedAppointment.patient?.owner?.name}
                      </p>
                    </div>
                    <div className="bg-white/10 p-6 rounded-[2rem]">
                      <Clock size={40} className="text-blue-500" />
                    </div>
                  </div>
                  <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
                    <PawPrint size={300} strokeWidth={1} />
                  </div>
                </div>

                <div className="p-10 space-y-10">
                  <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Horário & Data</span>
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 space-y-1">
                        <p className="font-black text-3xl text-slate-900 dark:text-white">
                          {selectedAppointment.startTime}
                        </p>
                        <p className="text-xs font-bold text-slate-400 uppercase">
                          {format(new Date(selectedAppointment.startDate), "dd 'de' MMMM yyyy", { locale: pt })}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Médico Responsável</span>
                      <Select 
                        defaultValue={selectedAppointment.veterinarianId} 
                        onValueChange={(val) => handleUpdateVet(selectedAppointment.id, val)}
                      >
                        <SelectTrigger className="h-20 rounded-2xl bg-slate-50 dark:bg-slate-800 font-bold text-lg text-slate-900 dark:text-white flex items-center gap-3 border-none ring-1 ring-slate-100 dark:ring-slate-700">
                          <div className="flex items-center gap-3">
                            <div className={cn("w-3 h-3 rounded-full", {
                              "bg-blue-500": VETS.find(v => v.id === selectedAppointment.veterinarianId)?.color === "blue",
                              "bg-purple-500": VETS.find(v => v.id === selectedAppointment.veterinarianId)?.color === "purple",
                              "bg-emerald-500": VETS.find(v => v.id === selectedAppointment.veterinarianId)?.color === "emerald",
                            })} />
                            <SelectValue placeholder="Selecionar Médico" />
                          </div>
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-800 p-2">
                          {VETS.map(vet => (
                            <SelectItem key={vet.id} value={vet.id} className="rounded-xl font-bold py-3">
                              <div className="flex items-center gap-3">
                                <div className={cn("w-2 h-2 rounded-full", {
                                  "bg-blue-500": vet.color === "blue",
                                  "bg-purple-500": vet.color === "purple",
                                  "bg-emerald-500": vet.color === "emerald",
                                })} />
                                {vet.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="p-8 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20 space-y-6">
                    <div className="flex items-center justify-between">
                       <h4 className="text-[11px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                          Notificações ao Cliente
                       </h4>
                       <Badge variant="outline" className="border-indigo-200 text-indigo-600 text-[9px] font-black">AUTO-RECALL</Badge>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <Button 
                         onClick={() => handleSendNotification("SMS")}
                         className="h-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-transparent hover:border-indigo-500 text-slate-900 dark:text-white font-black flex items-center gap-3 shadow-sm transition-all"
                       >
                          <Zap size={18} className="text-indigo-500" /> SMS Alerta
                       </Button>
                       <Button 
                         onClick={() => handleSendNotification("EMAIL")}
                         className="h-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-transparent hover:border-indigo-500 text-slate-900 dark:text-white font-black flex items-center gap-3 shadow-sm transition-all"
                       >
                          <Activity size={18} className="text-indigo-500" /> Email Memo
                       </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Button 
                      className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-lg gap-3 shadow-xl shadow-blue-200 dark:shadow-none transition-all active:scale-[0.98]"
                      onClick={() => handleStartConsultation(selectedAppointment.id, selectedAppointment.patientId)}
                    >
                      <Activity size={24} />
                      Iniciar Consulta Médica
                    </Button>
                    <div className="grid grid-cols-2 gap-4">
                      <Button variant="outline" className="h-14 rounded-2xl border-slate-200 dark:border-slate-700 font-black uppercase text-[10px] tracking-widest dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800">
                        Remarcar
                      </Button>
                      <Button variant="outline" className="h-14 rounded-2xl border-slate-200 dark:border-slate-700 font-black uppercase text-[10px] tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30">
                        Cancelar Marcação
                      </Button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
}
