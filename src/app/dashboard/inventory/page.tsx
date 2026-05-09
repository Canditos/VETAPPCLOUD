"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle,
  ArrowUpDown,
  MoreHorizontal,
  PlusCircle,
  MinusCircle,
  Calendar,
  Layers,
  History,
  TrendingDown,
  TrendingUp,
  Filter,
  PackageCheck,
  Tag,
  Euro,
  Box,
  ChevronRight,
  Download
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { format } from "date-fns";
import { pt } from "date-fns/locale";


export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
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
    mutationFn: async ({ productId, type, quantity }: { productId: string, type: "IN" | "OUT", quantity: number }) => {
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
    onError: (err: any) => {
      toast.error(err.message || "Erro ao atualizar stock.");
    }
  });

  const filteredProducts = useMemo(() => {
    if (!products) return [];
    return products.filter((p: any) => {
      const matchesSearch = 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        (p.barcode && p.barcode.includes(searchTerm));
      const matchesCategory = filterCategory === "all" || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchTerm, filterCategory]);

  const stats = useMemo(() => {
    if (!products) return { lowStock: 0, totalValue: 0, expired: 0 };
    return products.reduce((acc: any, p: any) => {
      if (p.stockQuantity <= 5) acc.lowStock++;
      acc.totalValue += Number(p.price) * p.stockQuantity;
      if (p.expiryDate && new Date(p.expiryDate) < new Date()) acc.expired++;
      return acc;
    }, { lowStock: 0, totalValue: 0, expired: 0 });
  }, [products]);

  const categories = useMemo(() => {
    if (!products) return [];
    return Array.from(new Set(products.map((p: any) => p.category))).filter(Boolean);
  }, [products]);

  return (
    <div className="max-w-full mx-auto space-y-8 p-4 md:p-6 animate-premium">
      {/* Painel de Gestão de Inventário Unificado */}
      <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 shadow-sm ring-1 ring-slate-200/60 dark:ring-white/5 space-y-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">Inventário & Stock</h1>
            <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em]">
               <Box size={14} className="text-blue-600" />
               <span>Controlo de Medicamentos e Consumíveis</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => toast.info("Histórico de stock em desenvolvimento...")}
              className="h-10 rounded-xl px-4 gap-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95"
            >
              <History size={16} strokeWidth={2.5} />
              <span>Movimentos</span>
            </Button>

            <Button 
              variant="outline" 
              onClick={() => toast.success("Exportação iniciada...")}
              className="h-10 rounded-xl px-4 gap-2 border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest hover:bg-white transition-all active:scale-95"
            >
              <Download size={16} strokeWidth={2.5} />
              <span>Exportar</span>
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button className="h-10 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-black px-5 shadow-sm transition-all active:scale-95">
                  <Plus size={16} strokeWidth={3} />
                  <span className="text-[10px] uppercase tracking-widest">Novo Artigo</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden bg-white dark:bg-slate-900">
                <div className="bg-blue-600 p-8 text-white">
                  <DialogTitle className="text-2xl font-black tracking-tight">Adicionar ao Catálogo</DialogTitle>
                  <p className="text-blue-100 text-xs font-bold uppercase tracking-widest mt-1 opacity-80">Registe novos artigos com IVA e Lote.</p>
                </div>
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designação</Label>
                    <Input placeholder="Ex: Clavaseptin 500mg" className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço (€)</Label>
                      <Input type="number" placeholder="0.00" className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-4 font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa IVA</Label>
                      <select className="h-12 w-full rounded-xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-100 dark:ring-slate-700 px-3 text-xs font-black">
                        <option value="23">23% (Normal)</option>
                        <option value="13">13% (Intermédia)</option>
                        <option value="6">6% (Reduzida)</option>
                      </select>
                    </div>
                  </div>
                  <Button className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest" onClick={() => toast.success("Artigo registado!")}>
                    Registar Artigo
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Row - Compact & Integrated */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Total Artigos", value: products?.length || 0, icon: Package, color: "text-blue-600", bg: "bg-blue-50/50" },
            { label: "Stock Crítico", value: stats.lowStock, icon: AlertTriangle, color: stats.lowStock > 0 ? "text-amber-600" : "text-slate-400", bg: stats.lowStock > 0 ? "bg-amber-50/50" : "bg-slate-50/50" },
            { label: "Expirados", value: stats.expired, icon: Calendar, color: stats.expired > 0 ? "text-rose-600" : "text-slate-400", bg: stats.expired > 0 ? "bg-rose-50/50" : "bg-slate-50/50" },
            { label: "Valor de Stock", value: `€${Math.floor(stats.totalValue).toLocaleString()}`, icon: TrendingUp, color: "text-slate-900 dark:text-white", bg: "bg-slate-900/5 dark:bg-white/5" }
          ].map((stat, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/20">
              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ring-1 ring-black/5 dark:ring-white/5", stat.bg, stat.color)}>
                <stat.icon size={18} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-tight">{stat.label}</p>
                <p className="text-lg font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search & Filter - Bottom Row of the Panel */}
        <div className="flex flex-col lg:flex-row gap-4 pt-6 border-t border-slate-100 dark:border-slate-800/50">
          <div className="relative flex-1 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" size={16} />
            <Input 
              placeholder="Pesquisar por nome, categoria ou código de barras..."
              className="h-12 pl-12 pr-4 rounded-xl border-none bg-slate-50 dark:bg-slate-800/50 ring-1 ring-slate-100 dark:ring-slate-800 focus-visible:ring-2 focus-visible:ring-blue-500/50 font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-12 rounded-xl px-4 gap-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 hover:bg-white transition-all">
                <Filter size={16} strokeWidth={2.5} />
                <span>{filterCategory === "all" ? "Todas as Categorias" : filterCategory}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl p-2 w-64 bg-white dark:bg-slate-900">
              <DropdownMenuItem onClick={() => setFilterCategory("all")} className="font-bold rounded-lg p-3 text-xs uppercase tracking-widest">
                Todas as Categorias
              </DropdownMenuItem>
              <DropdownMenuSeparator className="opacity-50" />
              {categories.map((cat: string) => (
                <DropdownMenuItem key={cat} onClick={() => setFilterCategory(cat)} className="font-bold rounded-lg p-3 text-xs uppercase tracking-widest">
                  {cat}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

        {/* List Content - Premium Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {isLoading ? (
            Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 rounded-[2.5rem] bg-white dark:bg-slate-900 animate-pulse ring-1 ring-slate-100 dark:ring-slate-800" />
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-32 text-center bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm rounded-[3rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
               <Package size={64} className="mx-auto text-slate-200 dark:text-slate-800 mb-4" />
               <h3 className="text-xl font-black text-slate-900 dark:text-white">Sem resultados</h3>
               <p className="text-slate-500 font-medium">Tente ajustar a sua pesquisa ou filtros.</p>
            </div>
          ) : (
            filteredProducts.map((p: any) => {
              const isLowStock = p.stockQuantity <= 5;
              const expiry = p.expiryDate ? new Date(p.expiryDate) : null;
              const isExpired = expiry ? expiry < new Date() : false;

              return (
                <div 
                  key={p.id} 
                  className="group relative bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] ring-1 ring-slate-100 dark:ring-slate-800 hover:ring-blue-500/30 dark:hover:ring-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-500 flex flex-col gap-6"
                >
                  {/* Card Header: Icon + Price */}
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 group-hover:rotate-3 transition-all duration-500 shadow-inner">
                        <Box size={28} strokeWidth={2} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-black text-xl text-slate-900 dark:text-white truncate tracking-tight leading-none group-hover:text-blue-600 transition-colors">
                          {p.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-[9px] font-black bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 uppercase tracking-widest border-none px-2">
                            {p.category || "GERAL"}
                          </Badge>
                          {p.batchNumber && (
                            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 font-mono">
                              LOTE: {p.batchNumber}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter leading-none">
                        €{Number(p.price).toFixed(2)}
                      </p>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">IVA {p.vatRate}%</p>
                    </div>
                  </div>

                  {/* Stock Status Bar */}
                  <div className="space-y-3">
                    <div className="flex justify-between items-end">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isLowStock ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className={`text-sm font-black uppercase tracking-widest ${isLowStock ? 'text-red-600' : 'text-slate-400'}`}>
                          {isLowStock ? 'Stock Crítico' : 'Stock Operacional'}
                        </span>
                      </div>
                      <span className="text-2xl font-black text-slate-900 dark:text-white leading-none">
                        {p.stockQuantity} <span className="text-[10px] text-slate-400 font-bold uppercase ml-1">UN</span>
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-50 dark:bg-slate-800 rounded-full overflow-hidden">
                       <div 
                         className={`h-full transition-all duration-1000 ${isLowStock ? 'bg-red-500' : 'bg-emerald-500'}`}
                         style={{ width: `${Math.min(100, (p.stockQuantity / 20) * 100)}%` }}
                       />
                    </div>
                  </div>

                  {/* Footer: Expiry + Actions */}
                  <div className="flex items-center justify-between pt-2 mt-auto">
                    <div className="flex flex-col">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Validade</p>
                      <p className={`text-xs font-bold mt-1 ${isExpired ? 'text-red-500' : 'text-slate-700 dark:text-slate-300'}`}>
                        {expiry ? format(expiry, "dd MMM yyyy", { locale: pt }) : "S/ VALIDADE"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-11 w-11 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all active:scale-90"
                        onClick={() => adjustStockMutation.mutate({ productId: p.id, type: "IN", quantity: 1 })}
                      >
                        <Plus size={20} strokeWidth={3} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-11 w-11 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-900 dark:hover:bg-white hover:text-white dark:hover:text-slate-900 transition-all active:scale-90"
                        onClick={() => adjustStockMutation.mutate({ productId: p.id, type: "OUT", quantity: 1 })}
                        disabled={p.stockQuantity === 0}
                      >
                        <MinusCircle size={20} strokeWidth={2.5} />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-11 w-11 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 hover:bg-blue-600 hover:text-white transition-all active:scale-90"
                      >
                        <ChevronRight size={20} strokeWidth={3} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
