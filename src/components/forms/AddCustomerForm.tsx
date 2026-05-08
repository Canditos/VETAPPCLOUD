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
import { 
  User, 
  Mail, 
  Phone, 
  CreditCard, 
  MapPin, 
  FileText,
  UserPlus
} from "lucide-react";

const customerSchema = z.object({
  name: z.string().min(2, "Nome completo é obrigatório"),
  email: z.string().email("Email inválido").or(z.literal("")),
  phone: z.string().min(9, "Telemóvel inválido").or(z.literal("")),
  vatNumber: z.string().length(9, "NIF deve ter 9 dígitos").regex(/^\d+$/, "NIF inválido"),
  address: z.string().min(5, "Morada fiscal completa é obrigatória"),
  notes: z.string().optional(),
});

type CustomerFormValues = z.infer<typeof customerSchema>;

export function AddCustomerForm({ onSuccess }: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, formState: { errors }, reset } = useForm<CustomerFormValues>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      vatNumber: "",
      address: "",
      notes: "",
    }
  });

  const mutation = useMutation({
    mutationFn: async (values: CustomerFormValues) => {
      const res = await fetch("/api/customers", {
        method: "POST",
        body: JSON.stringify(values),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Erro ao criar cliente");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Cliente registado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      reset();
      onSuccess?.();
    },
    onError: (err: any) => {
      toast.error(err.message || "Ocorreu um erro ao registar o cliente.");
    }
  });

  return (
    <DialogContent className="sm:max-w-[600px] rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden bg-white dark:bg-slate-900">
      <div className="bg-blue-600 p-10 text-white relative">
        <DialogTitle className="text-4xl font-black tracking-tight">Novo Cliente</DialogTitle>
        <DialogDescription className="text-blue-100 font-medium mt-2 text-lg opacity-90">
          Registe os dados fiscais e de contacto do tutor.
        </DialogDescription>
        <div className="absolute top-10 right-10 opacity-20">
          <UserPlus size={80} strokeWidth={1} />
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-10 space-y-8">
        <div className="space-y-6">
          {/* Identificação Base */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <User size={14} /> Nome Completo
              </Label>
              <Input id="name" {...register("name")} placeholder="Ex: Maria Alice Sousa" className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-bold text-base" />
              {errors.name && <p className="text-[10px] text-red-500 font-bold ml-4">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vatNumber" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <CreditCard size={14} className="text-blue-500" /> NIF (Contribuinte)
                </Label>
                <Input id="vatNumber" {...register("vatNumber")} placeholder="Ex: 245367891" className="h-14 rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950 px-6 font-mono font-black text-blue-600 dark:text-blue-400" />
                {errors.vatNumber && <p className="text-[10px] text-red-500 font-bold ml-4">{errors.vatNumber.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <Phone size={14} className="text-blue-500" /> Telemóvel
                </Label>
                <Input id="phone" {...register("phone")} placeholder="912 345 678" className="h-14 rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-slate-950 px-6 font-bold" />
                {errors.phone && <p className="text-[10px] text-red-500 font-bold ml-4">{errors.phone.message}</p>}
              </div>
            </div>
          </div>

          {/* Contactos & Morada */}
          <div className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <Mail size={14} /> Email de Faturação
              </Label>
              <Input id="email" type="email" {...register("email")} placeholder="cliente@exemplo.pt" className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-bold" />
              {errors.email && <p className="text-[10px] text-red-500 font-bold ml-4">{errors.email.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
                <MapPin size={14} /> Morada Fiscal
              </Label>
              <Input id="address" {...register("address")} placeholder="Rua, Número, Andar, Código Postal, Localidade" className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-bold" />
              {errors.address && <p className="text-[10px] text-red-500 font-bold ml-4">{errors.address.message}</p>}
            </div>
          </div>

          {/* Notas */}
          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2 flex items-center gap-2">
              <FileText size={14} className="text-blue-500" /> Observações Internas
            </Label>
            <textarea 
              id="notes" 
              {...register("notes")} 
              placeholder="Notas relevantes sobre o cliente..."
              className="w-full h-24 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 p-4 font-medium text-slate-700 dark:text-slate-300 placeholder:text-slate-300 outline-hidden resize-none ring-1 ring-slate-100 dark:ring-white/5"
            />
          </div>
        </div>

        <DialogFooter className="pt-4">
          <Button 
            type="submit" 
            className="w-full h-16 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xl font-black shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "A registar..." : "Finalizar Registo de Cliente"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
