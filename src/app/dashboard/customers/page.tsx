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
  ChevronLeft,
  UserPlus,
  PawPrint
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
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { AddCustomerForm } from "@/components/forms/AddCustomerForm";

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 30;

  const { data: response, isLoading } = useQuery({
    queryKey: ["customers", searchTerm, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error("Erro ao carregar clientes");
      return res.json();
    }
  });

  const customers = response?.data || response || [];
  const pagination = response?.pagination;

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="flex flex-wrap justify-between items-start gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight sm:text-5xl">Hub de Clientes</h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
             <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-none font-bold px-2 py-0.5">
               {pagination?.total || 0}
             </Badge>
             <span>clientes registados no ecossistema</span>
          </div>
        </div>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button className="h-14 rounded-2xl gap-3 bg-blue-600 hover:bg-blue-700 shadow-xl shadow-blue-100 dark:shadow-none font-black px-8 transition-all active:scale-95">
              <UserPlus size={22} strokeWidth={3} /> 
              <span>Novo Cliente</span>
            </Button>
          </DialogTrigger>
          <AddCustomerForm onSuccess={() => setIsModalOpen(false)} />
        </Dialog>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/40 dark:shadow-none overflow-hidden bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] ring-1 ring-slate-100 dark:ring-slate-800">
        <div className="p-6 md:p-8 border-b border-slate-50/50 dark:border-white/5">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
            <Input 
              placeholder="Procurar por nome, telefone, email ou NIF..."
              className="h-16 pl-16 pr-6 rounded-3xl border-none bg-slate-100/50 dark:bg-slate-800/50 focus-visible:ring-2 focus-visible:ring-blue-500/50 font-semibold text-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            />
          </div>
        </div>
        <CardContent className="p-0">
          <div className="overflow-x-auto no-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-50 dark:border-white/5">
                  <TableHead className="px-10 py-6 text-slate-400 dark:text-slate-500 font-black text-[11px] uppercase tracking-[0.25em]">Cliente & Contactos</TableHead>
                  <TableHead className="px-10 py-6 text-slate-400 dark:text-slate-500 font-black text-[11px] uppercase tracking-[0.25em]">Dados Fiscais</TableHead>
                  <TableHead className="px-10 py-6 text-slate-400 dark:text-slate-500 font-black text-[11px] uppercase tracking-[0.25em]">Animais</TableHead>
                  <TableHead className="px-10 py-6 text-slate-400 dark:text-slate-500 font-black text-[11px] uppercase tracking-[0.25em]">Morada</TableHead>
                  <TableHead className="px-10 py-6 text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <TableRow key={i} className="border-slate-50 dark:border-white/5">
                      <TableCell className="px-10 py-8">
                        <div className="flex items-center gap-4">
                          <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
                          <div className="space-y-2">
                            <div className="h-5 w-48 bg-slate-100 dark:bg-slate-800 rounded animate-pulse" />
                            <div className="h-3 w-32 bg-slate-50 dark:bg-slate-800 rounded animate-pulse" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell colSpan={4}><div className="h-4 w-full bg-slate-50 dark:bg-slate-800/50 rounded animate-pulse" /></TableCell>
                    </TableRow>
                  ))
                ) : customers?.map((c: any) => (
                  <TableRow key={c.id} className="hover:bg-blue-50/30 dark:hover:bg-slate-800/50 border-slate-50 dark:border-white/5 group transition-all cursor-pointer" asChild>
                    <Link href={`/dashboard/customers/${c.id}`}>
                      <TableCell className="px-10 py-8">
                        <div className="flex items-center gap-5">
                          <div className="h-14 w-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 font-black text-xl group-hover:bg-blue-600 dark:group-hover:bg-blue-600 group-hover:text-white group-hover:scale-105 group-hover:rotate-3 shadow-sm transition-all duration-300">
                            {c.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-slate-900 dark:text-white text-xl tracking-tight leading-tight">{c.name}</p>
                            <div className="flex gap-4 items-center mt-2 text-slate-400 dark:text-slate-500">
                              {c.phone && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md"><Phone size={10} strokeWidth={3} /> {c.phone}</span>
                              )}
                              {c.email && (
                                <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest bg-slate-50 dark:bg-slate-800 px-2 py-0.5 rounded-md"><Mail size={10} strokeWidth={3} /> {c.email}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-8">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">NIF</span>
                          <span className="text-sm font-black text-slate-700 dark:text-slate-300 font-mono tracking-wider">{c.vatNumber || "—"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-8">
                        <Badge variant="outline" className="rounded-xl border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-600 dark:text-slate-300 font-black gap-1.5 px-3 py-1.5 shadow-sm group-hover:border-blue-300 dark:group-hover:border-blue-800 transition-colors">
                          <PawPrint size={14} className="text-blue-500" />
                          {c._count?.patients || 0}
                          <span className="text-[9px] opacity-60 ml-0.5">ANIMAIS</span>
                        </Badge>
                      </TableCell>
                      <TableCell className="px-10 py-8">
                        <div className="flex items-start gap-2 max-w-[250px]">
                          <MapPin size={14} className="text-slate-300 mt-0.5 shrink-0" />
                          <span className="text-xs text-slate-500 dark:text-slate-400 font-bold leading-relaxed line-clamp-2">{c.address || "Sem morada fiscal registada"}</span>
                        </div>
                      </TableCell>
                      <TableCell className="px-10 py-8 text-right">
                         <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 dark:text-slate-600 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-200 dark:group-hover:shadow-none transition-all duration-300">
                            <ChevronRight size={24} strokeWidth={3} />
                         </div>
                      </TableCell>
                    </Link>
                  </TableRow>
                ))}
                {!isLoading && customers?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-32 text-center">
                      <div className="flex flex-col items-center gap-6">
                        <div className="w-24 h-24 rounded-[2.5rem] bg-slate-50 dark:bg-slate-900 flex items-center justify-center text-slate-200 dark:text-slate-800">
                          <Users size={48} strokeWidth={1} />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-2xl font-black text-slate-900 dark:text-white">Nenhum cliente encontrado</h3>
                          <p className="text-slate-500 dark:text-slate-400 font-medium">Ajuste os filtros ou crie um novo registo.</p>
                        </div>
                        <Button variant="outline" className="rounded-2xl border-slate-200 dark:border-slate-800 font-black px-8" onClick={() => setSearchTerm("")}>Limpar Procura</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-10 py-8 border-t border-slate-50/50 dark:border-white/5 bg-slate-50/30 dark:bg-slate-950/30">
              <p className="text-xs font-black text-slate-400 dark:text-slate-600 uppercase tracking-[0.2em]">
                Página {pagination.page} de {pagination.totalPages} <span className="mx-4 opacity-20">|</span> {pagination.total} Clientes
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="h-12 rounded-2xl border-slate-200 dark:border-slate-800 font-black px-6 hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-30"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  <ChevronLeft size={18} strokeWidth={3} className="mr-2" /> Anterior
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 rounded-2xl border-slate-200 dark:border-slate-800 font-black px-6 hover:bg-white dark:hover:bg-slate-800 transition-all disabled:opacity-30"
                  disabled={page >= pagination.totalPages}
                  onClick={() => setPage(p => p + 1)}
                >
                  Próxima <ChevronRight size={18} strokeWidth={3} className="ml-2" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
