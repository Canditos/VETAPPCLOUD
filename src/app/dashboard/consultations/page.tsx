"use client";

import { useState } from "react";
import { 
  Save, 
  Paperclip, 
  FileText, 
  Activity, 
  ClipboardCheck, 
  Lightbulb,
  Receipt,
  FlaskConical,
  Image as ImageIcon
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function ConsultationPage() {
  const [activeTab, setActiveTab] = useState("clinical");

  const handleSave = () => {
    toast.success("Consulta guardada com sucesso!");
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg ring-4 ring-blue-50">
            T
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tobias</h1>
              <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-200">Gato</Badge>
            </div>
            <p className="text-slate-500 font-medium">Europeu Comum • 4 Anos • 4.5kg • Dono: João Silva</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2 border-slate-300">
            <Receipt className="w-4 h-4" />
            Pré-Fatura
          </Button>
          <Button onClick={handleSave} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4" />
            Finalizar Consulta
          </Button>
        </div>
      </div>

      <Tabs defaultValue="clinical" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-8 bg-slate-100/50 p-1 rounded-xl">
          <TabsTrigger value="clinical" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <ClipboardCheck className="w-4 h-4 mr-2" />
            Histórico & SOAP
          </TabsTrigger>
          <TabsTrigger value="exams" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <FlaskConical className="w-4 h-4 mr-2" />
            Exames & Lab (Fuji/RX)
          </TabsTrigger>
          <TabsTrigger value="billing" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">
            <Receipt className="w-4 h-4 mr-2" />
            Plano & Faturação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="clinical" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 border-slate-200/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  Notas SOAP
                </CardTitle>
                <CardDescription>Registe os detalhes clínicos da visita atual.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="subjective" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Subjective</Label>
                    <textarea 
                      id="subjective"
                      className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      placeholder="Relato do proprietário..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="objective" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Objective</Label>
                    <textarea 
                      id="objective"
                      className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      placeholder="Sinais vitais, exame físico..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="assessment" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assessment</Label>
                    <textarea 
                      id="assessment"
                      className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      placeholder="Diagnóstico diferencial..."
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="plan" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Plan</Label>
                    <textarea 
                      id="plan"
                      className="w-full min-h-[100px] p-4 rounded-xl border border-slate-200 bg-slate-50 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all text-sm"
                      placeholder="Tratamento e acompanhamento..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="border-slate-200/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">Alertas do Paciente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-3 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3">
                    <Activity className="w-5 h-5 text-red-600 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-red-800 uppercase">Alergia Grave</p>
                      <p className="text-sm text-red-700">Reação alérgica a Penicilina (2023)</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-slate-200/60 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-sm">Parâmetros Bio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Temperatura</span>
                    <span className="font-bold text-slate-800">38.5 °C</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                    <span className="text-sm text-slate-500">Freq. Cardíaca</span>
                    <span className="font-bold text-slate-800">140 bpm</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exams" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
              <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-sm">Hemograma Fuji DX-500</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Normal</Badge>
              </div>
              <CardContent className="p-0">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-bold">
                    <tr>
                      <th className="px-4 py-2 text-left">Parâmetro</th>
                      <th className="px-4 py-2 text-right">Valor</th>
                      <th className="px-4 py-2 text-right">Ref.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="px-4 py-3 font-medium">RBC</td>
                      <td className="px-4 py-3 text-right font-bold">7.2</td>
                      <td className="px-4 py-3 text-right text-slate-400 text-xs">5.0 - 10.0</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium">WBC</td>
                      <td className="px-4 py-3 text-right font-bold">12.5</td>
                      <td className="px-4 py-3 text-right text-slate-400 text-xs">5.5 - 19.5</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-amber-600">HGB</td>
                      <td className="px-4 py-3 text-right font-bold text-amber-600">10.1</td>
                      <td className="px-4 py-3 text-right text-slate-400 text-xs">12.0 - 15.0</td>
                    </tr>
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="border-slate-200/60 shadow-sm overflow-hidden">
              <div className="bg-slate-900 p-4 flex justify-between items-center text-white">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-blue-400" />
                  <span className="font-bold text-sm">RX Tórax Lat • Examion</span>
                </div>
                <span className="text-[10px] text-slate-400">DICOM #8329</span>
              </div>
              <div className="aspect-square bg-black flex items-center justify-center relative group">
                 <div className="text-slate-600 text-xs text-center p-8 border border-slate-800 border-dashed rounded-lg">
                    [DICOM VIEWER PLACEHOLDER]<br/>
                    Carregando imagem do PACS...
                 </div>
                 <Button variant="secondary" className="absolute bottom-4 opacity-0 group-hover:opacity-100 transition-opacity gap-2">
                    <ExternalLink className="w-4 h-4" /> Abrir no Visualizador
                 </Button>
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card className="border-slate-200/60 shadow-sm">
            <CardHeader>
              <CardTitle>Linhas de Faturação</CardTitle>
              <CardDescription>Itens adicionados durante a consulta.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                      <Stethoscope className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Consulta Geral Canina/Felina</p>
                      <p className="text-xs text-slate-500">Artigo Jasmin: SERV_CONS</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">€35.00</p>
                    <p className="text-[10px] text-slate-400">IVA 23% Incluído</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white border border-slate-200 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Vacina Raiva (Merial)</p>
                      <p className="text-xs text-slate-500 text-amber-600 font-medium">Stock: -1 uni (Auto-dedução)</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">€15.00</p>
                    <p className="text-[10px] text-slate-400">IVA 23% Incluído</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                  <div>
                    <p className="text-sm text-slate-500">Subtotal</p>
                    <p className="text-sm text-slate-500">IVA (23%)</p>
                    <p className="text-2xl font-black text-slate-900 mt-1">Total</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 font-medium">€40.65</p>
                    <p className="text-sm text-slate-600 font-medium">€9.35</p>
                    <p className="text-3xl font-black text-blue-600 mt-1 tracking-tighter">€50.00</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ExternalLink(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function Stethoscope(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.8 2.3A.3.3 0 1 0 5 2a.3.3 0 0 0-.2.3Z" />
      <path d="M10 22v-2" />
      <path d="M7 16v.4a3 3 0 0 1-3 3H4" />
      <path d="M10 16h.4a3 3 0 0 0 3-3V8" />
      <path d="M17 16h.4a3 3 0 0 1 3 3H21" />
      <path d="M7 16H4" />
      <path d="M13 8c0-2.2 1.8-4 4-4s4 1.8 4 4" />
      <path d="M10 10v6" />
      <path d="M10 10c0-2.2-1.8-4-4-4s-4 1.8-4 4" />
    </svg>
  );
}

function Package(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m7.5 4.27 9 5.15" />
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
