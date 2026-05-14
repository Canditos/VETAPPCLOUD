"use client";

import { useState, useEffect, useRef } from "react";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  User, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  XCircle,
  ChevronRight,
  ArrowRight,
  Send,
  Activity
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface MessagesDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  notification: any;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}

export function MessagesDrawer({ 
  isOpen, 
  onOpenChange, 
  notification,
  onApprove,
  onReject
}: MessagesDrawerProps) {
  const [reply, setReply] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Buscar mensagens filtradas por contexto (RequestId)
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", notification?.ownerId, notification?.requestId],
    queryFn: async () => {
      if (!notification?.ownerId) return [];
      const requestId = notification.requestId || "";
      const res = await fetch(`/api/portal/messages?ownerId=${notification.ownerId}&requestId=${requestId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!notification?.ownerId && isOpen
  });

  // Enviar resposta
  const sendReply = useMutation({
    mutationFn: async () => {
      if (!reply.trim()) return;
      const res = await fetch("/api/messages/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          content: reply, 
          ownerId: notification.ownerId,
          requestId: notification.requestId
        }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["messages", notification.ownerId, notification.requestId] });
      toast.success("Mensagem enviada");
    }
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  if (!notification) return null;

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="w-[450px] sm:w-[540px] p-0 bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-white/10 shadow-2xl">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-white/5">
            <div className="flex items-center justify-between mb-6">
              <Badge variant="outline" className="px-3 py-1 rounded-full border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-400 font-black text-[10px] uppercase tracking-widest bg-blue-50/50 dark:bg-blue-500/5">
                {notification.type === "PORTAL_APPOINTMENT_REQUEST" ? "Pedido de Marcação" : "Conversa"}
              </Badge>
              <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-2">
                <Clock size={12} /> {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: pt })}
              </span>
            </div>
            <SheetTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
              {notification.title}
            </SheetTitle>
            <SheetDescription className="text-slate-500 dark:text-slate-400 font-medium mt-2 leading-relaxed">
              {notification.message}
            </SheetDescription>
          </div>

          {/* Content */}
          <ScrollArea className="flex-1 p-8">
            <div className="space-y-10">
              {/* Appointment Request Details (Conditional) */}
              {notification.type === "PORTAL_APPOINTMENT_REQUEST" && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-2 duration-500">
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Paciente</span>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-blue-600/10 text-blue-600 flex items-center justify-center">
                              <Activity size={18} />
                           </div>
                           <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Paciente</p>
                        </div>
                     </div>
                     <div className="p-5 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 shadow-sm">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tutor</span>
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                              <User size={18} />
                           </div>
                           <p className="font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">Tutor</p>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-6">
                     <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 pb-4">Detalhes da Solicitação</h4>
                     <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-4">
                           <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <Calendar size={18} />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Previsão</p>
                              <p className="font-black text-slate-900 dark:text-white">A definir na aprovação</p>
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              )}

              {/* Chat Section (Always Available) */}
              <div className="space-y-6">
                <h4 className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-[0.2em] border-b border-slate-100 dark:border-white/5 pb-4">Chat em Direto</h4>
                
                <div className="space-y-4">
                  {messages.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 dark:bg-white/5 rounded-[2rem] border border-dashed border-slate-200 dark:border-white/10">
                      <MessageSquare className="mx-auto mb-3 text-slate-300" size={32} />
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Inicie a conversa com o tutor</p>
                    </div>
                  ) : (
                    messages.map((msg: any) => (
                      <div key={msg.id} className={cn(
                        "flex flex-col max-w-[85%] gap-1",
                        msg.senderType === "CLINIC" ? "ml-auto items-end" : "items-start"
                      )}>
                        <div className={cn(
                          "p-4 rounded-2xl text-sm font-medium leading-relaxed",
                          msg.senderType === "CLINIC" 
                            ? "bg-blue-600 text-white rounded-tr-none shadow-lg shadow-blue-500/10" 
                            : "bg-slate-100 dark:bg-white/5 text-slate-900 dark:text-white rounded-tl-none"
                        )}>
                          {msg.content}
                        </div>
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest px-1">
                          {formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true, locale: pt })}
                        </span>
                      </div>
                    ))
                  )}
                  <div ref={scrollRef} />
                </div>

                {/* Input Area */}
                <div className="relative group pt-4">
                  <textarea
                    className="w-full min-h-[120px] p-6 rounded-[2rem] bg-slate-100 dark:bg-white/5 border-none font-medium text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all resize-none shadow-inner"
                    placeholder="Escreva a sua resposta aqui..."
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendReply.mutate();
                      }
                    }}
                  />
                  <Button 
                    size="icon"
                    className="absolute bottom-4 right-4 w-12 h-12 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 active:scale-95 transition-all disabled:opacity-50"
                    disabled={!reply.trim() || sendReply.isPending}
                    onClick={() => sendReply.mutate()}
                  >
                    <Send size={18} strokeWidth={3} />
                  </Button>
                </div>
              </div>
            </div>
          </ScrollArea>

          {/* Footer Actions (Only for requests) */}
          {notification.type === "PORTAL_APPOINTMENT_REQUEST" && (
            <div className="p-8 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-white/5">
               <div className="grid grid-cols-2 gap-4">
                  <Button 
                    variant="outline" 
                    className="h-16 rounded-[2rem] border-slate-200 dark:border-white/10 font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all gap-2"
                    onClick={() => onReject(notification.id)}
                  >
                     <XCircle size={18} /> Rejeitar
                  </Button>
                  <Button 
                    className="h-16 rounded-[2rem] bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all gap-2 group"
                    onClick={() => onApprove(notification.id)}
                  >
                     Aprovar Pedido <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                  </Button>
               </div>
               <p className="text-[10px] text-center text-slate-400 font-medium mt-6 uppercase tracking-widest">
                  Ao aprovar, poderá sugerir um horário final na agenda.
               </p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
