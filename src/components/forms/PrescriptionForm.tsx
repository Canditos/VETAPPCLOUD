"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Pill, Plus, Trash2, Calendar as CalendarIcon, Search, PawPrint, User as UserIcon, Printer } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { PrescriptionDownloadButton } from "@/components/clinical/PrescriptionDownloadButton";

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

export function PrescriptionForm({ patientId: initialPatientId, consultationId, onSuccess }: PrescriptionFormProps) {
  const queryClient = useQueryClient();
  const [patientId, setPatientId] = useState(initialPatientId);
  const [createdPrescription, setCreatedPrescription] = useState<any>(null);
  const [validUntil, setValidUntil] = useState<Date | undefined>(
    new Date(Date.now() + 30 * 86400000) // Default 30 days
  );
  const [items, setItems] = useState<PrescriptionItem[]>([
    { medicineName: "", dosage: "", frequency: "", duration: "", notes: "" }
  ]);

  const [patientSearch, setPatientSearch] = useState("");
  const [showResults, setShowResults] = useState(false);

  // Fetch patients
  const { data: patientsData, isLoading: isLoadingPatients } = useQuery({
    queryKey: ["patients-list"],
    queryFn: async () => {
      const res = await fetch("/api/patients?limit=1000");
      if (!res.ok) throw new Error("Erro ao carregar pacientes");
      return res.json();
    },
    enabled: !initialPatientId
  });

  const patients = patientsData?.data || [];
  const selectedPatient = patients.find((p: any) => p.id === patientId);

  const filteredPatients = patients.filter((p: any) => 
    p.name.toLowerCase().includes(patientSearch.toLowerCase()) || 
    p.owner?.name.toLowerCase().includes(patientSearch.toLowerCase())
  ).slice(0, 10);

  const { data: clinic } = useQuery({
    queryKey: ["clinic"],
    queryFn: async () => {
      const res = await fetch("/api/clinic");
      if (!res.ok) throw new Error("Erro ao carregar dados da clínica");
      return res.json();
    }
  });

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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["patient-hub", patientId] });
      queryClient.invalidateQueries({ queryKey: ["prescriptions"] });
      setCreatedPrescription(data);
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
    if (!patientId) {
      toast.error("Por favor, selecione um paciente.");
      return;
    }
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
      {/* Patient Selection */}
      {!initialPatientId && (
        <div className="bg-blue-600/5 p-6 rounded-[2.5rem] border border-blue-500/10 space-y-4">
          <Label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-2 ml-2">
            <PawPrint size={14} /> Seleção do Paciente
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative">
              <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={20} />
                <input
                  className="w-full h-16 pl-14 pr-6 rounded-2xl bg-white dark:bg-slate-900 border-none ring-1 ring-slate-200 dark:ring-white/10 font-black text-sm text-slate-900 dark:text-white placeholder:text-slate-500 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all shadow-sm"
                  placeholder="Pesquisar Animal ou Tutor..."
                  value={patientSearch}
                  onFocus={() => setShowResults(true)}
                  onChange={(e) => {
                    setPatientSearch(e.target.value);
                    setPatientId("");
                    setShowResults(true);
                  }}
                />
              </div>

              {showResults && patientSearch.length > 0 && !patientId && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white dark:bg-slate-950 rounded-[2rem] border border-slate-200 dark:border-white/10 shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 ring-1 ring-black/5">
                  {filteredPatients.length > 0 ? filteredPatients.map((p: any) => (
                    <button key={p.id}
                      type="button"
                      className="w-full text-left px-6 py-5 hover:bg-blue-600 group transition-all flex justify-between items-center border-b border-slate-100 dark:border-white/5 last:border-0"
                      onClick={() => {
                        setPatientId(p.id);
                        setPatientSearch(p.name);
                        setShowResults(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-black text-slate-900 dark:text-white group-hover:text-white">{p.name}</span>
                        <span className="text-[10px] font-bold text-slate-400 group-hover:text-blue-100 uppercase tracking-widest">{p.species}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-black text-slate-400 group-hover:text-white uppercase tracking-tighter block">{p.owner?.name}</span>
                      </div>
                    </button>
                  )) : (
                    <div className="p-8 text-center text-slate-500 font-bold text-sm">Nenhum paciente encontrado</div>
                  )}
                </div>
              )}
            </div>

            {selectedPatient ? (
              <div className="flex items-center gap-4 p-4 bg-blue-600/10 dark:bg-blue-400/5 border border-blue-600/20 rounded-2xl animate-in zoom-in-95">
                <div className="w-12 h-12 rounded-[1rem] bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-600/20">
                  <UserIcon size={20} strokeWidth={2.5} />
                </div>
                <div className="flex flex-col flex-1 overflow-hidden">
                  <span className="text-[10px] font-black text-blue-600/60 dark:text-blue-400/40 uppercase tracking-widest leading-none mb-1">Tutor Associado</span>
                  <span className="font-black text-slate-900 dark:text-white truncate">{selectedPatient.owner?.name}</span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{selectedPatient.owner?.email || "Sem email"}</span>
                </div>
                <button 
                  type="button"
                  onClick={() => { setPatientId(""); setPatientSearch(""); }}
                  className="p-2 hover:bg-blue-600/10 rounded-xl transition-colors shrink-0"
                >
                  <Trash2 size={16} className="text-red-400 hover:text-red-600" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-white/5 rounded-2xl p-4 text-slate-400 dark:text-slate-600">
                <p className="text-[10px] font-black uppercase tracking-[0.2em]">Aguardando seleção...</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Form Content */}
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
                  type="button"
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

      {createdPrescription ? (
        <div className="p-8 rounded-[2rem] bg-emerald-50 dark:bg-emerald-500/10 border-2 border-emerald-100 dark:border-emerald-500/20 flex flex-col items-center text-center space-y-4 animate-in zoom-in-95 duration-500">
          <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30">
            <Printer size={32} />
          </div>
          <div>
            <h3 className="text-xl font-black text-emerald-900 dark:text-emerald-400 uppercase tracking-tight">Prescrição Pronta!</h3>
            <p className="text-sm text-emerald-700 dark:text-emerald-500 font-medium">O documento legal foi gerado e está pronto para impressão.</p>
          </div>
          <div className="flex gap-4 w-full max-w-xs">
            <PrescriptionDownloadButton 
              prescription={createdPrescription} 
              clinic={clinic} 
            />
            <Button 
              variant="outline" 
              type="button"
              className="flex-1 rounded-xl font-black uppercase text-[10px] tracking-widest h-12"
              onClick={() => {
                setCreatedPrescription(null);
                setItems([{ medicineName: "", dosage: "", frequency: "", duration: "", notes: "" }]);
              }}
            >
              Nova Prescrição
            </Button>
          </div>
        </div>
      ) : (
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
      )}
    </form>
  );
}
