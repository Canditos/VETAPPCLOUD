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
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <Input 
          placeholder="Adicionar serviço ou produto (ex: Consulta, Vacina...)"
          className="pl-12 py-6 rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 focus-visible:ring-blue-500 transition-all"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        
        {searchResults && searchResults.length > 0 && (
          <Card className="absolute top-full left-0 right-0 mt-2 z-50 border-none shadow-2xl rounded-2xl overflow-hidden">
            <CardContent className="p-0">
              {searchResults.map((product: any) => (
                <div 
                  key={product.id}
                  className="p-4 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-none transition-colors"
                  onClick={() => addItem(product)}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                      {product.stockQuantity > 0 ? <Package size={16} /> : <Stethoscope size={16} />}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-900">{product.name}</p>
                      <p className="text-[10px] text-slate-400">Stock: {product.stockQuantity} un.</p>
                    </div>
                  </div>
                  <p className="font-black text-blue-600">€{product.price}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>

      <div className="space-y-3">
        {items.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
             <ShoppingCart size={32} className="mx-auto text-slate-100 mb-2" />
             <p className="text-slate-400 text-sm font-medium">Nenhum item adicionado à consulta.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-50 shadow-sm animate-in slide-in-from-right-2 duration-300">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-bold text-slate-400 text-xs">
                      {item.quantity}x
                   </div>
                   <div>
                      <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                      <p className="text-[10px] text-slate-400">Preço unitário: €{item.price}</p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <p className="font-black text-slate-900">€{(item.price * item.quantity).toFixed(2)}</p>
                   <Button variant="ghost" size="icon" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500 hover:bg-red-50">
                      <Trash2 size={16} />
                   </Button>
                </div>
              </div>
            ))}
            
            <div className="pt-6 border-t border-slate-100 flex justify-between items-end px-4">
               <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Consulta</p>
                  <div className="flex items-center gap-2 mt-1">
                     <CreditCard size={20} className="text-blue-600" />
                     <p className="text-3xl font-black text-slate-900 tracking-tighter">€{total.toFixed(2)}</p>
                  </div>
               </div>
               <Badge className="bg-blue-100 text-blue-700 border-none px-3 py-1 mb-1">
                  Draft Jasmin Pronto
               </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
