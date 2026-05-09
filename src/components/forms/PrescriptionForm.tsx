"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Pill, Plus, Trash2, Calendar as CalendarIcon, FileText, ChevronDown } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface PrescriptionItem {
  medicineName: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
}

interface PrescriptionFormProps {
  patientId: string;
  consultationId?: string;
  onSuccess?: () => void;
}

export function PrescriptionForm({ patientId, consultationId, onSuccess }: PrescriptionFormProps) {
  const queryClient = useQueryClient();
  const [validUntil, setValidUntil] = useState<Date | undefined>(
    new Date(Date.now() + 30 * 86400000) // Default 30 days
  );
  const [items, setItems] = useState<PrescriptionItem[]>([
    { medicineName: "", dosage: "", frequency: "", duration: "", notes: "" }
  ]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/prescriptions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao criar prescrição");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-hub", patientId] });
      toast.success("Prescrição criada com sucesso!");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao criar prescrição.");
    }
  });

  const addItem = () => {
    setItems([...items, { medicineName: "", dosage: "", frequency: "", duration: "", notes: "" }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof PrescriptionItem, value: string) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some(i => !i.medicineName)) {
      toast.error("Todos os itens devem ter um nome de medicamento.");
      return;
    }
    mutation.mutate({
      patientId,
      consultationId,
      validUntil,
      items
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon size={12} /> Validade da Prescrição
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-64 h-10 justify-start text-left font-bold rounded-xl border-none ring-1 ring-slate-200 dark:ring-slate-700 bg-white dark:bg-slate-900",
                    !validUntil && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
                  {validUntil ? format(validUntil, "dd/MM/yyyy") : <span>Escolher data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={validUntil}
                  onSelect={setValidUntil}
                  initialFocus
                  locale={pt}
                />
              </PopoverContent>
            </Popover>
          </div>
          <Badge className="bg-blue-600 text-white font-black text-[10px] px-4 py-2 rounded-xl shadow-lg shadow-blue-500/20 uppercase tracking-widest">
            Protocolo Clínico
          </Badge>
        </div>

        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="relative bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4 animate-in fade-in zoom-in-95 duration-300">
              <div className="flex justify-between items-start">
                <div className="flex-1 space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Medicamento / Substância</Label>
                  <Input 
                    placeholder="Ex: Clavaseptin 500mg" 
                    className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-black text-lg"
                    value={item.medicineName}
                    onChange={(e) => updateItem(index, "medicineName", e.target.value)}
                  />
                </div>
                {items.length > 1 && (
                  <Button 
                    type="button"
                    variant="ghost" 
                    size="icon" 
                    className="text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl ml-2 mt-6"
                    onClick={() => removeItem(index)}
                  >
                    <Trash2 size={18} />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Posologia</Label>
                  <Input 
                    placeholder="Ex: 1 comp" 
                    className="h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-3 font-bold"
                    value={item.dosage}
                    onChange={(e) => updateItem(index, "dosage", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Frequência</Label>
                  <Input 
                    placeholder="Ex: 12/12h" 
                    className="h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-3 font-bold"
                    value={item.frequency}
                    onChange={(e) => updateItem(index, "frequency", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duração</Label>
                  <Input 
                    placeholder="Ex: 7 dias" 
                    className="h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-3 font-bold"
                    value={item.duration}
                    onChange={(e) => updateItem(index, "duration", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Instruções Adicionais</Label>
                <Input 
                  placeholder="Ex: Administrar com alimento..." 
                  className="h-10 rounded-lg bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-3 font-medium text-xs"
                  value={item.notes}
                  onChange={(e) => updateItem(index, "notes", e.target.value)}
                />
              </div>
            </div>
          ))}
        </div>

        <Button 
          type="button"
          variant="outline"
          className="w-full mt-6 py-8 border-dashed border-slate-200 dark:border-slate-800 rounded-[2rem] bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900 text-slate-400 dark:text-slate-600 font-black uppercase text-[10px] tracking-widest transition-all"
          onClick={addItem}
        >
          <Plus size={16} className="mr-2" strokeWidth={3} /> Adicionar Medicamento
        </Button>
      </div>

      <Button 
        type="submit" 
        className="w-full h-16 rounded-[2rem] bg-slate-900 dark:bg-blue-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 group"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "A Gerar Prescrição..." : (
          <span className="flex items-center gap-3">
            Finalizar e Emitir Prescrição <Pill size={20} className="group-hover:rotate-12 transition-transform" />
          </span>
        )}
      </Button>
    </form>
  );
}
