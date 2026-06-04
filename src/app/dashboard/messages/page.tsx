"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Mail, 
  Search, 
  Clock, 
  User, 
  Filter, 
  ChevronRight, 
  MessageSquare, 
  CheckCircle2, 
  Calendar,
  AlertCircle,
  Send,
  Sparkles,
  ExternalLink,
  Check,
  X,
  Inbox,
  Activity,
  MessageCircle
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow, format } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function MessageCenter() {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // 'all', 'requests', 'chats', 'unread'
  const [replyText, setReplyText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Buscar todas as mensagens recebidas via portal
  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["all-portal-messages"],
    queryFn: async () => {
      const res = await fetch("/api/portal/messages?all=true");
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  // Agrupar mensagens por ownerId para criar os threads de conversação
  const threadsMap = new Map<string, any>();
  
  messages.forEach((m: any) => {
    const ownerId = m.ownerId;
    if (!ownerId) return;
    
    if (!threadsMap.has(ownerId)) {
      threadsMap.set(ownerId, {
        ownerId,
        ownerName: m.owner?.name || "Tutor do Portal",
        ownerEmail: m.owner?.email || "sem-email@portal.com",
        lastMessage: m,
        messagesCount: 0,
        pendingRequestsCount: 0,
        unreadCount: 0,
      });
    }
    
    const thread = threadsMap.get(ownerId);
    
    // Atualizar contadores
    if (m.type === "APPOINTMENT_REQUEST") {
      if (m.status === "PENDING") {
        thread.pendingRequestsCount += 1;
      }
    } else {
      thread.messagesCount += 1;
      if (m.senderType === "TUTOR") {
        thread.unreadCount += 1;
      }
    }
    
    // Guardar a atividade mais recente como última mensagem
    if (new Date(m.createdAt) > new Date(thread.lastMessage.createdAt)) {
      thread.lastMessage = m;
    }
  });

  const threads = Array.from(threadsMap.values()).sort(
    (a, b) => new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime()
  );

  // Filtrar os threads no painel esquerdo
  const filteredThreads = threads.filter(t => {
    const matchesSearch = t.ownerName.toLowerCase().includes(search.toLowerCase()) || 
                          t.ownerEmail.toLowerCase().includes(search.toLowerCase());
    
    if (filter === "requests") return matchesSearch && t.pendingRequestsCount > 0;
    if (filter === "unread") return matchesSearch && t.unreadCount > 0;
    if (filter === "chats") return matchesSearch && t.messagesCount > 0;
    return matchesSearch;
  });

  // Estatísticas globais para o painel vazio
  const totalPendingRequests = threads.reduce((acc, t) => acc + t.pendingRequestsCount, 0);
  const totalActiveChats = threads.filter(t => t.messagesCount > 0).length;

  // Filtrar dados da conversa selecionada
  const activeMessages = messages
    .filter((m: any) => m.ownerId === selectedOwnerId && m.type !== "APPOINTMENT_REQUEST")
    .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const activeRequests = messages
    .filter((m: any) => m.ownerId === selectedOwnerId && m.type === "APPOINTMENT_REQUEST")
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const selectedThread = threads.find(t => t.ownerId === selectedOwnerId);

  // Auto-scroll para o fim do chat
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedOwnerId, activeMessages.length]);

  // Enviar Resposta via Chat
  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedOwnerId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: replyText, 
          ownerId: selectedOwnerId
        }),
      });
      if (!res.ok) throw new Error();
      setReplyText("");
      queryClient.invalidateQueries({ queryKey: ["all-portal-messages"] });
      toast.success("Mensagem enviada com sucesso");
    } catch {
      toast.error("Erro ao enviar a mensagem");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Aprovar Pedido de Consulta
  const handleApprove = async (requestId: string) => {
    try {
      const res = await fetch("/api/portal/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId, status: "APPROVED" })
      });
      if (!res.ok) throw new Error();
      toast.success("Pedido de agendamento aprovado com sucesso");
      queryClient.invalidateQueries({ queryKey: ["all-portal-messages"] });
    } catch {
      toast.error("Erro ao aprovar o pedido");
    }
  };

  // Rejeitar Pedido de Consulta
  const handleReject = async (requestId: string) => {
    try {
      const res = await fetch("/api/portal/requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: requestId, status: "REJECTED" })
      });
      if (!res.ok) throw new Error();
      toast.success("Pedido de agendamento rejeitado");
      queryClient.invalidateQueries({ queryKey: ["all-portal-messages"] });
    } catch {
      toast.error("Erro ao rejeitar o pedido");
    }
  };

  // Respostas Rápidas / Atalhos de Mensagens
  const quickReplies = [
    "Olá! Recebemos o seu contacto. Como podemos ajudar?",
    "Confirmamos que o seu pedido de consulta foi aprovado na agenda.",
    "Lamentamos, mas não temos disponibilidade nesse horário. Sugere outro?",
    "Pedimos que traga o boletim de vacinas atualizado do seu animal."
  ];

  return (
    <div className="p-8 space-y-6 max-w-[1600px] mx-auto animate-in fade-in duration-700 h-[calc(100vh-130px)] flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter flex items-center gap-3.5">
            Inbox & Portal <Mail size={32} className="text-blue-600 dark:text-blue-500" />
          </h1>
          <p className="text-slate-500 font-medium tracking-tight mt-1 text-base">
            Canal de conversação em direto e central de marcações com os Tutores.
          </p>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex gap-6 overflow-hidden min-h-0">
        
        {/* Painel Esquerdo: Lista de Threads (Conversas) */}
        <div className="w-[380px] shrink-0 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden shadow-sm">
          
          {/* Procura */}
          <div className="p-4 border-b border-slate-100 dark:border-white/5 space-y-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <Input 
                placeholder="Pesquisar tutor..." 
                className="pl-11 h-10 rounded-2xl bg-slate-50 dark:bg-slate-950 border-slate-100 dark:border-white/5 font-semibold text-sm tracking-tight"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Categorias de Filtro */}
            <div className="flex gap-1 p-0.5 bg-slate-100 dark:bg-slate-950 rounded-xl">
              {[
                { id: "all", label: "Todas" },
                { id: "requests", label: "Pedidos" },
                { id: "chats", label: "Chats" },
                { id: "unread", label: "Não Lidas" }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={cn(
                    "flex-1 py-1.5 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-all",
                    filter === tab.id 
                      ? "bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-sm" 
                      : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-300"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Listagem */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 font-bold animate-pulse">A carregar inbox...</div>
            ) : filteredThreads.length === 0 ? (
              <div className="p-12 text-center py-20">
                <Inbox className="mx-auto mb-3 text-slate-300 dark:text-slate-600" size={32} />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Sem conversas</h4>
                <p className="text-xs text-slate-400 mt-1">Nenhuma mensagem ou pedido com estes filtros.</p>
              </div>
            ) : (
              filteredThreads.map((thread) => {
                const isActive = thread.ownerId === selectedOwnerId;
                const isRequest = thread.lastMessage.type === "APPOINTMENT_REQUEST";
                const isTutorSender = thread.lastMessage.senderType === "TUTOR";

                return (
                  <div
                    key={thread.ownerId}
                    onClick={() => setSelectedOwnerId(thread.ownerId)}
                    className={cn(
                      "p-4 flex gap-3.5 items-start cursor-pointer hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-all relative group",
                      isActive && "bg-blue-500/10 border-l-[3px] border-blue-500 dark:bg-blue-500/5"
                    )}
                  >
                    {/* Avatar com Gradiente Composto pelo Nome */}
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-blue-500/20 to-indigo-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center font-extrabold text-sm shrink-0 border border-blue-500/10 shadow-sm">
                      {thread.ownerName.charAt(0).toUpperCase()}
                    </div>

                    {/* Texto Informativo */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm tracking-tight truncate pr-2">
                          {thread.ownerName}
                        </h4>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 shrink-0 uppercase tracking-tighter">
                          {formatDistanceToNow(new Date(thread.lastMessage.createdAt), { addSuffix: false, locale: pt }).replace("cerca de", "")}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate tracking-tight pr-4">
                        {isRequest ? "📬 Pedido de marcação enviado" : thread.lastMessage.content}
                      </p>

                      {/* Badges de Estado */}
                      <div className="flex gap-1.5 mt-2 flex-wrap">
                        {thread.pendingRequestsCount > 0 && (
                          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 hover:bg-amber-500/15 border-none font-bold text-[8px] uppercase tracking-widest px-1.5 py-0.5">
                            {thread.pendingRequestsCount} Pedido{thread.pendingRequestsCount > 1 ? "s" : ""}
                          </Badge>
                        )}
                        {thread.unreadCount > 0 && (
                          <Badge className="bg-blue-500 text-white border-none font-bold text-[8px] uppercase tracking-widest px-1.5 py-0.5 animate-pulse">
                            Novo
                          </Badge>
                        )}
                        {!isRequest && !isTutorSender && (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 border-none font-bold text-[8px] uppercase tracking-widest px-1.5 py-0.5">
                            Respondido
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Painel Direito: Chat Aberto & Painel de Ações */}
        <div className="flex-1 bg-white dark:bg-slate-900/50 rounded-3xl border border-slate-200 dark:border-white/5 flex flex-col overflow-hidden relative shadow-sm">
          
          {selectedOwnerId ? (
            <>
              {/* Header do Chat */}
              <div className="px-6 py-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between shrink-0 bg-slate-50/50 dark:bg-slate-900/20">
                <div className="flex items-center gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                    {selectedThread?.ownerName.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-base tracking-tight leading-tight">
                      {selectedThread?.ownerName}
                    </h3>
                    <p className="text-xs text-slate-400 dark:text-slate-500 tracking-tight font-medium mt-0.5">
                      {selectedThread?.ownerEmail}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    className="rounded-xl h-9 font-bold text-[11px] uppercase tracking-widest gap-1.5 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
                    onClick={() => window.open(`/dashboard/customers/${selectedOwnerId}`, "_blank")}
                  >
                    Ficha do Tutor <ExternalLink size={12} />
                  </Button>
                </div>
              </div>

              {/* Área Central: Histórico de Conversa e Pedidos de Agendamento */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6 min-h-0 bg-slate-50/30 dark:bg-transparent">
                
                {/* 1. Secção de Pedidos de Agendamento Activos */}
                {activeRequests.length > 0 && (
                  <div className="space-y-3.5 mb-6">
                    {activeRequests.map((req: any) => {
                      const isPending = req.status === "PENDING";
                      const isApproved = req.status === "APPROVED";
                      const isRejected = req.status === "REJECTED";

                      return (
                        <div 
                          key={req.id} 
                          className={cn(
                            "rounded-2xl p-5 border shadow-sm transition-all animate-in slide-in-from-top-4 duration-300",
                            isPending && "bg-amber-500/5 dark:bg-amber-500/[0.02] border-amber-500/20",
                            isApproved && "bg-emerald-500/5 dark:bg-emerald-500/[0.02] border-emerald-500/20",
                            isRejected && "bg-rose-500/5 dark:bg-rose-500/[0.02] border-rose-500/20"
                          )}
                        >
                          <div className="flex items-center justify-between mb-3.5">
                            <span className={cn(
                              "text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5",
                              isPending && "text-amber-600 dark:text-amber-400",
                              isApproved && "text-emerald-600 dark:text-emerald-400",
                              isRejected && "text-rose-600 dark:text-rose-400"
                            )}>
                              <AlertCircle size={14} /> 
                              {isPending && "Pedido de Consulta Pendente"}
                              {isApproved && "Pedido Aprovado na Agenda"}
                              {isRejected && "Pedido Rejeitado / Cancelado"}
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">
                              {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true, locale: pt })}
                            </span>
                          </div>

                          <div className="grid grid-cols-2 gap-4 mb-4">
                            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Paciente</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                                <Activity size={14} className="text-blue-500" />
                                {req.patientName || "Animal"}
                              </span>
                            </div>
                            <div className="p-3.5 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-xl">
                              <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Preferência de Horário</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 text-sm flex items-center gap-1.5">
                                <Calendar size={14} className="text-indigo-500" />
                                {req.preferred || "Sem preferência"}
                              </span>
                            </div>
                          </div>

                          <div className="p-3.5 bg-slate-100/50 dark:bg-white/[0.02] rounded-xl mb-4 border border-slate-200/20">
                            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Motivo / Notas do Tutor</span>
                            <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 leading-relaxed">
                              "{req.content.split(": ").slice(1).join(": ") || req.content}"
                            </p>
                          </div>

                          {/* Ações para o Pedido */}
                          {isPending && (
                            <div className="flex gap-3 justify-end pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-xl border-slate-200 dark:border-white/10 text-xs font-bold text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all gap-1.5"
                                onClick={() => handleReject(req.id)}
                              >
                                <X size={14} /> Rejeitar
                              </Button>
                              <Button
                                size="sm"
                                className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/10 active:scale-95 transition-all gap-1.5"
                                onClick={() => handleApprove(req.id)}
                              >
                                <Check size={14} /> Aprovar Consulta
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 2. Histórico de Conversação (Mensagens de Chat) */}
                <div className="space-y-4 pt-2">
                  <div className="text-center py-2 shrink-0">
                    <span className="bg-slate-100 dark:bg-white/5 text-[9px] font-extrabold text-slate-400 dark:text-slate-500 px-3 py-1 rounded-full uppercase tracking-wider">
                      Início da conversa
                    </span>
                  </div>

                  {activeMessages.length === 0 ? (
                    <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-white/5 py-16">
                      <MessageSquare className="mx-auto mb-3 text-slate-300 dark:text-slate-700" size={32} />
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sem mensagens escritas</p>
                      <p className="text-[11px] text-slate-500 mt-1 font-medium">Use a barra abaixo para iniciar o chat com o tutor.</p>
                    </div>
                  ) : (
                    activeMessages.map((msg: any) => {
                      const isClinic = msg.senderType === "CLINIC";

                      return (
                        <div 
                          key={msg.id} 
                          className={cn(
                            "flex flex-col max-w-[75%] gap-1.5 animate-in fade-in duration-300",
                            isClinic ? "ml-auto items-end" : "items-start"
                          )}
                        >
                          <div className={cn(
                            "p-4 rounded-2xl text-sm font-semibold leading-relaxed shadow-sm tracking-tight",
                            isClinic 
                              ? "bg-blue-600 text-white rounded-tr-none shadow-blue-500/10" 
                              : "bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 text-slate-800 dark:text-slate-200 rounded-tl-none"
                          )}>
                            {msg.content}
                          </div>
                          
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest px-1.5 flex items-center gap-1.5">
                            {isClinic ? "Clínica" : selectedThread?.ownerName} • {format(new Date(msg.createdAt), "HH:mm")}
                          </span>
                        </div>
                      );
                    })
                  )}
                  <div ref={scrollRef} />
                </div>
              </div>

              {/* Sugestões de Resposta Rápida (Floating Pills) */}
              <div className="px-6 py-2 bg-slate-50/30 dark:bg-transparent shrink-0 flex gap-2 overflow-x-auto border-t border-slate-100 dark:border-white/5 scrollbar-none">
                {quickReplies.map((reply, idx) => (
                  <button
                    key={idx}
                    onClick={() => setReplyText(reply)}
                    className="bg-white dark:bg-slate-900 hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 border border-slate-200/80 dark:border-white/5 rounded-full px-4 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 transition-all shadow-sm shrink-0 active:scale-95"
                  >
                    {reply.length > 35 ? reply.substring(0, 35) + "..." : reply}
                  </button>
                ))}
              </div>

              {/* Área de Envio / Composer */}
              <div className="p-4 bg-white dark:bg-slate-900/80 border-t border-slate-100 dark:border-white/5 shrink-0 flex items-center gap-3">
                <textarea
                  className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-white/5 rounded-2xl px-5 py-3 text-sm font-semibold text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none h-11 leading-normal max-h-32 transition-all"
                  placeholder="Escreva uma resposta ao tutor..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendReply();
                    }
                  }}
                />
                <Button
                  size="icon"
                  className="w-11 h-11 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/10 shrink-0 active:scale-95 transition-all disabled:opacity-50"
                  disabled={!replyText.trim() || isSubmitting}
                  onClick={handleSendReply}
                >
                  <Send size={16} strokeWidth={3} />
                </Button>
              </div>
            </>
          ) : (
            // Empty State (Selecione Tutor)
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="relative mb-6">
                <div className="absolute inset-0 bg-blue-500/20 dark:bg-blue-500/15 rounded-full filter blur-xl animate-pulse" />
                <div className="w-20 h-20 bg-blue-500/10 text-blue-600 rounded-full flex items-center justify-center relative border border-blue-500/20 shadow-inner">
                  <MessageCircle size={38} className="animate-bounce" />
                </div>
              </div>
              
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
                Centro de Conversas & Agendamentos
              </h3>
              <p className="text-slate-500 font-medium text-sm mt-2 max-w-md leading-relaxed">
                Selecione um tutor na barra lateral esquerda para iniciar o chat em direto, responder a esclarecimentos e gerir pedidos de marcação de consulta.
              </p>

              {/* Grelha de Estatísticas Rápidas */}
              <div className="grid grid-cols-2 gap-4 mt-8 w-full max-w-md">
                <Card className="border-none bg-slate-50 dark:bg-white/[0.02] ring-1 ring-slate-100 dark:ring-white/5 rounded-2xl p-5 text-left">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Pedidos Pendentes</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-amber-500 tracking-tighter">
                      {totalPendingRequests}
                    </span>
                    <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/10 border-none font-bold text-[8px] uppercase tracking-widest">
                      Ação Requerida
                    </Badge>
                  </div>
                </Card>

                <Card className="border-none bg-slate-50 dark:bg-white/[0.02] ring-1 ring-slate-100 dark:ring-white/5 rounded-2xl p-5 text-left">
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Conversas Ativas</span>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-black text-blue-500 tracking-tighter">
                      {totalActiveChats}
                    </span>
                    <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/10 border-none font-bold text-[8px] uppercase tracking-widest">
                      Inbox Geral
                    </Badge>
                  </div>
                </Card>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
