"use client";

import { 
  Bed, 
  Plus, 
  Search, 
  Activity, 
  Clock, 
  CheckCircle2, 
  Thermometer, 
  Heart,
  ChevronRight,
  ClipboardList
} from "lucide-react";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";

const boxes = [
  { id: "1", patient: "Tobias", species: "Gato", breed: "Europeu", admission: "2024-05-01", tasks: 4, completed: 3, vital: "Estável", box: "Box 01" },
  { id: "2", patient: "Luna", species: "Cão", breed: "Golden", admission: "2024-05-02", tasks: 6, completed: 2, vital: "Crítico", box: "Box 02" },
  { id: "3", patient: "Simba", species: "Gato", breed: "Persa", admission: "2024-05-02", tasks: 2, completed: 2, vital: "Recuperação", box: "Box 03" },
  { id: "4", patient: null, box: "Box 04" },
  { id: "5", patient: null, box: "Box 05" },
  { id: "6", patient: null, box: "Box 06" },
];

export default function HospitalizationPage() {
  const [selectedBox, setSelectedBox] = useState<any>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Internamento</h1>
          <p className="text-slate-500 font-medium">Gestão de boxes, planos de tratamento e monitorização 24h.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="rounded-xl border-slate-200 font-bold gap-2">
            <ClipboardList size={18} /> Mapa de Tratamentos
          </Button>
          <Button className="rounded-xl bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-black gap-2">
            <Plus size={20} /> Admitir Paciente
          </Button>
        </div>
      </div>

      {/* Box Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {boxes.map((box) => (
          <Card 
            key={box.id} 
            className={`border-none shadow-sm transition-all rounded-3xl overflow-hidden group cursor-pointer
              ${box.patient ? 'ring-1 ring-slate-100 hover:ring-blue-100' : 'bg-slate-50/50 border-2 border-dashed border-slate-200 shadow-none'}`}
            onClick={() => box.patient && setSelectedBox(box)}
          >
            <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
               <Badge className={`font-black text-[10px] uppercase ${box.patient ? 'bg-blue-100 text-blue-700' : 'bg-slate-200 text-slate-500'} border-none`}>
                  {box.box}
               </Badge>
               {box.patient && (
                 <div className={`w-2 h-2 rounded-full ${box.vital === 'Crítico' ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
               )}
            </CardHeader>
            <CardContent>
               {box.patient ? (
                 <div className="space-y-4">
                    <div>
                       <h3 className="text-xl font-black text-slate-900">{box.patient}</h3>
                       <p className="text-xs text-slate-500 font-bold uppercase tracking-tight">{box.species} • {box.breed}</p>
                    </div>
                    
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <span>Tratamentos</span>
                          <span>{box.completed}/{box.tasks}</span>
                       </div>
                       <Progress value={(box.completed / box.tasks) * 100} className="h-1.5 bg-slate-100" />
                    </div>

                    <div className="flex items-center justify-between pt-2">
                       <div className="flex gap-2">
                          <Thermometer size={14} className="text-slate-300" />
                          <Heart size={14} className="text-slate-300" />
                       </div>
                       <Button variant="ghost" size="sm" className="h-7 text-[10px] font-black uppercase text-blue-600 hover:bg-blue-50 rounded-lg">
                          Ver Plano <ChevronRight size={12} />
                       </Button>
                    </div>
                 </div>
               ) : (
                 <div className="flex flex-col items-center justify-center py-8 text-slate-300 space-y-2">
                    <Bed size={32} strokeWidth={1.5} />
                    <p className="text-xs font-bold uppercase tracking-widest">Disponível</p>
                 </div>
               )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Treatment Plan Dialog (Mock) */}
      <Dialog open={!!selectedBox} onOpenChange={() => setSelectedBox(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-3xl border-none shadow-2xl p-0 overflow-hidden">
          <div className="bg-blue-600 p-8 text-white">
             <DialogHeader className="p-0">
                <div className="flex justify-between items-start">
                   <div>
                      <Badge className="bg-white/20 text-white border-none mb-2">BOX 01</Badge>
                      <DialogTitle className="text-3xl font-black">{selectedBox?.patient}</DialogTitle>
                      <p className="text-blue-100 font-medium">Internado em {selectedBox?.admission} • Motivo: Gastroenterite Hemorrágica</p>
                   </div>
                   <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                      <Activity className="text-blue-200" size={24} />
                   </div>
                </div>
             </DialogHeader>
          </div>

          <div className="p-8 space-y-6">
             <div>
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Plano de Tratamento Médio</h4>
                <div className="space-y-3">
                   {[
                     { time: "09:00", desc: "Soro Ringer Lactato (IV)", status: "done" },
                     { time: "12:00", desc: "Antibiótico Amoxicilina", status: "done" },
                     { time: "15:00", desc: "Protetor Gástrico", status: "pending" },
                     { time: "18:00", desc: "Monitorizar Temperatura", status: "pending" },
                   ].map((t, i) => (
                     <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                        <div className="text-xs font-black text-slate-400">{t.time}</div>
                        <div className="flex-1 font-bold text-slate-700 text-sm">{t.desc}</div>
                        {t.status === 'done' ? (
                          <CheckCircle2 size={18} className="text-green-500" />
                        ) : (
                          <Button size="sm" className="h-7 rounded-lg text-[10px] font-black uppercase">Fazer</Button>
                        )}
                     </div>
                   ))}
                </div>
             </div>

             <div className="flex gap-3">
                <Button className="flex-1 rounded-xl bg-blue-600 font-black h-12">Nova Medicação</Button>
                <Button variant="outline" className="flex-1 rounded-xl font-black h-12">Registar Bio</Button>
             </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
