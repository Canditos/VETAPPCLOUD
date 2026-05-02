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
  Filter
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
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
      toast.success("Stock atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar stock.");
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

  if (isLoading) return <div className="p-8 text-center font-bold text-slate-400">A carregar inventário...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Gestão de Stock</h1>
          <p className="text-slate-500 font-medium">Controlo avançado de consumíveis, medicamentos e rastreabilidade.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-xl gap-2 font-bold border-slate-200">
              <History size={16} /> Histórico de Movimentos
           </Button>
           <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-bold px-6">
                  <Plus size={20} /> Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
                <div className="bg-blue-600 p-8 text-white">
                  <DialogTitle className="text-2xl font-black">Adicionar ao Catálogo</DialogTitle>
                  <DialogDescription className="text-blue-100">Registe novos artigos com IVA e Lote.</DialogDescription>
                </div>
                <div className="p-8 grid gap-6">
                  <div className="grid gap-2">
                    <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Designação do Produto</Label>
                    <Input placeholder="Ex: Clavaseptin 500mg" className="rounded-xl border-slate-100 bg-slate-50 py-6" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Preço de Venda (€)</Label>
                      <Input type="number" placeholder="0.00" className="rounded-xl border-slate-100 bg-slate-50 py-6" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa IVA (%)</Label>
                      <select className="rounded-xl border-slate-100 bg-slate-50 p-3 text-sm font-bold">
                        <option value="23">23% (Normal)</option>
                        <option value="13">13% (Intermédia)</option>
                        <option value="6">6% (Reduzida)</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lote / Batch</Label>
                      <Input placeholder="L-2024-X" className="rounded-xl border-slate-100 bg-slate-50 py-6" />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validade</Label>
                      <Input type="date" className="rounded-xl border-slate-100 bg-slate-50 py-6" />
                    </div>
                  </div>
                  <Button className="w-full rounded-2xl bg-blue-600 py-7 text-lg font-black shadow-xl shadow-blue-100 mt-2">
                    Registar no Sistema
                  </Button>
                </div>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-none bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-3xl group-hover:scale-110 transition-transform">
              <Package size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Produtos</p>
              <p className="text-2xl font-black text-slate-900">{products?.length || 0}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className={`border-none bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden group ${stats.lowStock > 0 ? 'ring-amber-200' : ''}`}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-4 rounded-3xl group-hover:scale-110 transition-transform ${stats.lowStock > 0 ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-400'}`}>
              <AlertTriangle size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stock Crítico</p>
              <p className={`text-2xl font-black ${stats.lowStock > 0 ? 'text-amber-600' : 'text-slate-900'}`}>{stats.lowStock}</p>
            </div>
          </CardContent>
        </Card>

        <Card className={`border-none bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden group ${stats.expired > 0 ? 'ring-red-200' : ''}`}>
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`p-4 rounded-3xl group-hover:scale-110 transition-transform ${stats.expired > 0 ? 'bg-red-50 text-red-600' : 'bg-slate-50 text-slate-400'}`}>
              <Calendar size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Produtos Expirados</p>
              <p className={`text-2xl font-black ${stats.expired > 0 ? 'text-red-600' : 'text-slate-900'}`}>{stats.expired}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-none bg-slate-900 shadow-xl overflow-hidden group">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-4 bg-slate-800 text-blue-400 rounded-3xl group-hover:scale-110 transition-transform">
              <TrendingUp size={28} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor do Inventário</p>
              <p className="text-2xl font-black text-white">€{stats.totalValue.toLocaleString('pt-PT', { minimumFractionDigits: 2 })}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-[2rem]">
        <CardHeader className="bg-white pb-6 border-b border-slate-50 p-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
              <Input 
                placeholder="Procurar por nome, categoria ou código de barras..."
                className="pl-14 py-7 rounded-2xl border-none bg-slate-50 focus-visible:ring-blue-500 font-medium text-slate-600"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="rounded-2xl gap-2 py-7 px-6 border-slate-100 bg-slate-50 font-bold text-slate-600 hover:bg-slate-100">
                    <Filter size={18} />
                    {filterCategory === "all" ? "Todas as Categorias" : filterCategory}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl p-2 w-56">
                  <DropdownMenuItem onClick={() => setFilterCategory("all")} className="font-bold rounded-lg p-3">
                    Todas as Categorias
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {categories.map((cat: string) => (
                    <DropdownMenuItem key={cat} onClick={() => setFilterCategory(cat)} className="font-bold rounded-lg p-3">
                      {cat}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-50">
                <TableHead className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Designação & Lote</TableHead>
                <TableHead className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Stock Disponível</TableHead>
                <TableHead className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Validade</TableHead>
                <TableHead className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Preço Venda</TableHead>
                <TableHead className="px-8 py-5 text-right text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((p: any) => (
                <TableRow key={p.id} className="hover:bg-blue-50/30 border-slate-50 group/row transition-all">
                  <TableCell className="px-8 py-6">
                    <div>
                      <p className="font-black text-slate-900 text-lg group-hover/row:text-blue-600 transition-colors">{p.name}</p>
                      <div className="flex gap-2 items-center mt-1">
                        <Badge variant="outline" className="text-[10px] font-black border-slate-200 text-slate-400 uppercase">{p.category || "Geral"}</Badge>
                        <span className="text-[10px] font-bold text-slate-300 font-mono tracking-tighter">Lote: {p.batchNumber || "---"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${p.stockQuantity <= 5 ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
                      <span className={`text-xl font-black ${p.stockQuantity <= 5 ? 'text-red-600' : 'text-slate-900'}`}>
                        {p.stockQuantity}
                      </span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Unidades</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    {p.expiryDate ? (
                      <div className={`flex flex-col ${new Date(p.expiryDate) < new Date() ? 'text-red-500' : 'text-slate-500'}`}>
                        <span className="text-sm font-black">{format(new Date(p.expiryDate), "dd MMM yyyy", { locale: pt })}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Expira em breve</span>
                      </div>
                    ) : (
                      <span className="text-slate-300 font-bold">Sem validade</span>
                    )}
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <div className="flex flex-col">
                      <span className="text-lg font-black text-slate-900">€{Number(p.price).toFixed(2)}</span>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">IVA {p.vatRate}% inc.</span>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    <div className="flex justify-end gap-2">
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-12 w-12 rounded-2xl text-green-600 hover:bg-green-50 bg-slate-50 border border-slate-100 transition-all"
                         onClick={() => adjustStockMutation.mutate({ productId: p.id, type: "IN", quantity: 1 })}
                       >
                          <PlusCircle size={24} />
                       </Button>
                       <Button 
                         variant="ghost" 
                         size="icon" 
                         className="h-12 w-12 rounded-2xl text-red-600 hover:bg-red-50 bg-slate-50 border border-slate-100 transition-all"
                         onClick={() => adjustStockMutation.mutate({ productId: p.id, type: "OUT", quantity: 1 })}
                         disabled={p.stockQuantity === 0}
                       >
                          <MinusCircle size={24} />
                       </Button>
                       <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-400 bg-slate-50 border border-slate-100 transition-all">
                              <MoreHorizontal size={24} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-none shadow-2xl p-2 w-48">
                            <DropdownMenuItem className="gap-3 font-bold rounded-lg p-3">
                              <Layers size={16} /> Editar Artigo
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-3 font-bold rounded-lg p-3">
                              <TrendingDown size={16} /> Ver Movimentos
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="gap-3 font-bold text-red-500 rounded-lg p-3">
                              Desativar Artigo
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                       </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredProducts.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Package size={48} className="text-slate-100" />
                      <p className="text-slate-400 font-bold">Nenhum produto encontrado no inventário.</p>
                      <Button variant="outline" className="rounded-xl" onClick={() => { setSearchTerm(""); setFilterCategory("all"); }}>Limpar Filtros</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
