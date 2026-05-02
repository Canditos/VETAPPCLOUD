"use client";

import { useState } from "react";
import { format, addHours, startOfDay, eachHourOfInterval, isSameHour } from "date-fns";
import { pt } from "date-fns/locale";
import { CheckCircle2, Circle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Task {
  id: string;
  description: string;
  scheduledTime: string | Date;
  status: string;
  notes?: string;
}

interface Hospitalization {
  id: string;
  patient: {
    name: string;
    species: string;
  };
  boxNumber: string;
  tasks: Task[];
}

export function HospitalizationMap({ hospitalizations }: { hospitalizations: Hospitalization[] }) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  // Generate 24 hours starting from now or beginning of day
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentHour = new Date().getHours();

  return (
    <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
      <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
        <div>
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Mapa de Tratamentos (24h)</h3>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Monitorização em tempo real das boxes</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black uppercase text-slate-500">Concluído</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <span className="text-[10px] font-black uppercase text-slate-500">Pendente</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] font-black uppercase text-slate-500">Atrasado</span>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="p-6 text-left sticky left-0 bg-white z-20 border-r border-slate-50 w-64 min-w-[256px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Paciente / Box</span>
              </th>
              {hours.map((hour) => (
                <th 
                  key={hour} 
                  className={`p-4 text-center border-r border-slate-50 min-w-[80px] ${hour === currentHour ? 'bg-blue-50/50' : ''}`}
                >
                  <span className={`text-xs font-black ${hour === currentHour ? 'text-blue-600' : 'text-slate-400'}`}>
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hospitalizations.map((hosp) => (
              <tr key={hosp.id} className="border-t border-slate-50 group hover:bg-slate-50/30 transition-colors">
                <td className="p-6 sticky left-0 bg-white z-10 border-r border-slate-100 group-hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 text-blue-700 border-none font-black text-[9px] h-6">
                      {hosp.boxNumber || "BX"}
                    </Badge>
                    <div>
                      <p className="font-black text-slate-900 text-sm">{hosp.patient.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{hosp.patient.species}</p>
                    </div>
                  </div>
                </td>
                {hours.map((hour) => {
                  const tasksInHour = hosp.tasks.filter((t) => {
                    const taskDate = new Date(t.scheduledTime);
                    return taskDate.getHours() === hour;
                  });

                  const hasPending = tasksInHour.some(t => t.status === "PENDING");
                  const hasLate = hasPending && hour < currentHour;
                  const allDone = tasksInHour.length > 0 && tasksInHour.every(t => t.status === "COMPLETED");

                  return (
                    <td 
                      key={hour} 
                      className={`p-2 border-r border-slate-50 align-top ${hour === currentHour ? 'bg-blue-50/30' : ''}`}
                    >
                      <div className="flex flex-wrap gap-1 justify-center min-h-[40px]">
                        {tasksInHour.map((task) => (
                          <TooltipProvider key={task.id}>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <button className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                                  task.status === "COMPLETED" 
                                    ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                                    : hasLate 
                                      ? 'bg-red-100 text-red-600 animate-pulse' 
                                      : 'bg-amber-100 text-amber-600 hover:bg-amber-200 shadow-sm'
                                }`}>
                                  {task.status === "COMPLETED" ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                                </button>
                              </TooltipTrigger>
                              <TooltipContent className="bg-slate-900 text-white border-none rounded-xl p-3">
                                <div className="space-y-1">
                                  <p className="font-black text-xs">{task.description}</p>
                                  <p className="text-[10px] opacity-70">
                                    Agendado: {format(new Date(task.scheduledTime), "HH:mm")}
                                  </p>
                                  {task.notes && <p className="text-[10px] italic mt-1 border-t border-white/10 pt-1">{task.notes}</p>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {hospitalizations.length === 0 && (
              <tr>
                <td colSpan={25} className="py-20 text-center text-slate-300 font-bold">
                  Nenhum paciente internado no momento.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
