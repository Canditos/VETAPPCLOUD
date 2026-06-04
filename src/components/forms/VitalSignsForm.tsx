"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Activity, Thermometer, Weight, Heart, FileText } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface VitalSignsFormProps {
  patientId: string;
  onSuccess?: () => void;
}

export function VitalSignsForm({ patientId, onSuccess }: VitalSignsFormProps) {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    weight: "",
    temperature: "",
    heartRate: "",
    respiratoryRate: "",
    notes: ""
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch(`/api/patients/${patientId}/vitals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao registar sinais vitais");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["patient-hub", patientId] });
      toast.success("Sinais vitais registados!");
      onSuccess?.();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao registar sinais vitais.");
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Weight size={12} className="text-blue-500" /> Peso (kg)
          </Label>
          <Input 
            type="number" 
            step="0.01"
            placeholder="0.00" 
            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold"
            value={formData.weight}
            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Thermometer size={12} className="text-blue-500" /> Temp (ºC)
          </Label>
          <Input 
            type="number" 
            step="0.1"
            placeholder="38.5" 
            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold"
            value={formData.temperature}
            onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Heart size={12} className="text-rose-500" /> FC (BPM)
          </Label>
          <Input 
            type="number" 
            placeholder="100" 
            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold"
            value={formData.heartRate}
            onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Activity size={12} className="text-emerald-500" /> FR (RPM)
          </Label>
          <Input 
            type="number" 
            placeholder="24" 
            className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold"
            value={formData.respiratoryRate}
            onChange={(e) => setFormData({ ...formData, respiratoryRate: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <FileText size={12} /> Notas Clínicas
        </Label>
        <Textarea 
          placeholder="Mucosas, TRC, Linfonodos..." 
          className="min-h-[100px] rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-medium"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
        />
      </div>

      <Button 
        type="submit" 
        className="w-full h-14 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
        disabled={mutation.isPending}
      >
        {mutation.isPending ? "A Guardar..." : "Registar Sinais Vitais"}
      </Button>
    </form>
  );
}
