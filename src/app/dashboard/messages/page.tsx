"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Mail, 
  Search, 
  Clock, 
  User, 
  Filter, 
  MoreVertical, 
  ChevronRight, 
  MessageSquare, 
  CheckCircle2, 
  Reply,
  Calendar,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { MessagesDrawer } from "@/components/MessagesDrawer";

export default function MessageCenter() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedMsg, setSelectedMsg] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Buscar todas as mensagens recebidas via portal
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["all-portal-messages"],
    queryFn: async () => {
      const res = await fetch("/api/portal/messages?all=true");
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  const filteredMessages = messages.filter((m: any) => {
    const matchesSearch = m.content.toLowerCase().includes(search.toLowerCase()) || 
                         m.owner?.name?.toLowerCase().includes(search.toLowerCase());
    if (filter === "unread") return matchesSearch && m.senderType === "TUTOR"; // Exemplo simplificado
    return matchesSearch;
  });

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter flex items-center gap-4">
            Centro de Mensagens <Mail size={32} className="text-blue-600" />
          </h1>
          <p className="text-slate-500 font-medium tracking-tight mt-2 text-lg">
            Monitorização e tracking de comunicações via Portal do Tutor.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="relative w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Pesquisar mensagens..." 
              className="pl-12 h-10 rounded-2xl bg-white dark:bg-slate-900 border-slate-200 dark:border-white/10 font-bold text-sm tracking-tight"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="lg" className="rounded-2xl h-10 px-6 font-bold text-[11px] uppercase tracking-widest gap-2">
            <Filter size={16} /> Filtros
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Messages List */}
        <Card className="border-none rounded-2xl bg-white dark:bg-slate-900/50 shadow-sm ring-1 ring-slate-200 dark:ring-white/5 overflow-hidden">
          <CardHeader className="border-b px-8 py-6 bg-slate-50/50 dark:bg-white/5">
            <div className="grid grid-cols-12">
               <div className="col-span-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Remetente</div>
               <div className="col-span-5 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mensagem / Assunto</div>
               <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Data & Hora</div>
               <div className="col-span-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Status</div>
            </div>
          </CardHeader>
          <CardContent className="p-0">

            {isLoading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse">A carregar inbox...</div>
            ) : filteredMessages.length === 0 ? (
              <div className="p-24 text-center">
                 <div className="w-16 h-16 bg-slate-100 dark:bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-300">
                    <MessageSquare size={32} />
                 </div>
                 <h3 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">Sem mensagens</h3>
                 <p className="text-sm text-slate-500 font-medium">Não foram encontradas comunicações para os critérios selecionados.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-white/5">
                {filteredMessages.map((msg: any) => (
                  <div 
                    key={msg.id} 
                    className="grid grid-cols-12 px-8 py-8 items-center hover:bg-blue-50/30 dark:hover:bg-blue-600/5 transition-all cursor-pointer group"
                    onClick={() => {
                      setSelectedMsg({ ...msg, ownerId: msg.ownerId });
                      setIsDrawerOpen(true);
                    }}
                  >
                    {/* Remetente */}
                    <div className="col-span-3 flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-500/10 text-blue-600 flex items-center justify-center font-bold shadow-sm group-hover:scale-110 transition-transform">
                          {msg.owner?.name?.charAt(0) || "U"}
                       </div>
                       <div className="min-w-0">
                          <p className="font-bold text-slate-900 dark:text-white text-base tracking-tight truncate">{msg.owner?.name || "Tutor"}</p>
                          <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Cliente Portal</p>
                       </div>
                    </div>

                    {/* Mensagem */}
                    <div className="col-span-5 pr-8">
                       <p className="text-sm font-bold text-slate-800 dark:text-slate-200 line-clamp-1 mb-1 tracking-tight">
                         {msg.content}
                       </p>
                       <div className="flex items-center gap-2">
                          <Badge className="bg-slate-100 dark:bg-white/5 text-slate-500 border-none font-bold text-[9px] uppercase tracking-widest">
                            ID: {msg.id.slice(-6)}
                          </Badge>
                          {msg.requestId && (
                            <Badge className="bg-blue-500/10 text-blue-500 border-none font-bold text-[9px] uppercase tracking-widest">
                              Ref: Agendamento
                            </Badge>
                          )}
                       </div>
                    </div>

                    {/* Data/Hora */}
                    <div className="col-span-2">
                       <div className="flex items-center gap-2 mb-1">
                          <Calendar size={12} className="text-slate-400" />
                          <p className="text-sm font-bold text-slate-700 dark:text-slate-300 tracking-tighter">
                            {format(new Date(msg.createdAt), "dd MMM yyyy", { locale: pt })}
                          </p>
                       </div>
                       <div className="flex items-center gap-2">
                          <Clock size={12} className="text-slate-400" />
                          <p className="text-xs font-bold text-slate-500 tracking-widest">
                            {format(new Date(msg.createdAt), "HH:mm")}
                          </p>
                       </div>
                    </div>

                    {/* Status */}
                    <div className="col-span-2 text-right flex justify-end items-center gap-4">
                       <div className="flex flex-col items-end">
                          <Badge className={cn(
                            "rounded-full px-4 py-1 font-bold text-[9px] uppercase tracking-widest border-none",
                            msg.senderType === "TUTOR" ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                          )}>
                            {msg.senderType === "TUTOR" ? "Recebida" : "Respondida"}
                          </Badge>
                          <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-tighter">
                            {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: pt })}
                          </p>
                       </div>
                       <ChevronRight className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Drawer para responder/detalhes */}
      {selectedMsg && (
        <MessagesDrawer 
          isOpen={isDrawerOpen}
          onOpenChange={setIsDrawerOpen}
          notification={selectedMsg}
          onApprove={() => {}}
          onReject={() => {}}
        />
      )}
    </div>
  );
}
