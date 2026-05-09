"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  PawPrint,
  RefreshCw,
  ChevronRight,
  ChevronLeft,
  Dog,
  Cat,
  User,
  Cpu,
  Info
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AddPatientForm } from "@/components/forms/AddPatientForm";
import Link from "next/link";

// Custom Patient Avatar Component
const PatientAvatar = ({ name, species }: { name: string, species: string }) => {
  const isDog = species?.toLowerCase().includes("cão") || species?.toLowerCase().includes("can");
  const isCat = species?.toLowerCase().includes("gato") || species?.toLowerCase().includes("fel");
  
  return (
    <div className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110 shadow-sm ${
      isDog ? "bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" 
      : isCat ? "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
      : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
    }`}>
      {isDog ? <Dog size={24} strokeWidth={2.5} /> : isCat ? <Cat size={24} strokeWidth={2.5} /> : <PawPrint size={24} strokeWidth={2.5} />}
      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white dark:bg-slate-900 border-2 border-slate-50 dark:border-slate-800 flex items-center justify-center text-[8px] font-black shadow-sm">
        {name?.[0]?.toUpperCase()}
      </div>
    </div>
  );
};

export default function PatientsPage() {
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [speciesFilter, setSpeciesFilter] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 30;

  useEffect(() => {
    if (searchParams.get("new") === "true") {
      setIsModalOpen(true);
    }
  }, [searchParams]);

  const { data: response, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["patients", searchTerm, speciesFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (searchTerm) params.set("search", searchTerm);
      if (speciesFilter) params.set("species", speciesFilter);
      params.set("page", String(page));
      params.set("limit", String(limit));
      const res = await fetch(`/api/patients?${params.toString()}`);
      if (!res.ok) throw new Error("Falha ao carregar pacientes");
      return res.json();
    },
  });

  const patients = response?.data || response || [];
  const pagination = response?.pagination;

  const speciesOptions = [
    { value: "", label: "Todos", icon: PawPrint },
    { value: "Cão", label: "Cães", icon: Dog },
    { value: "Gato", label: "Gatos", icon: Cat },
  ];

  return (
    <div className="max-w-[1600px] mx-auto space-y-10 p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white sm:text-5xl">
            Pacientes
          </h1>
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium">
            <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border-none font-bold px-2 py-0.5">
              {pagination?.total || 0}
            </Badge>
            <span>animais sob cuidados ativos</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()} 
            disabled={isRefetching}
            className="h-12 w-12 rounded-2xl border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-all active:scale-95"
          >
            <RefreshCw className={`w-5 h-5 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
          
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="h-12 rounded-2xl px-6 gap-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 shadow-xl shadow-slate-200 dark:shadow-none font-black transition-all active:scale-95">
                <Plus size={22} strokeWidth={3} />
                <span>Novo Registo</span>
              </Button>
            </DialogTrigger>
            <AddPatientForm 
              onSuccess={() => setIsModalOpen(false)} 
              defaultOwnerId={searchParams.get("ownerId") || undefined}
            />
          </Dialog>
        </div>
      </div>

      {/* Main Container */}
      <div className="space-y-6">
        {/* Toolbar Card */}
        <Card className="border-none bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl rounded-[2.5rem] shadow-2xl shadow-slate-200/40 dark:shadow-none ring-1 ring-slate-100 dark:ring-slate-800 overflow-hidden">
          <CardContent className="p-4 md:p-6">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Search input with modern look */}
              <div className="relative flex-1 group">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-600 group-focus-within:text-blue-500 transition-colors" size={20} />
                <Input 
                  placeholder="Procurar por nome, chip ou proprietário..."
                  className="h-16 pl-16 pr-6 rounded-3xl border-none bg-slate-100/50 dark:bg-slate-800/50 focus-visible:ring-2 focus-visible:ring-blue-500/50 font-semibold text-lg text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-all"
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
                />
              </div>
              
              {/* Filter Section */}
              <div className="flex p-1.5 bg-slate-100/50 dark:bg-slate-800/50 rounded-3xl gap-1 self-start">
                {speciesOptions.map((opt) => (
                  <Button
                    key={opt.value}
                    variant="ghost"
                    className={`rounded-2xl px-6 h-12 gap-2 transition-all text-xs font-black uppercase tracking-wider ${
                      speciesFilter === opt.value
                        ? "bg-white dark:bg-slate-900 shadow-sm text-blue-600 dark:text-blue-400"
                        : "text-slate-500 hover:text-slate-900 dark:hover:text-slate-200"
                    }`}
                    onClick={() => { setSpeciesFilter(opt.value); setPage(1); }}
                  >
                    <opt.icon size={16} />
                    <span className="hidden sm:inline">{opt.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Patients List */}
        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 w-full bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl" />
            ))
          ) : patients.length === 0 ? (
            <div className="py-20 text-center space-y-4">
              <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center mx-auto text-slate-300">
                <PawPrint size={40} />
              </div>
              <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Nenhum paciente encontrado</p>
            </div>
          ) : (
            patients.map((patient: any) => (
              <Link 
                key={patient.id} 
                href={`/dashboard/patients/${patient.id}`}
                className="group block"
              >
                <div className="grid grid-cols-1 md:grid-cols-[1fr_200px_250px_180px_80px] gap-4 items-center bg-white dark:bg-slate-900 p-4 md:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-900/50 hover:shadow-xl hover:shadow-slate-200/40 dark:hover:shadow-none transition-all duration-300">
                  {/* Patient Info */}
                  <div className="flex items-center gap-5">
                    <PatientAvatar name={patient.name} species={patient.species} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-xl text-slate-900 dark:text-white truncate">{patient.name}</span>
                        {patient.gender && (
                          <Badge variant="outline" className="rounded-md px-1.5 py-0 text-[9px] font-black uppercase border-slate-200 dark:border-slate-700 text-slate-400">
                            {patient.gender}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-bold tracking-tight">
                        ID: {patient.id.substring(0, 8)}...
                      </p>
                    </div>
                  </div>

                  {/* Species & Breed */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${
                        patient.species === "Cão" ? "bg-amber-500" : patient.species === "Gato" ? "bg-indigo-500" : "bg-emerald-500"
                      }`} />
                      <span className="text-sm font-black text-slate-700 dark:text-slate-300 uppercase tracking-tighter">
                        {patient.species}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-slate-500 truncate pl-3.5">
                      {patient.breed || "Indefinida"}
                    </p>
                  </div>

                  {/* Owner */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                      <User size={16} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-slate-800 dark:text-slate-200 truncate">
                        {patient.owner?.name || "—"}
                      </p>
                      <p className="text-[11px] font-bold text-slate-400 dark:text-slate-500 tracking-wider">
                        {patient.owner?.phone || "SEM TELEFONE"}
                      </p>
                    </div>
                  </div>

                  {/* Chip */}
                  <div className="flex items-center gap-2">
                    <Cpu size={14} className="text-slate-300 dark:text-slate-700" />
                    <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400">
                      {patient.microchip || "—"}
                    </span>
                  </div>

                  {/* Action */}
                  <div className="text-right">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                      <ChevronRight size={20} strokeWidth={3} />
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>

        {/* Pagination Section */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 px-4 py-4">
            <p className="text-sm font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              Página {pagination.page} <span className="mx-2 text-slate-200 dark:text-slate-800">/</span> {pagination.totalPages}
            </p>
            
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="h-12 rounded-2xl border-slate-200 dark:border-slate-800 font-black px-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
              >
                <ChevronLeft size={18} strokeWidth={3} className="mr-2" />
                Anterior
              </Button>
              
              <Button 
                variant="outline" 
                className="h-12 rounded-2xl border-slate-200 dark:border-slate-800 font-black px-6 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all active:scale-95 disabled:opacity-50"
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
