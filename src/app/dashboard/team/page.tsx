"use client";

import { useEffect, useState } from "react";
import { 
  Users, 
  Plus, 
  ShieldCheck, 
  Mail, 
  UserPlus,
  Shield,
  Stethoscope,
  Briefcase,
  UserCircle,
  Loader2
} from "lucide-react";
import { toast } from "sonner";
import { 
  Dialog, 
  DialogTrigger, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem 
} from "@/components/ui/select";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";
import { 
  Table, 
  TableHeader, 
  TableRow, 
  TableHead, 
  TableBody, 
  TableCell 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<any[]>([]);
  const [inviting, setInviting] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "", role: "VETERINARIAN" });

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      const response = await fetch("/api/team");
      if (response.ok) {
        const data = await response.json();
        setTeam(data);
      }
    } catch (error) {
      toast.error("Erro ao carregar equipa");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async () => {
    setInviting(true);
    try {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast.success("Convite enviado com sucesso!");
        fetchTeam();
        setFormData({ name: "", email: "", role: "VETERINARIAN" });
      } else {
        const err = await response.json();
        toast.error(err.error || "Erro ao enviar convite");
      }
    } catch (error) {
      toast.error("Erro na comunicação com o servidor");
    } finally {
      setInviting(false);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN": return <Badge className="bg-purple-500/10 text-purple-400 border-none gap-1 px-3 py-1 rounded-lg"><Shield size={12} /> Admin</Badge>;
      case "VETERINARIAN": return <Badge className="bg-sky-500/10 text-sky-400 border-none gap-1 px-3 py-1 rounded-lg"><Stethoscope size={12} /> Veterinário</Badge>;
      case "ASSISTANT": return <Badge className="bg-emerald-500/10 text-emerald-400 border-none gap-1 px-3 py-1 rounded-lg"><Briefcase size={12} /> Assistente</Badge>;
      case "RECEPTIONIST": return <Badge className="bg-slate-500/10 text-slate-400 border-none gap-1 px-3 py-1 rounded-lg"><UserCircle size={12} /> Receção</Badge>;
      default: return <Badge>{role}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto p-4 md:p-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Equipa & Acessos</h1>
          <p className="text-slate-500 dark:text-slate-400 font-medium">Faça a gestão dos utilizadores e permissões da clínica.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 h-12 px-6 font-black shadow-lg shadow-blue-500/20">
              <UserPlus size={18} /> Convidar Membro
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] rounded-[2rem] border-none shadow-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-200 dark:ring-white/10">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-900 dark:text-white">Adicionar Membro</DialogTitle>
              <DialogDescription className="text-slate-500 dark:text-slate-400">O novo utilizador receberá um email para definir a palavra-passe.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase">Nome Completo</Label>
                <Input 
                  id="name" 
                  placeholder="Ex: Maria João" 
                  className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white" 
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase">Email Profissional</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="nome@clínica.pt" 
                  className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white" 
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="role" className="text-xs font-bold text-slate-500 uppercase">Cargo / Role</Label>
                <Select value={formData.role} onValueChange={(val) => setFormData({ ...formData, role: val })}>
                  <SelectTrigger className="rounded-xl bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 text-slate-900 dark:text-white">
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
            <Button 
              onClick={handleInvite}
              disabled={inviting}
              className="w-full rounded-xl bg-blue-600 py-6 text-lg font-bold gap-2"
            >
              {inviting ? <Loader2 className="animate-spin" size={20} /> : <UserPlus size={20} />}
              Enviar Convite
            </Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Staff</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-4xl font-black text-slate-900 dark:text-white">{team.length}</p>
             <p className="text-xs text-blue-600 font-bold mt-1">Colaboradores ativos</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-[2rem] bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Acessos Ativos</CardTitle>
          </CardHeader>
          <CardContent>
             <p className="text-4xl font-black text-slate-900 dark:text-white">{team.filter(u => u.role === 'ADMIN' || u.role === 'VETERINARIAN').length}</p>
             <p className="text-xs text-slate-400 font-bold mt-1">Gestão & Área Clínica</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm overflow-hidden rounded-[2.5rem] bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-white/5">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                <TableHead className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Colaborador</TableHead>
                <TableHead className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Permissões</TableHead>
                <TableHead className="px-8 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Desde</TableHead>
                <TableHead className="px-8 py-5 text-right font-black text-[10px] uppercase tracking-widest text-slate-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {team.map((m) => (
                <TableRow key={m.id} className="hover:bg-slate-50/50 dark:hover:bg-white/[0.02] border-slate-100 dark:border-white/5 transition-colors">
                  <TableCell className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center font-black text-lg">
                        {m.name[0]}
                      </div>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-lg tracking-tight leading-none">{m.name}</p>
                        <p className="text-sm text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1.5 mt-2 tracking-tight">
                          <Mail size={14} className="opacity-40" /> {m.email}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    {getRoleBadge(m.role)}
                  </TableCell>
                  <TableCell className="px-8 py-6">
                    <p className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      {new Date(m.createdAt).toLocaleDateString('pt-PT')}
                    </p>
                  </TableCell>
                  <TableCell className="px-8 py-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => toast.info(`A abrir definições de ${m.name}...`)}
                      className="font-black text-[10px] uppercase tracking-widest text-blue-600 dark:text-blue-400 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl px-4 h-9"
                    >
                      Configurar
                    </Button>
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
