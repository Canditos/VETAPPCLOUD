"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  PawPrint, 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  Activity, 
  Stethoscope, 
  Syringe, 
  Scissors, 
  AlertCircle,
  Dog,
  Cat,
  Loader2,
  FileText,
  Heart,
  Thermometer,
  Weight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const { data: patient, isLoading, isError } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      const res = await fetch(`/api/patients/${patientId}`);
      if (!res.ok) throw new Error("Erro ao carregar paciente");
      return res.json();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl md:col-span-2" />
        </div>
      </div>
    );
  }

  if (isError || !patient) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <AlertCircle size={48} className="text-red-500" />
        <h2 className="text-2xl font-bold text-slate-900">Paciente não encontrado</h2>
        <p className="text-slate-500">Não foi possível carregar os dados deste paciente.</p>
        <Button onClick={() => router.push("/dashboard/patients")}>Voltar para Lista</Button>
      </div>
    );
  }

  const isDog = patient.species?.toLowerCase().includes("cão") || patient.species?.toLowerCase().includes("can");
  const isCat = patient.species?.toLowerCase().includes("gato") || patient.species?.toLowerCase().includes("fel");
  const speciesIcon = isDog ? Dog : isCat ? Cat : PawPrint;

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl">
          <ArrowLeft size={20} />
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{patient.name}</h1>
          <p className="text-slate-500 dark:text-slate-400 flex items-center gap-2">
            <span className="capitalize">{patient.species}</span>
            {patient.breed && <span>• {patient.breed}</span>}
          </p>
        </div>
        <div className="ml-auto flex gap-2">
          <Badge variant={patient.status === "ACTIVE" ? "default" : "secondary"} className="rounded-lg px-3 py-1">
            {patient.status === "ACTIVE" ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="space-y-6">
          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  {speciesIcon({ size: 20 })}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Espécie</p>
                  <p className="font-semibold">{patient.species}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 flex items-center justify-center">
                  <Activity size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Género</p>
                  <p className="font-semibold">{patient.gender === "M" ? "Macho" : patient.gender === "F" ? "Fêmea" : "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center">
                  <Calendar size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Nascimento</p>
                  <p className="font-semibold">{patient.birthDate ? new Date(patient.birthDate).toLocaleDateString("pt-PT") : "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 flex items-center justify-center">
                  <Weight size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Peso</p>
                  <p className="font-semibold">{patient.weight ? `${patient.weight} kg` : "—"}</p>
                </div>
              </div>
              {patient.microchip && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 flex items-center justify-center">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Microchip</p>
                    <p className="font-mono font-semibold text-sm">{patient.microchip}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg font-semibold">Proprietário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                  <User size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Nome</p>
                  <p className="font-semibold">{patient.owner?.name || "—"}</p>
                </div>
              </div>
              {patient.owner?.phone && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center">
                    <Phone size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Telefone</p>
                    <p className="font-semibold">{patient.owner.phone}</p>
                  </div>
                </div>
              )}
              {patient.owner?.email && (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 flex items-center justify-center">
                    <Mail size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-500">Email</p>
                    <p className="font-semibold">{patient.owner.email}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Tabs */}
        <div className="lg:col-span-2">
          <Card className="border-none shadow-sm rounded-2xl min-h-[500px]">
            <Tabs defaultValue="clinical" className="w-full">
              <div className="px-6 pt-6 border-b border-slate-100 dark:border-slate-800">
                <TabsList className="bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                  <TabsTrigger value="clinical" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">Clínico</TabsTrigger>
                  <TabsTrigger value="history" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">Histórico</TabsTrigger>
                  <TabsTrigger value="documents" className="rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700">Documentos</TabsTrigger>
                </TabsList>
              </div>
              
              <div className="p-6">
                <TabsContent value="clinical" className="space-y-6 m-0">
                  {patient.allergies ? (
                    <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400 mb-2">
                        <AlertCircle size={18} />
                        <span className="font-bold text-sm uppercase">Alergias / Alertas</span>
                      </div>
                      <p className="text-sm text-red-800 dark:text-red-300">{patient.allergies}</p>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30">
                      <div className="flex items-center gap-2 text-green-700 dark:text-green-400">
                        <Heart size={18} />
                        <span className="font-bold text-sm">Sem alergias conhecidas</span>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500 uppercase">Estado Reprodutivo</span>
                      <p className="font-semibold mt-1">{patient.reproductiveStatus || "—"}</p>
                    </div>
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-xs font-medium text-slate-500 uppercase">Nível Agressividade</span>
                      <p className="font-semibold mt-1">{patient.aggressionLevel || "—"}</p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">Notas Clínicas</h3>
                    <p className="text-slate-500 text-sm">Nenhuma nota clínica registada ainda.</p>
                  </div>
                </TabsContent>

                <TabsContent value="history" className="m-0">
                  <div className="text-center py-12 text-slate-400">
                    <Stethoscope size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Histórico de consultas vazio</p>
                    <p className="text-sm mt-1">As consultas realizadas aparecerão aqui.</p>
                  </div>
                </TabsContent>

                <TabsContent value="documents" className="m-0">
                  <div className="text-center py-12 text-slate-400">
                    <FileText size={48} className="mx-auto mb-4 opacity-20" />
                    <p className="font-medium">Sem documentos</p>
                    <p className="text-sm mt-1">Anexa exames, receitas ou outros documentos.</p>
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>
      </div>
    </div>
  );
}
