"use client";

import { useState } from "react";
import { 
  Package, 
  Plus, 
  Search, 
  AlertTriangle,
  ArrowUpDown,
  MoreHorizontal,
  PlusCircle,
  MinusCircle
} from "lucide-react";
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

const products = [
  { id: "1", name: "Vacina Raiva (Merial)", stock: 15, price: "15.00", barcode: "123456", category: "Vacinas" },
  { id: "2", name: "Antibiótico Vet 250mg", stock: 2, price: "12.50", barcode: "789012", category: "Medicamentos" },
  { id: "3", name: "Ração Dietética Gastro 5kg", stock: 8, price: "45.00", barcode: "345678", category: "Alimentação" },
  { id: "4", name: "Desparasitante Interno", stock: 24, price: "8.90", barcode: "901234", category: "Higiene" },
];

export default function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Inventário & Stock</h1>
          <p className="text-slate-500 font-medium">Controlo total de medicamentos e consumíveis.</p>
        </div>
        <div className="flex gap-3">
           <Button variant="outline" className="rounded-xl gap-2">
              <ArrowUpDown size={16} /> Movimentos
           </Button>
           <Dialog>
              <DialogTrigger asChild>
                <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700">
                  <Plus size={16} /> Novo Produto
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Adicionar Produto</DialogTitle>
                  <DialogDescription>Registe um novo artigo no catálogo da clínica.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase">Nome do Produto</Label>
                    <Input id="name" placeholder="Ex: Vacina X" className="rounded-xl border-slate-200" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="price" className="text-xs font-bold text-slate-500 uppercase">Preço (EUR)</Label>
                      <Input id="price" type="number" placeholder="0.00" className="rounded-xl border-slate-200" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="stock" className="text-xs font-bold text-slate-500 uppercase">Stock Inicial</Label>
                      <Input id="stock" type="number" placeholder="0" className="rounded-xl border-slate-200" />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="barcode" className="text-xs font-bold text-slate-500 uppercase">Código de Barras</Label>
                    <Input id="barcode" placeholder="Digitalize ou digite..." className="rounded-xl border-slate-200" />
                  </div>
                </div>
                <Button className="w-full rounded-xl bg-blue-600 py-6 text-lg font-bold">Salvar no Inventário</Button>
              </DialogContent>
           </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none bg-amber-50 shadow-sm border-l-4 border-l-amber-400">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-amber-100 text-amber-600 rounded-2xl">
              <AlertTriangle size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-amber-700 uppercase tracking-widest">Alertas Urgentes</p>
              <p className="text-lg font-black text-slate-900">2 produtos em rutura</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none bg-blue-50 shadow-sm border-l-4 border-l-blue-400">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl">
              <Package size={24} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Valor em Armazém</p>
              <p className="text-lg font-black text-slate-900">€2,840.00</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 pb-6 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Procurar por nome, categoria ou código de barras..."
              className="pl-12 py-6 rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 focus-visible:ring-blue-500 transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100">
                <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Stock Atual</th>
                <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Preço Un.</th>
                <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-right">Ajuste</th>
              </tr>
            </TableHeader>
            <TableBody>
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                  <td className="px-6 py-5">
                    <div>
                      <p className="font-bold text-slate-900">{p.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.barcode}</p>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <Badge variant={p.stock <= 5 ? "destructive" : "secondary"} className="rounded-lg px-2 font-bold">
                      {p.stock} unidades
                    </Badge>
                  </td>
                  <td className="px-6 py-5 font-bold text-slate-700">€{p.price}</td>
                  <td className="px-6 py-5">
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md">{p.category}</span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex justify-end gap-1">
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-green-600 hover:bg-green-50">
                          <PlusCircle size={18} />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                          <MinusCircle size={18} />
                       </Button>
                       <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400">
                          <MoreHorizontal size={18} />
                       </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
