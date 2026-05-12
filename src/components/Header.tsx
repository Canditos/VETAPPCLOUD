"use client";

import { useState, useEffect, useRef } from "react";
import { Bell, User, Check, CheckCheck, ChevronRight, Calendar, Package, Syringe } from "lucide-react";
import { CommandMenu } from "./CommandMenu";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { useSession } from "next-auth/react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const NOTIFICATION_ICONS: Record<string, any> = {
  APPOINTMENT_REQUEST: Calendar,
  STOCK_ALERT: Package,
  VACCINE_DUE: Syringe,
};

export default function Header() {
  const { data: session } = useSession() as any;
  const router = useRouter();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Fetch unread count — poll every 30s
  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) return { notifications: [], unreadCount: 0 };
      return res.json();
    },
    refetchInterval: 30000,
    staleTime: 20000,
  });

  const unreadCount: number = data?.unreadCount ?? 0;
  const notifications: any[] = data?.notifications ?? [];

  // Mark all read
  const markAllRead = useMutation({
    mutationFn: async () => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Mark single read
  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const userName = session?.user?.name || "Utilizador";
  const userRole = (session?.user as any)?.role;
  const roleLabel = userRole === "ADMIN" ? "Administrador" : userRole === "VETERINARIAN" ? "Médico Vet." : userRole === "RECEPTIONIST" ? "Rececionista" : "Equipa";

  return (
    <header className="h-20 flex items-center justify-between px-10 glass-panel sticky top-0 z-40">
      <div className="flex-1 max-w-2xl">
        <CommandMenu />
      </div>

      <div className="flex items-center gap-6">
        <ThemeToggle />

        {/* Notification Bell */}
        <div ref={panelRef} className="relative">
          <Button
            variant="ghost" size="icon"
            className="h-12 w-12 rounded-2xl text-slate-400 dark:text-slate-300 relative bg-slate-50 dark:bg-card hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm"
            onClick={() => setOpen(!open)}
          >
            <Bell size={20} strokeWidth={2.5} />
            {unreadCount > 0 && (
              <span className="absolute top-2.5 right-2.5 w-4 h-4 bg-rose-500 rounded-full ring-2 ring-white dark:ring-background flex items-center justify-center">
                <span className="text-white text-[9px] font-black leading-none">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              </span>
            )}
          </Button>

          {/* Dropdown panel */}
          {open && (
            <div className="absolute right-0 top-14 w-96 bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/10 rounded-3xl shadow-2xl shadow-slate-200/60 dark:shadow-none z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Header */}
              <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100 dark:border-white/5">
                <div>
                  <p className="font-black text-slate-900 dark:text-white text-sm">Notificações</p>
                  {unreadCount > 0 && (
                    <p className="text-[10px] text-slate-400 font-bold">{unreadCount} por ler</p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllRead.mutate()}
                    className="flex items-center gap-1.5 text-[10px] font-black text-blue-600 hover:text-blue-500 uppercase tracking-widest"
                  >
                    <CheckCheck size={12} /> Marcar todas
                  </button>
                )}
              </div>

              {/* Notifications list */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-50 dark:divide-white/5">
                {notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
                    <Bell size={28} strokeWidth={1.2} />
                    <p className="text-sm font-bold">Sem notificações</p>
                  </div>
                ) : (
                  notifications.map((notif: any) => {
                    const Icon = NOTIFICATION_ICONS[notif.type] ?? Bell;
                    return (
                      <button
                        key={notif.id}
                        className={cn(
                          "w-full text-left flex gap-3 px-5 py-4 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors",
                          !notif.read && "bg-blue-50/40 dark:bg-blue-900/10"
                        )}
                        onClick={() => {
                          if (!notif.read) markRead.mutate(notif.id);
                          if (notif.link) router.push(notif.link);
                          setOpen(false);
                        }}
                      >
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                          !notif.read ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600" : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                        )}>
                          <Icon size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn("text-sm font-bold truncate", !notif.read ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                            {notif.title}
                          </p>
                          {notif.body && (
                            <p className="text-xs text-slate-400 truncate mt-0.5">{notif.body}</p>
                          )}
                          <p className="text-[10px] text-slate-300 dark:text-slate-600 mt-1 font-bold">
                            {formatDistanceToNow(new Date(notif.createdAt), { addSuffix: true, locale: pt })}
                          </p>
                        </div>
                        {!notif.read && (
                          <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-2" />
                        )}
                      </button>
                    );
                  })
                )}
              </div>

              {/* Footer */}
              {notifications.length > 0 && (
                <div className="border-t border-slate-100 dark:border-white/5 px-5 py-3">
                  <button
                    onClick={() => { setOpen(false); router.push("/dashboard/calendar"); }}
                    className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all"
                  >
                    Ver pedidos de marcação <ChevronRight size={10} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* User info */}
        <div className="flex items-center gap-4 pl-6 border-l border-slate-200 dark:border-white/10">
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none tracking-tight uppercase">
              {userName}
            </p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] mt-1.5">
              {roleLabel}
            </p>
          </div>
          <div className="w-12 h-12 bg-slate-100 dark:bg-card rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer shadow-sm border border-transparent dark:border-white/5">
            <User size={22} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </header>
  );
}
