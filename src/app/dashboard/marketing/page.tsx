"use client";

import { useState } from "react";
import { 
  Send, Search, MessageSquare, Phone, User as UserIcon,
  CheckCircle2, AlertTriangle, Loader2, Users, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function MarketingPage() {
  const [search, setSearch] = useState("");
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");
  const [results, setResults] = useState<any[] | null>(null);

  const { data: owners, isLoading } = useQuery({
    queryKey: ["owners-with-phone"],
    queryFn: async () => {
      const res = await fetch("/api/owners?hasPhone=true&limit=500");
      if (!res.ok) return [];
      return res.json();
    }
  });

  const filteredOwners = (owners || []).filter((o: any) =>
    !search || o.name?.toLowerCase().includes(search.toLowerCase()) || o.phone?.includes(search)
  );

  const toggleOwner = (id: string) => {
    setSelectedOwners((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedOwners(new Set(filteredOwners.map((o: any) => o.id)));
  };

  const clearSelection = () => setSelectedOwners(new Set());

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/marketing/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, ownerIds: Array.from(selectedOwners) }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao enviar campanha");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setResults(data.results);
      toast.success(`Campanha enviada! ${data.sent} enviados, ${data.failed} falhas.`);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const charsLeft = 160 - message.length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1400px] mx-auto pb-20">
      <div>
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">Campanhas SMS</h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium mt-2">Envie comunicações em massa para os tutores.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Owner Selection */}
        <div className="lg:col-span-3 space-y-4">
          <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <Users size={20} className="text-blue-600" /> Selecionar Tutores
                </CardTitle>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" className="text-xs font-bold" onClick={selectAllFiltered}>
                    Selecionar Todos
                  </Button>
                  <Button variant="ghost" size="sm" className="text-xs font-bold text-rose-600" onClick={clearSelection}>
                    Limpar
                  </Button>
                </div>
              </div>
              <div className="relative mt-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Procurar por nome ou telefone..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 pl-10 rounded-xl bg-slate-50 dark:bg-white/5 border-none text-sm"
                />
              </div>
              <p className="text-xs text-slate-400 font-medium mt-2">
                {selectedOwners.size} selecionados de {owners?.length || 0} tutores com telefone
              </p>
            </CardHeader>
            <CardContent className="p-0 max-h-[400px] overflow-y-auto">
              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 size={24} className="animate-spin text-slate-400" />
                </div>
              ) : filteredOwners.length === 0 ? (
                <div className="text-center py-20 text-slate-400 font-medium">
                  Nenhum tutor encontrado.
                </div>
              ) : (
                filteredOwners.map((owner: any) => (
                  <div
                    key={owner.id}
                    className={cn(
                      "flex items-center gap-4 px-6 py-4 border-b border-slate-50 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer",
                      selectedOwners.has(owner.id) && "bg-blue-50 dark:bg-blue-900/10"
                    )}
                    onClick={() => toggleOwner(owner.id)}
                  >
                    <Checkbox checked={selectedOwners.has(owner.id)} />
                    <div className="h-10 w-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0">
                      <UserIcon size={18} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{owner.name}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Phone size={11} className="text-slate-400 shrink-0" />
                        <span className="text-xs text-slate-500 font-medium truncate">{owner.phone}</span>
                        {owner.patientsCount > 0 && (
                          <>
                            <span className="text-slate-300">•</span>
                            <span className="text-xs text-slate-400">{owner.patientsCount} animais</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Compose */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
            <CardHeader className="p-6 border-b border-slate-100 dark:border-white/5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <MessageSquare size={20} className="text-blue-600" /> Compor Mensagem
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Mensagem SMS</Label>
                <Textarea
                  placeholder="Escreva a sua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="min-h-[180px] rounded-2xl bg-slate-50 dark:bg-white/5 border-none text-sm resize-none"
                  maxLength={480}
                />
                <div className="flex justify-between text-xs">
                  <span className={cn("font-bold", charsLeft < 0 ? "text-rose-600" : "text-slate-400")}>
                    {message.length}/480 caracteres
                  </span>
                  <span className="text-slate-400 font-medium">
                    ~{Math.ceil(message.length / 160)} SMS(es)
                  </span>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1.5">
                  <AlertTriangle size={12} /> Aviso
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium mt-1">
                  A campanha será enviada para {selectedOwners.size} tutores. Verifique o conteúdo antes de enviar.
                </p>
              </div>

              <Button
                className="w-full h-12 rounded-2xl gap-2 font-bold text-sm"
                disabled={!message || selectedOwners.size === 0 || sendMutation.isPending}
                onClick={() => sendMutation.mutate()}
              >
                {sendMutation.isPending ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
                {sendMutation.isPending
                  ? `A enviar para ${selectedOwners.size} tutores...`
                  : `Enviar para ${selectedOwners.size} tutores`
                }
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          {results && (
            <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
              <CardHeader className="p-6 border-b border-slate-100 dark:border-white/5">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <FileText size={20} className="text-blue-600" /> Resultado do Envio
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 max-h-[300px] overflow-y-auto">
                {results.map((r: any, i: number) => (
                  <div key={i} className="flex items-center gap-3 px-6 py-3 border-b border-slate-50 dark:border-white/5">
                    {r.status === "sent" ? (
                      <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                    ) : (
                      <AlertTriangle size={16} className="text-rose-500 shrink-0" />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{r.name}</p>
                      <p className="text-xs text-slate-400">{r.phone}</p>
                    </div>
                    <Badge className={cn(
                      "text-[9px] font-bold uppercase border-none",
                      r.status === "sent" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
                    )}>
                      {r.status === "sent" ? "OK" : "Falha"}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
