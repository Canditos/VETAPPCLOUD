import { 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  Clock,
  ArrowRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function DashboardPage() {
  const stats = [
    { name: "Consultas Hoje", value: "12", icon: Calendar, color: "text-blue-600", bg: "bg-blue-100", trend: "+2 em relação a ontem" },
    { name: "Novos Pacientes", value: "48", icon: Users, color: "text-green-600", bg: "bg-green-100", trend: "+15% este mês" },
    { name: "Faturação (Mês)", value: "€4,250", icon: TrendingUp, color: "text-sky-600", bg: "bg-sky-100", trend: "Meta: €5,000" },
    { name: "Alertas de Stock", value: "3", icon: AlertCircle, color: "text-amber-600", bg: "bg-amber-100", trend: "Urgente" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Dashboard Clínica</h1>
          <p className="text-slate-500 font-medium">Bem-vindo de volta, Dr. Marco.</p>
        </div>
        <div className="flex gap-2">
           <Button variant="outline" className="rounded-xl border-slate-200">Exportar Relatórios</Button>
           <Button className="rounded-xl bg-blue-600 hover:bg-blue-700">Nova Consulta</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="border-none shadow-sm hover:shadow-md transition-all group overflow-hidden">
            <CardContent className="p-6">
              <div className="flex justify-between items-start">
                <div className={`p-3 rounded-2xl ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <stat.icon size={24} />
                </div>
                <Badge variant="outline" className="text-[10px] font-bold border-slate-100 text-slate-400">{stat.trend}</Badge>
              </div>
              <div className="mt-4">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.name}</p>
                <p className="text-3xl font-black text-slate-900 mt-1">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Próximas Consultas */}
        <Card className="lg:col-span-2 border-none shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7">
            <div>
              <CardTitle className="text-lg font-bold">Próximas Consultas</CardTitle>
              <CardDescription>Gerir agenda para o período da tarde.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-blue-600 font-bold hover:text-blue-700 hover:bg-blue-50">
              Ver Agenda Completa
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Paciente</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Hora</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Motivo</TableHead>
                  <TableHead className="text-slate-400 font-bold text-xs uppercase tracking-wider">Estado</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "Tobias", type: "Gato", time: "14:30", reason: "Check-up Vacinação", status: "Confirmado" },
                  { name: "Rex", type: "Cão", time: "15:15", reason: "Limp. Ouvidos", status: "Em Espera" },
                  { name: "Luna", type: "Gato", time: "16:00", reason: "Cirurgia (Castr.)", status: "Preparação" },
                ].map((item) => (
                  <TableRow key={item.name} className="border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer group">
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center font-bold text-slate-500">
                          {item.name[0]}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{item.name}</p>
                          <p className="text-[10px] text-slate-500 font-medium uppercase tracking-tighter">{item.type}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-bold text-slate-700">{item.time}</TableCell>
                    <TableCell className="text-slate-500 text-sm font-medium">{item.reason}</TableCell>
                    <TableCell>
                      <Badge variant={item.status === "Confirmado" ? "secondary" : "outline"} className={item.status === "Confirmado" ? "bg-green-100 text-green-700 border-none" : "bg-blue-100 text-blue-700 border-none"}>
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                       <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          Iniciar <ArrowRight className="ml-2 w-3 h-3" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Atividade & Integrações */}
        <Card className="border-none shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Atividade Recente</CardTitle>
            <CardDescription>Logs de sistema e integrações.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1">
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-blue-600 ring-4 ring-blue-50"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold text-slate-800">Resultado Lab Fuji: Rex</p>
                  <p className="text-xs text-slate-500">Análise concluída e anexada à ficha clínica.</p>
                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock size={10} /> 12 MIN ATRÁS
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 w-2 h-2 rounded-full bg-green-500 ring-4 ring-green-50"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold text-slate-800">Fatura #FA/041 Sincronizada</p>
                  <p className="text-xs text-slate-500">Documento emitido legalmente via Jasmin ERP.</p>
                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock size={10} /> 45 MIN ATRÁS
                  </p>
                </div>
              </div>
              <div className="flex gap-4 opacity-50">
                <div className="mt-1 w-2 h-2 rounded-full bg-slate-300 ring-4 ring-slate-50"></div>
                <div className="flex-1 space-y-1">
                  <p className="text-sm font-bold text-slate-800">Cópia de Segurança Completa</p>
                  <p className="text-xs text-slate-500">Cloud Backup realizado com sucesso.</p>
                  <p className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                    <Clock size={10} /> 2 HORAS ATRÁS
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
          <div className="p-6 pt-0 mt-auto">
            <div className="p-4 bg-slate-900 rounded-2xl text-white">
               <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold opacity-70">Sincronização Jasmin</span>
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
               </div>
               <p className="text-xs font-medium">Todos os serviços operacionais.</p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
