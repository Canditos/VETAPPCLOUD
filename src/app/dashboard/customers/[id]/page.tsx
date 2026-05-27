"use client";

import { useState, use, useMemo } from "react";
import { 
  Users, 
  Stethoscope, 
  CreditCard, 
  FileText, 
  History as HistoryIcon,
  Plus,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  MoreHorizontal,
  FilePlus,
  ArrowUpRight,
  PawPrint,
  Clock,
  ExternalLink,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Shield,
  ArrowRight,
  Calendar,
  Edit3,
  Save,
  X,
  Copy,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Layers,
  Send
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { InvoiceDownloadBtn } from "@/components/InvoicePDF";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";

export default function CustomerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", vatNumber: "", address: "", notes: "" });
  
  // Portal Modal state
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);
  const [manualPassword, setManualPassword] = useState("");
  const [generatedPassword, setGeneratedPassword] = useState("");
  const [isGeneratingPass, setIsGeneratingPass] = useState(false);
  const [consentLink, setConsentLink] = useState<string | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [invoiceForm, setInvoiceForm] = useState({
    description: "Consulta veterinária",
    quantity: 1,
    unitPrice: "45",
    vatRate: "23",
    paymentMethod: "CASH",
  });

  const sendConsentInvite = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/privacy/send-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ownerId: id }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Erro ao enviar convite");
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.link) setConsentLink(data.link);
      toast.success(data.message || "Convite enviado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["customer-hub", id] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const { data: customer, isLoading } = useQuery({
    queryKey: ["customer-hub", id],
    queryFn: async () => {
      const res = await fetch(`/api/customers/${id}`);
      if (!res.ok) throw new Error("Erro ao carregar hub do cliente");
      return res.json();
    }
  });

  const { data: clinic } = useQuery({
    queryKey: ["clinic-settings"],
    queryFn: async () => {
      const res = await fetch("/api/clinic");
      if (!res.ok) throw new Error("Erro ao carregar clínica");
      return res.json();
    }
  });

  const updateCustomer = useMutation({
    mutationFn: async (data: typeof editForm) => {
      const res = await fetch(`/api/customers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao atualizar cliente");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-hub", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      toast.success("Cliente atualizado com sucesso!");
      setIsEditing(false);
    },
    onError: () => toast.error("Erro ao atualizar cliente"),
  });

  const createInvoice = useMutation({
    mutationFn: async () => {
      const payload = {
        description: invoiceForm.description.trim(),
        quantity: Number(invoiceForm.quantity),
        unitPrice: Number(invoiceForm.unitPrice),
        vatRate: Number(invoiceForm.vatRate),
        paymentMethod: invoiceForm.paymentMethod,
      };

      const res = await fetch(`/api/customers/${id}/invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Erro ao emitir fatura");
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customer-hub", id] });
      queryClient.invalidateQueries({ queryKey: ["billing"] });
      setIsInvoiceModalOpen(false);
      toast.success("Fatura emitida no Vendus com sucesso.");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const handleEdit = () => {
    if (customer) {
      setEditForm({
        name: customer.name || "",
        email: customer.email || "",
        phone: customer.phone || "",
        vatNumber: customer.vatNumber || "",
        address: customer.address || "",
        notes: customer.notes || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = () => {
    if (!editForm.name.trim()) {
      toast.error("Nome é obrigatório");
      return;
    }
    updateCustomer.mutate(editForm);
  };

  const [viewMode, setViewMode] = useState<"cards" | "table" | "auto">("auto");
  const [sortKey, setSortKey] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const patients = customer?.patients || [];
  const effectiveViewMode = viewMode === "auto" ? (patients.length > 3 ? "table" : "cards") : viewMode;

  const sortedPatients = useMemo(() => {
    return [...patients].sort((a: any, b: any) => {
      let av: any, bv: any;
      if (sortKey === "_count") {
        av = a._count?.visitCount ?? 0;
        bv = b._count?.visitCount ?? 0;
      } else if (sortKey === "weight") {
        av = Number(a.weight) || 0;
        bv = Number(b.weight) || 0;
      } else {
        av = (a[sortKey] ?? "");
        bv = (b[sortKey] ?? "");
        if (typeof av === "string") { av = av.toLowerCase(); bv = String(bv).toLowerCase(); }
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [patients, sortKey, sortDir]);

  const balance = customer?.stats?.outstandingBalance || 0;

  if (isLoading) return <div className="p-12 text-center font-black text-slate-300 animate-pulse">A carregar Hub 360º...</div>;
  if (!customer) return <div className="p-12 text-center text-red-500 font-bold">Cliente não encontrado.</div>;

  const SortIcon = ({ k }: { k: string }) => {
    if (sortKey !== k) return <ArrowUpDown size={12} className="opacity-30 inline ml-1" />;
    return sortDir === "asc"
      ? <ArrowUp size={12} className="text-blue-500 inline ml-1" />
      : <ArrowDown size={12} className="text-blue-500 inline ml-1" />;
  };

  const patientSortHeader = (label: string, k: string, className?: string) => (
    <th
      className={cn("px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap", className)}
      onClick={() => handleSort(k)}
    >
      {label} <SortIcon k={k} />
    </th>
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      {/* 360º Header - Clean & Professional */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl ring-1 ring-slate-200/60 dark:ring-white/5 shadow-sm">
        <div className="flex gap-4 items-center">
          <div className="h-16 w-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-blue-500/20">
            {customer.name.charAt(0)}
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">{customer.name}</h1>
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border-none font-bold text-[9px] uppercase tracking-wider px-2 py-0.5">
                Cliente Ativo
              </Badge>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800" onClick={handleEdit}>
                <Edit3 size={14} />
              </Button>
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">ID: #{id.substring(0, 8).toUpperCase()}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <Dialog open={isPortalModalOpen} onOpenChange={setIsPortalModalOpen}>
            <DialogTrigger asChild>
              <Button 
                variant="outline" 
                className="rounded-xl h-10 font-bold border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-2 text-xs"
              >
                <Smartphone size={16} /> Portal do Tutor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
              <DialogHeader>
                <DialogTitle className="font-bold text-xl flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                    <Smartphone size={20} />
                  </div>
                  Acesso ao Portal
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <p className="text-slate-500 dark:text-slate-400 font-medium text-sm">Gere uma password de acesso para o cliente entrar no portal. O email de acesso é: <strong className="text-slate-800 dark:text-white">{customer.email || "Necessita email na ficha!"}</strong></p>
                
                {!generatedPassword ? (
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                    <div>
                      <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Password Personalizada (Opcional)</Label>
                      <Input 
                        value={manualPassword}
                        onChange={(e) => setManualPassword(e.target.value)}
                        placeholder="Deixe em branco para gerar aleatória"
                        className="mt-2 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 h-11 font-medium text-sm"
                      />
                    </div>
                    <Button 
                      className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold"
                      onClick={async () => {
                        if (!customer.email) {
                          toast.error("O cliente precisa de ter um email na ficha.");
                          return;
                        }
                        setIsGeneratingPass(true);
                        try {
                          const res = await fetch("/api/portal/generate-password", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ownerId: id, manualPassword }),
                          });
                          const data = await res.json();
                          if (data.error) throw new Error(data.error);
                          setGeneratedPassword(data.password);
                          toast.success("Acesso gerado com sucesso!");
                        } catch (e: any) {
                          toast.error(e.message || "Erro ao gerar acesso");
                        } finally {
                          setIsGeneratingPass(false);
                        }
                      }}
                      disabled={isGeneratingPass}
                    >
                      {isGeneratingPass ? "A gerar..." : "Gerar Acesso"}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in fade-in slide-in-from-bottom-2">
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 p-4 rounded-xl border border-emerald-100 dark:border-emerald-900/50 text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">Nova Password</p>
                      <p className="text-2xl font-black tracking-widest">{generatedPassword}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="w-full h-11 rounded-xl font-bold border-slate-200 dark:border-slate-800"
                      onClick={() => {
                        const text = `O seu acesso ao Portal do Gato Escondido:\nLink: https://cloud.gatoescondido.com/portal\nEmail: ${customer.email}\nPassword: ${generatedPassword}`;
                        navigator.clipboard.writeText(text);
                        toast.success("Dados copiados para partilhar!");
                      }}
                    >
                      <Copy size={16} className="mr-2" /> Copiar Dados de Acesso
                    </Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isInvoiceModalOpen} onOpenChange={setIsInvoiceModalOpen}>
            <Button 
              variant="outline" 
              className="rounded-xl h-10 font-bold border-slate-200 dark:border-slate-805 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 gap-2 text-xs"
              onClick={() => setIsInvoiceModalOpen(true)}
            >
              <FilePlus size={16} /> Criar Fatura
            </Button>
            <DialogContent className="sm:max-w-[560px] rounded-3xl border-none shadow-2xl bg-white dark:bg-slate-900">
              <DialogHeader>
                <DialogTitle className="text-xl font-black text-slate-900 dark:text-slate-100">Emitir Fatura no Vendus</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {!customer.vatNumber && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 dark:border-red-900/40 dark:bg-red-950/20 dark:text-red-300">
                    Este cliente precisa de NIF antes de poder ser faturado.
                  </div>
                )}
                {!clinic?.vendusApiKey && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
                    A API key do Vendus ainda não está configurada nas definições da clínica.
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Descrição</Label>
                  <Input
                    value={invoiceForm.description}
                    onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                    className="h-11 rounded-xl"
                    placeholder="Ex: Consulta, cirurgia, vacinação"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Quantidade</Label>
                    <Input
                      type="number"
                      min="1"
                      value={invoiceForm.quantity}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, quantity: Number(e.target.value || 1) })}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Preço unitário</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={invoiceForm.unitPrice}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, unitPrice: e.target.value })}
                      className="h-11 rounded-xl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">IVA</Label>
                    <select
                      value={invoiceForm.vatRate}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, vatRate: e.target.value })}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="23">23%</option>
                      <option value="13">13%</option>
                      <option value="6">6%</option>
                      <option value="0">0%</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Pagamento</Label>
                    <select
                      value={invoiceForm.paymentMethod}
                      onChange={(e) => setInvoiceForm({ ...invoiceForm, paymentMethod: e.target.value })}
                      className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm font-medium text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                    >
                      <option value="CASH">Dinheiro</option>
                      <option value="CARD">Cartão</option>
                      <option value="MBWAY">MB WAY</option>
                      <option value="TRANSFER">Transferência</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-600 dark:bg-slate-800/60 dark:text-slate-300">
                  Total a emitir: €{((Number(invoiceForm.quantity) || 0) * (Number(invoiceForm.unitPrice) || 0)).toFixed(2)}
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" className="rounded-xl" onClick={() => setIsInvoiceModalOpen(false)} disabled={createInvoice.isPending}>
                  Cancelar
                </Button>
                <Button
                  className="rounded-xl bg-blue-600 hover:bg-blue-700"
                  onClick={() => createInvoice.mutate()}
                  disabled={createInvoice.isPending || !customer.vatNumber || !clinic?.vendusApiKey || !invoiceForm.description.trim()}
                >
                  {createInvoice.isPending ? "A emitir..." : "Emitir Fatura"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Link href={`/dashboard/consultations?customerId=${id}`}>
            <Button className="rounded-xl h-10 font-bold bg-blue-600 hover:bg-blue-700 text-white gap-2 text-xs shadow-md shadow-blue-500/10">
              <Plus size={16} /> Nova Consulta
            </Button>
          </Link>
        </div>
      </div>

      {/* Grid de Informações de Suporte (RGPD, Dados Pessoais, Saldo) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Card 1: Dados do Tutor */}
        <Card className="border-none rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/60 dark:ring-white/5 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                <Users size={15} className="text-blue-500" /> Dados do Tutor
              </h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Phone size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Telemóvel</p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{customer.phone || "Não configurado"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Mail size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Email</p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 truncate">{customer.email || "Não configurado"}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin size={14} className="text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Morada</p>
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5 leading-relaxed">{customer.address || "Não configurado"}</p>
                </div>
              </div>
              {customer.vatNumber && (
                <div className="flex items-start gap-3">
                  <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">NIF</p>
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-0.5">{customer.vatNumber}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Card 2: Privacidade e RGPD */}
        <Card className="border-none rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200/60 dark:ring-white/5 shadow-sm p-6 flex flex-col justify-between">
          <div className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-slate-800 dark:text-slate-200 text-xs uppercase tracking-wider flex items-center gap-2">
                <Shield size={15} className="text-blue-500" /> Privacidade e RGPD
              </h3>
            </div>
            
            <div className="flex-1 flex flex-col justify-between">
              {customer.privacyConsents?.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 py-1 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400 w-fit">
                    <ShieldCheck size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Consentimento Ativo ✓</span>
                  </div>
                  
                  {(() => {
                    const c = customer.privacyConsents[0];
                    return (
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-[11px] pt-1">
                        <div>
                          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Data</p>
                          <p className="text-slate-700 dark:text-slate-300 font-semibold">{format(new Date(c.acceptedAt || c.createdAt), "dd/MM/yyyy HH:mm", { locale: pt })}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">IP</p>
                          <p className="text-slate-700 dark:text-slate-300 font-mono font-semibold">{c.ip || "—"}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Versão</p>
                          <p className="text-slate-700 dark:text-slate-300 font-mono font-semibold">{c.version}</p>
                        </div>
                        <div>
                          <p className="text-slate-400 font-bold text-[9px] uppercase tracking-wider">Método</p>
                          <p className="text-slate-700 dark:text-slate-300 font-semibold capitalize">{c.method === "portal" ? "Portal" : c.method}</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="space-y-4 h-full flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 py-1 px-3 rounded-lg bg-amber-50 dark:bg-amber-955/20 border border-amber-100 dark:border-amber-900/30 text-amber-700 dark:text-amber-400 w-fit">
                      <AlertCircle size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Pendente</span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                      O tutor ainda não assinou o consentimento RGPD. Solicite o consentimento enviando um convite.
                    </p>
                  </div>

                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 rounded-xl h-9 border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-wider gap-1.5"
                      onClick={() => router.push(`/dashboard/messages?customerId=${id}`)}
                    >
                      <Clock size={12} strokeWidth={2.5} /> Chat
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => sendConsentInvite.mutate()}
                      disabled={sendConsentInvite.isPending}
                      className="flex-1 rounded-xl h-9 border-emerald-200 dark:border-emerald-900/30 bg-emerald-50 dark:bg-emerald-950/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider gap-1.5"
                    >
                      <Send size={12} strokeWidth={2.5} /> {sendConsentInvite.isPending ? "A enviar..." : "Solicitar"}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {consentLink && (
              <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-850 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Link</p>
                  <p className="text-[10px] text-slate-600 dark:text-slate-300 truncate font-mono mt-0.5">{consentLink}</p>
                </div>
                <Button
                  size="sm"
                  onClick={() => { navigator.clipboard.writeText(consentLink); toast.success("Link copiado!"); }}
                  className="h-8 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[9px] font-bold uppercase tracking-wider px-2.5"
                >
                  Copiar
                </Button>
              </div>
            )}
          </div>
        </Card>

        {/* Card 3: Balanço e Saldo */}
        <Card className={cn(
          "border-none rounded-2xl p-6 flex flex-col justify-between shadow-sm",
          balance > 0 
            ? "bg-red-50/50 dark:bg-red-950/10 ring-1 ring-red-100/70 dark:ring-red-900/20 text-red-700 dark:text-red-400" 
            : "bg-emerald-50/50 dark:bg-emerald-950/10 ring-1 ring-emerald-100/70 dark:ring-emerald-900/20 text-emerald-700 dark:text-emerald-400"
        )}>
          <div className="flex flex-col justify-between h-full">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-black/5 dark:border-white/5 pb-3">
                <h3 className="font-bold text-xs uppercase tracking-wider flex items-center gap-2">
                  <CreditCard size={15} /> Saldo de Contas
                </h3>
              </div>
              
              <div className="flex justify-between items-center py-2">
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-70">Saldo em Dívida</p>
                  <p className="text-3xl font-black mt-1">€{(balance || 0).toFixed(2)}</p>
                </div>
                {balance > 0 ? (
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400">
                    <AlertCircle size={24} />
                  </div>
                ) : (
                  <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 size={24} />
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-black/5 dark:border-white/5 text-xs">
              <div>
                <p className="opacity-70 font-bold text-[9px] uppercase tracking-wider">Total Faturado</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">€{(customer.stats?.totalInvoiced || 0).toFixed(2)}</p>
              </div>
              <div>
                <p className="opacity-70 font-bold text-[9px] uppercase tracking-wider">Total Liquidado</p>
                <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">€{(customer.stats?.totalPaid || 0).toFixed(2)}</p>
              </div>
            </div>
          </div>
        </Card>

      </div>

      <Tabs defaultValue="animals" className="w-full">
        <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1.5 rounded-[2rem] h-auto gap-2 mb-8 w-full flex">
          <TabsTrigger value="animals" className="flex-1 rounded-2xl py-3 font-black text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg transition-all gap-2 justify-center">
            <PawPrint size={18} /> Animais
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex-1 rounded-2xl py-3 font-black text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg transition-all gap-2 justify-center">
            <CreditCard size={18} /> Financeiro
          </TabsTrigger>
          <TabsTrigger value="budgets" className="flex-1 rounded-2xl py-3 font-black text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg transition-all gap-2 justify-center">
            <FileText size={18} /> Orçamentos
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 rounded-2xl py-3 font-black text-slate-500 dark:text-slate-400 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-blue-600 dark:data-[state=active]:text-blue-400 data-[state=active]:shadow-lg transition-all gap-2 justify-center">
            <HistoryIcon size={18} /> Histórico Clínico
          </TabsTrigger>
        </TabsList>

        {/* Animals Tab */}
        <TabsContent value="animals" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="flex items-center justify-end gap-2 mb-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">Vista:</span>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 rounded-lg px-3 text-xs font-bold", effectiveViewMode === "cards" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-slate-400")}
              onClick={() => setViewMode("cards")}
            >
              <PawPrint size={14} className="mr-1.5" /> Cards
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-8 rounded-lg px-3 text-xs font-bold", effectiveViewMode === "table" ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" : "text-slate-400")}
              onClick={() => setViewMode("table")}
            >
              <Layers size={14} className="mr-1.5" /> Tabela
            </Button>
          </div>
          {effectiveViewMode === "cards" ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {patients.map((animal: any) => (
                <Card key={animal.id} className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2.5rem] overflow-hidden group hover:-translate-y-2 transition-all duration-500 bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
                  <div className="bg-slate-50 dark:bg-slate-800/50 p-8 flex items-center gap-6">
                    <div className="h-20 w-20 rounded-3xl bg-white dark:bg-slate-800 shadow-sm flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                      <PawPrint size={40} />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">{animal.name}</h3>
                      <div className="flex gap-2 mt-1">
                        <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase">{animal.species}</Badge>
                        <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase">{animal.breed || "Indefinida"}</Badge>
                      </div>
                    </div>
                  </div>
                  <CardContent className="p-8 space-y-6 bg-white dark:bg-slate-900">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Peso Atual</p>
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{animal.weight ? `${Number(animal.weight).toFixed(1)} kg` : "---"}</p>
                      </div>
                      <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Consultas</p>
                        <p className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">{animal._count?.visitCount || 0}</p>




                      </div>
                    </div>
                    <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-2">
                      <Link href={`/dashboard/patients/${animal.id}`} className="flex-1">
                        <Button className="w-full rounded-xl bg-slate-900 dark:bg-blue-600 font-black py-6 text-xs gap-2">
                          Ver Histórico <ArrowUpRight size={14} />
                        </Button>
                      </Link>
                      <Button variant="ghost" size="icon" className="rounded-xl h-12 w-12 bg-slate-50 dark:bg-slate-800 text-slate-400 dark:text-slate-500">
                        <MoreHorizontal size={20} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              <Link href={`/dashboard/patients?new=true&ownerId=${id}`} className="border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-[2.5rem] p-8 flex flex-col items-center justify-center gap-4 text-slate-300 dark:text-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 transition-all group">
                <div className="p-6 bg-slate-50 dark:bg-slate-800 rounded-full group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 transition-colors">
                  <Plus size={32} />
                </div>
                <span className="font-black text-sm uppercase tracking-[0.2em]">Adicionar Animal</span>
              </Link>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-white/5 overflow-hidden">
              <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                  {patients.length} animal{patients.length !== 1 ? "is" : ""}
                </p>
                <Link href={`/dashboard/patients?new=true&ownerId=${id}`}>
                  <Button className="h-8 rounded-xl gap-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] uppercase tracking-widest px-3">
                    <Plus size={13} strokeWidth={3} /> Novo Animal
                  </Button>
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      {patientSortHeader("Nome", "name", "pl-5 min-w-[180px]")}
                      {patientSortHeader("Espécie", "species", "min-w-[100px]")}
                      {patientSortHeader("Raça", "breed", "min-w-[140px]")}
                      {patientSortHeader("Peso", "weight", "min-w-[90px]")}
                      {patientSortHeader("Consultas", "_count", "min-w-[100px]")}
                      <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest pr-5">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {sortedPatients.map((animal: any) => (
                      <tr key={animal.id} className="group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                              <PawPrint size={15} strokeWidth={1.8} />
                            </div>
                            <span className="font-semibold text-slate-900 dark:text-white">{animal.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5">
                          <Badge variant="secondary" className="text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 uppercase tracking-widest border-none px-2 py-0.5">
                            {animal.species || "---"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                          {animal.breed || "---"}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                          {animal.weight ? `${Number(animal.weight).toFixed(1)} kg` : "---"}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                            {animal._count?.visitCount || 0}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 pr-5">
                          <Link href={`/dashboard/patients/${animal.id}`}>
                            <Button className="h-8 rounded-lg text-xs font-bold gap-1 bg-slate-900 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700 transition-all active:scale-90 px-3">
                              Histórico <ArrowUpRight size={12} strokeWidth={2.5} />
                            </Button>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </TabsContent>

        {/* Financial Tab */}
        <TabsContent value="financial" className="animate-in fade-in slide-in-from-top-2 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
                <CardHeader className="bg-white dark:bg-slate-900 border-b border-slate-50 dark:border-slate-800 p-8 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">Histórico de Faturação</CardTitle>
                    <CardDescription className="dark:text-slate-400 font-medium">Últimos documentos emitidos no sistema.</CardDescription>
                  </div>
                  <Button variant="outline" className="rounded-xl font-bold border-slate-100 dark:border-slate-800 dark:text-slate-200"
                    onClick={() => toast.info("Funcionalidade de histórico completo em desenvolvimento")}>Ver Todas</Button>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-slate-50 dark:border-slate-800">
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Nº Documento</TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Data</TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Total</TableHead>
                      <TableHead className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Estado</TableHead>
                      <TableHead className="px-8 py-5 text-right text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.invoices?.map((inv: any) => (
                      <TableRow key={inv.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 border-slate-50 dark:border-slate-800 transition-colors">
                        <TableCell className="px-8 py-6 font-black text-slate-900 dark:text-slate-200">{inv.externalId || inv.vendusId || inv.jasminInvoiceId || "Provisória"}</TableCell>
                        <TableCell className="px-8 py-6 font-bold text-slate-500 dark:text-slate-400">{inv.createdAt ? format(new Date(inv.createdAt), "dd/MM/yyyy") : "---"}</TableCell>
                        <TableCell className="px-8 py-6 font-black text-slate-900 dark:text-slate-100">€{(Number(inv.total) || 0).toFixed(2)}</TableCell>
                        <TableCell className="px-8 py-6">
                          <Badge className={`rounded-lg font-black text-[9px] uppercase ${inv.status === 'PAID' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                            {inv.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="px-8 py-6 text-right">
                          <div className="flex justify-end items-center gap-4">
                            <InvoiceDownloadBtn invoice={inv} clinic={clinic} owner={customer} />
                            <Button variant="ghost" size="icon" className="rounded-xl text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400">
                               <ExternalLink size={18} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!customer.invoices || customer.invoices.length === 0) && (
                      <TableRow><TableCell colSpan={5} className="py-12 text-center text-slate-300 dark:text-slate-700 font-bold">Sem faturas registadas.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2rem] bg-slate-900 dark:bg-slate-950 text-white overflow-hidden ring-1 ring-white/5">
                <CardHeader className="p-8 border-b border-white/5">
                  <CardTitle className="text-xl font-black flex items-center gap-2 text-white"><TrendingUp className="text-blue-400" /> Resumo Financeiro</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Faturado</p>
                    <p className="text-3xl font-black text-white">€{(customer.stats?.totalInvoiced || 0).toFixed(2)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">Total Liquidado</p>
                    <p className="text-3xl font-black text-emerald-400">€{(customer.stats?.totalPaid || 0).toFixed(2)}</p>
                  </div>
                  <div className="pt-8 border-t border-white/5">
                    <Button 
                      className="w-full rounded-2xl py-7 bg-blue-600 hover:bg-blue-700 font-black text-lg gap-2 shadow-2xl shadow-blue-500/20"
                      onClick={() => toast.info("Funcionalidade de liquidação em desenvolvimento")}
                    >
                       Liquidar Dívida
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2rem] bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-100 dark:ring-slate-800">
                <CardHeader className="p-8">
                  <CardTitle className="text-xl font-black text-slate-900 dark:text-slate-100">Pagamentos Recentes</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="px-8 pb-8 space-y-4">
                    {customer.payments?.map((p: any) => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
                        <div>
                          <p className="font-black text-slate-900 dark:text-slate-100">€{(Number(p.amount) || 0).toFixed(2)}</p>
                          <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">{p.method} • {p.paidAt ? format(new Date(p.paidAt), "dd MMM") : "---"}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                          <CheckCircle2 size={18} />
                        </div>
                      </div>
                    ))}
                    {(!customer.payments || customer.payments.length === 0) && (
                      <p className="text-center py-4 text-slate-300 dark:text-slate-700 font-bold">Sem pagamentos.</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="animate-in fade-in slide-in-from-top-2 duration-500">
           <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2rem] p-8 bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
              <CardHeader className="px-0 pt-0">
                <CardTitle className="text-xl font-black text-slate-900 dark:text-white">Histórico Clínico</CardTitle>
                <CardDescription className="dark:text-slate-400">Consultas de todos os animais deste cliente.</CardDescription>
              </CardHeader>
              {customer.patients?.some((p: any) => p._count?.visitCount > 0) ? (
                <div className="space-y-4 mt-4">
                  {customer.patients
                    .filter((p: any) => p._count?.visitCount > 0)
                    .map((patient: any) => (
                      <div key={patient.id} className="p-6 rounded-2xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/10">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400">
                            <PawPrint size={20} />
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white">{patient.name}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{patient._count?.visitCount || 0} consultas</p>
                          </div>
                        </div>
                        <Link href={`/dashboard/patients/${patient.id}`}>
                          <Button variant="ghost" className="text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest gap-1">
                            Ver histórico completo <ArrowRight size={14} />
                          </Button>
                        </Link>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-16 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-[2rem] bg-slate-50/30 dark:bg-transparent mt-4">
                  <div className="h-16 w-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Clock size={28} className="text-slate-300 dark:text-slate-700" />
                  </div>
                  <p className="text-slate-400 dark:text-slate-600 font-black text-xs uppercase tracking-widest">Sem registos clínicos</p>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Nenhum animal deste cliente tem consultas registadas.</p>
                </div>
              )}
           </Card>
        </TabsContent>
        
        {/* Budgets Tab */}
        <TabsContent value="budgets" className="animate-in fade-in slide-in-from-top-2 duration-500">
           <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none rounded-[2rem] overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800">
              <CardHeader className="p-8 border-b border-slate-50 dark:border-slate-800">
                 <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-2xl font-black text-slate-900 dark:text-slate-100">Orçamentos e Planos</CardTitle>
                      <CardDescription className="dark:text-slate-400 font-medium">Propostas clínicas aceites e pendentes.</CardDescription>
                    </div>
                    <Button 
                      className="rounded-xl gap-2 bg-slate-900 dark:bg-blue-600 font-black"
                      onClick={() => toast.info("Funcionalidade de orçamentos em desenvolvimento")}
                    >
                      <Plus size={18} /> Novo Orçamento
                    </Button>
                 </div>
              </CardHeader>
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                 {customer.budgets?.map((budget: any) => (
                   <div key={budget.id} className="p-6 border border-slate-100 dark:border-slate-800 rounded-3xl hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group">
                      <div className="flex justify-between items-start mb-4">
                         <div>
                            <p className="font-black text-slate-900 dark:text-slate-100 text-lg">€{(Number(budget.totalAmount) || 0).toFixed(2)}</p>
                            <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase">Emitido em {budget.createdAt ? format(new Date(budget.createdAt), "dd MMM") : "---"}</p>
                         </div>
                         <Badge className={`rounded-lg font-black text-[9px] ${budget.status === 'ACCEPTED' ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500'}`}>
                            {budget.status}
                         </Badge>
                      </div>
                      <div className="pt-4 border-t border-slate-50 dark:border-slate-800 flex gap-2">
                     <Button 
                       className="flex-1 rounded-xl py-5 bg-blue-600 font-black text-xs gap-2 shadow-xl shadow-blue-100 dark:shadow-none opacity-0 group-hover:opacity-100 transition-all"
                       onClick={() => toast.info("Funcionalidade de conversão em desenvolvimento")}
                     >
                        Converter em Fatura
                     </Button>
                      </div>
                   </div>
                 ))}
                 {(!customer.budgets || customer.budgets.length === 0) && (
                   <div className="col-span-full py-20 text-center flex flex-col items-center gap-4">
                      <FileText size={48} className="text-slate-100 dark:text-slate-800" />
                      <p className="text-slate-300 dark:text-slate-700 font-bold">Nenhum orçamento emitido para este cliente.</p>
                   </div>
                 )}
              </div>
           </Card>
        </TabsContent>
       </Tabs>

      {/* Edit Customer Dialog */}
      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="sm:max-w-[560px] rounded-[2rem] border-none shadow-2xl bg-white dark:bg-slate-900">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black tracking-tight">Editar Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 py-4">
            <div className="grid gap-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIF</Label>
                <Input value={editForm.vatNumber} onChange={(e) => setEditForm({ ...editForm, vatNumber: e.target.value })} className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-mono font-bold" />
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telemóvel</Label>
                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold" />
              </div>
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</Label>
              <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Morada</Label>
              <Input value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 font-bold" />
            </div>
            <div className="grid gap-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observações</Label>
              <textarea
                value={editForm.notes}
                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full h-20 rounded-xl bg-slate-50 dark:bg-white/5 border-none ring-1 ring-slate-100 dark:ring-white/10 p-4 font-medium text-sm resize-none outline-none"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" className="rounded-xl font-black" onClick={() => setIsEditing(false)}>
              <X size={16} className="mr-2" /> Cancelar
            </Button>
            <Button className="rounded-xl font-black bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={updateCustomer.isPending}>
              {updateCustomer.isPending ? "A guardar..." : <><Save size={16} className="mr-2" /> Guardar</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
