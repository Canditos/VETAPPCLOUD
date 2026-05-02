"use client";

import { useState, useMemo } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus,
  MoreVertical,
  Check,
  Stethoscope,
  User,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export default function CalendarPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [currentDate, setCurrentDate] = useState(new Date());

  // Calculate week days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    startOfWeek.setDate(diff);
    
    return Array.from({ length: 5 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return {
        name: d.toLocaleDateString('pt-PT', { weekday: 'short' }),
        date: d.toLocaleDateString('pt-PT', { day: '2-digit', month: 'short' }),
        fullDate: d.toISOString().split('T')[0]
      };
    });
  }, [currentDate]);

  const { data: appointments, isLoading, refetch } = useQuery({
    queryKey: ["appointments", weekDays[0].fullDate],
    queryFn: async () => {
      const res = await fetch(`/api/appointments?start=${weekDays[0].fullDate}&end=${weekDays[4].fullDate}`);
      if (!res.ok) throw new Error("Erro ao carregar agenda");
      return res.json();
    }
  });

  const handleStartConsultation = (appointmentId: string, patientId: string) => {
    toast.promise(
      // In a real app, this would create a consultation from the appointment
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agenda Clínica</h1>
          <p className="text-slate-500 font-medium">Marcações integradas com processos clínicos e faturação.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" onClick={() => refetch()} className="rounded-xl border-slate-200">
             <RefreshCw className="w-4 h-4" />
          </Button>
          <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
            <Plus size={20} />
            Nova Marcação
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 p-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-slate-900 capitalize">
              {currentDate.toLocaleDateString('pt-PT', { month: 'long', year: 'numeric' })}
            </h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400" onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() - 7);
                setCurrentDate(d);
              }}>
                <ChevronLeft size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400" onClick={() => {
                const d = new Date(currentDate);
                d.setDate(d.getDate() + 7);
                setCurrentDate(d);
              }}>
                <ChevronRight size={18} />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg font-bold border-slate-200" onClick={() => setCurrentDate(new Date())}>Hoje</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-slate-50">
            <div className="p-4 bg-slate-50/30"></div>
            {weekDays.map((day) => (
              <div key={day.fullDate} className="p-4 text-center border-l border-slate-50 bg-slate-50/30">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day.name}</p>
                <p className="text-lg font-black text-slate-900 mt-1">{day.date}</p>
              </div>
            ))}
          </div>

          <div className="relative">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-slate-50 min-h-[100px]">
                <div className="p-4 text-xs font-bold text-slate-400 text-right">{hour}</div>
                {weekDays.map((day) => {
                  // Find appointments for this slot
                  const slotAppointments = appointments?.filter((a: any) => {
                    const aDate = new Date(a.startTime).toISOString().split('T')[0];
                    const aHour = new Date(a.startTime).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' });
                    return aDate === day.fullDate && aHour === hour;
                  });

                  return (
                    <div key={`${day.fullDate}-${hour}`} className="p-2 border-l border-slate-50 relative group">
                      {slotAppointments?.map((app: any) => (
                        <div key={app.id} className={`
                          p-3 rounded-2xl h-full shadow-sm border-l-4 transition-all hover:scale-[1.02] cursor-pointer group/card relative
                          ${app.status === 'SCHEDULED' ? 'bg-blue-50 border-blue-500' : 'bg-slate-50 border-slate-300'}
                        `}>
                          <div className="flex justify-between items-start">
                             <Badge variant="outline" className="text-[8px] py-0 px-1.5 border-blue-200 text-blue-600 bg-white uppercase font-black tracking-tight">
                                {app.type || "Consulta"}
                             </Badge>
                             
                             <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                    <MoreVertical size={14} />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-xl border-none shadow-xl">
                                  <DropdownMenuItem className="gap-2 font-bold text-blue-600" onClick={() => handleStartConsultation(app.id, app.patientId)}>
                                    <Stethoscope size={14} /> Iniciar Consulta
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2 font-bold">
                                    <User size={14} /> Ficha do Paciente
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="gap-2 font-bold text-red-500">
                                    <AlertCircle size={14} /> Cancelar
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                             </DropdownMenu>
                          </div>
                          <p className="font-black text-slate-900 text-sm mt-1">{app.patient.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium truncate">{app.patient.owner?.name}</p>
                        </div>
                      ))}
                      {!slotAppointments?.length && (
                        <button className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-blue-300 hover:text-blue-500 transition-all">
                          <Plus size={24} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
