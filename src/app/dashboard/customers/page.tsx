"use client";

import { useState } from "react";
import { Plus, Search, Phone, Mail, CreditCard, ChevronRight, ChevronLeft, UserPlus, PawPrint, MapPin, RefreshCw, MoreHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { FormField, SelectField, FormErrorSummary } from "@/components/forms/FormFields";
import { PatientAvatar, VetStatusBadge } from "@/components/PatientAvatar";
import { EmptyState } from "@/components/EmptyState";
import Link from "next/link";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddCustomerForm } from "@/components/forms/AddCustomerForm";

const CustomerAvatar = ({ name }: { name: string }) => (
  <PatientAvatar name={name} className="h-12 w-12 text-lg" />
);

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 30;

  const { data: response, isLoading, refetch, isRefetching } = useQuery({
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
    <div className="max-w-[1600px] mx-auto space-y-6 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Hub de Clientes
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-none font-bold px-2 py-0.5">
              {pagination?.total || 0}
            </Badge>
            <span>clientes ativos na plataforma</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()} 
            disabled={isRefetching}
            className="h-10 w-10 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <RefreshCw className={`w-5 h-5 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
               <Button className="h-10 rounded-2xl px-6 gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl shadow-slate-200 dark:shadow-none font-bold transition-all active:scale-95">
                <Plus size={22} strokeWidth={3} />
                <span>Novo Cliente</span>
              </Button>
            </DialogTrigger>
            <AddCustomerForm onSuccess={() => setIsModalOpen(false)} />
          </Dialog>
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        {/* Toolbar Card */}
        <Card className="border-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl shadow-slate-200/40 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="relative group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
              <Input 
                placeholder="Procurar por nome, NIF, telemóvel ou email..."
                className="h-16 pl-16 pr-6 rounded-3xl border-none bg-slate-100/50 dark:bg-slate-800/50 focus-visible:ring-2 focus-visible:ring-blue-500/50 font-semibold text-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Labels for "Columns" in Card Layout (Desktop) */}
        <div className="hidden md:grid grid-cols-[1fr_200px_300px_150px_80px] gap-4 px-8 text-slate-400 dark:text-slate-500 font-bold text-[10px] uppercase tracking-wider">
          <span>Cliente & Identificação</span>
          <span>Contactos</span>
          <span>Faturação & Morada</span>
          <span className="text-center">Pacientes</span>
          <span></span>
        </div>

        {/* Customers List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
            ))
          ) : customers.length === 0 ? (
            <EmptyState
              title="Nenhum cliente encontrado"
              description="Tente ajustar a procura ou crie um novo cliente."
              primaryAction={{ label: "Novo cliente", href: "#" }}
              icon={SearchX}
            />
          ) : (
            customers.map((customer: any) => (
              <Link 
                key={customer.id} 
                href={`/dashboard/customers/${customer.id}`}
                className="group block"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_300px_150px_80px] gap-4 items-center bg-white dark:bg-slate-900 p-4 md:p-6 rounded-2xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none transition-all duration-300">
                  {/* Customer Info */}
                  <div className="flex items-center gap-5">
                    <CustomerAvatar name={customer.name} />
                    <div className="min-w-0">
                      <p className="font-bold text-xl text-slate-900 dark:text-white truncate">{customer.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <CreditCard size={12} className="text-slate-300 dark:text-slate-600" />
                        <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                          {customer.vatNumber || "SEM NIF"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Contacts */}
                  <div className="flex flex-col gap-1.5">
                    {customer.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={12} className="text-blue-500 opacity-60" />
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{customer.phone}</span>
                      </div>
                    )}
                    {customer.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={12} className="text-slate-300 dark:text-slate-600" />
                        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">{customer.email}</span>
                      </div>
                    )}
                  </div>

                  {/* Billing / Address */}
                  <div className="flex flex-col gap-1">
                    <div className="flex items-start gap-2">
                      <MapPin size={14} className="text-slate-300 dark:text-slate-700 mt-0.5 shrink-0" />
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 leading-tight line-clamp-2">
                        {customer.address || "Sem morada fiscal registada"}
                      </p>
                    </div>
                  </div>

                  {/* Patients Count */}
                  <div className="text-center">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 font-bold text-blue-600 dark:text-blue-400 shadow-sm transition-colors group-hover:border-blue-200 dark:group-hover:border-blue-900/50">
                      <PawPrint size={16} />
                      <span className="text-sm">{customer._count?.patients || 0}</span>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="text-right flex items-center gap-2 justify-end">
                    <button
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        try {
                          const res = await fetch("/api/portal/token", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ ownerId: customer.id }),
                          });
                          const data = await res.json();
                          const link = `${window.location.origin}/portal/${data.token}`;
                          await navigator.clipboard.writeText(link);
                          alert(`Link copiado!\n\n${link}`);
                        } catch {
                          alert("Erro ao gerar link do portal");
                        }
                      }}
                      className="h-10 px-3 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider hover:bg-blue-600 hover:text-white transition-all duration-300 shrink-0"
                      title="Enviar Portal ao Tutor"
                    >
                      Portal
                    </button>
                    <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <ChevronRight size={24} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination Section */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-4">
            <p className="text-sm font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              Página {pagination.page} <span className="mx-2 text-slate-200 dark:text-slate-800">/</span> {pagination.totalPages}
            </p>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="h-10 rounded-2xl border-slate-200 dark:border-slate-800 font-bold px-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={18} strokeWidth={3} className="mr-2" />
                Anterior
              </Button>
              
              <Button 
                variant="outline" 
                className="h-10 rounded-2xl border-slate-200 dark:border-slate-800 font-bold px-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Próxima
                <ChevronRight size={18} strokeWidth={3} className="ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
