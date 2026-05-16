"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Mail, 
  MessageSquare, 
  Bell, 
  Settings2, 
  ShieldCheck, 
  Zap, 
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Clock,
  Calendar,
  Syringe,
  Save,
  Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { toast } from "sonner";
import axios from "axios";

export default function AutomationsPage() {
  const queryClient = useQueryClient();
  const [previewTemplate, setPreviewTemplate] = useState<string | null>(null);

  const { data: settingsData, isLoading } = useQuery({
    queryKey: ["automationSettings"],
    queryFn: async () => {
      const res = await axios.get("/api/settings/automations");
      return res.data;
    }
  });

  const [config, setConfig] = useState({
    emailEnabled: true,
    smsEnabled: false,
    reminder24h: true,
    vaccineAlert: true,
    invoiceEmail: true
  });

  useEffect(() => {
    if (settingsData && !settingsData.error) {
      setConfig({
        emailEnabled: settingsData.emailEnabled,
        smsEnabled: settingsData.smsEnabled,
        reminder24h: settingsData.reminder24h,
        vaccineAlert: settingsData.vaccineAlert,
        invoiceEmail: settingsData.invoiceEmail
      });
    }
  }, [settingsData]);

  const mutation = useMutation({
    mutationFn: async (newConfig: typeof config) => {
      const res = await axios.put("/api/settings/automations", newConfig);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["automationSettings"] });
      toast.success("Configurações de automação guardadas com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao guardar as configurações.");
    }
  });

  const templates = {
    reminder24h: {
      title: "Lembrete de Consulta",
      subject: "Amanhã temos encontro marcado! 🐾",
      body: "Olá {{owner_name}}, lembramos que o(a) {{patient_name}} tem uma consulta amanhã às {{time}}. Até breve!"
    },
    vaccineAlert: {
      title: "Aviso de Vacinação",
      subject: "Proteção em dia para {{patient_name}}? 💉",
      body: "Olá {{owner_name}}, a vacina {{vaccine_name}} do(a) {{patient_name}} expira em 15 dias. Agende já o reforço!"
    }
  };

  const handleSave = () => {
    mutation.mutate(config);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto space-y-6 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 tracking-tight">Automações & Notificações</h1>
          <p className="text-slate-500 font-medium mt-2">Configure como a clínica comunica com os tutores de forma automática.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={mutation.isPending}
          className="rounded-2xl bg-blue-600 hover:bg-blue-700 font-bold px-8 py-6 gap-2 shadow-xl shadow-blue-200"
        >
          {mutation.isPending ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {mutation.isPending ? "A Guardar..." : "Guardar Alterações"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Connection Providers */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-slate-900 text-white overflow-hidden">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-xl font-bold flex items-center gap-2">
                <Zap className="text-blue-400" /> Canais de Envio
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 group hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-blue-400 font-bold italic">R</div>
                    <div>
                      <p className="font-bold">Resend (Email)</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Ligado</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-500/20 text-emerald-400 border-none text-[8px]">ATIVO</Badge>
                </div>

                <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 opacity-50 grayscale hover:grayscale-0 transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-white/10 flex items-center justify-center text-red-400 font-bold italic">T</div>
                    <div>
                      <p className="font-bold">Twilio (SMS)</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Desligado</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-slate-600" />
                </div>
              </div>
              
              <p className="text-[10px] text-slate-500 font-bold leading-relaxed italic">
                A integração com Resend é gratuita até 3,000 emails/mês. SMS Twilio requer carregamento de saldo.
              </p>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden">
            <CardHeader className="border-b p-8">
              <div className="flex items-center gap-3">
                <ShieldCheck size={24} className="text-blue-600" />
                <CardTitle className="text-lg font-bold">Regras de Privacidade</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8">
              <p className="text-slate-500 text-sm font-medium leading-relaxed">
                As notificações automáticas respeitam as definições de marketing do RGPD configuradas na ficha do cliente.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Automation Triggers */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl shadow-slate-200/50 rounded-2xl bg-white overflow-hidden">
            <CardHeader className="p-8 border-b border-slate-50">
              <CardTitle className="text-2xl font-bold">Regras de Notificação</CardTitle>
              <CardDescription className="font-medium">Defina quando o sistema deve enviar mensagens aos tutores.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              {/* Reminder 24h */}
              <div className="flex items-start justify-between gap-6 group">
                <div className="flex gap-6">
                  <div className="h-10 w-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Clock size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Lembrete de Consulta (24h)</h4>
                    <p className="text-slate-500 text-sm font-medium mt-1">Envia um lembrete automático por email e SMS 24 horas antes do agendamento.</p>
                    <div className="flex gap-3 mt-4">
                       <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate('reminder24h')} className="text-[10px] font-bold uppercase text-blue-600 p-0 h-auto hover:bg-transparent">Ver Template</Button>
                       <span className="text-slate-200">|</span>
                       <Badge variant="outline" className="rounded-lg text-[9px] font-bold uppercase text-slate-400">Canal: Email</Badge>
                       <Badge variant="outline" className="rounded-lg text-[9px] font-bold uppercase text-slate-400">Canal: SMS</Badge>
                    </div>
                  </div>
                </div>
                <Switch checked={config.reminder24h} onCheckedChange={(val) => setConfig({...config, reminder24h: val})} />
              </div>

              {/* Vaccine Alerts */}
              <div className="flex items-start justify-between gap-6 group">
                <div className="flex gap-6">
                  <div className="h-10 w-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Syringe size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Avisos de Vacinação</h4>
                    <p className="text-slate-500 text-sm font-medium mt-1">Notifica o tutor 15 dias antes da vacina expirar para agendar o reforço.</p>
                    <div className="flex gap-3 mt-4">
                       <Button variant="ghost" size="sm" onClick={() => setPreviewTemplate('vaccineAlert')} className="text-[10px] font-bold uppercase text-amber-600 p-0 h-auto hover:bg-transparent">Ver Template</Button>
                       <span className="text-slate-200">|</span>
                       <Badge className="bg-amber-100 text-amber-600 border-none rounded-lg text-[9px] font-bold uppercase">Alta Conversão</Badge>
                    </div>
                  </div>
                </div>
                <Switch checked={config.vaccineAlert} onCheckedChange={(val) => setConfig({...config, vaccineAlert: val})} />
              </div>

              {/* Invoice Sending */}
              <div className="flex items-start justify-between gap-6 group">
                <div className="flex gap-6">
                  <div className="h-10 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <Mail size={28} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-slate-900">Envio de Fatura PDF</h4>
                    <p className="text-slate-500 text-sm font-medium mt-1">Envia automaticamente a fatura por email assim que é finalizada a consulta.</p>
                  </div>
                </div>
                <Switch checked={config.invoiceEmail} onCheckedChange={(val) => setConfig({...config, invoiceEmail: val})} />
              </div>

              <div className="pt-8 border-t border-slate-50">
                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Logs de Envio (Hoje)</h4>
                <div className="space-y-3">
                  {[
                    { target: "marco@example.com", type: "Email", status: "SENT", msg: "Lembrete Consulta - Bolinha" },
                    { target: "ana@vet.pt", type: "Email", status: "SENT", msg: "Fatura FT 2024/045" },
                    { target: "+351 912...", type: "SMS", status: "FAILED", msg: "Aviso Vacina" }
                  ].map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        {log.type === "Email" ? <Mail size={14} className="text-slate-400" /> : <MessageSquare size={14} className="text-slate-400" />}
                        <div>
                          <p className="text-xs font-bold text-slate-900">{log.msg}</p>
                          <p className="text-[10px] font-bold text-slate-400 tracking-tight">{log.target}</p>
                        </div>
                      </div>
                      <Badge className={`rounded-lg text-[8px] font-bold uppercase ${log.status === 'SENT' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                        {log.status === 'SENT' ? 'Enviado' : 'Falhou'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={!!previewTemplate} onOpenChange={() => setPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-[600px] rounded-2xl border-none shadow-2xl p-0 overflow-hidden">
          {previewTemplate && (
            <>
              <div className="bg-slate-900 p-10 text-white relative">
                <div className="absolute top-0 right-0 p-10 opacity-10">
                   <Mail size={120} />
                </div>
                <Badge className="bg-blue-600 text-white border-none font-bold text-[10px] uppercase mb-4 px-3 py-1">Pré-visualização</Badge>
                <DialogTitle className="text-3xl font-bold tracking-tight">{templates[previewTemplate as keyof typeof templates].title}</DialogTitle>
                <DialogDescription className="text-slate-400 font-medium mt-2">Veja como o tutor receberá esta mensagem.</DialogDescription>
              </div>
              <div className="p-10 space-y-6 bg-slate-50">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Assunto do Email</Label>
                  <div className="p-4 bg-white rounded-2xl border border-slate-100 font-bold text-slate-700">
                    {templates[previewTemplate as keyof typeof templates].subject}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Corpo da Mensagem</Label>
                  <div className="p-6 bg-white rounded-3xl border border-slate-100 text-slate-600 leading-relaxed font-medium min-h-[150px]">
                    {templates[previewTemplate as keyof typeof templates].body}
                  </div>
                </div>
                <div className="flex gap-3">
                   <Button className="flex-1 rounded-2xl bg-slate-900 py-6 font-bold text-white hover:bg-slate-800">Editar Texto</Button>
                   <Button variant="outline" className="flex-1 rounded-2xl py-6 font-bold border-slate-200">Enviar Teste</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
