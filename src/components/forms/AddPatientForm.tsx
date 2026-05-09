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
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Search, 
  UserPlus, 
  Check, 
  ChevronsUpDown, 
  User, 
  Info, 
  ShieldAlert,
  Stethoscope,
  Scissors
} from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  const [isSearching, setIsSearching] = useState(false);
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

  // Pre-select owner if defaultOwnerId is provided
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

  // Fetch owners when searching
  useEffect(() => {
    const fetchOwners = async () => {
      if (ownerSearch.length < 2) {
        setOwners([]);
        return;
      }
      setIsSearching(true);
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(ownerSearch)}&limit=5`);
        const result = await res.json();
        setOwners(result.data || []);
      } catch (err) {
        console.error("Error searching owners:", err);
      } finally {
        setIsSearching(false);
      }
    };

    const timer = setTimeout(fetchOwners, 300);
    return () => clearTimeout(timer);
  }, [ownerSearch]);

  const mutation = useMutation({
    mutationFn: async (values: PatientFormValues) => {
      const res = await fetch("/api/patients", {
        method: "POST",
        body: JSON.stringify({
          ...values,
          isNewOwner,
        }),
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
    onError: (err: any) => {
      toast.error(err.message || "Ocorreu um erro ao registar o paciente.");
    }
  });

  const handleSelectOwner = (owner: any) => {
    setSelectedOwner(owner);
    setValue("ownerId", owner.id);
    setValue("ownerName", owner.name);
    setOwnerSearch("");
    setOwners([]);
  };

  return (
    <DialogContent className="sm:max-w-[700px] rounded-[3rem] border-none shadow-xl p-0 overflow-hidden bg-white dark:bg-slate-900">
      <div className="bg-blue-600 p-10 text-white relative">
        <DialogTitle className="text-4xl font-black tracking-tight">Novo Registo Clínico</DialogTitle>
        <DialogDescription className="text-blue-100 font-medium mt-2 text-lg">
          Ficha detalhada para gestão veterinária avançada.
        </DialogDescription>
        <div className="absolute top-10 right-10 opacity-20">
          <Stethoscope size={80} strokeWidth={1} />
        </div>
      </div>

      <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="p-0">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-10 pt-6">
            <TabsList className="grid w-full grid-cols-2 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 p-1">
              <TabsTrigger value="patient" className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">
                Animal
              </TabsTrigger>
              <TabsTrigger value="owner" className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-950 data-[state=active]:shadow-sm">
                Proprietário
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="p-10 pt-6 max-h-[60vh] overflow-y-auto no-scrollbar">
            <TabsContent value="patient" className="space-y-10 m-0">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-8">
                <div className="grid gap-3">
                  <Label htmlFor="name" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Nome do Animal</Label>
                  <Input id="name" {...register("name")} placeholder="Ex: Tobias" className="h-16 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-bold text-lg" />
                  {errors.name && <p className="text-[10px] text-red-500 font-bold ml-4">{errors.name.message}</p>}
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="species" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Espécie</Label>
                  <select 
                    {...register("species")}
                    className="h-16 rounded-2xl border-none bg-slate-50 dark:bg-slate-950 px-6 font-bold text-lg dark:text-slate-200 outline-hidden"
                  >
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
              <div className="grid grid-cols-3 gap-6">
                <div className="grid gap-3">
                  <Label className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Género</Label>
                  <div className="flex bg-slate-100 dark:bg-slate-800 rounded-2xl p-1 h-14">
                    <button 
                      type="button"
                      onClick={() => setValue("gender", "M")}
                      className={cn("flex-1 rounded-xl text-xs font-black transition-all", watch("gender") === "M" ? "bg-white dark:bg-slate-950 text-blue-600 shadow-sm" : "text-slate-400")}
                    >Macho</button>
                    <button 
                      type="button"
                      onClick={() => setValue("gender", "F")}
                      className={cn("flex-1 rounded-xl text-xs font-black transition-all", watch("gender") === "F" ? "bg-white dark:bg-slate-950 text-rose-600 shadow-sm" : "text-slate-400")}
                    >Fêmea</button>
                  </div>
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="weight" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Peso (kg)</Label>
                  <Input id="weight" {...register("weight")} placeholder="0.00" className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-bold" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="birthDate" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Nascimento</Label>
                  <Input id="birthDate" type="date" {...register("birthDate")} className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-bold" />
                </div>
              </div>

              {/* Health Plan Section */}
              <div className="p-8 rounded-[2.5rem] bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-800/30 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                    <ShieldAlert size={22} strokeWidth={2.5} />
                    <div>
                      <span className="text-[11px] font-black uppercase tracking-widest block">Plano de Saúde</span>
                      <span className="text-[10px] font-bold opacity-70">Descontos automáticos em atos clínicos</span>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600 text-white font-black px-3 py-1 rounded-lg">PRO</Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <button 
                     type="button"
                     onClick={() => setValue("healthPlanId", "")}
                     className={cn(
                       "p-4 rounded-2xl text-left transition-all border-2",
                       !watch("healthPlanId") 
                         ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-sm" 
                         : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400"
                     )}
                   >
                     <p className="font-black text-xs uppercase tracking-widest">Sem Plano</p>
                     <p className="text-[10px] font-bold opacity-60 mt-1">Particular / Geral</p>
                   </button>
                   <button 
                     type="button"
                     onClick={() => setValue("healthPlanId", "plan-premium")}
                     className={cn(
                       "p-4 rounded-2xl text-left transition-all border-2",
                       watch("healthPlanId") === "plan-premium" 
                         ? "bg-white dark:bg-slate-800 border-emerald-500 shadow-sm" 
                         : "bg-slate-50 dark:bg-slate-900 border-transparent text-slate-400"
                     )}
                   >
                     <p className="font-black text-xs uppercase tracking-widest text-emerald-600">Premium Plus</p>
                     <p className="text-[10px] font-bold opacity-60 mt-1">Vacinas + Checkup Inc.</p>
                   </button>
                </div>
              </div>

              {/* Clinical Details */}
              <div className="grid grid-cols-2 gap-8">
                <div className="grid gap-3">
                  <Label htmlFor="microchip" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Nº Microchip</Label>
                  <Input id="microchip" {...register("microchip")} placeholder="900000000000000" className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-mono font-bold" />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="breed" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Raça / Pelagem</Label>
                  <Input id="breed" {...register("breed")} placeholder="Ex: Siamês, Tricolor" className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-bold" />
                </div>
              </div>

              {/* Pro Indicators */}
              <div className="grid grid-cols-2 gap-8">
                <div className="p-6 rounded-[2rem] bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800/30 space-y-4">
                  <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                    <Scissors size={18} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Estado Reprodutivo</span>
                  </div>
                  <div className="flex gap-2">
                    {["Intacto", "Castrado", "Esterilizado"].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setValue("reproductiveStatus", status)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                          watch("reproductiveStatus") === status 
                            ? "bg-indigo-600 text-white shadow-sm" 
                            : "bg-white dark:bg-slate-800 text-indigo-400 border border-indigo-100 dark:border-indigo-800"
                        )}
                      >{status}</button>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-[2rem] bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-800/30 space-y-4">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <ShieldAlert size={18} strokeWidth={2.5} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Nível Agressividade</span>
                  </div>
                  <div className="flex gap-2">
                    {["Baixo", "Médio", "Alto"].map((lvl) => (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setValue("aggressionLevel", lvl)}
                        className={cn(
                          "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all",
                          watch("aggressionLevel") === lvl 
                            ? (lvl === "Alto" ? "bg-rose-600 text-white" : "bg-amber-600 text-white") + " shadow-sm" 
                            : "bg-white dark:bg-slate-800 text-amber-400 border border-amber-100 dark:border-amber-800"
                        )}
                      >{lvl}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid gap-3">
                <Label htmlFor="allergies" className="text-[11px] font-black text-rose-500 uppercase tracking-widest ml-2 flex items-center gap-2">
                  <Info size={14} /> Alertas Médicos / Alergias
                </Label>
                <textarea 
                  id="allergies" 
                  {...register("allergies")} 
                  placeholder="Ex: Alergia a Penicilina, Diabetes, etc."
                  className="w-full h-32 rounded-2xl border-none bg-rose-50 dark:bg-rose-900/10 p-6 font-bold text-rose-900 dark:text-rose-100 placeholder:text-rose-200 outline-hidden resize-none"
                />
              </div>
            </TabsContent>

            <TabsContent value="owner" className="space-y-10 m-0 animate-in slide-in-from-right-4 duration-500">
              <div className="flex justify-between items-center px-2">
                <h3 className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Seleção de Proprietário</h3>
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setIsNewOwner(!isNewOwner);
                    setSelectedOwner(null);
                    setValue("ownerId", "");
                  }}
                  className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest gap-2 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                >
                  {isNewOwner ? <Search size={14} strokeWidth={3} /> : <UserPlus size={14} strokeWidth={3} />}
                  {isNewOwner ? "Pesquisar Existente" : "Criar Novo Dono"}
                </Button>
              </div>

              {!isNewOwner ? (
                <div className="space-y-6">
                  {selectedOwner ? (
                    <div className="flex items-center justify-between p-8 rounded-[2.5rem] bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 group animate-in zoom-in-95 duration-300">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-sm">
                          <User size={32} strokeWidth={2.5} />
                        </div>
                        <div>
                          <p className="font-black text-2xl text-blue-900 dark:text-blue-100 tracking-tight">{selectedOwner.name}</p>
                          <p className="text-xs font-bold text-blue-500 dark:text-blue-400 uppercase tracking-[0.2em] mt-1">{selectedOwner.email || selectedOwner.phone || "Sem contacto"}</p>
                        </div>
                      </div>
                      <Button 
                        type="button" 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => {
                          setSelectedOwner(null);
                          setValue("ownerId", "");
                        }}
                        className="w-12 h-12 rounded-2xl text-blue-300 hover:text-rose-500 transition-colors"
                      >
                        <ChevronsUpDown size={24} />
                      </Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Search className="absolute left-8 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600" size={24} />
                      <Input 
                        placeholder="Pesquisar por nome, telemóvel ou NIF..." 
                        value={ownerSearch}
                        onChange={(e) => setOwnerSearch(e.target.value)}
                        className="h-20 pl-20 pr-8 rounded-[2rem] border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-black text-xl shadow-inner placeholder:text-slate-300"
                      />
                      
                      {owners.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-4xl border border-slate-100 dark:border-slate-800 p-3 z-50 animate-in fade-in slide-in-from-top-4">
                          {owners.map((owner) => (
                            <div 
                              key={owner.id}
                              onClick={() => handleSelectOwner(owner)}
                              className="flex items-center justify-between p-5 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all group"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                  <User size={22} />
                                </div>
                                <div>
                                  <p className="font-black text-lg text-slate-900 dark:text-white tracking-tight">{owner.name}</p>
                                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{owner.phone || owner.email}</p>
                                </div>
                              </div>
                              <Check className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" size={24} strokeWidth={3} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
                  <div className="grid gap-3">
                    <Label htmlFor="ownerName" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Nome do Novo Dono</Label>
                    <Input id="ownerName" {...register("ownerName")} placeholder="Nome completo" className="h-16 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-bold text-lg" />
                  </div>

                  <div className="grid grid-cols-2 gap-8">
                    <div className="grid gap-3">
                      <Label htmlFor="ownerEmail" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Email</Label>
                      <Input id="ownerEmail" type="email" {...register("ownerEmail")} placeholder="email@exemplo.com" className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-bold" />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="ownerPhone" className="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest ml-2">Telemóvel</Label>
                      <Input id="ownerPhone" {...register("ownerPhone")} placeholder="912 345 678" className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-bold" />
                    </div>
                  </div>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>

        <DialogFooter className="p-10 pt-0">
          <Button 
            type="submit" 
            className="w-full h-20 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white text-2xl font-black shadow-sm transition-all active:scale-[0.98] disabled:opacity-50"
            disabled={mutation.isPending || (!isNewOwner && !selectedOwner)}
          >
            {mutation.isPending ? "A processar..." : "Finalizar Registo Clínico"}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}
