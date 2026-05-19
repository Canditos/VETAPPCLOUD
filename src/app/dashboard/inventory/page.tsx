"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import {
  Package, Plus, Search, AlertTriangle, ArrowUpDown, ArrowUp, ArrowDown,
  MoreHorizontal, PlusCircle, MinusCircle, Calendar, Layers, History,
  TrendingDown, TrendingUp, Filter, PackageCheck, Tag, Euro, Box,
  ChevronRight, Download, ChevronLeft, AlertCircle
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogTitle, DialogTrigger
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

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const queryClient = useQueryClient();

  const { data: products, isLoading } = useQuery({
    queryKey: ["inventory"],
    queryFn: async () => {
      const res = await fetch("/api/inventory");
      if (!res.ok) throw new Error("Erro ao carregar inventário");
      return res.json();
    }
  });

  const adjustStockMutation = useMutation({
    mutationFn: async ({ productId, type, quantity }: { productId: string; type: "IN" | "OUT"; quantity: number }) => {
      const res = await fetch("/api/inventory/adjust", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, type, quantity })
      });
      if (!res.ok) throw new Error("Erro ao ajustar stock");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["inventory"] });
      toast.success("Stock atualizado!");
    },
    onError: (err: any) => toast.error(err.message || "Erro ao atualizar stock.")
  });

  const categories = useMemo(() => {
    if (!products) return [];
    return Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean) as string[];
  }, [products]);

  // critério inteligente: usa minStock do produto, ou fallback para 5
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

  const filtered = useMemo(() => {
    if (!products) return [];
    let rows = products.filter((p: any) => {
      const q = searchTerm.toLowerCase();
      const matchSearch = p.name.toLowerCase().includes(q) || (p.barcode ?? "").includes(q) || (p.category ?? "").toLowerCase().includes(q);
      const matchCat = filterCategory === "all" || p.category === filterCategory;
      return matchSearch && matchCat;
    });

    rows = [...rows].sort((a: any, b: any) => {
      let av: any = a[sortKey] ?? "";
      let bv: any = b[sortKey] ?? "";
      if (sortKey === "price" || sortKey === "stockQuantity") { av = Number(av); bv = Number(bv); }
      if (sortKey === "expiryDate") { av = av ? new Date(av).getTime() : 0; bv = bv ? new Date(bv).getTime() : 0; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });

    return rows;
  }, [products, searchTerm, filterCategory, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown size={12} className="opacity-30" />;
    return sortDir === "asc" ? <ArrowUp size={12} className="text-blue-500" /> : <ArrowDown size={12} className="text-blue-500" />;
  };

  const ColHeader = ({ label, k, className }: { label: string; k: SortKey; className?: string }) => (
    <th
      className={cn("px-4 py-3 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest cursor-pointer select-none hover:text-slate-700 dark:hover:text-slate-200 transition-colors whitespace-nowrap", className)}
      onClick={() => handleSort(k)}
    >
      <div className="flex items-center gap-1.5">
        {label} <SortIcon k={k} />
      </div>
    </th>
  );

  return (
    <div className="max-w-[1600px] mx-auto space-y-5 p-4 md:p-6">

      {/* ── Cabeçalho + Stats ─────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm ring-1 ring-slate-200/60 dark:ring-white/5 space-y-5">
        {/* Título + Ações */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tighter">Inventário & Stock</h1>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-wider">
              <Box size={13} className="text-blue-600" />
              <span>Controlo de Medicamentos e Consumíveis</span>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => toast.info("Histórico em desenvolvimento...")} className="h-9 rounded-xl px-4 gap-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95">
              <History size={15} strokeWidth={2.5} /> Movimentos
            </Button>
            <Button variant="outline" onClick={() => toast.success("Exportação iniciada...")} className="h-9 rounded-xl px-4 gap-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-bold text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95">
              <Download size={15} strokeWidth={2.5} /> Exportar
            </Button>
            <Dialog>
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
                <div className="p-8 space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Designação</Label>
                    <Input placeholder="Ex: Clavaseptin 500mg" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Preço (€)</Label>
                      <Input type="number" placeholder="0.00" className="h-11 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Taxa IVA</Label>
                      <select className="h-11 w-full rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-3 text-xs font-bold">
                        <option value="23">23% (Normal)</option>
                        <option value="13">13% (Intermédia)</option>
                        <option value="6">6% (Reduzida)</option>
                      </select>
                    </div>
                  </div>
                  <Button className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-widest" onClick={() => toast.success("Artigo registado!")}>
                    Registar Artigo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* KPI Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Artigos", value: products?.length ?? 0, icon: Package, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/20" },
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
            <Input
              placeholder="Pesquisar por nome, categoria ou código de barras..."
              className="h-10 pl-11 pr-4 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500/50 font-medium text-sm"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 rounded-xl px-4 gap-2 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 font-bold text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-white transition-all shrink-0">
                <Filter size={14} strokeWidth={2.5} />
                <span className="max-w-[140px] truncate">{filterCategory === "all" ? "Todas as Categorias" : filterCategory}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl p-2 w-60 bg-white dark:bg-slate-900">
              <DropdownMenuItem onClick={() => { setFilterCategory("all"); setPage(1); }} className="font-bold rounded-lg p-3 text-xs uppercase tracking-widest">
                Todas as Categorias
              </DropdownMenuItem>
              <DropdownMenuSeparator className="opacity-50" />
              {categories.map((cat) => (
                <DropdownMenuItem key={cat} onClick={() => { setFilterCategory(cat); setPage(1); }} className="font-bold rounded-lg p-3 text-xs uppercase tracking-widest">
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* ── Tabela ─────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm ring-1 ring-slate-200/60 dark:ring-white/5 overflow-hidden">

        {/* Resultado count */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            {filtered.length.toLocaleString("pt-PT")} artigo{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </p>
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
            Página {page} / {totalPages}
          </p>
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
                      <td key={j} className="px-4 py-4">
                        <div className="h-4 rounded-md bg-slate-100 dark:bg-slate-800 animate-pulse" style={{ width: j === 0 ? "70%" : "50%" }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-24 text-center">
                    <Package size={48} className="mx-auto text-slate-200 dark:text-slate-800 mb-3" />
                    <p className="font-bold text-slate-700 dark:text-slate-300">Sem resultados</p>
                    <p className="text-sm text-slate-400 mt-1">Tente ajustar a pesquisa ou os filtros.</p>
                  </td>
                </tr>
              ) : (
                paginated.map((p: any) => {
                  const low = isLowStock(p);
                  const expired = isExpired(p);
                  const expiry = p.expiryDate ? new Date(p.expiryDate) : null;

                  return (
                    <tr key={p.id} className={cn(
                      "group hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors",
                      low && "bg-amber-50/30 dark:bg-amber-900/5",
                      expired && "bg-rose-50/30 dark:bg-rose-900/5"
                    )}>
                      {/* Designação */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 shrink-0">
                            <Box size={15} strokeWidth={1.8} />
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-slate-900 dark:text-white leading-tight text-sm truncate max-w-[280px]">{p.name}</p>
                            {p.batchNumber && (
                              <p className="text-[10px] font-mono text-slate-400 mt-0.5">Lote: {p.batchNumber}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Categoria */}
                      <td className="px-4 py-3.5">
                        <Badge variant="secondary" className="text-[9px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 uppercase tracking-widest border-none px-2 py-0.5">
                          {p.category || "Geral"}
                        </Badge>
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-base font-bold tabular-nums",
                            low ? "text-amber-600" : "text-slate-900 dark:text-white"
                          )}>
                            {p.stockQuantity}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">un.</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3.5">
                        {expired ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-rose-600 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 px-2 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" /> Expirado
                          </span>
                        ) : low ? (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> Crítico
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-lg">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> OK
                          </span>
                        )}
                      </td>

                      {/* Preço */}
                      <td className="px-4 py-3.5">
                        <p className="font-bold text-slate-900 dark:text-white tabular-nums">
                          {Number(p.price).toFixed(2)} €
                        </p>
                        <p className="text-[9px] font-bold text-slate-400 uppercase">IVA {p.vatRate ?? 23}%</p>
                      </td>

                      {/* Validade */}
                      <td className="px-4 py-3.5">
                        {expiry ? (
                          <span className={cn("text-xs font-semibold", expired ? "text-rose-500" : "text-slate-600 dark:text-slate-400")}>
                            {format(expiry, "dd MMM yyyy", { locale: pt })}
                          </span>
                        ) : (
                          <span className="text-xs font-medium text-slate-400">—</span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="px-4 py-3.5 pr-5">
                        <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                            onClick={() => adjustStockMutation.mutate({ productId: p.id, type: "IN", quantity: 1 })}
                            title="Entrada de stock"
                          >
                            <PlusCircle size={15} strokeWidth={2.5} />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-500 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 transition-all active:scale-90"
                            onClick={() => adjustStockMutation.mutate({ productId: p.id, type: "OUT", quantity: 1 })}
                            disabled={p.stockQuantity === 0}
                            title="Saída de stock"
                          >
                            <MinusCircle size={15} strokeWidth={2.5} />
                          </Button>
                          <Button
                            variant="ghost" size="icon"
                            className="h-8 w-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                            title="Ver detalhe"
                          >
                            <ChevronRight size={15} strokeWidth={2.5} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── Paginação ── */}
        {totalPages > 1 && (
          <div className="px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
              A mostrar {Math.min((page - 1) * PAGE_SIZE + 1, filtered.length)}–{Math.min(page * PAGE_SIZE, filtered.length)} de {filtered.length.toLocaleString("pt-PT")}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={page === 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft size={15} />
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
                const pg = page <= 3 ? i + 1 : page - 2 + i;
                if (pg > totalPages) return null;
                return (
                  <Button
                    key={pg}
                    variant="ghost" size="icon"
                    className={cn(
                      "h-8 w-8 rounded-lg text-xs font-bold",
                      pg === page ? "bg-blue-600 text-white hover:bg-blue-600" : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                    )}
                    onClick={() => setPage(pg)}
                  >
                    {pg}
                  </Button>
                );
              })}
              <Button
                variant="ghost" size="icon"
                className="h-8 w-8 rounded-lg"
                disabled={page === totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight size={15} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
