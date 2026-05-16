"use client";

import { useState, useMemo, useCallback, useEffect, Suspense } from "react";
import {
  ChevronLeft, ChevronRight, Clock, Plus, Stethoscope,
  RefreshCw, Activity, Syringe, Scissors, Zap, CalendarDays,
  User as UserIcon, Search, CheckCircle2, X, MessageSquare, Mail, PawPrint,
} from "lucide-react";
import {
  DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
  rectIntersection, pointerWithin, useDraggable, useDroppable, MeasuringStrategy,
} from "@dnd-kit/core";
import { restrictToFirstScrollableAncestor } from "@dnd-kit/modifiers";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogHeader } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as _Cal } from "@/components/ui/calendar";
const Calendar = _Cal as any;
import { format, startOfWeek, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { isFeatureEnabled } from "@/lib/features";

// 30-min slots 08:00 → 23:30
const halfHours: string[] = [];
for (let h = 8; h < 24; h++) {
  halfHours.push(`${String(h).padStart(2,'0')}:00`);
  halfHours.push(`${String(h).padStart(2,'0')}:30`);
}
const SLOT_H = 44; // px per 30-min slot

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

// ── Draggable appointment card (absolutely positioned, duration-aware) ────────
function AppCard({ app, config, onClick, isOverlay, topPx, heightPx }: any) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id, data: { app } });
  const compact = (heightPx ?? SLOT_H) < 56;
  if (isDragging && !isOverlay) return <div ref={setNodeRef} style={{ position:'absolute', top: topPx, height: heightPx, left:3, right:3, visibility:'hidden' }} />;
  const cardStyle: React.CSSProperties = isOverlay
    ? { borderLeftColor: config.color, backgroundColor: `color-mix(in srgb,${config.color},transparent 85%)` }
    : { position:'absolute', top: topPx, height: (heightPx??SLOT_H)-2, left:3, right:3, borderLeftColor: config.color, backgroundColor: `color-mix(in srgb,${config.color},transparent 88%)` };
  return (
    <div ref={setNodeRef} style={cardStyle} {...attributes} {...listeners}
      onClick={e => { e.stopPropagation(); onClick(app); }}
      className={cn('rounded-md border-l-[3px] cursor-grab select-none overflow-hidden px-2 flex flex-col justify-center gap-0.5 shadow-sm hover:shadow-md hover:z-20 z-10 transition-shadow',
        isOverlay && 'scale-105 shadow-2xl cursor-grabbing ring-2 ring-blue-500/30 z-[1000] rounded-lg w-52')}>
      <div className="flex items-center gap-1">
        <config.icon size={9} strokeWidth={3} style={{color:config.color}} className="shrink-0" />
        <span className="font-bold text-[11px] truncate dark:text-white text-slate-800 leading-none flex-1">{app.patient?.name}</span>
        <span className="text-[9px] text-slate-400 dark:text-slate-500 shrink-0 tabular-nums">{format(new Date(app.startTime),'HH:mm')}</span>
      </div>
      {!compact && <span className="text-[9px] text-slate-500 dark:text-slate-400 truncate">{app.patient?.owner?.name}</span>}
    </div>
  );
}

// ── Drop target slot (thin, fixed-height background element) ────────────────
function DropSlot({ id, day, slotTime, isToday, isHighlighted, onAddClick }: any) {
  const { setNodeRef } = useDroppable({ id, data: { day, hour: slotTime } });
  const isHalf = slotTime.endsWith(':30');
  return (
    <div ref={setNodeRef} onClick={() => onAddClick?.({ day, hour: slotTime })}
      style={{ height: SLOT_H }}
      className={cn('border-b cursor-pointer transition-colors duration-75 group/slot relative',
        isHalf ? 'border-slate-100/20 dark:border-white/[0.015]' : 'border-slate-200/40 dark:border-white/[0.04]',
        isToday && !isHighlighted && 'bg-blue-600/[0.008]',
        isHighlighted && 'bg-blue-500/10 border-blue-400/40')} />
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
function CalendarContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestId = searchParams.get("requestId");
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVet, setSelectedVet] = useState<string>("all");
  const [view, setView] = useState<"week" | "day">("day");
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverSlotKey, setHoverSlotKey] = useState<string | null>(null);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isApprovalOpen, setIsApprovalOpen] = useState(false);
  const [pendingRequest, setPendingRequest] = useState<any>(null);
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

  // Fetch pending request if ID exists in URL
  const { data: requestData } = useQuery({
    queryKey: ["appointment-request", requestId],
    queryFn: async () => {
      if (!requestId) return null;
      const res = await fetch(`/api/appointments/requests/${requestId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!requestId,
  });

  useEffect(() => {
    if (requestData) {
      setPendingRequest(requestData);
      setIsApprovalOpen(true);
    }
  }, [requestData]);

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

  // Group appointments by day (for absolute positioning)
  const groupedByDay = useMemo(() => {
    const map = new Map<string, any[]>();
    rawAppointments.forEach((app: any) => {
      if (selectedVet !== "all" && app.veterinarianId !== selectedVet) return;
      try {
        const d = new Date(app.startTime);
        if (isNaN(d.getTime())) return;
        const key = format(d, "yyyy-MM-dd");
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(app);
      } catch {}
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

  const approveMutation = useMutation({
    mutationFn: async () => {
      if (!pendingRequest || !newVetId) throw new Error("Dados em falta");
      
      const res = await fetch(`/api/appointments/requests/${pendingRequest.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          veterinarianId: newVetId,
          // Se o tutor não especificou hora, usa a data sugerida + 09:00 por defeito ou a hora atual se for hoje
          startTime: `${pendingRequest.requestedDate.split('T')[0]}T09:00:00` 
        }),
      });
      if (!res.ok) throw new Error("Erro ao aprovar pedido");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      toast.success("Proposta enviada ao tutor!");
      setIsApprovalOpen(false);
      router.push("/dashboard/appointments");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const colCount = activeDays.length;

  /** Calculates target {day, hour} from drag delta — 30-min precision */
  const calcTargetSlot = useCallback((active: any, delta: { x: number; y: number }) => {
    const app = active.data.current?.app;
    if (!app?.startTime) return null;
    const origDate = new Date(app.startTime);
    const origMin = origDate.getMinutes() < 30 ? '00' : '30';
    const origSlotKey = `${String(origDate.getHours()).padStart(2,'0')}:${origMin}`;
    const origIdx = halfHours.indexOf(origSlotKey);
    if (origIdx === -1) return null;
    const slotDelta = Math.round(delta.y / SLOT_H);
    const newIdx = Math.max(0, Math.min(halfHours.length - 1, origIdx + slotDelta));
    const newHour = halfHours[newIdx];
    const colWidthPx = (window.innerWidth - 64) / colCount;
    const dayDelta = Math.round(delta.x / colWidthPx);
    const origDayIdx = activeDays.findIndex(d => d.fullDate === format(origDate, "yyyy-MM-dd"));
    const newDayIdx = Math.max(0, Math.min(activeDays.length - 1, origDayIdx + dayDelta));
    const newDay = activeDays[newDayIdx]?.fullDate ?? format(origDate, "yyyy-MM-dd");
    return { day: newDay, hour: newHour };
  }, [activeDays, colCount]);

  const handleDragMove = useCallback((event: any) => {
    const slot = calcTargetSlot(event.active, event.delta);
    setHoverSlotKey(slot ? `${slot.day}-${slot.hour}` : null);
  }, [calcTargetSlot]);

  const handleDragEnd = async (event: any) => {
    const { active, delta } = event;
    setActiveId(null);
    setHoverSlotKey(null);
    const slot = calcTargetSlot(active, delta);
    if (!slot) return;
    const { day: newDay, hour: newHour } = slot;
    const app = active.data.current?.app;
    if (!app?.startTime) return;
    const origDate = new Date(app.startTime);
    const origMin = origDate.getMinutes() < 30 ? '00' : '30';
    const origSlot = `${String(origDate.getHours()).padStart(2,'0')}:${origMin}`;
    if (newHour === origSlot && newDay === format(origDate, "yyyy-MM-dd")) return;
    const newStartTime = `${newDay}T${newHour}:00`;
    queryClient.setQueryData(
      ["appointments", weekDays[0]?.fullDate, selectedVet],
      (old: any[]) => old?.map(a => a.id === active.id ? { ...a, startTime: newStartTime } : a) ?? []
    );
    try {
      const res = await fetch(`/api/appointments/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime: newStartTime }),
      });
      if (!res.ok) throw new Error();
      toast.success(`Movido para ${newHour} — ${format(new Date(newDay), "EEE d MMM", { locale: pt })}`);
    } catch {
      refetch();
      toast.error("Erro ao reagendar marcação");
    }
  };

  const activeApp = activeId ? rawAppointments.find((a: any) => a.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => { setActiveId(e.active.id as string); setHoverSlotKey(null); }}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={() => { setActiveId(null); setHoverSlotKey(null); }}
    >
      <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden bg-slate-50/30 dark:bg-slate-950 max-w-[1600px] mx-auto">
        {/* ── Top Bar ─────────────────────────────────────────────────── */}
        <div className="bg-white/80 dark:bg-slate-900/50 backdrop-blur-xl border-b border-slate-200/60 dark:border-white/5 p-5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
                <Stethoscope size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter leading-none">Agenda Clínica</h1>
                <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mt-1.5">Gestão de Marcações e Fluxo</p>
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
                <Button variant="ghost" onClick={() => setCurrentDate(new Date())} className="h-9 px-4 font-bold text-[10px] tracking-widest hover:bg-white dark:hover:bg-white/10 rounded-xl transition-all text-slate-900 dark:text-white">
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
              
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Input 
                    key={format(currentDate, "yyyy-MM-dd")}
                    defaultValue={format(currentDate, "dd/MM/yyyy")}
                    className="h-9 w-[110px] bg-transparent border-none font-bold text-[11px] tracking-widest text-slate-900 dark:text-white p-0 text-center focus:ring-0 focus:bg-slate-200/50 dark:focus:bg-white/5 rounded-lg transition-all"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const val = (e.target as HTMLInputElement).value;
                        const [d, m, y] = val.split('/').map(Number);
                        if (d && m && y) {
                          const newD = new Date(y, m - 1, d);
                          if (!isNaN(newD.getTime())) {
                            setCurrentDate(newD);
                            (e.target as HTMLInputElement).blur();
                            toast.success(`Agenda movida para ${format(newD, "PP", { locale: pt })}`);
                          }
                        }
                      }
                    }}
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:bg-white dark:hover:bg-white/10 transition-all text-blue-600">
                      <CalendarDays size={18} strokeWidth={2.5} />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 rounded-2xl bg-white dark:bg-slate-900 border-none shadow-2xl ring-1 ring-black/5 dark:ring-white/10 z-[110]" align="end">
                    <Calendar
                      mode="single"
                      selected={currentDate}
                      onSelect={(d: any) => d && setCurrentDate(d)}
                      initialFocus
                      locale={pt}
                      className="rounded-xl border border-slate-100 dark:border-white/5"
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Vet filters */}
            <div className="flex gap-2 border-r border-slate-200/60 dark:border-white/10 pr-6 overflow-x-auto max-w-[500px] no-scrollbar">
              <button
                onClick={() => setSelectedVet("all")}
                className={cn("px-5 h-10 rounded-2xl font-bold text-[10px] tracking-widest transition-all shadow-sm",
                  selectedVet === "all" ? "bg-blue-600 text-white" : "bg-white dark:bg-white/5 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10")}
              >Todos</button>
              {vets.map((vet: any) => (
                <button key={vet.id} onClick={() => setSelectedVet(vet.id)}
                  className={cn("px-5 h-10 rounded-2xl font-bold text-[10px] tracking-widest transition-all flex items-center gap-2 whitespace-nowrap shadow-sm border border-transparent",
                    selectedVet === vet.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white" : "bg-white dark:bg-white/5 text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10")}
                >
                  <div className="w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]" style={{ backgroundColor: vet.color }} />
                  {vet.name.split(" ").slice(-1)[0]}
                </button>
              ))}
            </div>

            <div className="flex bg-slate-100/50 dark:bg-white/5 p-1.5 rounded-2xl border border-slate-200/50 dark:border-white/5">
              <button onClick={() => setView("day")} className={cn("px-5 h-9 rounded-xl font-bold text-[10px] tracking-widest transition-all", view === "day" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}>Dia</button>
              <button onClick={() => setView("week")} className={cn("px-5 h-9 rounded-xl font-bold text-[10px] tracking-widest transition-all", view === "week" ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm" : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300")}>Semana</button>
            </div>

            <Button onClick={() => { setNewSlot(null); setIsAddOpen(true); }} className="h-10 px-6 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-bold text-[10px] tracking-wider shadow-lg shadow-blue-500/25 active:scale-95 transition-all flex items-center gap-2">
              <Plus size={18} strokeWidth={3} />
              Agendar
            </Button>
          </div>
        </div>

        {/* ── Calendar grid ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-auto bg-white/50 dark:bg-slate-950/50">
          {/* Day headers */}
          <div className="flex sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-b border-slate-200/60 dark:border-white/10 shadow-sm">
            {/* Corner cell */}
            <div className="w-16 shrink-0 h-16 flex items-center justify-center border-r border-slate-200/60 dark:border-white/10 bg-slate-50/50 dark:bg-slate-900/50">
              <RefreshCw className={cn("w-3.5 h-3.5 text-slate-400 dark:text-slate-600", isLoading && "animate-spin")} />
            </div>
            <div className="flex flex-1">
            {activeDays.map(day => (
              <div key={day.fullDate}
                className={cn("h-16 flex-1 flex flex-col items-center justify-center border-l border-slate-200/40 dark:border-white/5 transition-all relative overflow-hidden",
                  day.isToday && "bg-blue-600/[0.04] dark:bg-blue-400/[0.02]",
                  day.isSunday && "bg-slate-50/50 dark:bg-white/[0.02]")}
              >
                {day.isToday && (
                  <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600 shadow-[0_2px_8px_rgba(37,99,235,0.4)]" />
                )}
                <span className={cn("text-[10px] font-bold tracking-wider mb-2",
                  day.isToday ? "text-blue-600" : "text-slate-400 dark:text-slate-500")}>
                  {day.name}
                </span>
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "flex items-center justify-center rounded-2xl transition-all duration-500",
                    day.isToday ? "bg-blue-600 text-white w-12 h-12 shadow-lg shadow-blue-500/30" : ""
                  )}>
                    <span className={cn("text-2xl font-bold tracking-tighter leading-none",
                      day.isToday ? "text-white" : "text-slate-900 dark:text-white")}>
                      {day.date}
                    </span>
                  </div>
                  <span className={cn("text-[10px] font-bold tracking-widest",
                    day.isToday ? "text-blue-600" : "text-slate-400 dark:text-slate-600")}>
                    {day.month}
                  </span>
                </div>
              </div>
            ))}
            </div>
          </div>

          <div className="relative flex" style={{ minHeight: halfHours.length * SLOT_H }}>
            {/* Time column */}
            <div className="sticky left-0 z-20 w-16 shrink-0 bg-slate-50/95 dark:bg-slate-900/95 border-r border-slate-200/40 dark:border-white/[0.06]">
              {halfHours.map((slot) => {
                const isHalf = slot.endsWith(':30');
                return (
                  <div key={slot} style={{ height: SLOT_H }}
                    className={cn("flex items-start justify-end pr-2 border-b",
                      isHalf ? "border-slate-100/20 dark:border-white/[0.015]" : "border-slate-200/40 dark:border-white/[0.04]")}>
                    {!isHalf && (
                      <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 -translate-y-[6px] tabular-nums">{slot}</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Day columns */}
            <div className="flex flex-1 min-w-0">
              {activeDays.map(day => {
                const dayApps = groupedByDay.get(day.fullDate) ?? [];
                return (
                  <div key={day.fullDate} className="relative flex-1 border-l border-slate-100 dark:border-white/[0.04]"
                    style={{ minHeight: halfHours.length * SLOT_H }}>
                    {/* Drop targets */}
                    {halfHours.map((slotTime) => (
                      <DropSlot key={slotTime} id={`${day.fullDate}-${slotTime}`}
                        day={day.fullDate} slotTime={slotTime} isToday={day.isToday}
                        isHighlighted={hoverSlotKey === `${day.fullDate}-${slotTime}`}
                        onAddClick={(s: any) => { setNewSlot(s); setIsAddOpen(true); }} />
                    ))}
                    {/* Appointment cards — absolutely positioned */}
                    {dayApps.map((app: any) => {
                      const start = new Date(app.startTime);
                      const end = app.endTime ? new Date(app.endTime) : new Date(start.getTime() + 30 * 60000);
                      const startMins = (start.getHours() - 8) * 60 + start.getMinutes();
                      const durMins = Math.max(30, (end.getTime() - start.getTime()) / 60000);
                      const topPx = (startMins / 30) * SLOT_H;
                      const heightPx = (durMins / 30) * SLOT_H;
                      return (
                        <AppCard key={app.id} app={app} config={getTypeConfig(app.type)}
                          vetColor={getVetColor(app.veterinarianId)}
                          onClick={setSelectedApp} topPx={topPx} heightPx={heightPx} />
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Now indicator */}
            {mounted && now && activeDays.some(d => d.isToday) && now.getHours() >= 8 && now.getHours() < 24 && (
              <div className="absolute left-0 right-0 z-30 pointer-events-none"
                style={{ top: ((now.getHours() - 8) * 60 + now.getMinutes()) / 30 * SLOT_H }}>
                <div className="flex items-center">
                  <div className="w-16 flex justify-end pr-2 shrink-0">
                    <span className="bg-rose-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-full animate-pulse tracking-widest">Agora</span>
                  </div>
                  <div className="flex-1 h-px bg-rose-500/60 relative">
                    <div className="absolute -left-1 -top-1 w-2 h-2 rounded-full bg-rose-500 shadow-sm shadow-rose-500/40" />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Drag overlay */}
        <DragOverlay>
          {activeApp && (
            <AppCard app={activeApp} config={getTypeConfig(activeApp?.type)}
              vetColor={getVetColor(activeApp?.veterinarianId)}
              onClick={() => {}} isOverlay topPx={0} heightPx={SLOT_H * 2} />
          )}
        </DragOverlay>


        {/* ── New appointment modal ─────────────────────────────────────── */}
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogContent className="sm:max-w-[560px] rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-950 border-none shadow-[0_0_50px_rgba(0,0,0,0.3)] ring-1 ring-white/10">
            <div className="bg-slate-50 dark:bg-slate-900/50 p-6 border-b border-slate-200 dark:border-white/5 relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-32 h-32 bg-blue-600/10 rounded-full blur-3xl" />
              <div className="flex items-center gap-5 relative z-10">
                <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/10">
                  <CalendarDays size={26} strokeWidth={2.5} />
                </div>
                <div>
                  <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">Nova Marcação</DialogTitle>
                  <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mt-1.5 flex items-center gap-2">
                    <Clock size={12} strokeWidth={3} />
                    {newSlot
                      ? `${format(new Date(newSlot.day), "d 'de' MMMM", { locale: pt })} às ${newSlot.hour}`
                      : "Selecione o horário disponível"}
                  </p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider ml-1">Paciente</label>
                <div className="relative group">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" size={18} />
                  <input
                    className="w-full h-14 pl-14 pr-6 rounded-2xl bg-slate-100 dark:bg-white/5 border-none font-bold text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all"
                    placeholder="Procurar animal ou tutor..."
                    value={patientSearch}
                    onChange={(e) => { setPatientSearch(e.target.value); setSelectedPatient(null); }}
                  />
                  
                  {filteredPatients.length > 0 && !selectedPatient && (
                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-[60] animate-in fade-in slide-in-from-top-2 duration-300 ring-1 ring-black/5">
                      {filteredPatients.map((p: any) => (
                        <button key={p.id}
                          className="w-full text-left px-6 py-4 hover:bg-blue-600 group/item transition-all flex justify-between items-center border-b border-slate-100 dark:border-white/5 last:border-0"
                          onClick={() => { setSelectedPatient(p); setPatientSearch(p.name); }}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-900 dark:text-white group-hover/item:text-white">{p.name}</span>
                            <span className="text-[10px] font-bold text-slate-400 group-hover/item:text-blue-100 tracking-widest">{p.species}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] font-bold text-slate-400 group-hover/item:text-white tracking-tighter block">{p.owner?.name}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {selectedPatient && (
                  <div className="flex items-center justify-between bg-blue-600/10 dark:bg-blue-400/5 border border-blue-600/20 rounded-2xl px-5 py-4 animate-in zoom-in-95">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center">
                        <PawPrint size={18} />
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-blue-600 dark:text-blue-400 text-sm leading-none">{selectedPatient.name}</span>
                        <span className="text-[10px] font-bold text-blue-600/60 dark:text-blue-400/40 tracking-widest mt-1">{selectedPatient.owner?.name}</span>
                      </div>
                    </div>
                    <button onClick={() => { setSelectedPatient(null); setPatientSearch(""); }} className="p-2 hover:bg-blue-600/10 rounded-lg transition-colors">
                      <X size={16} className="text-blue-600/60 hover:text-blue-600" />
                    </button>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider ml-1">Médico Responsável</label>
                  <Select value={newVetId} onValueChange={setNewVetId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border-none font-bold text-sm px-6">
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white p-2">
                      {vets.map((v: any) => (
                        <SelectItem key={v.id} value={v.id} className="rounded-xl focus:bg-blue-600 p-3 font-bold">{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider ml-1">Tipo de Serviço</label>
                  <Select value={newType} onValueChange={setNewType}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border-none font-bold text-sm px-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white p-2">
                      <SelectItem value="CONSULTA" className="rounded-xl focus:bg-blue-600 p-3 font-bold">Consulta Geral</SelectItem>
                      <SelectItem value="VACINA" className="rounded-xl focus:bg-blue-600 p-3 font-bold">Vacinação</SelectItem>
                      <SelectItem value="CIRURGIA" className="rounded-xl focus:bg-blue-600 p-3 font-bold">Cirurgia</SelectItem>
                      <SelectItem value="URGÊNCIA" className="rounded-xl focus:bg-blue-600 p-3 font-bold">Urgência</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider ml-1">Duração Prevista</label>
                  <Select value={newDuration} onValueChange={setNewDuration}>
                    <SelectTrigger className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border-none font-bold text-sm px-6">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white p-2">
                      <SelectItem value="15" className="rounded-xl focus:bg-blue-600 p-3 font-bold">15 minutos</SelectItem>
                      <SelectItem value="30" className="rounded-xl focus:bg-blue-600 p-3 font-bold">30 minutos</SelectItem>
                      <SelectItem value="45" className="rounded-xl focus:bg-blue-600 p-3 font-bold">45 minutos</SelectItem>
                      <SelectItem value="60" className="rounded-xl focus:bg-blue-600 p-3 font-bold">1 hora</SelectItem>
                      <SelectItem value="90" className="rounded-xl focus:bg-blue-600 p-3 font-bold">1h 30min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {!newSlot && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider ml-1">Hora de Início</label>
                    <Select onValueChange={(v) => setNewSlot({ day: format(new Date(), "yyyy-MM-dd"), hour: v })}>
                      <SelectTrigger className="h-14 rounded-2xl bg-slate-100 dark:bg-white/5 border-none font-bold text-sm px-6">
                        <SelectValue placeholder="Escolher..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white p-2">
                        {hours.map(h => <SelectItem key={h} value={h} className="rounded-xl focus:bg-blue-600 p-3 font-bold">{h}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <Button
                className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wider shadow-xl shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale"
                disabled={!selectedPatient || !newVetId || !newSlot || createAppointment.isPending}
                onClick={() => createAppointment.mutate()}
              >
                {createAppointment.isPending ? "A processar..." : "Confirmar Agendamento"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Appointment detail modal ──────────────────────────────────── */}
        <Dialog open={!!selectedApp} onOpenChange={() => setSelectedApp(null)}>
          <DialogContent className="sm:max-w-[480px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden bg-white dark:bg-slate-900">
            {selectedApp && (() => {
              const config = getTypeConfig(selectedApp.type);
              const vet = vets.find((v: any) => v.id === selectedApp.veterinarianId);
              return (
                <div>
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-6 border-b border-slate-200 dark:border-white/10">
                    <div className="flex justify-between items-start">
                      <div className="space-y-3">
                        <Badge className="font-bold text-[9px] px-3 py-1 rounded-full tracking-widest shadow-sm" style={{ backgroundColor: config.color, color: "#fff" }}>
                          {selectedApp.type ?? "Geral"}
                        </Badge>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tighter">{selectedApp.patient?.name}</h2>
                        <p className="text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center gap-2 tracking-wide">
                          <UserIcon size={14} strokeWidth={3} className="text-blue-600" /> {selectedApp.patient?.owner?.name}
                        </p>
                      </div>
                      <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl ring-1 ring-slate-200 dark:ring-white/10">
                        <config.icon size={24} strokeWidth={2.5} style={{ color: config.color }} />
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-inner">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Horário</span>
                        <p className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">{format(new Date(selectedApp.startTime), "HH:mm")}</p>
                        <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 tracking-tighter">{format(new Date(selectedApp.startTime), "EEEE, dd MMM", { locale: pt })}</p>
                      </div>
                      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 shadow-inner">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-widest block mb-2">Médico</span>
                        <p className="text-sm font-bold text-slate-900 dark:text-white line-clamp-2 tracking-tight">{vet?.name ?? "—"}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {isFeatureEnabled("smsNotifications") ? (
                        <Button variant="outline" className="h-9 rounded-lg font-medium text-xs gap-1.5 border-slate-200"
                          onClick={() => toast.info("SMS enviado para " + selectedApp.patient?.owner?.name)}>
                          <MessageSquare size={13} /> SMS
                        </Button>
                      ) : (
                        <Button variant="outline" className="h-9 rounded-lg font-medium text-xs gap-1.5 border-slate-200 opacity-50 cursor-not-allowed" disabled>
                          <MessageSquare size={13} /> SMS
                        </Button>
                      )}
                      <Button variant="outline" className="h-9 rounded-lg font-medium text-xs gap-1.5 border-slate-200"
                        onClick={() => toast.info("Email enviado")}>
                        <Mail size={13} /> Email
                      </Button>
                    </div>

                    <Button
                      className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm gap-2 shadow-md shadow-blue-500/10"
                      onClick={() => {
                        router.push(`/dashboard/consultations?patientId=${selectedApp.patientId}&appointmentId=${selectedApp.id}`);
                        setSelectedApp(null);
                      }}
                    >
                      <Clock size={16} /> Iniciar Consulta
                    </Button>

                    <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex justify-between gap-3">
                      <Button variant="ghost" className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 font-bold text-xs"
                        onClick={() => { if (confirm("Cancelar esta marcação?")) cancelAppointment.mutate(selectedApp.id); }}>
                        Cancelar Marcação
                      </Button>
                      <Button variant="ghost" onClick={() => setSelectedApp(null)} className="font-bold text-xs">Fechar</Button>
                    </div>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        </Dialog>

        {/* ── Approval Modal ───────────────────────────────────────────── */}
        <Dialog open={isApprovalOpen} onOpenChange={setIsApprovalOpen}>
          <DialogContent className="sm:max-w-[500px] rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border-none shadow-2xl ring-1 ring-black/5 dark:ring-white/10">
            <div className="bg-blue-600 p-8 text-white relative overflow-hidden">
              <div className="absolute -right-8 -top-8 w-40 h-40 bg-white/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <Badge className="bg-white/20 hover:bg-white/30 text-white border-none mb-4 font-bold tracking-widest px-3 py-1">SOLICITAÇÃO WEB</Badge>
                <h2 className="text-2xl font-bold tracking-tighter">Novo Pedido de Agendamento</h2>
                <p className="text-blue-100/80 text-xs font-bold mt-2 tracking-wide uppercase">Recebido via Portal do Tutor</p>
              </div>
            </div>

            {pendingRequest && (
              <div className="p-8 space-y-8">
                <div className="flex items-center gap-5 p-5 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-white/5 shadow-inner">
                  <div className="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                    <PawPrint size={28} />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter">{pendingRequest.patientName}</p>
                    <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 tracking-wider mt-1 uppercase">Animal Registado</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">Data Pretendida</label>
                    <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 font-bold text-sm text-slate-900 dark:text-white">
                      {format(new Date(pendingRequest.requestedDate), "dd 'de' MMMM", { locale: pt })}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 tracking-widest uppercase ml-1">Período</label>
                    <div className="p-4 rounded-xl bg-slate-100/50 dark:bg-white/5 border border-slate-200/50 font-bold text-sm text-slate-900 dark:text-white">
                      {pendingRequest.requestedPeriod === "MORNING" ? "Manhã" : "Tarde"}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="text-[10px] font-bold text-blue-600 tracking-widest uppercase ml-1">Atribuir Médico e Propor Hora</label>
                  <Select value={newVetId} onValueChange={setNewVetId}>
                    <SelectTrigger className="h-14 rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-600/20 font-bold text-sm px-6 shadow-sm">
                      <SelectValue placeholder="Escolha o veterinário..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl bg-slate-900 border-white/10 text-white p-2">
                      {vets.map((v: any) => (
                        <SelectItem key={v.id} value={v.id} className="rounded-xl focus:bg-blue-600 p-3 font-bold">{v.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-14 rounded-2xl font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                    onClick={() => setIsApprovalOpen(false)}
                  >Rejeitar</Button>
                  <Button 
                    className="flex-2 h-14 px-10 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xl shadow-blue-500/20 disabled:opacity-50"
                    disabled={!newVetId || approveMutation.isPending}
                    onClick={() => approveMutation.mutate()}
                  >
                    {approveMutation.isPending ? "A enviar..." : "Aprovar e Enviar Proposta"}
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DndContext>
  );
}

export default function AppointmentsPage() {
  return (
    <Suspense fallback={<Skeleton className="w-full h-full" />}>
      <CalendarContent />
    </Suspense>
  );
}
