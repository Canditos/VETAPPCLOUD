"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus,
  Stethoscope,
  RefreshCw,
  Activity,
  Syringe,
  Scissors,
  Zap,
  CalendarDays,
  PawPrint,
  User as UserIcon,
  Search,
  CheckCircle2,
  AlertCircle
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
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

// Extended hours until midnight for full clinical coverage
const hours = [
  "08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", 
  "16:00", "17:00", "18:00", "19:00", "20:00", "21:00", "22:00", "23:00", "00:00"
];

const VETS = [
  { id: "v1", name: "Dr. Marco Cândido", color: "blue", specialty: "Clinical Lead" },
  { id: "v2", name: "Dra. Ana Silva", color: "purple", specialty: "Surgery" },
  { id: "v3", name: "Dr. João Pedro", color: "emerald", specialty: "Internal Med" },
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
    case "blue": return "border-blue-600 bg-blue-50/80 dark:bg-blue-900/40 text-blue-950 dark:text-blue-50 ring-1 ring-blue-200 dark:ring-blue-800/50";
    case "purple": return "border-purple-600 bg-purple-50/80 dark:bg-purple-900/40 text-purple-950 dark:text-purple-50 ring-1 ring-purple-200 dark:ring-purple-800/50";
    case "emerald": return "border-emerald-600 bg-emerald-50/80 dark:bg-emerald-900/40 text-emerald-950 dark:text-emerald-50 ring-1 ring-emerald-200 dark:ring-emerald-800/50";
    default: return "border-slate-500 bg-slate-50 dark:bg-slate-900/20 text-slate-950 dark:text-slate-50 ring-1 ring-slate-200";
  }
};

function DraggableAppointment({ app, hour, config, onClick, isOverlay }: any) {
  const { attributes, listeners, setNodeRef, style, isDragging } = useDraggable({
    id: app.id,
    data: { app }
  });

  if (isDragging && !isOverlay) {
    return <div ref={setNodeRef} className="opacity-10 h-full w-full rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800" />;
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
        "p-3 rounded-2xl h-full border-l-[4px] transition-all cursor-grab active:cursor-grabbing group relative overflow-hidden mb-1 last:mb-0",
        getVetColor(app.veterinarianId),
        isOverlay 
          ? "scale-105 rotate-1 shadow-2xl bg-white dark:bg-slate-800 border-blue-600 ring-4 ring-blue-500/20 z-[1000] cursor-grabbing" 
          : "hover:brightness-95 active:scale-95"
      )}
    >
      <div className="flex justify-between items-start relative z-10">
          <div className="flex items-center gap-1.5">
             <config.icon size={12} strokeWidth={4} className={cn({
               "text-blue-600 dark:text-blue-400": config.color === "blue",
               "text-rose-600 dark:text-rose-400": config.color === "rose",
               "text-emerald-600 dark:text-emerald-400": config.color === "emerald",
               "text-orange-600 dark:text-orange-400": config.color === "orange",
             })} />
             <span className="text-[8px] font-black uppercase tracking-widest">{config.label}</span>
          </div>
          <span className="text-[8px] font-black opacity-60">{hour}</span>
      </div>

      <div className="mt-1 relative z-10">
        <p className="font-black text-slate-900 dark:text-white text-xs tracking-tight line-clamp-1">{app.patient?.name}</p>
        <p className="text-[9px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-tighter opacity-80 line-clamp-1">
          {app.patient?.owner?.name}
        </p>
      </div>

      <div className="absolute -bottom-2 -right-2 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform duration-500 pointer-events-none">
         <config.icon size={60} strokeWidth={2} />
      </div>
    </div>
  );
}

function DroppableSlot({ id, children, day, hour, isToday, onAddClick }: any) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
    data: { day, hour }
  });

  return (
    <div 
      ref={setNodeRef}
      className={cn(
        "p-1 border-l border-slate-100 dark:border-slate-800/50 transition-all duration-200 min-h-[100px] flex flex-col gap-1 relative group/slot",
        isToday ? "bg-blue-600/[0.02] dark:bg-blue-400/[0.02]" : "bg-transparent",
        isOver && "bg-blue-600/10 dark:bg-blue-400/10 ring-2 ring-inset ring-blue-600/20 z-40"
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

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVet, setSelectedVet] = useState<string | "all">("all");
  const [view, setView] = useState<"week" | "day">("week");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newAppSlot, setNewAppSlot] = useState<{ day: string; hour: string } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const weekDays = useMemo(() => {
    // Start of week (Monday)
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 6 }).map((_, i) => {
      const d = addDays(start, i);
      return {
        name: format(d, 'EEEE', { locale: pt }),
        shortName: format(d, 'EEE', { locale: pt }),
        date: format(d, 'dd'),
        month: format(d, 'MMM', { locale: pt }),
        fullDate: format(d, 'yyyy-MM-dd'),
        isToday: format(d, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')
      };
    });
  }, [currentDate]);

  const activeDays = view === "day" ? [weekDays.find(d => d.fullDate === format(currentDate, 'yyyy-MM-dd')) || weekDays[0]] : weekDays;

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
      
      const date = new Date(app.startTime);
      const dayKey = format(date, 'yyyy-MM-dd');
      const hourKey = format(date, 'HH:00');
      
      const key = `${dayKey}-${hourKey}`;
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
        const fullStartTime = `${newDate}T${newHour}:00Z`;
        const res = await fetch(`/api/appointments/${appointmentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            startTime: fullStartTime
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
      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden">
        
        {/* TOP BAR: Controls and Filters (Optimized for Total Space) */}
        <div className="bg-white dark:bg-slate-950 border-b border-slate-100 dark:border-white/5 p-4 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                <CalendarDays size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Agenda Clínica</h1>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Medical Management System</p>
              </div>
            </div>

            <div className="hidden xl:flex items-center gap-1 bg-slate-50 dark:bg-white/5 p-1 rounded-xl">
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() - (view === "week" ? 7 : 1));
                  setCurrentDate(d);
                }}>
                  <ChevronLeft size={16} strokeWidth={3} />
               </Button>
               <span className="px-4 font-black text-[10px] uppercase tracking-widest text-slate-900 dark:text-slate-300">
                  {format(currentDate, "MMMM yyyy", { locale: pt })}
               </span>
               <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => {
                  const d = new Date(currentDate);
                  d.setDate(d.getDate() + (view === "week" ? 7 : 1));
                  setCurrentDate(d);
                }}>
                  <ChevronRight size={16} strokeWidth={3} />
               </Button>
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Vet Filters in Top Bar */}
             <div className="flex gap-2 mr-4 border-r border-slate-100 dark:border-white/5 pr-4 overflow-x-auto no-scrollbar max-w-[400px]">
                <button 
                  onClick={() => setSelectedVet("all")}
                  className={cn(
                    "px-4 h-9 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all",
                    selectedVet === "all" ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-50 dark:bg-white/5 text-slate-400"
                  )}
                >
                  Todos
                </button>
                {VETS.map(vet => (
                  <button 
                    key={vet.id}
                    onClick={() => setSelectedVet(vet.id)}
                    className={cn(
                      "px-4 h-9 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all flex items-center gap-2",
                      selectedVet === vet.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900" : "bg-slate-50 dark:bg-white/5 text-slate-400"
                    )}
                  >
                    <div className={cn("w-1.5 h-1.5 rounded-full", {
                      "bg-blue-500": vet.color === "blue",
                      "bg-purple-500": vet.color === "purple",
                      "bg-emerald-500": vet.color === "emerald",
                    })} />
                    {vet.name.split(' ')[1]}
                  </button>
                ))}
             </div>

             <div className="flex bg-slate-50 dark:bg-white/5 p-1 rounded-xl">
               <Button 
                  variant="ghost" 
                  className={cn("h-8 rounded-lg px-4 text-[9px] font-black uppercase tracking-widest", view === "day" && "bg-white dark:bg-slate-800 shadow-sm text-blue-600")}
                  onClick={() => setView("day")}
               >Dia</Button>
               <Button 
                  variant="ghost" 
                  className={cn("h-8 rounded-lg px-4 text-[9px] font-black uppercase tracking-widest", view === "week" && "bg-white dark:bg-slate-800 shadow-sm text-blue-600")}
                  onClick={() => setView("week")}
               >Semana</Button>
             </div>

             <Button 
                onClick={() => setIsAddModalOpen(true)}
                className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black px-6 shadow-lg shadow-blue-500/20 gap-2 transition-all active:scale-95"
             >
                <Plus size={16} strokeWidth={3} />
                <span className="text-[10px] uppercase tracking-widest">Agendar</span>
             </Button>
          </div>
        </div>

        {/* CALENDAR GRID CORE */}
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-950 no-scrollbar">
           <div className={cn(
             "grid sticky top-0 z-40 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-100 dark:border-white/5",
             view === "week" ? "grid-cols-[70px_repeat(6,1fr)]" : "grid-cols-[70px_1fr]"
           )}>
              <div className="h-16 flex items-center justify-center border-r border-slate-100 dark:border-white/5">
                 <RefreshCw className={cn("w-3.5 h-3.5 text-slate-300", isLoading && "animate-spin")} />
              </div>
              {activeDays.map(day => (
                <div key={day.fullDate} className={cn(
                  "h-16 flex flex-col items-center justify-center border-l border-slate-100 dark:border-white/5",
                  day.isToday && "bg-blue-600/[0.03]"
                )}>
                   <span className={cn("text-[8px] font-black uppercase tracking-widest mb-0.5", day.isToday ? "text-blue-600" : "text-slate-400")}>
                      {day.name}
                   </span>
                   <div className="flex items-center gap-1.5">
                      <span className={cn("text-xl font-black tracking-tighter", day.isToday ? "text-blue-600" : "text-slate-900 dark:text-white")}>
                        {day.date}
                      </span>
                      <span className="text-[9px] font-bold text-slate-300 uppercase">{day.month}</span>
                   </div>
                </div>
              ))}
           </div>

           {/* Grid Body */}
           <div className="relative">
              {hours.map(hour => (
                <div key={hour} className={cn(
                  "grid border-b border-slate-50 dark:border-white/[0.02]",
                  view === "week" ? "grid-cols-[70px_repeat(6,1fr)]" : "grid-cols-[70px_1fr]"
                )}>
                   <div className="py-8 px-2 text-[9px] font-black text-slate-300 dark:text-slate-700 text-right pr-4 flex items-start justify-end sticky left-0 bg-white dark:bg-slate-950 z-10 border-r border-slate-50 dark:border-white/[0.02]">
                      {hour}
                   </div>
                   {activeDays.map(day => {
                     const slotAppointments = groupedAppointments.get(`${day.fullDate}-${hour}`);
                     return (
                       <DroppableSlot 
                         key={`${day.fullDate}-${hour}`} 
                         id={`${day.fullDate}-${hour}`}
                         day={day.fullDate}
                         hour={hour}
                         isToday={day.isToday}
                         onAddClick={(slot: any) => {
                           setNewAppSlot(slot);
                           setIsAddModalOpen(true);
                         }}
                       >
                         {slotAppointments?.map((app: any) => (
                           <DraggableAppointment 
                             key={app.id}
                             app={app}
                             hour={hour}
                             config={getTypeConfig(app.type)}
                             onClick={setSelectedAppointment}
                           />
                         ))}
                       </DroppableSlot>
                     );
                   })}
                </div>
              ))}
           </div>
        </div>

        {/* Drag Overlay */}
        <DragOverlay>
          {activeApp && (
            <div className="w-[200px] pointer-events-none opacity-90">
              <DraggableAppointment 
                app={activeApp}
                hour={activeApp.startTime}
                config={getTypeConfig(activeApp.type)}
                isOverlay
              />
            </div>
          )}
        </DragOverlay>

        {/* Modals */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="sm:max-w-[450px] rounded-[2.5rem] p-10 bg-white dark:bg-slate-900 border-none shadow-2xl">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-blue-50 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center text-blue-600">
                  <CalendarDays size={28} />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-black tracking-tighter uppercase">Nova Marcação</DialogTitle>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    {newAppSlot ? `${newAppSlot.day} @ ${newAppSlot.hour}` : "Selecione horário"}
                  </p>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-6">
               <div className="space-y-2">
                 <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Identificar Paciente</label>
                 <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input className="w-full h-14 pl-12 pr-6 rounded-2xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold text-sm focus:ring-2 focus:ring-blue-500/20 outline-none" placeholder="Nome do paciente ou proprietário..." />
                 </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Médico Responsável</label>
                    <Select>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold text-xs uppercase tracking-tighter">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {VETS.map(v => <SelectItem key={v.id} value={v.id} className="font-bold">{v.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Tipo de Serviço</label>
                    <Select>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold text-xs uppercase tracking-tighter">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        <SelectItem value="CONSULTA" className="font-bold">CONSULTA GERAL</SelectItem>
                        <SelectItem value="VACINA" className="font-bold">VACINAÇÃO</SelectItem>
                        <SelectItem value="CIRURGIA" className="font-bold">CIRURGIA</SelectItem>
                        <SelectItem value="URGÊNCIA" className="font-bold">URGÊNCIA</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
               </div>

               <Button className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20" onClick={() => {
                 toast.error("Integração com PatientDB pendente.");
                 setIsAddModalOpen(false);
               }}>
                 Confirmar Agendamento
               </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
          <DialogContent className="sm:max-w-[600px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-black/5">
            {selectedAppointment && (
              <div className="animate-in fade-in zoom-in-95 duration-300">
                <div className="bg-slate-900 p-10 text-white relative">
                   <div className="flex justify-between items-start">
                      <div className="space-y-3">
                         <Badge className="bg-blue-600 text-white border-none font-black text-[9px] uppercase px-4 py-1.5 rounded-full">{selectedAppointment.type}</Badge>
                         <h2 className="text-4xl font-black tracking-tighter leading-none">{selectedAppointment.patient?.name}</h2>
                         <p className="text-slate-400 font-bold text-lg flex items-center gap-2">
                           <UserIcon size={16} className="text-blue-500" /> {selectedAppointment.patient?.owner?.name}
                         </p>
                      </div>
                      <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center">
                         <Clock size={32} className="text-blue-500" />
                      </div>
                   </div>
                </div>

                <div className="p-10 space-y-8">
                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                         <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Horário Marcado</span>
                         <p className="text-2xl font-black text-slate-900 dark:text-white">{format(new Date(selectedAppointment.startTime), "HH:mm")}</p>
                         <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{format(new Date(selectedAppointment.startTime), "EEEE, dd MMM", { locale: pt })}</p>
                      </div>
                      <div className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                         <span className="text-[9px] font-black text-slate-400 uppercase block mb-1 tracking-widest">Médico</span>
                         <p className="text-xl font-black text-slate-900 dark:text-white line-clamp-1">{selectedAppointment.vetName || "N/A"}</p>
                         <Badge variant="ghost" className="text-[8px] font-bold text-blue-500 p-0">Ver Perfil Médico</Badge>
                      </div>
                   </div>

                   <div className="p-8 rounded-[2.5rem] bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-500/20">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-indigo-600 dark:text-indigo-400 mb-4 flex items-center gap-2">
                         <Zap size={14} /> Telemetria de Notificações
                      </h4>
                      <div className="grid grid-cols-2 gap-3">
                         <Button variant="outline" className="h-12 rounded-xl bg-white dark:bg-slate-800 border-none shadow-sm text-[10px] font-black uppercase tracking-widest">Enviar SMS Lembrete</Button>
                         <Button variant="outline" className="h-12 rounded-xl bg-white dark:bg-slate-800 border-none shadow-sm text-[10px] font-black uppercase tracking-widest">Mandar Email</Button>
                      </div>
                   </div>

                   <div className="space-y-4">
                      <Button 
                        className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm uppercase tracking-widest gap-3 shadow-xl shadow-blue-500/20 transition-all active:scale-95"
                        onClick={() => handleStartConsultation(selectedAppointment.id, selectedAppointment.patientId)}
                      >
                         <Activity size={20} strokeWidth={3} /> Iniciar Procedimento Clínico
                      </Button>
                      <div className="grid grid-cols-2 gap-4">
                         <Button variant="outline" className="h-14 rounded-2xl border-slate-100 dark:border-white/10 font-black text-[10px] uppercase tracking-widest dark:text-white">Remarcar</Button>
                         <Button variant="outline" className="h-14 rounded-2xl border-slate-100 dark:border-white/10 font-black text-[10px] uppercase tracking-widest text-rose-500 hover:bg-rose-50">Cancelar</Button>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
}
