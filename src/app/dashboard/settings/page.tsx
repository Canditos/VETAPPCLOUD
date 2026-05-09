"use client";

import { 
  Building2, 
  CreditCard, 
  Bell, 
  Shield, 
  Save,
  Globe,
  Database,
  Link2,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clinic, setClinic] = useState({
    name: "",
    vatNumber: "",
    email: "",
    address: "",
    phone: "",
    vendusApiKey: ""
  });

  useEffect(() => {
    fetchClinic();
  }, []);

  const fetchClinic = async () => {
    try {
      const response = await fetch("/api/clinic");
      if (response.ok) {
        const data = await response.json();
        setClinic({
          name: data.name || "",
          vatNumber: data.vatNumber || "",
          email: data.email || "",
          address: data.address || "",
          phone: data.phone || "",
          vendusApiKey: data.vendusApiKey || ""
        });
      }
    } catch (error) {
      toast.error("Erro ao carregar dados da clínica");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/clinic", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clinic)
      });
      if (response.ok) {
        toast.success("Configurações guardadas com sucesso!");
      } else {
        throw new Error();
      }
    } catch (error) {
      toast.error("Erro ao guardar configurações");
    } finally {
      setSaving(false);
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
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Definições</h1>
          <p className="text-slate-500 font-medium">Configure a identidade e integrações da sua clínica.</p>
        </div>
        <Button 
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl gap-2 bg-blue-600 h-12 px-6 font-black shadow-lg shadow-blue-100"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Guardar Tudo
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Building2 size={16} /> Geral
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard size={16} /> Faturação (Vendus)
          </TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Database size={16} /> Laboratório & RX
          </TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Shield size={16} /> Segurança
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold">Informação da Clínica</CardTitle>
              <CardDescription>Estes dados serão usados nos cabeçalhos das faturas e relatórios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Nome da Clínica</Label>
                  <Input 
                    value={clinic.name} 
                    onChange={(e) => setClinic({ ...clinic, name: e.target.value })}
                    className="rounded-xl" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">NIF / VAT Number</Label>
                  <Input 
                    value={clinic.vatNumber}
                    onChange={(e) => setClinic({ ...clinic, vatNumber: e.target.value })}
                    className="rounded-xl" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Email Geral</Label>
                  <Input 
                    value={clinic.email}
                    onChange={(e) => setClinic({ ...clinic, email: e.target.value })}
                    className="rounded-xl" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Telefone</Label>
                  <Input 
                    value={clinic.phone}
                    onChange={(e) => setClinic({ ...clinic, phone: e.target.value })}
                    className="rounded-xl" 
                  />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Morada</Label>
                  <Input 
                    value={clinic.address}
                    onChange={(e) => setClinic({ ...clinic, address: e.target.value })}
                    className="rounded-xl" 
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="border-none shadow-sm border-l-4 border-l-blue-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600">
                    <Link2 size={24} />
                 </div>
                 <div>
                    <CardTitle className="text-lg font-bold">Ligação ao Vendus ERP</CardTitle>
                    <CardDescription>Configure a sua API Key para emissão de faturas legais.</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Vendus API Key</Label>
                  <Input 
                    type="password" 
                    value={clinic.vendusApiKey}
                    onChange={(e) => setClinic({ ...clinic, vendusApiKey: e.target.value })}
                    placeholder="Introduza a sua API Key do Vendus" 
                    className="rounded-xl font-mono" 
                  />
                  <p className="text-[10px] text-slate-400 font-medium">Pode encontrar a sua chave em Definições > API no painel do Vendus.</p>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                 <div>
                    <p className="text-sm font-bold text-slate-900">Sincronização Automática</p>
                    <p className="text-xs text-slate-500 font-medium">Enviar faturas para o Vendus assim que a consulta termina.</p>
                 </div>
                 <Switch defaultChecked />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => toast.info("A testar comunicação com Vendus...")}
                  className="h-12 rounded-xl border-slate-200 dark:border-white/10 dark:text-white font-bold px-6"
                >
                  Testar Ligação
                </Button>
                <Button 
                  onClick={handleSave}
                  className="h-12 rounded-xl gap-2 bg-blue-600 font-black px-6 shadow-lg shadow-blue-100"
                >
                  <Save size={16} /> Ativar Integração
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

