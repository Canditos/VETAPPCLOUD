"use client";

import { useState } from "react";
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  Mail, 
  UserPlus,
  Shield,
  Stethoscope,
  Briefcase,
  UserCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const team = [
  { id: "1", name: "Dr. Marco António", email: "marco@clinicavet.pt", role: "ADMIN", status: "Ativo" },
  { id: "2", name: "Dra. Sara Lima", email: "sara.vet@clinicavet.pt", role: "VETERINARIAN", status: "Ativo" },
  { id: "3", name: "Ricardo Sousa", email: "ricardo@clinicavet.pt", role: "ASSISTANT", status: "Ativo" },
  { id: "4", name: "Ana Pires", email: "ana.recep@clinicavet.pt", role: "RECEPTIONIST", status: "Ausente" },
];

export default function TeamPage() {
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN": return <Badge className="bg-purple-100 text-purple-700 border-none gap-1"><Shield size={12} /> Admin</Badge>;
      case "VETERINARIAN": return <Badge className="bg-sky-100 text-sky-700 border-none gap-1"><Stethoscope size={12} /> Veterinário</Badge>;
      case "ASSISTANT": return <Badge className="bg-emerald-100 text-emerald-700 border-none gap-1"><Briefcase size={12} /> Assistente</Badge>;
      case "RECEPTIONIST": return <Badge className="bg-slate-100 text-slate-700 border-none gap-1"><UserCircle size={12} /> Receção</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Equipa & Acessos</h1>
          <p className="text-slate-500 font-medium">Faça a gestão dos utilizadores e permissões da clínica.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700">
              <UserPlus size={18} /> Convidar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-3xl border-none shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Adicionar Membro</DialogTitle>
              <DialogDescription>O novo utilizador receberá um email para definir a palavra-passe.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase">Nome Completo</Label>
                <Input id="name" placeholder="Ex: Maria João" className="rounded-xl border-slate-200" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase">Email Profissional</Label>
                <Input id="email" type="email" placeholder="nome@clínica.pt" className="rounded-xl border-slate-200" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-xs font-bold text-slate-500 uppercase">Cargo / Role</Label>
                <Select>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Selecione o cargo" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="ADMIN">Administrador</SelectItem>
                    <SelectItem value="VETERINARIAN">Veterinário</SelectItem>
                    <SelectItem value="ASSISTANT">Assistente</SelectItem>
                    <SelectItem value="RECEPTIONIST">Rececionista</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full rounded-xl bg-blue-600 py-6 text-lg font-bold">Enviar Convite</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-3xl font-black text-slate-900">14</p>
             <p className="text-xs text-green-600 font-bold mt-1">+2 novos este mês</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-slate-400 uppercase tracking-widest">Acessos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-3xl font-black text-slate-900">8</p>
             <p className="text-xs text-slate-400 font-bold mt-1">Sessões em curso agora</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100">
                <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Colaborador</th>
                <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Permissões</th>
                <th className="px-6 py-4 text-slate-400 font-bold text-xs uppercase tracking-wider">Estado</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </TableHeader>
            <TableBody>
              {team.map((m) => (
                <TableRow key={m.id} className="hover:bg-slate-50/50 border-slate-50 transition-colors">
                  <TableCell className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                        {m.name[0]}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900">{m.name}</p>
                        <p className="text-xs text-slate-500 flex items-center gap-1"><Mail size={12} /> {m.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    {getRoleBadge(m.role)}
                  </TableCell>
                  <TableCell className="px-6 py-5">
                    <Badge variant="outline" className={`border-none rounded-full px-3 ${m.status === "Ativo" ? "bg-green-50 text-green-600" : "bg-slate-100 text-slate-400"}`}>
                       <div className={`w-1.5 h-1.5 rounded-full mr-2 ${m.status === "Ativo" ? "bg-green-500" : "bg-slate-400"}`}></div>
                       {m.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-5 text-right">
                    <Button variant="ghost" size="sm" className="font-bold text-blue-600 hover:text-blue-700 hover:bg-blue-50">Configurar</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
