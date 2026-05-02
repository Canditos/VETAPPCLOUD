"use client";

import { useState } from "react";
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Plus,
  MoreVertical,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const hours = ["09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];
const days = [
  { name: "Seg", date: "02 Mai" },
  { name: "Ter", date: "03 Mai" },
  { name: "Qua", date: "04 Mai" },
  { name: "Qui", date: "05 Mai" },
  { name: "Sex", date: "06 Mai" },
];

const appointments = [
  { id: "1", time: "09:00", day: "Seg", patient: "Tobias", owner: "João Silva", type: "Vacinação", status: "CONFIRMED" },
  { id: "2", time: "11:00", day: "Seg", patient: "Luna", owner: "Maria João", type: "Consulta Geral", status: "WAITING" },
  { id: "3", time: "14:00", day: "Ter", patient: "Simba", owner: "Ricardo S.", type: "Cirurgia", status: "CONFIRMED" },
  { id: "4", time: "10:00", day: "Qua", patient: "Mel", owner: "Ana Pires", type: "Check-up", status: "CONFIRMED" },
];

export default function CalendarPage() {
  const [view, setView] = useState<"week" | "day">("week");

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Agenda</h1>
          <p className="text-slate-500 font-medium">Gestão de marcações e horários da equipa.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white p-1 rounded-xl shadow-sm border border-slate-100">
            <Button 
              variant={view === "day" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setView("day")}
              className="rounded-lg font-bold"
            >
              Dia
            </Button>
            <Button 
              variant={view === "week" ? "secondary" : "ghost"} 
              size="sm" 
              onClick={() => setView("week")}
              className="rounded-lg font-bold"
            >
              Semana
            </Button>
          </div>
          <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
            <Plus size={20} />
            Nova Marcação
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-50 p-6">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-black text-slate-900">Maio, 2024</h2>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
                <ChevronLeft size={18} />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400">
                <ChevronRight size={18} />
              </Button>
            </div>
            <Button variant="outline" size="sm" className="rounded-lg font-bold border-slate-200">Hoje</Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-slate-50">
            <div className="p-4 bg-slate-50/30"></div>
            {days.map((day) => (
              <div key={day.name} className="p-4 text-center border-l border-slate-50 bg-slate-50/30">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{day.name}</p>
                <p className="text-lg font-black text-slate-900 mt-1">{day.date}</p>
              </div>
            ))}
          </div>

          <div className="relative">
            {hours.map((hour) => (
              <div key={hour} className="grid grid-cols-[80px_repeat(5,1fr)] border-b border-slate-50 min-h-[100px]">
                <div className="p-4 text-xs font-bold text-slate-400 text-right">{hour}</div>
                {days.map((day) => {
                  const appointment = appointments.find(a => a.day === day.name && a.time === hour);
                  return (
                    <div key={`${day.name}-${hour}`} className="p-2 border-l border-slate-50 relative group">
                      {appointment && (
                        <div className={`
                          p-3 rounded-2xl h-full shadow-sm border-l-4 transition-transform hover:scale-[1.02] cursor-pointer
                          ${appointment.status === "CONFIRMED" ? "bg-blue-50 border-blue-500" : "bg-amber-50 border-amber-500"}
                        `}>
                          <div className="flex justify-between items-start">
                             <p className="text-[10px] font-black uppercase text-blue-600/70 tracking-tight">{appointment.type}</p>
                             {appointment.status === "CONFIRMED" && <Check size={12} className="text-blue-500" />}
                          </div>
                          <p className="font-black text-slate-900 text-sm mt-1">{appointment.patient}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{appointment.owner}</p>
                        </div>
                      )}
                      {!appointment && (
                        <button className="w-full h-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-blue-400 transition-opacity">
                          <Plus size={20} />
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
