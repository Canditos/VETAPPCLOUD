"use client";

import { useState, useMemo, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  Package, Plus, Search, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown,
  MoreHorizontal, PlusCircle, MinusCircle, Calendar, Layers, History,
  TrendingUp, Filter, PackageCheck, Tag, Euro, Box,
  ChevronRight, Download, ChevronLeft, AlertCircle, Edit, Trash2, X, Barcode, Mail,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogTitle, DialogTrigger, DialogClose,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

const PAGE_SIZE = 50;
type SortKey = "name" | "category" | "stockQuantity" | "price" | "expiryDate";
type SortDir = "asc" | "desc";

interface ProductForm {
  name: string; price: string; vatRate: number; stockQuantity: string; minStock: string;
  barcode: string; batchNumber: string; expiryDate: string; category: string;
}

const emptyForm = (): ProductForm => ({
  name: "", price: "", vatRate: 23, stockQuantity: "0", minStock: "5",
  barcode: "", batchNumber: "", expiryDate: "", category: "",
});

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [scanFeedback, setScanFeedback] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const [filterCategory, setFilterCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ProductForm>(emptyForm());
  const [editTarget, setEditTarget] = useState<any>(null);
  const [movementTarget, setMovementTarget] = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [adjustTarget, setAdjustTarget] = useState<any>(null);
  const [adjustQty, setAdjustQty] = useState("1");
  const queryClient = useQueryClient();

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("limit", String(PAGE_SIZE));
    if (searchTerm) p.set("search", searchTerm);
    if (filterCategory !== "all") p.set("category", filterCategory);
    p.set("sortKey", sortKey);
    p.set("sortDir", sortDir);
    return p.toString();
  }, [page, searchTerm, filterCategory, sortKey, sortDir]);

  const { data: response, isLoading } = useQuery({
    queryKey: ["inventory", queryParams],
    queryFn: async () => {
      const r = await fetch(`/api/inventory?${queryParams}`);
      if (!r.ok) throw new Error();
      return r.json();
    },
  });

  const products = response?.products ?? [];
  const total = response?.total ?? 0;
  const totalPages = response?.totalPages ?? 1;

  const adjustMutation = useMutation({
    mutationFn: async ({ productId, type, quantity }: { productId: string; type: "IN" | "OUT"; quantity: number }) => {
      const r = await fetch("/api/inventory/adjust", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, type, quantity }) });
      if (!r.ok) throw new Error(); return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); toast.success("Stock actualizado!"); },
    onError: () => toast.error("Erro ao actualizar stock"),
  });

  const createMutation = useMutation({
    mutationFn: async (form: ProductForm) => {
      const r = await fetch("/api/inventory", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, price: parseFloat(form.price) || 0, stockQuantity: parseInt(form.stockQuantity) || 0 }) });
      if (!r.ok) throw new Error(); return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); setCreateOpen(false); setCreateForm(emptyForm()); toast.success("Artigo criado!"); },
    onError: () => toast.error("Erro ao criar artigo"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, ...data }: any) => {
      const r = await fetch(`/api/inventory/${id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      if (!r.ok) throw new Error(); return r.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); setEditTarget(null); toast.success("Artigo actualizado!"); },
    onError: () => toast.error("Erro ao actualizar artigo"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { const r = await fetch(`/api/inventory/${id}`, { method: "DELETE" }); if (!r.ok) throw new Error(); return r.json(); },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["inventory"] }); setDeleteTarget(null); toast.success("Artigo eliminado!"); },
    onError: () => toast.error("Erro ao eliminar artigo"),
  });

  const { data: movements } = useQuery({
    queryKey: ["movements", movementTarget?.id],
    queryFn: async () => { const r = await fetch(`/api/inventory/${movementTarget.id}/movements`); if (!r.ok) throw new Error(); return r.json(); },
    enabled: !!movementTarget,
  });

  const categories = useMemo(() => {
    if (!products) return [];
    return Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean) as string[];
  }, [products]);

  const isLowStock = (p: any) => p.stockQuantity <= (p.minStock ?? 5);
  const isExpired = (p: any) => p.expiryDate && new Date(p.expiryDate) < new Date();

  const stats = useMemo(() => {
    if (!products) return { lowStock: 0, totalValue: 0, expired: 0 };
    return products.reduce((acc: any, p: any) => {
      if (isLowStock(p)) acc.lowStock++;
      acc.totalValue += Number(p.price) * p.stockQuantity;
      if (isExpired(p)) acc.expired++;
      return acc;
    }, { lowStock: 0, totalValue: 0, expired: 0 });
  }, [products]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
    setPage(1);
  };

  const handleSearchKeyDown = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchTerm.trim()) {
      e.preventDefault();
      const q = searchTerm.trim();
      try {
        // Look up by barcode
        const res = await fetch(`/api/products/${encodeURIComponent(q)}`);
        if (res.ok) {
          const product = await res.json();
          if (product && product.id) {
            setScanFeedback(true);
            setTimeout(() => setScanFeedback(false), 600);
            // Auto-open adjust modal for scanned product
            setAdjustTarget(product);
            setAdjustQty("1");
            setSearchTerm("");
          }
        } else {
          // Not a barcode lookup — search normally via API
          setPage(1);
        }
      } catch { setPage(1); }
    }
  };

  const filtered = useMemo(() => {
    if (!products) return [];
    let rows = products.filter((p: any) => {
      const q = searchTerm.toLowerCase();
      return (p.name.toLowerCase().includes(q) || (p.barcode ?? "").includes(q) || (p.category ?? "").toLowerCase().includes(q))
        && (filterCategory === "all" || p.category === filterCategory);
    });
    rows = [...rows].sort((a: any, b: any) => {
      let av = a[sortKey] ?? "", bv = b[sortKey] ?? "";
      if (sortKey === "price" || sortKey === "stockQuantity") { av = Number(av); bv = Number(bv); }
      if (sortKey === "expiryDate") { av = av ? new Date(av).getTime() : 0; bv = bv ? new Date(bv).getTime() : 0; }
      return av < bv ? (sortDir === "asc" ? -1 : 1) : av > bv ? (sortDir === "asc" ? 1 : -1) : 0;
    });
    return rows;
  }, [products, searchTerm, filterCategory, sortKey, sortDir]);

  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />;
  };

  const ColHeader = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <th className={cn("px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap", className)} onClick={() => handleSort(k)}>
      <div className="flex items-center gap-1.5">{label} <SortIcon k={k} /></div>
    </th>
  );

  const ProductDialog = ({ form, setForm, onSubmit, title, loading }: { form: ProductForm; setForm: (f: ProductForm) => void; onSubmit: () => void; title: string; loading?: boolean }) => (
    <div className="p-8 space-y-5">
      <div className="space-y-2">
        <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Designação *</Label>
        <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Clavaseptin 500mg" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço (€) *</Label>
          <Input type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0.00" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">IVA</Label>
          <select value={form.vatRate} onChange={e => setForm({ ...form, vatRate: Number(e.target.value) })} className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-3 text-xs font-bold">
            <option value={23}>23% (Normal)</option>
            <option value={13}>13% (Intermédia)</option>
            <option value={6}>6% (Reduzida)</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Inicial</Label>
          <Input type="number" value={form.stockQuantity} onChange={e => setForm({ ...form, stockQuantity: e.target.value })} placeholder="0" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Stock Mínimo</Label>
          <Input type="number" value={form.minStock} onChange={e => setForm({ ...form, minStock: e.target.value })} placeholder="5" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Categoria</Label>
          <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ex: Medicamentos" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Código de Barras</Label>
          <Input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} placeholder="Ex: 5601234567890" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nº Lote</Label>
          <Input value={form.batchNumber} onChange={e => setForm({ ...form, batchNumber: e.target.value })} placeholder="Ex: LOTE-2024-001" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validade</Label>
          <Input type="date" value={form.expiryDate} onChange={e => setForm({ ...form, expiryDate: e.target.value })} className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
        </div>
      </div>
      <Button disabled={loading || !form.name || !form.price} onClick={onSubmit} className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest">
        {loading ? "A guardar..." : title}
      </Button>
    </div>
  );

  const DeleteConfirm = () => (
    <Dialog open={!!deleteTarget} onOpenChange={o => { if (!o) setDeleteTarget(null); }}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl border-none p-8 bg-white dark:bg-slate-900">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mx-auto">
            <Trash2 size={24} className="text-rose-500" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Eliminar Artigo</DialogTitle>
          <p className="text-sm text-slate-500">Tem a certeza que pretende eliminar <strong>{deleteTarget?.name}</strong>? Esta acção é irreversível.</p>
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => setDeleteTarget(null)} className="flex-1 h-10 rounded-xl border-slate-200 font-bold">Cancelar</Button>
            <Button onClick={() => deleteMutation.mutate(deleteTarget.id)} disabled={deleteMutation.isPending} className="flex-1 h-10 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold">Eliminar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const AdjustStockModal = () => (
    <Dialog open={!!adjustTarget} onOpenChange={o => { if (!o) { setAdjustTarget(null); setAdjustQty("1"); } }}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl border-none p-8 bg-white dark:bg-slate-900">
        <div className="text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mx-auto">
            <Package size={24} className="text-blue-500" />
          </div>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">Ajustar Stock</DialogTitle>
          <p className="text-sm text-slate-500">
            <strong>{adjustTarget?.name}</strong> &mdash; Stock atual: <strong>{adjustTarget?.stockQuantity}</strong> un.
          </p>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Quantidade</label>
              <input type="number" min="1" value={adjustQty} onChange={e => setAdjustQty(e.target.value)}
                className="w-full h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-center font-bold text-lg" />
            </div>
          </div>
          {adjustTarget?.barcode && (
            <div className="text-center text-[10px] text-slate-500 font-mono">
              Cód. Barras: {adjustTarget.barcode}
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={() => adjustMutation.mutate({ productId: adjustTarget.id, type: "IN", quantity: parseInt(adjustQty) || 1 })}
              disabled={adjustMutation.isPending}
              className="flex-1 h-10 rounded-xl border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600 font-bold gap-1.5 transition-all">
              <PlusCircle size={16} /> Entrada
            </Button>
            <Button variant="outline" onClick={() => adjustMutation.mutate({ productId: adjustTarget.id, type: "OUT", quantity: parseInt(adjustQty) || 1 })}
              disabled={adjustMutation.isPending || adjustTarget?.stockQuantity === 0}
              className="flex-1 h-10 rounded-xl border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white hover:border-rose-600 font-bold gap-1.5 transition-all">
              <MinusCircle size={16} /> Saída
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const MovementsModal = () => (
    <Dialog open={!!movementTarget} onOpenChange={o => { if (!o) setMovementTarget(null); }}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl border-none p-0 overflow-hidden bg-white dark:bg-slate-900">
        <div className="bg-blue-600 p-6 text-white flex justify-between items-center">
          <div>
            <DialogTitle className="text-xl font-bold tracking-tight">Movimentos</DialogTitle>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-0.5">{movementTarget?.name}</p>
          </div>
          <DialogClose className="text-white/70 hover:text-white transition-colors"><X size={20} /></DialogClose>
        </div>
        <div className="p-6 max-h-[400px] overflow-y-auto">
          {!movements ? (
            <p className="text-center text-slate-400 py-8">A carregar...</p>
          ) : movements.length === 0 ? (
            <p className="text-center text-slate-400 py-8 font-medium">Nenhum movimento registado.</p>
          ) : (
            <div className="space-y-2">
              {movements.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", m.type === "IN" ? "bg-emerald-50 text-emerald-600" : m.type === "OUT" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600")}>
                      {m.type === "IN" ? <PlusCircle size={14} /> : m.type === "OUT" ? <MinusCircle size={14} /> : <AlertCircle size={14} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800 dark:text-slate-100">
                        {m.type === "IN" ? "Entrada" : m.type === "OUT" ? "Saída" : "Ajuste"}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{m.source || "Manual"}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-bold text-sm", m.type === "IN" ? "text-emerald-600" : "text-rose-600")}>
                      {m.type === "IN" ? "+" : "-"}{m.quantity} un.
                    </p>
                    <p className="text-[10px] text-slate-400">{format(new Date(m.createdAt), "dd MMM yyyy HH:mm", { locale: pt })}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 p-4 md:p-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200/60 dark:ring-white/5 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tighter">Inventário & Stock</h1>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              <Box size={13} className="text-blue-600" />
              <span>Controlo de Medicamentos e Consumíveis</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => {
              const a = document.createElement("a");
              a.href = "/api/reports/annual-inventory";
              a.click();
              toast.success("PDF gerado!");
            }} className="h-9 rounded-xl px-4 gap-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95">
              <Download size={15} strokeWidth={2.5} /> Download PDF
            </Button>
            <Button variant="outline" onClick={async () => {
              const email = prompt("Enviar PDF para o email:");
              if (!email) return;
              try {
                const r = await fetch("/api/reports/annual-inventory/send", {
                  method: "POST", headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email }),
                });
                if (r.ok) toast.success("PDF enviado para " + email);
                else toast.error("Erro ao enviar");
              } catch { toast.error("Erro ao enviar"); }
            }} className="h-9 rounded-xl px-4 gap-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95">
              <Mail size={15} strokeWidth={2.5} /> Enviar Email
            </Button>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="h-9 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 shadow-sm transition-all active:scale-95">
                  <Plus size={15} strokeWidth={3} />
                  <span className="text-[10px] uppercase tracking-widest">Novo Artigo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-3xl p-0 overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-blue-600 p-8 text-white">
                  <DialogTitle className="text-2xl font-bold tracking-tight">Adicionar ao Catálogo</DialogTitle>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Registe novos artigos com IVA e Lote.</p>
                </div>
                <ProductDialog form={createForm} setForm={setCreateForm} onSubmit={() => createMutation.mutate(createForm)} title="Registar Artigo" loading={createMutation.isPending} />
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Artigos", value: total, icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
            { label: "Stock Crítico", value: stats.lowStock, icon: AlertTriangle, color: stats.lowStock > 0 ? "text-amber-600" : "text-slate-400", bg: stats.lowStock > 0 ? "bg-amber-50 dark:bg-amber-900/20" : "bg-slate-50 dark:bg-slate-800" },
            { label: "Expirados", value: stats.expired, icon: AlertCircle, color: stats.expired > 0 ? "text-rose-600" : "text-slate-400", bg: stats.expired > 0 ? "bg-rose-50 dark:bg-rose-900/20" : "bg-slate-50 dark:bg-slate-800" },
            { label: "Valor de Stock", value: `€${Math.floor(stats.totalValue).toLocaleString("pt-PT")}`, icon: TrendingUp, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20" },
          ].map((s, i) => (
            <div key={i} className={cn("flex items-center gap-3 p-3.5 rounded-xl border border-slate-100 dark:border-slate-800", s.bg)}>
              <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", s.color)}>
                <s.icon size={17} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{s.label}</p>
                <p className="text-base font-bold text-slate-900 dark:text-white tracking-tight mt-0.5">{s.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-100 dark:border-slate-800/50">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={15} />
            <Barcode className={`absolute right-4 top-1/2 -translate-y-1/2 transition-all duration-300 ${scanFeedback ? "text-blue-500 scale-125" : "text-slate-300 dark:text-slate-600"}`} size={18} />
            <Input ref={searchRef} placeholder="Pesquisar por nome, categoria ou código de barras..." className="h-10 pl-11 pr-12 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500/50 font-medium text-sm" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }} onKeyDown={handleSearchKeyDown} />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 rounded-xl px-4 gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-white transition-all shrink-0">
                <Filter size={14} strokeWidth={2.5} />
                <span className="max-w-[140px] truncate">{filterCategory === "all" ? "Todas as Categorias" : filterCategory}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl p-2 w-60 bg-white dark:bg-slate-900">
              <DropdownMenuItem onClick={() => { setFilterCategory("all"); setPage(1); }} className="font-bold rounded-lg p-3 text-xs uppercase tracking-widest">Todas as Categorias</DropdownMenuItem>
              <DropdownMenuSeparator className="opacity-50" />
              {categories.map((cat) => (
                <DropdownMenuItem key={cat} onClick={() => { setFilterCategory(cat); setPage(1); }} className="font-bold rounded-lg p-3 text-xs uppercase tracking-widest">{cat}</DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={o => { if (!o) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl border-none shadow-3xl p-0 overflow-hidden bg-white dark:bg-slate-900">
          <div className="bg-blue-600 p-8 text-white">
            <DialogTitle className="text-2xl font-bold tracking-tight">Editar Artigo</DialogTitle>
            <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">{editTarget?.name}</p>
          </div>
          {editTarget && (
            <ProductDialog
              form={{
                name: editTarget.name || "",
                price: String(editTarget.price || ""),
                vatRate: editTarget.vatRate ?? 23,
                stockQuantity: String(editTarget.stockQuantity ?? 0),
                minStock: String(editTarget.minStock ?? 5),
                barcode: editTarget.barcode || "",
                batchNumber: editTarget.batchNumber || "",
                expiryDate: editTarget.expiryDate ? editTarget.expiryDate.split("T")[0] : "",
                category: editTarget.category || "",
              }}
              setForm={(f) => setEditTarget({ ...editTarget, ...f } as any)}
              onSubmit={() => {
                const { id, name, price, vatRate, stockQuantity, minStock, barcode, batchNumber, expiryDate, category } = editTarget;
                updateMutation.mutate({ id, name: name || "", price: parseFloat(price) || 0, vatRate, stockQuantity: parseInt(stockQuantity) || 0, minStock: parseInt(minStock) || 5, barcode, batchNumber, expiryDate, category });
              }}
              title="Guardar Alterações"
              loading={updateMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <DeleteConfirm />

      {/* Movements Modal */}
      <MovementsModal />
      <AdjustStockModal />

      {/* Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-white/5 overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{total.toLocaleString("pt-PT")} artigo{total !== 1 ? "s" : ""} encontrado{total !== 1 ? "s" : ""}</p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Página {page} / {totalPages}</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <ColHeader label="Designação" k="name" className="pl-5 min-w-[260px]" />
                <ColHeader label="Categoria" k="category" className="min-w-[120px]" />
                <ColHeader label="Stock" k="stockQuantity" className="min-w-[100px]" />
                <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest whitespace-nowrap">Estado</th>
                <ColHeader label="Preço" k="price" className="min-w-[100px]" />
                <ColHeader label="Validade" k="expiryDate" className="min-w-[110px]" />
                <th className="px-4 py-3 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest pr-5">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                Array.from({ length: 12 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-4"><div className="h-4 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" style={{ width: j === 0 ? "70%" : "50%" }} /></td>
                    ))}
                  </tr>
                ))
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <Package size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-3" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">Sem resultados</p>
                    <p className="text-sm text-slate-400 mt-1">Tente ajustar a pesquisa ou os filtros.</p>
                  </td>
                </tr>
              ) : (
                products.map((p: any) => {
                  const low = isLowStock(p);
                  const expired = isExpired(p);
                  const expiry = p.expiryDate ? new Date(p.expiryDate) : null;
                  return (
                    <tr key={p.id} className={cn("group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors", low && "bg-amber-50/30 dark:bg-amber-900/5", expired && "bg-rose-50/30 dark:bg-rose-900/5")}>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0"><Box size={15} strokeWidth={1.8} /></div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white leading-tight text-sm truncate max-w-[280px]">{p.name}</p>
                            {p.batchNumber && <p className="text-[10px] font-mono text-slate-400 mt-0.5">Lote: {p.batchNumber}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <Badge variant="secondary" className="text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 uppercase tracking-widest border-none px-2 py-0.5">{p.category || "Geral"}</Badge>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={cn("text-base font-bold tabular-nums", low ? "text-amber-600" : "text-slate-900 dark:text-white")}>{p.stockQuantity}</span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">un.</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        {expired ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg"><span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Expirado</span>
                        ) : low ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg"><span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Crítico</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> OK</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white tabular-nums">{Number(p.price).toFixed(2)} €</p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">IVA {p.vatRate ?? 23}%</p>
                      </td>
                      <td className="px-4 py-3.5">
                        {expiry ? (
                          <span className={cn("text-xs font-semibold", expired ? "text-rose-500" : "text-slate-600 dark:text-slate-400")}>{format(expiry, "dd MMM yyyy", { locale: pt })}</span>
                        ) : <span className="text-xs font-medium text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3.5 pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button variant="ghost" size="sm" className="h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all text-[10px] font-bold px-2.5 gap-1"
                            onClick={() => { setAdjustTarget(p); setAdjustQty("1"); }}>
                            <Package size={13} /> Ajustar
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all active:scale-90"><MoreHorizontal size={14} strokeWidth={2.5} /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl p-2 w-44 bg-white dark:bg-slate-900">
                              <DropdownMenuItem onClick={() => setMovementTarget(p)} className="font-medium rounded-lg p-2.5 text-xs gap-2"><History size={14} /> Movimentos</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setEditTarget(p)} className="font-medium rounded-lg p-2.5 text-xs gap-2"><Edit size={14} /> Editar</DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => setDeleteTarget(p)} className="font-medium rounded-lg p-2.5 text-xs gap-2 text-rose-600 focus:text-rose-600"><Trash2 size={14} /> Eliminar</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">A mostrar {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} de {total.toLocaleString("pt-PT")}</p>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={page === 1} onClick={() => setPage(p => p - 1)}><ChevronLeft size={15} /></Button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i;
                if (pg > totalPages) return null;
                return <Button key={pg} variant="ghost" size="icon" className={cn("h-8 w-8 rounded-lg text-xs font-bold", pg === page ? "bg-blue-600 text-white hover:bg-blue-600" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800")} onClick={() => setPage(pg)}>{pg}</Button>;
              })}
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}><ChevronRight size={15} /></Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
