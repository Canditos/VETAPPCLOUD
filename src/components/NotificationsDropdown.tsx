"use client";

import { useState } from "react";
import { Bell, Clock, Calendar, MessageSquare } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { MessagesDrawer } from "./MessagesDrawer";
import { toast } from "sonner";

export function NotificationsDropdown() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Erro ao carregar notificações");
      return res.json();
    },
    refetchInterval: 10000,
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch(`/api/notifications`, { 
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  const handleNotificationClick = (n: any) => {
    if (!n.isRead) markAsRead.mutate(n.id);
    
    // Abrir o Drawer Lateral para pedidos de marcação e mensagens
    if (n.type === "PORTAL_APPOINTMENT_REQUEST" || n.type === "MESSAGE") {
      setSelectedNotification(n);
      setIsDrawerOpen(true);
    } else if (n.link) {
      // Para links normais, garantir que apontam para a rota certa (appointments)
      const safeLink = n.link.replace("/calendar", "/appointments");
      router.push(safeLink);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-400 dark:text-slate-300 relative bg-slate-50 dark:bg-card hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm group">
            <Bell size={20} strokeWidth={2.5} className="group-hover:rotate-12 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center ring-4 ring-white dark:ring-slate-950 shadow-lg shadow-rose-500/30 animate-in zoom-in duration-300">
                {unreadCount > 9 ? "+9" : unreadCount}
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80 rounded-[2rem] p-2 bg-white dark:bg-slate-950 border-slate-200 dark:border-white/10 shadow-2xl z-[100]">
          <DropdownMenuLabel className="flex items-center justify-between px-4 py-3">
            <span className="font-black text-[11px] uppercase tracking-[0.2em] text-slate-400">Notificações</span>
            {unreadCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 text-[9px] font-black uppercase tracking-widest text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                onClick={() => {
                  fetch("/api/notifications", { 
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ markAllRead: true })
                  }).then(() => queryClient.invalidateQueries({ queryKey: ["notifications"] }));
                }}
              >
                Marcar lidas
              </Button>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/5 mx-2" />
          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-300 dark:text-slate-700 mb-3">
                    <Bell size={20} />
                </div>
                <p className="text-xs font-bold text-slate-500">Tudo em dia!</p>
                <p className="text-[10px] text-slate-400 mt-1">Não tens notificações pendentes.</p>
              </div>
            ) : (
              <div className="space-y-1 p-1">
                {notifications.map((n: any) => (
                  <DropdownMenuItem 
                    key={n.id} 
                    className={cn(
                      "flex flex-col items-start gap-1 p-4 rounded-2xl cursor-pointer transition-all border border-transparent outline-none focus:bg-slate-50 dark:focus:bg-white/5",
                      n.isRead 
                        ? "opacity-60 grayscale-[0.5]" 
                        : "bg-blue-50/50 dark:bg-blue-500/5 border-blue-100/50 dark:border-blue-500/10"
                    )}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div className="flex items-center gap-3 w-full">
                       <div className={cn(
                         "w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                         n.type === "PORTAL_APPOINTMENT_REQUEST" ? "bg-amber-500/10 text-amber-500" : "bg-blue-500/10 text-blue-500"
                       )}>
                         {n.type === "PORTAL_APPOINTMENT_REQUEST" ? <Calendar size={14} strokeWidth={3} /> : <MessageSquare size={14} strokeWidth={3} />}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-black text-slate-900 dark:text-white truncate">{n.title}</p>
                          <p className="text-[10px] text-slate-500 dark:text-slate-400 font-medium leading-relaxed line-clamp-2 mt-0.5">
                            {n.message}
                          </p>
                       </div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 ml-11">
                       <Clock size={10} className="text-slate-300" />
                       <p className="text-[9px] font-bold text-slate-400 uppercase">
                         {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: pt })}
                       </p>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>
            )}
          </ScrollArea>
        </DropdownMenuContent>
      </DropdownMenu>

      <MessagesDrawer 
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        notification={selectedNotification}
        onApprove={(id) => {
          setIsDrawerOpen(false);
          // Redireciona para a agenda com o ID do pedido (na rota correta)
          const requestId = selectedNotification.appointmentRequestId || selectedNotification.link?.split('requestId=')[1];
          router.push(`/dashboard/appointments?requestId=${requestId}`);
        }}
        onReject={(id) => {
          setIsDrawerOpen(false);
          toast.info("A funcionalidade de rejeição será implementada em breve.");
        }}
      />
    </>
  );
}
