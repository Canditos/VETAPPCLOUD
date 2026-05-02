"use client";

import { useState } from "react";
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal,
  PawPrint,
  RefreshCw
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AddPatientForm } from "@/components/forms/AddPatientForm";

export default function PatientsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: patients, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["patients"],
    queryFn: async () => {
      const res = await fetch("/api/patients");
      if (!res.ok) throw new Error("Falha ao carregar pacientes");
      return res.json();
    },
  });

  const filteredPatients = patients?.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.owner?.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Pacientes</h1>
          <p className="text-slate-500 font-medium">Gestão centralizada de animais e proprietários.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => refetch()} 
            disabled={isRefetching}
            className="rounded-xl border-slate-200"
          >
            <RefreshCw className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} />
          </Button>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-100">
                <Plus size={20} />
                Novo Paciente
              </Button>
            </DialogTrigger>
            <AddPatientForm onSuccess={() => setIsModalOpen(false)} />
          </Dialog>
        </div>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100 p-6">
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="relative flex-1 min-w-[300px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Procurar por nome, espécie ou dono..."
                className="pl-12 py-6 rounded-2xl border-none bg-white shadow-sm ring-1 ring-slate-100 focus-visible:ring-blue-500 transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button variant="outline" className="rounded-xl gap-2 border-slate-200">
              <Filter size={18} />
              Filtros Avançados
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100">
                <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Paciente</TableHead>
                <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Espécie / Raça</TableHead>
                <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Proprietário</TableHead>
                <TableHead className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Última Consulta</TableHead>
                <TableHead className="px-6 py-4 text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="px-6 py-4"><Skeleton className="h-10 w-40 rounded-lg" /></TableCell>
                    <TableCell className="px-6 py-4"><Skeleton className="h-10 w-32 rounded-lg" /></TableCell>
                    <TableCell className="px-6 py-4"><Skeleton className="h-10 w-24 rounded-lg" /></TableCell>
                    <TableCell className="px-6 py-4"><Skeleton className="h-10 w-20 rounded-lg" /></TableCell>
                    <TableCell className="px-6 py-4"><Skeleton className="h-8 w-8 rounded-lg ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : filteredPatients?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <PawPrint size={40} className="text-slate-200" />
                      <p className="text-slate-400 font-medium">Nenhum paciente encontrado.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPatients?.map((patient: any) => (
                  <TableRow key={patient.id} className="hover:bg-slate-50/50 transition-colors group border-slate-50">
                    <TableCell className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                          {patient.name[0]}
                        </div>
                        <span className="font-bold text-slate-900">{patient.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <Badge variant="outline" className="bg-slate-50 border-slate-200 text-slate-600 font-bold">
                        {patient.species}
                      </Badge>
                      <p className="text-[10px] text-slate-400 mt-1 font-medium">{patient.breed || "Sem raça definida"}</p>
                    </TableCell>
                    <TableCell className="px-6 py-5">
                      <div className="text-sm font-bold text-slate-700">{patient.owner?.name}</div>
                      <div className="text-[10px] text-slate-400">{patient.owner?.email}</div>
                    </TableCell>
                    <TableCell className="px-6 py-5 text-sm text-slate-500 font-medium">
                      {patient.lastVisit ? new Date(patient.lastVisit).toLocaleDateString() : "Primeira visita"}
                    </TableCell>
                    <TableCell className="px-6 py-5 text-right">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                        <MoreHorizontal size={18} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
