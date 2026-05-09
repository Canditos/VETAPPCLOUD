"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Bug, Calendar as CalendarIcon, Tag, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DewormingFormProps {
  patientId: string;
  onSuccess?: () => void;
}

export function DewormingForm({ patientId, onSuccess }: DewormingFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    type: "INTERNA",
    productName: "",
    batchNumber: "",
    appliedAt: new Date(),
    expiresAt: undefined as Date | undefined,
    notes: ""
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/patients/${patientId}/dewormings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao registar desparasitação");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-hub", patientId] });
      toast.success("Desparasitação registada com sucesso!");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registar desparasitação.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName) {
      toast.error("Nome do produto é obrigatório.");
      return;
    }
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Bug size={12} /> Tipo de Desparasitação
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {["INTERNA", "EXTERNA"].map((t) => (
              <Button
                key={t}
                type="button"
                variant={formData.type === t ? "default" : "outline"}
                className={cn(
                  "h-12 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all",
                  formData.type === t 
                    ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20" 
                    : "border-slate-100 dark:border-slate-800 text-slate-400"
                )}
                onClick={() => setFormData({ ...formData, type: t })}
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
             Nome do Produto
          </Label>
          <Input 
            placeholder="Ex: Milbemax, Bravecto..." 
            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Tag size={12} /> Lote / Batch
            </Label>
            <Input 
              placeholder="Ex: L89231" 
              className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold"
              value={formData.batchNumber}
              onChange={(e) => setFormData({ ...formData, batchNumber: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <CalendarIcon size={12} /> Data Aplicação
            </Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-12 justify-start text-left font-bold rounded-xl border-none ring-1 ring-slate-100 dark:ring-slate-700 bg-slate-50 dark:bg-slate-800",
                    !formData.appliedAt && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.appliedAt ? format(formData.appliedAt, "dd/MM/yyyy") : <span>Escolher data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.appliedAt}
                  onSelect={(date) => date && setFormData({ ...formData, appliedAt: date })}
                  initialFocus
                  locale={pt}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <CalendarIcon size={12} /> Próxima Dose (Validade)
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full h-12 justify-start text-left font-bold rounded-xl border-none ring-1 ring-slate-100 dark:ring-slate-700 bg-slate-50 dark:bg-slate-800",
                  !formData.expiresAt && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {formData.expiresAt ? format(formData.expiresAt, "dd/MM/yyyy") : <span>Sem data de validade</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={formData.expiresAt}
                onSelect={(date) => setFormData({ ...formData, expiresAt: date })}
                initialFocus
                locale={pt}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <FileText size={12} /> Observações
          </Label>
          <Textarea 
            placeholder="Notas adicionais..." 
            className="min-h-[100px] rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-medium"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          />
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "A Registar..." : "Registar Desparasitação"}
      </Button>
    </form>
  );
}
