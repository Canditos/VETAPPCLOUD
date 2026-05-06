"use client";

import { useState, useMemo } from "react";
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
  ChevronRight
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

// Custom Stat Card Component for consistency
const StatCard = ({ title, value, icon: Icon, color, subtitle }: any) => (
  <Card className="border-none bg-white dark:bg-card shadow-xl shadow-slate-200/40 dark:shadow-none ring-1 ring-slate-100 dark:ring-white/10 overflow-hidden group">
    <CardContent className="p-6 flex items-center gap-5">
      <div className={`p-4 rounded-[2rem] transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${color}`}>
        <Icon size={28} strokeWidth={2.5} />
      </div>
      <div>
        <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] mb-1">{title}</p>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-black text-slate-900 dark:text-white leading-none">{value}</p>
          {subtitle && <span className="text-xs font-bold text-slate-400">{subtitle}</span>}
        </div>
      </div>
    </CardContent>
  </Card>
);

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
    <div className="max-w-[1600px] mx-auto space-y-10 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Inventário
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <Badge variant="secondary" className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-400 border-none font-bold px-2 py-0.5">
              CATÁLOGO
            </Badge>
            <span>Gestão avançada de medicamentos e consumíveis</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            className="h-12 rounded-2xl px-6 gap-2 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm font-black hover:shadow-md transition-all active:scale-95"
          >
            <History size={18} strokeWidth={2.5} />
            <span className="hidden sm:inline">Movimentos</span>
          </Button>
          
          <Dialog>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-2xl px-6 gap-3 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-100 dark:shadow-none font-black transition-all active:scale-95">
                <Plus size={22} strokeWidth={3} />
                <span>Novo Artigo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] rounded-[3rem] border-none shadow-3xl p-0 overflow-hidden bg-white dark:bg-background">
              <div className="bg-blue-600 p-10 text-white">
                <DialogTitle className="text-3xl font-black tracking-tight">Adicionar ao Catálogo</DialogTitle>
                <DialogDescription className="text-blue-100 font-medium mt-2">Registe novos artigos com IVA e Lote.</DialogDescription>
              </div>
              <div className="p-10 grid gap-8">
                <div className="grid gap-3">
                  <Label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Designação do Produto</Label>
                  <Input placeholder="Ex: Clavaseptin 500mg" className="h-14 rounded-2xl border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-card px-6 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="grid gap-3">
                    <Label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Preço Venda (€)</Label>
                    <Input type="number" placeholder="0.00" className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-6 font-bold" />
                  </div>
                  <div className="grid gap-3">
                    <Label className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Taxa IVA (%)</Label>
                    <select className="h-14 rounded-2xl border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-4 text-sm font-black dark:text-slate-300">
                      <option value="23">23% (Normal)</option>
                      <option value="13">13% (Intermédia)</option>
                      <option value="6">6% (Reduzida)</option>
                    </select>
                  </div>
                </div>
                <Button className="w-full h-16 rounded-[1.5rem] bg-blue-600 hover:bg-blue-700 text-white text-lg font-black shadow-xl shadow-blue-100 dark:shadow-none">
                  Registar no Sistema
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Artigos" 
          value={products?.length || 0} 
          icon={Package} 
          color="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
          subtitle="No catálogo"
        />
        <StatCard 
          title="Stock Crítico" 
          value={stats.lowStock} 
          icon={AlertTriangle} 
          color={stats.lowStock > 0 ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" : "bg-slate-50 dark:bg-slate-800 text-slate-400"}
          subtitle="Baixas unidades"
        />
        <StatCard 
          title="Expirados" 
          value={stats.expired} 
          icon={Calendar} 
          color={stats.expired > 0 ? "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400" : "bg-slate-50 dark:bg-slate-800 text-slate-400"}
          subtitle="Atenção necessária"
        />
        <StatCard 
          title="Valor Total" 
          value={`€${Math.floor(stats.totalValue).toLocaleString()}`} 
          icon={TrendingUp} 
          color="bg-slate-900 dark:bg-white text-white dark:text-slate-900"
          subtitle="Avaliação de stock"
        />
      </div>

      {/* Main List Section */}
      <div className="space-y-6">
        {/* Search & Filter Toolbar */}
        <Card className="border-none bg-white/60 dark:bg-card/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/40 dark:shadow-none ring-1 ring-slate-100 dark:ring-white/10 overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-indigo-500 transition-colors" size={20} />
                <Input 
                  placeholder="Procurar por designação, categoria ou código..."
                  className="h-16 pl-16 pr-6 rounded-3xl border-none bg-slate-100/50 dark:bg-card/50 focus-visible:ring-2 focus-visible:ring-indigo-500/50 font-semibold text-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-16 rounded-3xl px-8 gap-3 bg-slate-100/50 dark:bg-slate-800/50 font-black text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 shadow-sm transition-all">
                      <Filter size={18} strokeWidth={2.5} />
                      <span className="uppercase tracking-widest text-[11px]">
                        {filterCategory === "all" ? "Categorias" : filterCategory}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="rounded-2xl border-none shadow-3xl p-2 w-64 bg-white dark:bg-slate-800">
                    <DropdownMenuItem onClick={() => setFilterCategory("all")} className="font-bold rounded-xl p-4 dark:text-slate-200">
                      Todas as Categorias
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="opacity-50" />
                    {categories.map((cat: string) => (
                      <DropdownMenuItem key={cat} onClick={() => setFilterCategory(cat)} className="font-bold rounded-xl p-4 dark:text-slate-200">
                        {cat}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* List Header */}
        <div className="px-10 hidden md:grid grid-cols-[1fr_200px_180px_150px_140px] gap-4 text-slate-400 dark:text-slate-500 font-black text-[11px] uppercase tracking-[0.25em] mb-2">
          <span>Artigo & Categoria</span>
          <span>Disponibilidade</span>
          <span>Validade</span>
          <span>Valor Unitário</span>
          <span className="text-right">Ações</span>
        </div>

        {/* List Content */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 rounded-3xl bg-white dark:bg-slate-900 animate-pulse" />
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="py-32 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-sm">
               <Package size={64} className="mx-auto text-slate-100 dark:text-slate-800 mb-4" />
               <h3 className="text-xl font-black text-slate-900 dark:text-white">Sem resultados</h3>
               <p className="text-slate-500 font-medium">Tente ajustar a sua pesquisa ou filtros.</p>
            </div>
          ) : (
            filteredProducts.map((p: any) => (
              <div key={p.id} className="group grid grid-cols-1 md:grid-cols-[1fr_200px_180px_150px_140px] gap-4 items-center bg-white dark:bg-slate-900 p-5 md:p-6 rounded-[2.2rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-200 dark:hover:border-indigo-900/50 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none transition-all duration-300">
                
                {/* Product Name & Cat */}
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:scale-110 transition-transform">
                    <Box size={26} strokeWidth={2} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-black text-xl text-slate-900 dark:text-white truncate tracking-tight">{p.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="outline" className="text-[10px] font-black border-slate-200 dark:border-slate-800 text-slate-400 uppercase tracking-wider">
                        {p.category || "GERAL"}
                      </Badge>
                      <span className="text-[10px] font-bold text-slate-300 dark:text-slate-600 font-mono">
                        L: {p.batchNumber || "---"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Stock Status */}
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <div className={`w-2.5 h-2.5 rounded-full ${p.stockQuantity <= 5 ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className={`text-2xl font-black ${p.stockQuantity <= 5 ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
                      {p.stockQuantity}
                    </span>
                  </div>
                  <p className="text-[11px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest pl-4">UNIDADES</p>
                </div>

                {/* Expiry */}
                <div>
                  {p.expiryDate ? (() => {
                    const expiry = new Date(p.expiryDate);
                    const isExpired = expiry < new Date();
                    return (
                      <div className="flex flex-col">
                        <span className={`text-sm font-black ${isExpired ? 'text-red-600' : 'text-slate-700 dark:text-slate-300'}`}>
                          {format(expiry, "dd MMM yyyy", { locale: pt })}
                        </span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${isExpired ? 'text-red-400' : 'text-slate-400'}`}>
                          {isExpired ? "EXPIRADO" : "VALIDADE"}
                        </span>
                      </div>
                    );
                  })() : (
                    <span className="text-xs font-bold text-slate-300 dark:text-slate-700 italic">SEM VALIDADE</span>
                  )}
                </div>

                {/* Price */}
                <div className="flex flex-col">
                  <span className="text-xl font-black text-slate-900 dark:text-white tracking-tighter">€{Number(p.price).toFixed(2)}</span>
                  <span className="text-[10px] font-bold text-slate-400 dark:text-slate-600 uppercase">IVA {p.vatRate}% INC.</span>
                </div>

                {/* Quick Actions */}
                <div className="flex justify-end gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
                    onClick={() => adjustStockMutation.mutate({ productId: p.id, type: "IN", quantity: 1 })}
                  >
                    <PlusCircle size={22} strokeWidth={2.5} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-12 w-12 rounded-2xl bg-red-50 dark:bg-red-900/20 text-red-600 hover:bg-red-600 hover:text-white transition-all shadow-sm"
                    onClick={() => adjustStockMutation.mutate({ productId: p.id, type: "OUT", quantity: 1 })}
                    disabled={p.stockQuantity === 0}
                  >
                    <MinusCircle size={22} strokeWidth={2.5} />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-indigo-600 transition-all">
                    <ChevronRight size={22} strokeWidth={2.5} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
