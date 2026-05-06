"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CheckCircle2, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const currentHour = new Date().getHours();

  return (
    <div className="bg-white dark:bg-slate-900 rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 overflow-hidden">
      <div className="p-8 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
        <div>
          <h3 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Mapa de Tratamentos (24h)</h3>
          <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Monitorização em tempo real das boxes</p>
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
              <th className="p-6 text-left sticky left-0 bg-white dark:bg-slate-900 z-20 border-r border-slate-50 dark:border-slate-800 w-64 min-w-[256px]">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Paciente / Box</span>
              </th>
              {hours.map((hour) => (
                <th 
                  key={hour} 
                  className={`p-4 text-center border-r border-slate-50 dark:border-slate-800 min-w-[80px] ${hour === currentHour ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                >
                  <span className={`text-xs font-black ${hour === currentHour ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                    {String(hour).padStart(2, "0")}:00
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {hospitalizations.map((hosp) => (
              <tr key={hosp.id} className="border-t border-slate-50 dark:border-slate-800 group hover:bg-slate-50/30 dark:hover:bg-slate-800/30 transition-colors">
                <td className="p-6 sticky left-0 bg-white dark:bg-slate-900 z-10 border-r border-slate-100 dark:border-slate-800 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-none font-black text-[9px] h-6">
                      {hosp.boxNumber || "BX"}
                    </Badge>
                    <div>
                      <p className="font-black text-slate-900 dark:text-slate-100 text-sm">{hosp.patient.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{hosp.patient.species}</p>
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

                  return (
                    <td 
                      key={hour} 
                      className={`p-2 border-r border-slate-50 dark:border-slate-800 align-top ${hour === currentHour ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                    >
                      <div className="flex flex-wrap gap-1 justify-center min-h-[40px]">
                        {tasksInHour.map((task) => (
                          <button 
                            key={task.id}
                            title={`${task.description} (${format(new Date(task.scheduledTime), "HH:mm")})`}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                              task.status === "COMPLETED" 
                                ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50' 
                                : hasLate 
                                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 animate-pulse' 
                                  : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 shadow-sm'
                            }`}
                          >
                            {task.status === "COMPLETED" ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                          </button>
                        ))}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
            {hospitalizations.length === 0 && (
              <tr>
                <td colSpan={25} className="py-20 text-center text-slate-300 dark:text-slate-700 font-bold">
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
