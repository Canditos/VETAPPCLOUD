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
  vatNumber: z.string().length(9, "NIF deve ter 9 dígitos").regex(/^\d+$/, "NIF inválido").min(1, "NIF é obrigatório para faturação"),
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
    // Optimistic Update
    onMutate: async (newCustomer) => {
      await queryClient.cancelQueries({ queryKey: ["customers"] });
      const previousCustomers = queryClient.getQueryData(["customers"]);
      
      // Update the cache optimistically
      queryClient.setQueryData(["customers"], (old: any) => {
        if (!old) return { data: [newCustomer], pagination: { total: 1, page: 1, limit: 30, totalPages: 1 } };
        return {
          ...old,
          data: [newCustomer, ...(old.data || [])],
          pagination: {
            ...old.pagination,
            total: (old.pagination?.total || 0) + 1,
          }
        };
      });

      return { previousCustomers };
    },
    onError: (err: any, newCustomer, context: any) => {
      // Rollback on error
      queryClient.setQueryData(["customers"], context.previousCustomers);
      toast.error(err.message || "Ocorreu um erro ao registar o cliente.");
    },
    onSettled: () => {
      // Refetch to ensure sync with server
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente registado com sucesso!");
      reset();
      onSuccess?.();
    },
  });

  return (
    <DialogContent className="sm:max-w-[600px] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl p-0 overflow-hidden bg-white dark:bg-slate-900">
      <div className="bg-blue-600 p-8 text-white relative">
        <DialogTitle className="text-2xl font-bold tracking-tight">Novo Cliente</DialogTitle>
        <DialogDescription className="text-blue-100 font-medium mt-1 text-sm opacity-90">
          Registe os dados fiscais e de contacto do tutor.
        </DialogDescription>
        <div className="absolute top-8 right-8 opacity-20">
          <UserPlus size={60} strokeWidth={1} />
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-8 space-y-6">
        <div className="space-y-4">
          {/* Identificação Base */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="name" className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <User size={14} /> Nome Completo
              </Label>
              <Input id="name" {...register("name")} placeholder="Ex: Maria Alice Sousa" className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 font-medium text-base" />
              {errors.name && <p className="text-xs text-red-500 font-medium ml-1">{errors.name.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="vatNumber" className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <CreditCard size={14} className="text-blue-500" /> NIF (Contribuinte)
                </Label>
                <Input id="vatNumber" {...register("vatNumber")} placeholder="Ex: 245367891" className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 font-mono font-medium text-blue-600 dark:text-blue-400" />
                {errors.vatNumber && <p className="text-xs text-red-500 font-medium ml-1">{errors.vatNumber.message}</p>}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone" className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                  <Phone size={14} className="text-blue-500" /> Telemóvel
                </Label>
                <Input id="phone" {...register("phone")} placeholder="912 345 678" className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 font-medium" />
                {errors.phone && <p className="text-xs text-red-500 font-medium ml-1">{errors.phone.message}</p>}
              </div>
            </div>
          </div>

          {/* Contactos & Morada */}
          <div className="grid gap-4 pt-2">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <Mail size={14} /> Email de Faturação
              </Label>
              <Input id="email" type="email" {...register("email")} placeholder="cliente@exemplo.pt" className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 font-medium" />
              {errors.email && <p className="text-xs text-red-500 font-medium ml-1">{errors.email.message}</p>}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address" className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
                <MapPin size={14} /> Morada Fiscal
              </Label>
              <Input id="address" {...register("address")} placeholder="Rua, Número, Código Postal, Localidade" className="h-12 rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-4 font-medium" />
              {errors.address && <p className="text-xs text-red-500 font-medium ml-1">{errors.address.message}</p>}
            </div>
          </div>

          {/* Notas */}
          <div className="grid gap-2">
            <Label htmlFor="notes" className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <FileText size={14} className="text-blue-500" /> Observações Internas
            </Label>
            <textarea 
              id="notes" 
              {...register("notes")} 
              placeholder="Notas relevantes sobre o cliente..."
              className="w-full h-20 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 font-medium text-sm dark:text-slate-200 outline-none resize-none"
            />
          </div>
        </div>

        <DialogFooter className="pt-2">
          <Button 
            type="submit" 
            className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "A registar..." : "Finalizar Registo de Cliente"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
