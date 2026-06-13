"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Archive,
  Clock,
  HardDrive,
  Cloud,
  Download,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Database,
  FileImage,
  Settings,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function BackupDashboard() {
  const [triggering, setTriggering] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["backups"],
    queryFn: async () => {
      const r = await fetch("/api/admin/backup");
      if (!r.ok) throw new Error();
      return r.json();
    },
    refetchInterval: 30000,
  });

  const triggerBackup = async () => {
    setTriggering(true);
    try {
      const r = await fetch("/api/admin/backup", { method: "POST" });
      if (r.ok) {
        toast.success("Backup iniciado!");
        refetch();
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erro ao iniciar backup");
    } finally {
      setTriggering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-[400px] flex items-center justify-center">
        <RefreshCw className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  const lastBackup = data?.lastBackup;
  const backups = data?.backups ?? [];
  const cloudConfigured = data?.cloud?.configured;

  return (
    <div className="max-w-[1200px] mx-auto space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tighter">
            Backup & Recuperação
          </h1>
          <p className="text-slate-400 text-sm font-medium mt-1">
            Backup automático a cada 2 dias. Retém apenas os 2 mais recentes.
          </p>
        </div>
        <Button
          onClick={triggerBackup}
          disabled={triggering}
          className="h-10 rounded-xl gap-2 bg-blue-600 hover:bg-blue-700 font-bold"
        >
          {triggering ? (
            <RefreshCw size={16} className="animate-spin" />
          ) : (
            <Archive size={16} />
          )}
          Fazer Backup Agora
        </Button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-none ring-1 ring-slate-200/60 dark:ring-white/5 rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                <CheckCircle size={20} className="text-emerald-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Último Backup
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {lastBackup
                    ? new Date(lastBackup.timestamp).toLocaleDateString("pt-PT", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Nunca"}
                </p>
              </div>
            </div>
            {lastBackup && (
              <p className="text-xs text-slate-500 font-mono">
                {lastBackup.file} — {lastBackup.size}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="border-none ring-1 ring-slate-200/60 dark:ring-white/5 rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                <HardDrive size={20} className="text-blue-600" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Backups Locais
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {data?.total ?? 0} / {data?.retentionCount ?? 2}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              Diretório: {data?.backupDir ?? "/backups"}
            </p>
          </CardContent>
        </Card>

        <Card className="border-none ring-1 ring-slate-200/60 dark:ring-white/5 rounded-2xl">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${cloudConfigured ? "bg-emerald-50 dark:bg-emerald-900/20" : "bg-slate-50 dark:bg-slate-800"}`}>
                <Cloud size={20} className={cloudConfigured ? "text-emerald-600" : "text-slate-400"} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Cloud
                </p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {cloudConfigured ? "Ativo" : "Não configurado"}
                </p>
              </div>
            </div>
            {cloudConfigured && (
              <p className="text-xs text-slate-500 font-mono">
                {data?.cloud?.remote}
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Components */}
      <Card className="border-none ring-1 ring-slate-200/60 dark:ring-white/5 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
            Componentes do Backup
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          <div className="grid grid-cols-3 gap-4">
            {[
              {
                icon: Database,
                label: "Base de Dados",
                desc: "PostgreSQL",
                color: "text-blue-600",
                bg: "bg-blue-50 dark:bg-blue-900/20",
              },
              {
                icon: FileImage,
                label: "Uploads",
                desc: "Fotos, PDFs",
                color: "text-amber-600",
                bg: "bg-amber-50 dark:bg-amber-900/20",
              },
              {
                icon: Settings,
                label: "Configs",
                desc: "ENV, Schema",
                color: "text-slate-600",
                bg: "bg-slate-50 dark:bg-slate-800",
              },
            ].map((c, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50"
              >
                <div className={`w-10 h-10 rounded-lg ${c.bg} flex items-center justify-center`}>
                  <c.icon size={18} className={c.color} />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {c.label}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium">
                    {c.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Backup List */}
      <Card className="border-none ring-1 ring-slate-200/60 dark:ring-white/5 rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">
            Backups Disponíveis
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 pt-0">
          {backups.length === 0 ? (
            <div className="text-center py-12">
              <Archive size={48} className="mx-auto text-slate-200 dark:text-slate-700 mb-3" />
              <p className="text-sm font-bold text-slate-500">
                Nenhum backup encontrado
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Clique em "Fazer Backup Agora" para criar o primeiro.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((b: any) => (
                <div
                  key={b.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                      <Archive size={14} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900 dark:text-white">
                        {b.name}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {new Date(b.date).toLocaleString("pt-PT")} — {b.size}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="text-[9px] font-bold bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-none"
                    >
                      {b.components.length} componentes
                    </Badge>
                    <ChevronRight size={14} className="text-slate-400" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Config Info */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Clock size={16} className="text-slate-400" />
          Configuração do Servidor
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs font-mono text-slate-500">
          <div>
            <span className="text-slate-400">Cron:</span> {data?.cron ?? "0 2 */2 * *"}
          </div>
          <div>
            <span className="text-slate-400">Retenção:</span> {data?.retentionCount ?? 2} backups
          </div>
          <div>
            <span className="text-slate-400">Diretório:</span> {data?.backupDir ?? "/backups"}
          </div>
          <div>
            <span className="text-slate-400">Próximo:</span> {lastBackup ? new Date(lastBackup.nextBackup).toLocaleDateString("pt-PT") : "N/A"}
          </div>
        </div>
      </div>
    </div>
  );
}
