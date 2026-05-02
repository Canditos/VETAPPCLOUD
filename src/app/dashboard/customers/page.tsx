"use client";

import { useState } from "react";
import { 
  Users, 
  Plus, 
  Search, 
  Phone, 
  Mail, 
  CreditCard,
  ChevronRight,
  UserPlus
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const { data: customers, isLoading } = useQuery({
    queryKey: ["customers", searchTerm],
    queryFn: async () => {
      const res = await fetch(`/api/customers?q=${searchTerm}`);
      if (!res.ok) throw new Error("Erro ao carregar clientes");
      return res.json();
    }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">Hub de Clientes</h1>
          <p className="text-slate-500 font-medium">Gestão centralizada de tutores, animais e conta corrente.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100 font-bold px-6">
              <UserPlus size={20} /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <div className="bg-blue-600 p-8 text-white">
              <DialogTitle className="text-2xl font-black">Registar Tutor</DialogTitle>
              <DialogDescription className="text-blue-100">Adicione um novo proprietário ao sistema.</DialogDescription>
            </div>
            <div className="p-8 grid gap-6">
              <div className="grid gap-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nome Completo</Label>
                <Input placeholder="Ex: João Silva" className="rounded-xl border-slate-100 bg-slate-50 py-6" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Telemóvel</Label>
                  <Input placeholder="912 345 678" className="rounded-xl border-slate-100 bg-slate-50 py-6" />
                </div>
                <div className="grid gap-2">
                  <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">NIF</Label>
                  <Input placeholder="123456789" className="rounded-xl border-slate-100 bg-slate-50 py-6" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</Label>
                <Input type="email" placeholder="joao@exemplo.com" className="rounded-xl border-slate-100 bg-slate-50 py-6" />
              </div>
              <Button className="w-full rounded-2xl bg-blue-600 py-7 text-lg font-black shadow-xl shadow-blue-100 mt-2">
                Criar Ficha de Cliente
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white rounded-[2rem]">
        <div className="p-8 border-b border-slate-50">
          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
            <Input 
              placeholder="Procurar por nome, telefone, email ou NIF..."
              className="pl-14 py-7 rounded-2xl border-none bg-slate-50 focus-visible:ring-blue-500 font-medium text-slate-600"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-50">
                <TableHead className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Cliente & Contactos</TableHead>
                <TableHead className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Animais</TableHead>
                <TableHead className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Conta Corrente</TableHead>
                <TableHead className="px-8 py-5 text-right text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center py-20 font-bold text-slate-300">A carregar...</TableCell></TableRow>
              ) : customers?.map((c: any) => (
                <TableRow key={c.id} className="hover:bg-blue-50/30 border-slate-50 group transition-all cursor-pointer" asChild>
                  <Link href={`/dashboard/customers/${c.id}`}>
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                          {c.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 text-lg">{c.name}</p>
                          <div className="flex gap-4 items-center mt-1 text-slate-400">
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"><Phone size={12} /> {c.phone || "---"}</span>
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"><Mail size={12} /> {c.email || "---"}</span>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="rounded-lg border-slate-200 text-slate-400 font-black">
                          {c._count.patients} Animais
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="px-8 py-6">
                       <div className="flex items-center gap-2">
                          <CreditCard size={16} className="text-slate-300" />
                          <span className="font-black text-slate-700">€0.00</span>
                       </div>
                    </TableCell>
                    <TableCell className="px-8 py-6 text-right">
                       <Button variant="ghost" size="icon" className="rounded-xl hover:bg-white">
                          <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                       </Button>
                    </TableCell>
                  </Link>
                </TableRow>
              ))}
              {!isLoading && customers?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <Users size={48} className="text-slate-100" />
                      <p className="text-slate-400 font-bold">Nenhum cliente encontrado.</p>
                      <Button variant="outline" className="rounded-xl" onClick={() => setSearchTerm("")}>Limpar Procura</Button>
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
