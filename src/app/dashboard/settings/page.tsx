"use client";

import { 
  Building2, 
  CreditCard, 
  Bell, 
  Shield, 
  Save,
  Globe,
  Database,
  Link2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Definições</h1>
        <p className="text-slate-500 font-medium">Configure a identidade e integrações da sua clínica.</p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="general" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Building2 size={16} /> Geral
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <CreditCard size={16} /> Faturação (Jasmin)
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
                  <Input defaultValue="Clínica Veterinária Gato Escondido" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">NIF / VAT Number</Label>
                  <Input defaultValue="500123456" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Email Geral</Label>
                  <Input defaultValue="geral@gatoescondido.pt" className="rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Website</Label>
                  <Input defaultValue="www.gatoescondido.pt" className="rounded-xl" />
                </div>
              </div>
              <div className="pt-4 flex justify-end">
                <Button className="rounded-xl gap-2 bg-blue-600">
                  <Save size={16} /> Guardar Alterações
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing">
          <Card className="border-none shadow-sm border-l-4 border-l-amber-500">
            <CardHeader>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                    <Link2 size={24} />
                 </div>
                 <div>
                    <CardTitle className="text-lg font-bold">Ligação ao Jasmin ERP</CardTitle>
                    <CardDescription>Configure as chaves de API para emissão de faturas legais.</CardDescription>
                 </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Client ID</Label>
                  <Input type="password" placeholder="••••••••••••••••" className="rounded-xl font-mono" />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-500 uppercase">Client Secret</Label>
                  <Input type="password" placeholder="••••••••••••••••" className="rounded-xl font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Tenant Key</Label>
                    <Input placeholder="Ex: 23456" className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-slate-500 uppercase">Organization Key</Label>
                    <Input placeholder="Ex: 23456-0001" className="rounded-xl" />
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                 <div>
                    <p className="text-sm font-bold text-slate-900">Sincronização Automática</p>
                    <p className="text-xs text-slate-500 font-medium">Enviar faturas para o Jasmin assim que a consulta termina.</p>
                 </div>
                 <Switch />
              </div>
              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" className="rounded-xl border-slate-200">Testar Ligação</Button>
                <Button className="rounded-xl gap-2 bg-blue-600">
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
