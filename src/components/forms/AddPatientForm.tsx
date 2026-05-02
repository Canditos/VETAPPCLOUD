"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";

const patientSchema = z.object({
  name: z.string().min(2, "Nome do animal é obrigatório"),
  species: z.string().min(2, "Espécie é obrigatória"),
  breed: z.string().optional(),
  ownerName: z.string().min(2, "Nome do dono é obrigatório"),
  ownerEmail: z.string().email("Email inválido"),
  ownerPhone: z.string().optional(),
});

type PatientFormValues = z.infer<typeof patientSchema>;

export function AddPatientForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
  });

  const mutation = useMutation({
    mutationFn: async (values: PatientFormValues) => {
      const res = await fetch("/api/patients", {
        method: "POST",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Erro ao criar paciente");
      return res.json();
    },
    onSuccess: () => {
      toast.success("Paciente registado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      reset();
      onSuccess?.();
    },
    onError: () => {
      toast.error("Ocorreu um erro ao registar o paciente.");
    }
  });

  return (
    <DialogContent className="sm:max-w-[500px] rounded-3xl border-none shadow-2xl">
      <DialogHeader>
        <DialogTitle className="text-xl font-bold">Novo Registo Clínico</DialogTitle>
        <DialogDescription>
          Introduza os dados do animal e do respetivo proprietário.
        </DialogDescription>
      </DialogHeader>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6 py-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase">Nome do Animal</Label>
              <Input id="name" {...register("name")} placeholder="Ex: Tobias" className="rounded-xl" />
              {errors.name && <p className="text-[10px] text-red-500 font-bold">{errors.name.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="species" className="text-xs font-bold text-slate-500 uppercase">Espécie</Label>
              <Input id="species" {...register("species")} placeholder="Gato, Cão..." className="rounded-xl" />
              {errors.species && <p className="text-[10px] text-red-500 font-bold">{errors.species.message}</p>}
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="ownerName" className="text-xs font-bold text-slate-500 uppercase">Nome do Dono</Label>
            <Input id="ownerName" {...register("ownerName")} placeholder="Nome completo" className="rounded-xl" />
            {errors.ownerName && <p className="text-[10px] text-red-500 font-bold">{errors.ownerName.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ownerEmail" className="text-xs font-bold text-slate-500 uppercase">Email do Dono</Label>
              <Input id="ownerEmail" type="email" {...register("ownerEmail")} placeholder="email@exemplo.com" className="rounded-xl" />
              {errors.ownerEmail && <p className="text-[10px] text-red-500 font-bold">{errors.ownerEmail.message}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ownerPhone" className="text-xs font-bold text-slate-500 uppercase">Telemóvel</Label>
              <Input id="ownerPhone" {...register("ownerPhone")} placeholder="912 345 678" className="rounded-xl" />
            </div>
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button 
            type="submit" 
            className="w-full rounded-xl bg-blue-600 py-6 text-lg font-bold shadow-lg shadow-blue-200"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "A processar..." : "Finalizar Registo"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
