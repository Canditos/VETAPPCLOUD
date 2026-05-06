"use client";

import { useState, useMemo } from "react";
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
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
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
    case "blue": return "border-blue-500 bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300";
    case "purple": return "border-purple-500 bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300";
    case "emerald": return "border-emerald-500 bg-emerald-50 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300";
    default: return "border-slate-500 bg-slate-50 dark:bg-slate-900/40 text-slate-700 dark:text-slate-300";
  }
};

export default function CalendarPage() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVet, setSelectedVet] = useState<string | "all">("all");
  const [view, setView] = useState<"week" | "day">("week");
  const [selectedAppointment, setSelectedAppointment] = useState<any>(null);

  // Calculate week days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 5 }).map((_, i) => {
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
      const res = await fetch(`/api/appointments?start=${weekDays[0].fullDate}&end=${weekDays[4].fullDate}`);
      if (!res.ok) throw new Error("Erro ao carregar agenda");
      let data = await res.json();
      if (selectedVet !== "all") {
        data = data.filter((a: any) => a.veterinarianId === selectedVet);
      }
      return data;
    }
  });

  // Pre-group appointments for performance (O(N) instead of O(N*H*D))
  const groupedAppointments = useMemo(() => {
    if (!rawAppointments) return new Map();
    const map = new Map();
    rawAppointments.forEach((a: any) => {
      const aDate = new Date(a.startTime).toISOString().split('T')[0];
      const aHour = new Date(a.startTime).getUTCHours().toString().padStart(2, '0') + ":00";
      const key = `${aDate}-${aHour}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(a);
    });
    return map;
  }, [rawAppointments]);

  const handleStartConsultation = (appointmentId: string, patientId: string) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 1000)),
      {
        loading: 'A iniciar consulta...',
        success: () => {
          router.push(`/dashboard/consultations?patientId=${patientId}&appointmentId=${appointmentId}`);
          return 'Consulta iniciada!';
        },
        error: 'Erro ao iniciar consulta.',
      }
    );
  };

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 p-4 md:p-8 animate-premium">
      {/* Header Section */}
      <div className="flex flex-wrap justify-between items-start gap-8">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight sm:text-5xl">Agenda Mestre</h1>
          <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 font-medium">
             <CalendarDays size={18} className="text-blue-600" />
             <span>Gestão de consultórios e bloco operatório</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
            <Button 
              variant={view === "day" ? "secondary" : "ghost"} 
              className={cn("rounded-xl px-6 font-black text-xs uppercase tracking-widest h-11", view === "day" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400")}
              onClick={() => setView("day")}
            >
              Dia
            </Button>
            <Button 
              variant={view === "week" ? "secondary" : "ghost"} 
              className={cn("rounded-xl px-6 font-black text-xs uppercase tracking-widest h-11", view === "week" ? "bg-white dark:bg-slate-700 shadow-sm" : "text-slate-400")}
              onClick={() => setView("week")}
            >
              Semana
            </Button>
          </div>

          <Button className="h-14 rounded-2xl gap-3 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 dark:shadow-none font-black px-8 transition-all active:scale-95">
            <Plus size={22} strokeWidth={3} />
            <span>Nova Marcação</span>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
        {/* Left Sidebar - Vets & Controls */}
        <div className="xl:col-span-1 space-y-6">
          <Card className="border-none shadow-2xl shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 space-y-8 ring-1 ring-slate-100 dark:ring-white/5">
            <div className="space-y-4">
               <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] ml-2">Médico Veterinário</h3>
               <div className="space-y-2">
                 <button 
                   onClick={() => setSelectedVet("all")}
                   className={cn(
                     "w-full flex items-center gap-3 p-4 rounded-2xl transition-all font-bold text-sm",
                     selectedVet === "all" ? "bg-blue-600 text-white shadow-lg shadow-blue-100 dark:shadow-none" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                   )}
                 >
                   <div className={cn("w-2 h-2 rounded-full", selectedVet === "all" ? "bg-white" : "bg-blue-500")} />
                   Todos os Médicos
                 </button>
                 {VETS.map(vet => (
                   <button 
                     key={vet.id}
                     onClick={() => setSelectedVet(vet.id)}
                     className={cn(
                       "w-full flex items-center justify-between p-4 rounded-2xl transition-all font-bold text-sm",
                       selectedVet === vet.id ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md ring-1 ring-slate-100 dark:ring-white/10" : "text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5"
                     )}
                   >
                     <div className="flex items-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", {
                          "bg-blue-500": vet.color === "blue",
                          "bg-purple-500": vet.color === "purple",
                          "bg-emerald-500": vet.color === "emerald",
                        })} />
                        <span className={cn(selectedVet === vet.id ? "" : "text-slate-500 dark:text-slate-400")}>{vet.name}</span>
                     </div>
                     {selectedVet === vet.id && <CheckCircle2 size={16} className={cn(selectedVet === vet.id && vet.color === "blue" ? "text-white" : "text-blue-600")} />}
                   </button>
                 ))}
               </div>
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-white/5 space-y-4">
               <h3 className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] ml-2">Legenda de Tipos</h3>
               <div className="grid grid-cols-1 gap-3">
                 {["Consulta", "Cirurgia", "Vacina", "Urgência"].map(type => {
                   const config = getTypeConfig(type);
                   return (
                     <div key={type} className="flex items-center gap-3 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-white/5">
                        <config.icon size={14} className={cn({
                          "text-blue-500": config.color === "blue",
                          "text-rose-500": config.color === "rose",
                          "text-emerald-500": config.color === "emerald",
                          "text-orange-500": config.color === "orange",
                        })} />
                        {type}
                     </div>
                   );
                 })}
               </div>
            </div>
          </Card>
        </div>

        {/* Calendar View */}
        <div className="xl:col-span-3">
          <Card className="border-none shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden bg-white dark:bg-slate-900 rounded-[2.5rem] ring-1 ring-slate-100 dark:ring-white/5">
            <div className="p-8 border-b border-slate-50 dark:border-white/5 flex flex-wrap justify-between items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 dark:text-slate-500 hover:text-blue-600" onClick={() => {
                    const d = new Date(currentDate);
                    d.setDate(d.getDate() - (view === "week" ? 7 : 1));
                    setCurrentDate(d);
                  }}>
                    <ChevronLeft size={24} strokeWidth={3} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl hover:bg-blue-50 dark:hover:bg-blue-900/20 text-slate-400 dark:text-slate-500 hover:text-blue-600" onClick={() => {
                    const d = new Date(currentDate);
                    d.setDate(d.getDate() + (view === "week" ? 7 : 1));
                    setCurrentDate(d);
                  }}>
                    <ChevronRight size={24} strokeWidth={3} />
                  </Button>
                </div>
                <h2 className="text-2xl font-black text-slate-900 dark:text-white capitalize tracking-tight">
                  {currentDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
                </h2>
                <Button variant="outline" className="h-10 rounded-xl font-black text-[10px] uppercase tracking-widest border-slate-200 dark:border-white/10 dark:text-slate-300 px-6" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
              </div>
              
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => refetch()} className="h-12 w-12 rounded-2xl text-slate-400 hover:text-blue-600">
                   <RefreshCw className={cn("w-5 h-5", isLoading && "animate-spin")} />
                </Button>
              </div>
            </div>

            <div className="p-0 overflow-hidden">
              <div className={cn(
                "grid border-b border-slate-50 dark:border-white/5",
                view === "week" ? "grid-cols-[100px_repeat(5,1fr)]" : "grid-cols-[100px_1fr]"
              )}>
                <div className="p-6 bg-slate-50 dark:bg-slate-950 border-r border-slate-50 dark:border-white/5"></div>
                {activeDays.map((day: any) => (
                  <div key={day.fullDate} className={cn(
                    "p-6 text-center border-l border-slate-50 dark:border-white/5 transition-colors",
                    day.isToday ? "bg-blue-50/30 dark:bg-blue-900/10" : "bg-slate-50/30 dark:bg-slate-950/10"
                  )}>
                    <p className={cn(
                      "text-[10px] font-black uppercase tracking-[0.2em]",
                      day.isToday ? "text-blue-600" : "text-slate-400 dark:text-slate-500"
                    )}>{day.name}</p>
                    <div className="mt-2 flex items-center justify-center gap-2">
                      <span className={cn(
                        "text-3xl font-black tracking-tighter",
                        day.isToday ? "text-blue-600" : "text-slate-900 dark:text-white"
                      )}>{day.date}</span>
                      <span className="text-sm font-bold text-slate-400 uppercase">{day.month}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="relative max-h-[800px] overflow-y-auto no-scrollbar scroll-smooth">
                {isLoading ? (
                  <div className="p-20 space-y-8">
                    <div className="flex gap-8">
                       <Skeleton className="h-[200px] flex-1 rounded-[3rem]" />
                       <Skeleton className="h-[200px] flex-1 rounded-[3rem]" />
                       <Skeleton className="h-[200px] flex-1 rounded-[3rem]" />
                    </div>
                    <Skeleton className="h-[400px] w-full rounded-[3rem]" />
                  </div>
                ) : hours.map((hour) => (
                  <div key={hour} className={cn(
                    "grid border-b border-slate-50 dark:border-white/5 min-h-[140px]",
                    view === "week" ? "grid-cols-[100px_repeat(5,1fr)]" : "grid-cols-[100px_1fr]"
                  )}>
                    <div className="p-6 text-xs font-black text-slate-400 dark:text-slate-600 text-right bg-slate-50 dark:bg-slate-950 flex flex-col justify-between border-r border-slate-50 dark:border-white/5">
                      <span>{hour}</span>
                      <span className="opacity-30 text-[9px] font-black">:30</span>
                    </div>
                    {activeDays.map((day: any) => {
                      const slotAppointments = groupedAppointments.get(`${day.fullDate}-${hour}`);

                      return (
                        <div key={`${day.fullDate}-${hour}`} className={cn(
                          "p-3 border-l border-slate-50 dark:border-white/5 relative group transition-colors",
                          day.isToday ? "bg-blue-50/10 dark:bg-blue-900/5" : "hover:bg-slate-50 dark:hover:bg-white/5"
                        )}>
                          {slotAppointments?.map((app: any) => {
                            const config = getTypeConfig(app.type);
                            return (
                              <div 
                                key={app.id} 
                                onClick={() => setSelectedAppointment(app)}
                                className={cn(
                                  "p-5 rounded-3xl h-full shadow-2xl shadow-slate-200/50 dark:shadow-none border-l-[6px] transition-all hover:scale-[1.02] active:scale-95 cursor-pointer group/card relative overflow-hidden bg-white dark:bg-slate-800",
                                  getVetColor(app.veterinarianId)
                                )}
                              >
                                <div className="flex justify-between items-start relative z-10">
                                   <div className="flex items-center gap-2">
                                      <div className={cn("p-2 rounded-xl bg-white dark:bg-slate-900 shadow-sm")}>
                                        <config.icon size={16} strokeWidth={3} className={cn({
                                          "text-blue-500": config.color === "blue",
                                          "text-rose-500": config.color === "rose",
                                          "text-emerald-500": config.color === "emerald",
                                          "text-orange-500": config.color === "orange",
                                        })} />
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{config.label}</span>
                                   </div>
                                   
                                   <DropdownMenu>
                                      <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-white/50 dark:hover:bg-black/20 text-current" onClick={(e) => e.stopPropagation()}>
                                          <MoreVertical size={16} />
                                        </Button>
                                      </DropdownMenuTrigger>
                                      <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-2xl bg-white dark:bg-slate-900 p-2 min-w-[200px]">
                                        <DropdownMenuItem className="gap-3 p-3 rounded-xl font-black text-xs uppercase tracking-widest text-blue-600" onClick={(e) => { e.stopPropagation(); handleStartConsultation(app.id, app.patientId); }}>
                                          <Stethoscope size={18} strokeWidth={3} /> Iniciar Consulta
                                        </DropdownMenuItem>
                                        <DropdownMenuItem className="gap-3 p-3 rounded-xl font-black text-xs uppercase tracking-widest" onClick={(e) => { e.stopPropagation(); router.push(`/dashboard/patients/${app.patientId}`); }}>
                                          <UserIcon size={18} strokeWidth={3} /> Ficha Clínica
                                        </DropdownMenuItem>
                                        <div className="h-px bg-slate-50 dark:bg-white/5 my-2" />
                                        <DropdownMenuItem className="gap-3 p-3 rounded-xl font-black text-xs uppercase tracking-widest text-rose-500" onClick={(e) => e.stopPropagation()}>
                                          <Activity size={18} strokeWidth={3} /> Cancelar
                                        </DropdownMenuItem>
                                      </DropdownMenuContent>
                                   </DropdownMenu>
                                </div>

                                <div className="mt-4 space-y-1 relative z-10">
                                  <p className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-tight">{app.patient?.name}</p>
                                  <div className="flex items-center gap-2 text-[10px] font-bold opacity-70 uppercase tracking-wider">
                                     <span>{app.patient?.owner?.name}</span>
                                     <span>•</span>
                                     <span className="flex items-center gap-1"><Clock size={10} /> {hour}</span>
                                  </div>
                                </div>

                                <div className="mt-4 pt-4 border-t border-current/10 flex items-center justify-between relative z-10">
                                   <div className="flex items-center gap-2">
                                      <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[10px] font-black text-slate-600 dark:text-slate-400">
                                         {app.vetName?.charAt(0)}
                                      </div>
                                      <span className="text-[9px] font-black uppercase tracking-tighter opacity-60">{app.vetName || "Médico N/D"}</span>
                                   </div>
                                </div>

                                {/* Decorative Background Icon */}
                                <div className="absolute -bottom-4 -right-4 opacity-[0.03] dark:opacity-[0.08] group-hover/card:scale-125 transition-transform duration-700 pointer-events-none">
                                   <config.icon size={120} strokeWidth={1} />
                                </div>
                              </div>
                            );
                          })}
                          {!slotAppointments?.length && (
                            <button className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-blue-300 dark:text-blue-800 hover:text-blue-500 transition-all active:scale-90 bg-blue-50 dark:bg-slate-800 rounded-3xl border-2 border-dashed border-blue-200 dark:border-white/5">
                              <Plus size={32} strokeWidth={3} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Appointment Detail Dialog */}
      <Dialog open={!!selectedAppointment} onOpenChange={() => setSelectedAppointment(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden bg-white dark:bg-slate-900">
          {selectedAppointment && (
            <>
              <div className="bg-slate-900 dark:bg-white p-10 text-white dark:text-slate-900 relative overflow-hidden">
                <div className="flex justify-between items-start relative z-10">
                  <div className="space-y-4">
                    <Badge className="bg-white/20 dark:bg-slate-900/10 text-white dark:text-slate-900 border-none font-black text-[10px] uppercase tracking-widest px-4 py-1.5 rounded-full">
                      {selectedAppointment.type}
                    </Badge>
                    <DialogTitle className="text-5xl font-black tracking-tight leading-none">
                      {selectedAppointment.patient?.name}
                    </DialogTitle>
                    <p className="text-slate-400 dark:text-slate-500 font-bold text-xl flex items-center gap-2">
                      <UserIcon size={20} className="text-blue-500" /> {selectedAppointment.patient?.owner?.name}
                    </p>
                  </div>
                  <div className="bg-white/10 dark:bg-slate-900/5 p-6 rounded-[2rem] backdrop-blur-md">
                    <Clock size={40} className="text-blue-500" />
                  </div>
                </div>
                {/* Visual Decoration */}
                <div className="absolute -bottom-10 -right-10 opacity-10 pointer-events-none">
                  <PawPrint size={300} strokeWidth={1} />
                </div>
              </div>

              <div className="p-10 space-y-10">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Horário da Consulta</span>
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 font-black text-3xl text-slate-900 dark:text-white ring-1 ring-slate-100 dark:ring-white/5">
                      {new Date(selectedAppointment.startTime).getUTCHours().toString().padStart(2, '0')}:00
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block">Médico Responsável</span>
                    <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 font-bold text-lg text-slate-900 dark:text-white flex items-center gap-3 ring-1 ring-slate-100 dark:ring-white/5">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: VETS.find(v => v.id === selectedAppointment.veterinarianId)?.color }} />
                      {selectedAppointment.vetName || "Médico N/D"}
                    </div>
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
                    <Button variant="outline" className="h-14 rounded-2xl border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest dark:text-white">
                      Remarcar
                    </Button>
                    <Button variant="outline" className="h-14 rounded-2xl border-slate-200 dark:border-white/10 font-black uppercase text-[10px] tracking-widest text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/20">
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
  );
}
