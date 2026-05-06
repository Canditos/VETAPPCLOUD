"use client";

import { useState } from "react";
import { 
  Search, 
  Plus, 
  Trash2, 
  Package, 
  Stethoscope, 
  CreditCard,
  ShoppingCart
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";

interface BillingItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  type: "PRODUCT" | "SERVICE";
}

export function ConsultationBilling({ onItemsChange }: { onItemsChange: (items: BillingItem[]) => void }) {
  const [items, setItems] = useState<BillingItem[]>([]);
  const [search, setSearch] = useState("");

  const { data: searchResults } = useQuery({
    queryKey: ["product-search", search],
    queryFn: async () => {
      if (!search) return [];
      const res = await fetch(`/api/products?q=${search}`);
      return res.json();
    },
    enabled: search.length > 2
  });

  const addItem = (product: any) => {
    const existing = items.find(i => i.id === product.id);
    let newItems;
    if (existing) {
      newItems = items.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
    } else {
      newItems = [...items, { 
        id: product.id, 
        name: product.name, 
        price: Number(product.price), 
        quantity: 1,
        type: product.stockQuantity > 0 ? "PRODUCT" : "SERVICE"
      } as BillingItem];
    }
    setItems(newItems);
    onItemsChange(newItems);
    setSearch("");
  };

  const removeItem = (id: string) => {
    const newItems = items.filter(i => i.id !== id);
    setItems(newItems);
    onItemsChange(newItems);
  };

  const total = items.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  return (
    <div className="space-y-6">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600" size={18} />
        <Input 
          placeholder="Adicionar serviço ou produto (ex: Consulta, Vacina...)"
          className="pl-12 py-6 rounded-2xl border-none bg-white dark:bg-slate-900 shadow-sm ring-1 ring-slate-100 dark:ring-white/5 focus-visible:ring-blue-500 transition-all font-medium"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        {searchResults && searchResults.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 border-none shadow-2xl rounded-2xl overflow-hidden bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/10">
            <CardContent className="p-0">
              {searchResults.map((product: any) => (
                <div 
                  key={product.id}
                  className="p-4 hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer flex justify-between items-center border-b border-slate-50 dark:border-white/5 last:border-none transition-colors"
                  onClick={() => addItem(product)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                      {product.stockQuantity > 0 ? <Package size={16} /> : <Stethoscope size={16} />}
                    </div>
                    <div>
                      <p className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-tight">{product.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Stock: {product.stockQuantity} un.</p>
                    </div>
                  </div>
                  <p className="font-black text-blue-600 dark:text-blue-400">€{product.price}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-white/5 rounded-3xl">
             <ShoppingCart size={32} className="mx-auto text-slate-100 dark:text-slate-800 mb-2" />
             <p className="text-slate-400 dark:text-slate-600 text-sm font-medium">Nenhum item adicionado à consulta.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-50 dark:border-white/5 shadow-sm animate-in slide-in-from-right-2 duration-300">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-white/5 flex items-center justify-center font-black text-slate-400 dark:text-slate-500 text-xs">
                      {item.quantity}x
                   </div>
                   <div>
                      <p className="font-black text-slate-900 dark:text-white text-sm uppercase tracking-tight">{item.name}</p>
                      <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500">Preço unitário: €{item.price}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <p className="font-black text-slate-900 dark:text-white text-lg tracking-tighter">€{(item.price * item.quantity).toFixed(2)}</p>
                   <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-slate-300 dark:text-slate-700 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20">
                      <Trash2 size={16} />
                   </Button>
                </div>
              </div>
            ))}
            
            <div className="pt-6 border-t border-slate-100 dark:border-white/5 flex justify-between items-end px-4">
               <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Total Consulta</p>
                  <div className="flex items-center gap-2 mt-1">
                     <CreditCard size={20} className="text-blue-600 dark:text-blue-400" />
                     <p className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">€{total.toFixed(2)}</p>
                  </div>
               </div>
               <Badge className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-none px-4 py-1.5 mb-1 font-black text-[10px] uppercase tracking-widest rounded-lg">
                  Draft Jasmin Pronto
               </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
