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
  Database,
  History,
  CheckCircle2,
  AlertTriangle,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

  const { data: settings, isLoading } = useQuery({
    queryKey: ["rut240-settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings/rut240");
      if (!res.ok) throw new Error("Erro ao carregar configurações");
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

  const handleSave = () => {
    saveMutation.mutate({ rut240Ip, rut240Port, rut240User, rut240Password, rut240Enabled });
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
          patientName: "Teste"
        }),
      });
      const data = await res.json();
      setTestResult({ success: data.success, message: data.message || "SMS enviado!" });
      if (data.success) setGatewayStatus("online");
    } catch (e) {
      setTestResult({ success: false, message: "Falha na comunicação com o Gateway RUT240." });
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
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
        <Button className="rounded-2xl gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold uppercase text-[10px] tracking-widest px-6 shadow-xl shadow-blue-500/20"
          onClick={handleSave} disabled={saveMutation.isPending}>
           {saveMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} strokeWidth={3} />} Guardar Configurações
        </Button>
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
                   { id: "sms-auto", label: "SMS Automático de Consultas", desc: "Envia lembrete 24h antes da consulta agendada.", icon: Bell },
                   { id: "sms-vaccines", label: "Alertas de Vacinação", desc: "Notifica proprietários sobre vacinas próximas do vencimento.", icon: Shield },
                   { id: "sms-marketing", label: "Comunicações de Marketing", desc: "Permite envio de SMS em massa para campanhas.", icon: Send }
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
                      <Switch defaultChecked />
                   </div>
                 ))}
              </div>
           </Card>
        </div>
      </div>

      <Tabs defaultValue="gateway" className="w-full">
        <TabsList className="bg-slate-100/50 dark:bg-slate-900/50 p-1.5 rounded-2xl ring-1 ring-slate-200 dark:ring-white/5 mb-8 w-full flex">
           <TabsTrigger value="gateway" className="flex-1 rounded-xl font-bold text-[10px] uppercase tracking-widest py-4 data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 shadow-sm transition-all justify-center">Configuração Gateway</TabsTrigger>
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
                           <Lock size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-300" />
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
        
        <TabsContent value="templates">
           <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
              <Database size={48} className="mx-auto mb-4 text-slate-300" />
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest">Gestão de Templates</h4>
              <p className="text-sm text-slate-500 font-medium mt-2">Crie e edite as mensagens que os seus clientes recebem.</p>
           </div>
        </TabsContent>

        <TabsContent value="logs">
           <div className="text-center py-20 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-white/5">
              <History size={48} className="mx-auto mb-4 text-slate-300" />
              <h4 className="font-bold text-slate-900 dark:text-white uppercase tracking-widest">Logs de Comunicação</h4>
              <p className="text-sm text-slate-500 font-medium mt-2">Nenhum log disponível para o período selecionado.</p>
           </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
