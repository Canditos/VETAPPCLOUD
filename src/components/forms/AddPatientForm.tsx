"use client";

import { useState, useEffect } from "react";
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
  Search, 
  UserPlus, 
  Check, 
  User, 
  Info, 
  ShieldAlert,
  Stethoscope,
  Scissors
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const patientSchema = z.object({
  name: z.string().min(2, "Nome do animal é obrigatório"),
  species: z.string().min(2, "Espécie é obrigatória"),
  breed: z.string().optional(),
  gender: z.string().optional(),
  birthDate: z.string().optional(),
  weight: z.string().optional(),
  microchip: z.string().optional(),
  coatColor: z.string().optional(),
  reproductiveStatus: z.string().optional(),
  aggressionLevel: z.string().optional(),
  allergies: z.string().optional(),
  healthPlanId: z.string().optional(),
  ownerId: z.string().optional(),
  ownerName: z.string().min(2, "Nome do dono é obrigatório").optional(),
  ownerEmail: z.string().email("Email inválido").optional(),
  ownerPhone: z.string().optional(),
}).refine((data) => data.ownerId || (data.ownerName && data.ownerEmail), {
  message: "Deve selecionar um dono existente ou preencher os dados de um novo.",
  path: ["ownerName"],
});

type PatientFormValues = z.infer<typeof patientSchema>;

export function AddPatientForm({ onSuccess, defaultOwnerId }: { onSuccess?: () => void; defaultOwnerId?: string }) {
  const queryClient = useQueryClient();
  const [isNewOwner, setIsNewOwner] = useState(false);
  const [ownerSearch, setOwnerSearch] = useState("");
  const [owners, setOwners] = useState<any[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("patient");

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: {
      species: "Gato",
      gender: "F",
      reproductiveStatus: "Intacto",
      aggressionLevel: "Baixo"
    }
  });

  useEffect(() => {
    if (defaultOwnerId) {
      const fetchOwner = async () => {
        try {
          const res = await fetch(`/api/customers/${defaultOwnerId}`);
          if (res.ok) {
            const owner = await res.json();
            setSelectedOwner(owner);
            setValue("ownerId", owner.id);
            setIsNewOwner(false);
            setActiveTab("patient");
          }
        } catch (err) {
          console.error("Error fetching default owner:", err);
        }
      };
      fetchOwner();
    }
  }, [defaultOwnerId, setValue]);

  useEffect(() => {
    const fetchOwners = async () => {
      if (ownerSearch.length < 2) {
        setOwners([]);
        return;
      }
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(ownerSearch)}&limit=5`);
        const result = await res.json();
        setOwners(result.data || []);
      } catch (err) {
        console.error("Error searching owners:", err);
      }
    };
    const timer = setTimeout(fetchOwners, 300);
    return () => clearTimeout(timer);
  }, [ownerSearch]);

  const mutation = useMutation({
    mutationFn: async (values: PatientFormValues) => {
      const res = await fetch("/api/patients", {
        method: "POST",
        body: JSON.stringify({ ...values, isNewOwner }),
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Erro ao criar paciente");
      return res.json();
    },
    // Optimistic Update
    onMutate: async (newPatient) => {
      await queryClient.cancelQueries({ queryKey: ["patients"] });
      const previousPatients = queryClient.getQueryData(["patients"]);
      
      queryClient.setQueryData(["patients"], (old: any) => {
        if (!old) return { data: [newPatient], pagination: { total: 1, page: 1, limit: 30, totalPages: 1 } };
        return {
          ...old,
          data: [newPatient, ...(old.data || [])],
          pagination: {
            ...old.pagination,
            total: (old.pagination?.total || 0) + 1,
          }
        };
      });

      return { previousPatients };
    },
    onError: (err: any, newPatient, context: any) => {
      queryClient.setQueryData(["patients"], context.previousPatients);
      toast.error(err.message || "Erro ao registar paciente.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["patients"] });
      toast.success("Paciente registado com sucesso!");
      reset();
      onSuccess?.();
    },
  });

  const handleSelectOwner = (owner: any) => {
    setSelectedOwner(owner);
    setValue("ownerId", owner.id);
    setValue("ownerName", owner.name);
    setOwnerSearch("");
    setOwners([]);
  };

  return (
    <DialogContent className="sm:max-w-[650px] rounded-2xl p-0 overflow-hidden bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl">
      <div className="bg-blue-600 p-6 text-white">
        <DialogTitle className="text-xl font-bold">Novo Registo Clínico</DialogTitle>
        <DialogDescription className="text-blue-100 text-sm mt-1">
          Preencha os dados do animal e do proprietário.
        </DialogDescription>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="flex flex-col h-[75vh]">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-4 pb-2 bg-white dark:bg-slate-900">
            <TabsList className="grid w-full grid-cols-2 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
              <TabsTrigger value="patient" className="rounded-md font-medium text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                Animal
              </TabsTrigger>
              <TabsTrigger value="owner" className="rounded-md font-medium text-xs data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:shadow-sm">
                Proprietário
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-2 space-y-6">
            <TabsContent value="patient" className="m-0 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-xs font-medium text-slate-600 dark:text-slate-400">Nome do Animal</Label>
                  <Input id="name" {...register("name")} placeholder="Ex: Tobias" className="h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                  {errors.name && <p className="text-[10px] text-red-500">{errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="species" className="text-xs font-medium text-slate-600 dark:text-slate-400">Espécie</Label>
                  <select {...register("species")} className="h-10 w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 text-sm dark:text-slate-200 outline-none">
                    <option value="Gato">Gato</option>
                    <option value="Cão">Cão</option>
                    <option value="Ave">Ave</option>
                    <option value="Coelho">Coelho</option>
                    <option value="Réptil">Réptil</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              {/* Bio Details */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600 dark:text-slate-400">Género</Label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 h-10">
                    <button type="button" onClick={() => setValue("gender", "M")} className={cn("flex-1 rounded-md text-xs font-medium transition-all", watch("gender") === "M" ? "bg-white dark:bg-slate-700 text-blue-600 shadow-sm" : "text-slate-500")}>Macho</button>
                    <button type="button" onClick={() => setValue("gender", "F")} className={cn("flex-1 rounded-md text-xs font-medium transition-all", watch("gender") === "F" ? "bg-white dark:bg-slate-700 text-rose-600 shadow-sm" : "text-slate-500")}>Fêmea</button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-xs font-medium text-slate-600 dark:text-slate-400">Peso (kg)</Label>
                  <Input id="weight" {...register("weight")} placeholder="0.00" className="h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthDate" className="text-xs font-medium text-slate-600 dark:text-slate-400">Nascimento</Label>
                  <Input id="birthDate" type="date" {...register("birthDate")} className="h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                </div>
              </div>

              {/* Health Plan */}
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/30 space-y-3">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <ShieldAlert size={16} />
                  <span className="text-xs font-bold uppercase">Plano de Saúde</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                   <button type="button" onClick={() => setValue("healthPlanId", "")} className={cn("p-3 rounded-lg text-left transition-all border text-xs font-medium", !watch("healthPlanId") ? "bg-white dark:bg-slate-800 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm" : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500")}>Sem Plano</button>
                   <button type="button" onClick={() => setValue("healthPlanId", "plan-premium")} className={cn("p-3 rounded-lg text-left transition-all border text-xs font-medium", watch("healthPlanId") === "plan-premium" ? "bg-white dark:bg-slate-800 border-emerald-500 text-emerald-700 dark:text-emerald-400 shadow-sm" : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-500")}>Premium Plus</button>
                </div>
              </div>

              {/* Microchip & Breed */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="microchip" className="text-xs font-medium text-slate-600 dark:text-slate-400">Nº Microchip</Label>
                  <Input id="microchip" {...register("microchip")} placeholder="900..." className="h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="breed" className="text-xs font-medium text-slate-600 dark:text-slate-400">Raça</Label>
                  <Input id="breed" {...register("breed")} placeholder="Ex: Siamês" className="h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                </div>
              </div>

              {/* Reproductive & Aggression */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/30 space-y-2">
                  <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400">
                    <Scissors size={14} />
                    <span className="text-[10px] font-bold uppercase">Reprodutivo</span>
                  </div>
                  <div className="flex gap-1">
                    {["Intacto", "Castrado"].map((status) => (
                      <button key={status} type="button" onClick={() => setValue("reproductiveStatus", status)} className={cn("flex-1 py-1.5 rounded text-[10px] font-medium transition-all", watch("reproductiveStatus") === status ? "bg-indigo-600 text-white" : "bg-white dark:bg-slate-800 text-indigo-400 border border-indigo-100 dark:border-indigo-800")}>{status}</button>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800/30 space-y-2">
                  <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                    <ShieldAlert size={14} />
                    <span className="text-[10px] font-bold uppercase">Agressividade</span>
                  </div>
                  <div className="flex gap-1">
                    {["Baixo", "Médio", "Alto"].map((lvl) => (
                      <button key={lvl} type="button" onClick={() => setValue("aggressionLevel", lvl)} className={cn("flex-1 py-1.5 rounded text-[10px] font-medium transition-all", watch("aggressionLevel") === lvl ? (lvl === "Alto" ? "bg-rose-600" : "bg-amber-600") + " text-white" : "bg-white dark:bg-slate-800 text-amber-400 border border-amber-100 dark:border-amber-800")}>{lvl}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allergies" className="text-xs font-medium text-rose-600 dark:text-rose-400 flex items-center gap-2">
                  <Info size={14} /> Alertas / Alergias
                </Label>
                <textarea id="allergies" {...register("allergies")} placeholder="Ex: Alergia a Penicilina..." className="w-full h-20 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-3 text-sm dark:text-slate-200 outline-none resize-none" />
              </div>
            </TabsContent>

            <TabsContent value="owner" className="m-0 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold text-slate-500 uppercase">Proprietário</h3>
                <Button type="button" variant="ghost" size="sm" onClick={() => { setIsNewOwner(!isNewOwner); setSelectedOwner(null); setValue("ownerId", ""); }} className="text-blue-600 text-xs font-medium">
                  {isNewOwner ? "Pesquisar" : "Criar Novo"}
                </Button>
              </div>

              {!isNewOwner ? (
                <div className="space-y-4">
                  {selectedOwner ? (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center text-white"><User size={20} /></div>
                        <div>
                          <p className="font-bold text-sm text-blue-900 dark:text-blue-100">{selectedOwner.name}</p>
                          <p className="text-xs text-blue-500">{selectedOwner.email || selectedOwner.phone}</p>
                        </div>
                      </div>
                      <Button type="button" variant="ghost" size="icon" onClick={() => { setSelectedOwner(null); setValue("ownerId", ""); }} className="w-8 h-8 text-blue-400 hover:text-rose-500"><Check size={16} /></Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input placeholder="Pesquisar nome ou NIF..." value={ownerSearch} onChange={(e) => setOwnerSearch(e.target.value)} className="h-10 pl-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      {owners.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-100 dark:border-slate-700 p-2 z-50">
                          {owners.map((owner) => (
                            <div key={owner.id} onClick={() => handleSelectOwner(owner)} className="flex items-center justify-between p-3 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-600 flex items-center justify-center text-slate-500 dark:text-slate-300"><User size={16} /></div>
                                <div>
                                  <p className="font-medium text-sm text-slate-900 dark:text-white">{owner.name}</p>
                                  <p className="text-[10px] text-slate-500">{owner.phone || owner.email}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ownerName" className="text-xs font-medium text-slate-600 dark:text-slate-400">Nome do Dono</Label>
                    <Input id="ownerName" {...register("ownerName")} placeholder="Nome completo" className="h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="ownerEmail" className="text-xs font-medium text-slate-600 dark:text-slate-400">Email</Label>
                      <Input id="ownerEmail" type="email" {...register("ownerEmail")} placeholder="email@exemplo.com" className="h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ownerPhone" className="text-xs font-medium text-slate-600 dark:text-slate-400">Telemóvel</Label>
                      <Input id="ownerPhone" {...register("ownerPhone")} placeholder="912 345 678" className="h-10 rounded-lg bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700" />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-6 pt-0 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <Button type="submit" className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium" disabled={mutation.isPending || (!isNewOwner && !selectedOwner)}>
            {mutation.isPending ? "A processar..." : "Registar Animal"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
