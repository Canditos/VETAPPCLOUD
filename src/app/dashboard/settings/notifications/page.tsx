"use client";

import { useState, useEffect } from "react";
import { 
  Bell, 
  Smartphone, 
  Mail, 
  Shield, 
  Save, 
  RefreshCw, 
  Send,
  Wifi,
  WifiOff,
  Settings2,
  Lock,
  History,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Plus,
  Pencil,
  Trash2,
  MessageSquare,
  BarChart3,
  Sparkles,
  Bot
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<"online" | "offline">("offline");

  const [rut240Ip, setRut240Ip] = useState("");
  const [rut240Port, setRut240Port] = useState(80);
  const [rut240User, setRut240User] = useState("");
  const [rut240Password, setRut240Password] = useState("");
  const [rut240Enabled, setRut240Enabled] = useState(false);
  const [testPhone, setTestPhone] = useState("+351 912 345 678");

  const [reminder24h, setReminder24h] = useState(true);
  const [vaccineAlert, setVaccineAlert] = useState(true);
  const [smsMarketing, setSmsMarketing] = useState(false);
  const [isSavingAutomation, setIsSavingAutomation] = useState(false);

  const [aiApiKey, setAiApiKey] = useState("");
  const [aiBaseUrl, setAiBaseUrl] = useState("https://opencode.ai/zen/go/v1");
  const [aiModel, setAiModel] = useState("deepseek-v4-flash");
  const [aiVisionModel, setAiVisionModel] = useState("qwen3.7-max");

  const { data: settings, isLoading } = useQuery({
    queryKey: ["rut240-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/rut240");
      if (!res.ok) throw new Error("Erro ao carregar configurações");
      return res.json();
    }
  });

  const { data: automations, isLoading: loadingAuto } = useQuery({
    queryKey: ["automationSettings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/automations");
      if (!res.ok) throw new Error("Erro ao carregar automações");
      return res.json();
    }
  });

  const { data: aiSettings, isLoading: loadingAi } = useQuery({
    queryKey: ["ai-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/ai");
      if (!res.ok) throw new Error("Erro ao carregar IA");
      return res.json();
    }
  });

  useEffect(() => {
    if (settings) {
      setRut240Ip(settings.rut240Ip || "");
      setRut240Port(settings.rut240Port || 80);
      setRut240User(settings.rut240User || "");
      setRut240Password(settings.rut240Password || "");
      setRut240Enabled(settings.rut240Enabled || false);
      if (settings.rut240Ip) setGatewayStatus("online");
    }
  }, [settings]);

  useEffect(() => {
    if (automations) {
      setReminder24h(automations.reminder24h ?? true);
      setVaccineAlert(automations.vaccineAlert ?? true);
      setSmsMarketing(automations.smsMarketing ?? false);
    }
  }, [automations]);

  useEffect(() => {
    if (aiSettings && !aiSettings.error) {
      setAiApiKey(aiSettings.aiApiKey || "");
      setAiBaseUrl(aiSettings.aiBaseUrl || "https://opencode.ai/zen/go/v1");
      setAiModel(aiSettings.aiModel || "deepseek-v4-flash");
      setAiVisionModel(aiSettings.aiVisionModel || "qwen3.7-max");
    }
  }, [aiSettings]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/settings/rut240", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao guardar");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["rut240-settings"] });
      toast.success("Configurações guardadas!");
    },
    onError: () => toast.error("Erro ao guardar configurações"),
  });

  const saveAiMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/settings/ai", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Erro ao guardar IA");
      return res.json();
    },
    onSuccess: () => toast.success("Configuração de IA guardada!"),
  });

  const handleSave = () => {
    saveMutation.mutate({ rut240Ip, rut240Port, rut240User, rut240Password, rut240Enabled });
    saveAiMutation.mutate({ aiApiKey, aiBaseUrl, aiModel, aiVisionModel });
  };

  const saveAutomationSwitches = async () => {
    setIsSavingAutomation(true);
    try {
      const res = await fetch("/api/settings/automations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reminder24h, vaccineAlert, smsMarketing }),
      });
      if (!res.ok) throw new Error("Erro ao guardar");
      queryClient.invalidateQueries({ queryKey: ["automationSettings"] });
      toast.success("Preferências de notificação guardadas!");
    } catch {
      toast.error("Erro ao guardar preferências");
    } finally {
      setIsSavingAutomation(false);
    }
  };

  const handleTestSMS = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/notifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "SMS",
          ownerPhone: testPhone.replace(/\s+/g, ''),
          message: "Teste de conectividade RUT240 - VetConnect",
          patientName: "Teste",
          isTest: true
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setTestResult({ 
          success: false, 
          message: data.error || data.message || "Falha na comunicação com o Gateway RUT240." 
        });
        setGatewayStatus("offline");
      } else {
        setTestResult({ success: true, message: data.message || "SMS enviado!" });
        setGatewayStatus("online");
      }
    } catch (e) {
      setTestResult({ success: false, message: "Falha na comunicação com o Gateway RUT240." });
      setGatewayStatus("offline");
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading || loadingAuto || loadingAi) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 size={32} className="animate-spin text-slate-400" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-[1400px] mx-auto pb-20">
      
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">Notificações & Gateway</h1>
          <p className="text-slate-500 dark:text-slate-400 font-bold mt-2">Configure o motor de comunicação e integração SMS.</p>
        </div>
        <div className="flex items-center gap-3">
          <a href="/dashboard/sms" className="text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
            <BarChart3 size={14} /> Dashboard SMS
          </a>
          <Button className="rounded-2xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest px-6 shadow-xl shadow-blue-500/20"
            onClick={handleSave} disabled={saveMutation.isPending}>
             {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={3} />} Guardar Configurações
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Connection Status Card */}
        <Card className="border-none shadow-xl rounded-2xl bg-slate-900 text-white overflow-hidden relative flex flex-col">
           <div className="absolute -top-4 -right-4 opacity-10">
              <Wifi size={120} />
           </div>
           <CardHeader className="border-b border-white/10 relative z-10 p-8 pb-6">
              <Badge className={cn(
                "border-none font-bold text-[9px] uppercase tracking-widest px-3 py-1 mb-2",
                gatewayStatus === "online" ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              )}>
                {gatewayStatus === "online" ? "Gateway Online" : "Gateway Offline"}
              </Badge>
              <CardTitle className="text-2xl font-bold tracking-tighter">Teltonika RUT240</CardTitle>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">IP: {rut240Ip || "Não configurado"} {rut240Port !== 80 && `:${rut240Port}`}</p>
           </CardHeader>
           <CardContent className="relative z-10 p-8 pt-6 flex-1 flex flex-col justify-between min-h-[140px]">
              <div className="space-y-4">
                 <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    <span>Gateway RUT240</span>
                    {rut240Enabled ? (
                      <span className="text-emerald-400">Ativo</span>
                    ) : (
                      <span className="text-slate-500">Desativado</span>
                    )}
                 </div>
              </div>
           </CardContent>
        </Card>

        {/* Global Switches */}
        <div className="md:col-span-2 space-y-4">
           <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 p-8 ring-1 ring-slate-100 dark:ring-white/5">
              <div className="space-y-6">
                 {[
                   { id: "sms-auto", label: "SMS Automático de Consultas", desc: "Envia lembrete 24h antes da consulta agendada.", icon: Bell, value: reminder24h, setter: setReminder24h },
                   { id: "sms-vaccines", label: "Alertas de Vacinação", desc: "Notifica proprietários sobre vacinas próximas do vencimento.", icon: Shield, value: vaccineAlert, setter: setVaccineAlert },
                   { id: "sms-marketing", label: "Comunicações de Marketing", desc: "Permite envio de SMS em massa para campanhas.", icon: Send, value: smsMarketing, setter: setSmsMarketing }
                 ].map((item) => (
                   <div key={item.id} className="flex items-center justify-between group">
                      <div className="flex items-center gap-4">
                         <div className="p-3 bg-slate-50 dark:bg-white/5 rounded-2xl text-slate-400 group-hover:text-blue-600 transition-colors">
                            <item.icon size={20} />
                         </div>
                         <div>
                            <p className="font-bold text-slate-900 dark:text-white uppercase text-[11px] tracking-tight">{item.label}</p>
                            <p className="text-xs text-slate-500 font-medium">{item.desc}</p>
                         </div>
                      </div>
                      <Switch checked={item.value} onCheckedChange={(val) => item.setter(val)} />
                   </div>
                 ))}
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                <Button size="sm" className="rounded-xl gap-1 text-xs font-bold" onClick={saveAutomationSwitches} disabled={isSavingAutomation}>
                  {isSavingAutomation ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                  Guardar Preferências
                </Button>
              </div>
           </Card>
        </div>
      </div>

      <Tabs defaultValue="gateway" className="w-full">
        <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl ring-1 ring-slate-200 dark:ring-white/5 mb-8 w-full flex">
           <TabsTrigger value="gateway" className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-widest py-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-sm transition-all justify-center">Configuração Gateway</TabsTrigger>
           <TabsTrigger value="ai" className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-widest py-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-sm transition-all justify-center">Assistente IA</TabsTrigger>
           <TabsTrigger value="templates" className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-widest py-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-sm transition-all justify-center">Templates de Mensagem</TabsTrigger>
           <TabsTrigger value="logs" className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-widest py-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-sm transition-all justify-center">Histórico de Envios</TabsTrigger>
        </TabsList>

        <TabsContent value="gateway" className="space-y-6 animate-in fade-in duration-500">
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
               <Card className="border-none shadow-xl rounded-2xl bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-slate-100 dark:ring-white/5">
                  <CardHeader className="border-b p-10 pb-8">
                    <CardTitle className="text-xl font-bold text-slate-900 dark:text-white tracking-tighter flex items-center gap-2">
                       <Settings2 size={20} className="text-blue-600" /> Parâmetros Técnicos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-10 pt-8 space-y-6">
                     <div className="flex items-center gap-4 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
                       <Switch checked={rut240Enabled} onCheckedChange={setRut240Enabled} />
                       <div>
                         <p className="font-bold text-sm text-slate-900 dark:text-white">Gateway Ativo</p>
                         <p className="text-[10px] text-slate-400 font-medium">Ligar/desligar envio de SMS via RUT240</p>
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Endereço IP Gateway</Label>
                           <Input value={rut240Ip} onChange={(e) => setRut240Ip(e.target.value)} placeholder="192.168.1.1" className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none font-bold" />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Porta (HTTP/S)</Label>
                           <Input type="number" value={rut240Port} onChange={(e) => setRut240Port(parseInt(e.target.value) || 80)} className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none font-bold" />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Utilizador API</Label>
                        <Input value={rut240User} onChange={(e) => setRut240User(e.target.value)} placeholder="admin" className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none font-bold" />
                     </div>
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Palavra-passe API</Label>
                        <div className="relative">
                           <Input type="password" value={rut240Password} onChange={(e) => setRut240Password(e.target.value)} placeholder="admin01" className="h-12 rounded-xl bg-slate-50 dark:bg-white/5 border-none font-bold pr-10" />
                          </div>
                       </div>
                    </CardContent>
                 </Card>

               <Card className="border-none shadow-2xl rounded-2xl bg-blue-600 text-white p-0 flex flex-col justify-between overflow-hidden">
                  <CardHeader className="border-b border-white/10 p-10 pb-6">
                     <CardTitle className="text-xl font-bold tracking-tighter">Teste de Diagnóstico</CardTitle>
                     <CardDescription className="text-blue-100 text-xs font-medium mt-1">Valide a conectividade com o hardware RUT240.</CardDescription>
                  </CardHeader>
                  <CardContent className="p-10 pt-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-4">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-blue-200">Telemóvel para Teste</Label>
                         <Input value={testPhone} onChange={(e) => setTestPhone(e.target.value)} className="h-10 rounded-xl bg-white/10 border-none text-white placeholder:text-blue-300 font-bold" />
                     </div>
                     <Button 
                       className="w-full h-10 rounded-2xl bg-white text-blue-600 hover:bg-blue-50 font-bold uppercase tracking-widest gap-2 shadow-lg"
                       onClick={handleTestSMS}
                       disabled={isTesting}
                     >
                       {isTesting ? <RefreshCw className="animate-spin" size={18} /> : <Send size={18} />}
                       {isTesting ? "A enviar..." : "Enviar SMS de Teste"}
                    </Button>
                    
                    {testResult && (
                      <div className={cn(
                        "p-4 rounded-2xl flex items-start gap-3 animate-in zoom-in-95 duration-300",
                        testResult.success ? "bg-emerald-500/20 border border-emerald-400/30" : "bg-rose-500/20 border border-rose-400/30"
                      )}>
                        {testResult.success ? <CheckCircle2 size={18} className="text-emerald-400 shrink-0" /> : <AlertTriangle size={18} className="text-rose-400 shrink-0" />}
                        <p className="text-xs font-bold leading-relaxed">{testResult.message}</p>
                      </div>
                    )}
                  </div>
                  </CardContent>
               </Card>
            </div>
         </TabsContent>

         <TabsContent value="ai" className="space-y-6 animate-in fade-in duration-500">
           <div className="max-w-3xl">
             <Card className="border-none shadow-xl rounded-2xl bg-slate-900 text-white overflow-hidden relative flex flex-col">
               <div className="absolute -top-4 -right-4 opacity-10">
                  <Bot size={120} />
               </div>
               <CardHeader className="border-b border-white/10 relative z-10 p-8 pb-6">
                  <CardTitle className="text-2xl font-bold tracking-tighter flex items-center gap-2">
                     <Sparkles size={24} className="text-blue-400" /> Assistente IA (Opencode / OpenAI)
                  </CardTitle>
               </CardHeader>
               <CardContent className="relative z-10 p-8 pt-6 space-y-6">
                  <div className="space-y-2">
                     <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Base URL da API</Label>
                     <Input value={aiBaseUrl} onChange={(e) => setAiBaseUrl(e.target.value)} placeholder="https://opencode.ai/zen/go/v1" className="h-12 rounded-xl bg-slate-50/10 border-none font-bold text-white" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Chave de API</Label>
                        <Input type="password" value={aiApiKey} onChange={(e) => setAiApiKey(e.target.value)} placeholder="sk-..." className="h-12 rounded-xl bg-slate-50/10 border-none font-bold text-white" />
                     </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Modelo Chat (Texto)</Label>
                          <Input value={aiModel} onChange={(e) => setAiModel(e.target.value)} placeholder="deepseek-v4-flash" className="h-12 rounded-xl bg-slate-50/10 border-none font-bold text-white" />
                       </div>
                       <div className="space-y-2">
                          <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Modelo de Visão (Raios-X)</Label>
                          <Input value={aiVisionModel} onChange={(e) => setAiVisionModel(e.target.value)} placeholder="qwen3.7-max" className="h-12 rounded-xl bg-slate-50/10 border-none font-bold text-white" />
                       </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/10 flex justify-end">
                    <Button className="rounded-xl gap-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-6 h-10 shadow-lg shadow-blue-500/20" onClick={() => saveAiMutation.mutate({ aiApiKey, aiBaseUrl, aiModel, aiVisionModel })} disabled={saveAiMutation.isPending}>
                      {saveAiMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      Guardar Definições de IA
                    </Button>
                  </div>
               </CardContent>
             </Card>
           </div>
         </TabsContent>
        
         <TabsContent value="templates">
            <TemplateManager />
         </TabsContent>

        <TabsContent value="logs">
          <SmsLogView />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function TemplateManager() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [name, setName] = useState("");
  const [key, setKey] = useState("");
  const [message, setMessage] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/settings/templates");
      if (r.ok) setTemplates(await r.json());
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const openNew = () => {
    setEditing(null); setName(""); setKey(""); setMessage(""); setAiPrompt("");
    setDialogOpen(true);
  };

  const openEdit = (t: any) => {
    setEditing(t); setName(t.name); setKey(t.key); setMessage(t.message);
    setDialogOpen(true);
  };

  const save = async () => {
    if (!name || !message) { toast.error("Nome e mensagem são obrigatórios"); return; }
    try {
      const r = await fetch("/api/settings/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editing?.id, key, name, message }),
      });
      if (!r.ok) throw new Error();
      toast.success(editing ? "Template atualizado!" : "Template criado!");
      setDialogOpen(false);
      fetchTemplates();
    } catch { toast.error("Erro ao guardar template"); }
  };

  const remove = async (id: string) => {
    try {
      const r = await fetch(`/api/settings/templates?id=${id}`, { method: "DELETE" });
      if (!r.ok) throw new Error();
      toast.success("Template removido");
      fetchTemplates();
    } catch { toast.error("Erro ao remover"); }
  };

  const generateAi = async () => {
    if (!aiPrompt) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/settings/templates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar.");
      setMessage(data.result);
      setAiPrompt("");
      toast.success("Mensagem gerada com sucesso!");
    } catch(e:any) {
      toast.error(e.message);
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400 text-sm"><Loader2 size={24} className="mx-auto animate-spin mb-2" />A carregar...</div>;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{templates.length} templates</p>
        <Button onClick={openNew} className="rounded-xl gap-2 h-9 text-xs font-bold bg-blue-600 hover:bg-blue-700">
          <Plus size={14} /> Novo Template
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
          <MessageSquare size={48} className="mx-auto mb-4 text-slate-300" />
          <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest">Nenhum template</h4>
          <p className="text-sm text-slate-500 font-medium mt-2">Crie templates para usar nos envios automáticos.</p>
          <Button onClick={openNew} variant="outline" className="mt-4 rounded-xl gap-2">
            <Plus size={14} /> Criar primeiro template
          </Button>
        </div>
      ) : (
        <div className="grid gap-3">
          {templates.map((t: any) => (
            <div key={t.id} className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 text-[9px] font-bold uppercase border-none">{t.key || "geral"}</Badge>
                  <p className="font-bold text-slate-900 dark:text-white text-sm truncate">{t.name}</p>
                </div>
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2 whitespace-pre-wrap">{t.message}</p>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl" onClick={() => openEdit(t)}><Pencil size={14} /></Button>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50" onClick={() => remove(t.id)}><Trash2 size={14} /></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">{editing ? "Editar" : "Novo"} Template</DialogTitle>
            <DialogDescription>Define a mensagem padrão para envios automáticos.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Identificador técnico (key)</Label>
              <Input value={key} onChange={e => setKey(e.target.value)} placeholder="ex: reminder-24h, vaccine-alert, marketing" className="h-10 rounded-xl bg-slate-50 border-none font-mono text-xs" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Nome do Template</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder="ex: Lembrete 24h" className="h-10 rounded-xl bg-slate-50 border-none font-bold" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Mensagem</Label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                placeholder="Olá {{nome}}, lembre-se da sua consulta em {{data}}."
                className="w-full min-h-[120px] rounded-xl bg-slate-50 border-0 p-4 text-sm font-medium resize-y focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
              <p className="text-[9px] text-slate-400 font-medium">Use {"{{nome}}"}, {"{{data}}"}, {"{{hora}}"}, {"{{animal}}"} como variáveis</p>
            </div>
            
            <div className="space-y-1.5 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-900/50">
               <Label className="text-[10px] font-bold uppercase tracking-widest text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                 <Sparkles size={12} /> Ajuda da Inteligência Artificial
               </Label>
               <div className="flex gap-2">
                 <Input 
                   value={aiPrompt} 
                   onChange={e => setAiPrompt(e.target.value)} 
                   placeholder="Ex: Avisar vacina da raiva amanhã com 10% desconto" 
                   className="h-10 rounded-xl bg-white dark:bg-slate-900 border-none font-medium text-xs flex-1" 
                   onKeyDown={(e) => { if (e.key === 'Enter') generateAi(); }}
                 />
                 <Button onClick={generateAi} disabled={!aiPrompt || isGenerating} className="h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 gap-2">
                   {isGenerating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />} Gerar
                 </Button>
               </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <DialogClose asChild><Button variant="outline" className="rounded-xl">Cancelar</Button></DialogClose>
            <Button onClick={save} className="rounded-xl bg-blue-600 hover:bg-blue-700">{editing ? "Atualizar" : "Criar"} Template</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SmsLogView() {
  const { data: logs, isLoading } = useQuery({
    queryKey: ["sms-logs"],
    queryFn: async () => {
      const res = await fetch("/api/sms-logs");
      if (!res.ok) return [];
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={24} className="animate-spin text-slate-400" />
      </div>
    );
  }

  if (!logs || logs.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
        <History size={48} className="mx-auto mb-4 text-slate-300" />
        <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest">Logs de Comunicação</h4>
        <p className="text-sm text-slate-500 font-medium mt-2">Nenhum envio de SMS registado.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {logs.map((log: any) => (
        <div key={log.id} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-white/5 shadow-sm">
          <div className="flex items-start gap-4">
            <div className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center",
              log.status === "SENT" ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {log.status === "SENT" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">{log.message}</p>
              <div className="flex gap-3 mt-1.5">
                <span className="text-[10px] font-bold text-slate-400">{log.phone}</span>
                <span className="text-[10px] font-bold text-slate-300">•</span>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{log.type}</span>
                {log.sentAt && (
                  <>
                    <span className="text-[10px] font-bold text-slate-300">•</span>
                    <span className="text-[10px] font-bold text-slate-400">{new Date(log.sentAt).toLocaleString("pt-PT")}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <Badge className={cn(
            "text-[9px] font-bold uppercase border-none",
            log.status === "SENT" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"
          )}>
            {log.status === "SENT" ? "Enviado" : "Falhou"}
          </Badge>
        </div>
      ))}
    </div>
  );
}
