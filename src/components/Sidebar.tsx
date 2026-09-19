"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  LogOut,
  Heart,
  ChevronRight,
  User,
  PanelLeftClose,
  PanelLeftOpen,
  Pin,
  PinOff,
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { getVisibleMenuItems, ROLE_LABELS } from "@/lib/roles";
import { MENU_ICONS, MENU_GROUPS } from "@/lib/menu-config";
import { useSidebar } from "@/components/SidebarContext";
import { cn } from "@/lib/utils";

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession() as any;
  const role: string | undefined = session?.user?.role;
  const visible = getVisibleMenuItems(role);
  const visibleNames = new Set(visible.map((m) => m.name));

  const { isPinned, setIsPinned, setIsHovered, isExpanded, collapseSidebar, toggleSidebar } = useSidebar();

  return (
    <aside
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "hidden md:flex flex-col h-screen fixed left-0 top-0 z-50 transition-all duration-300 ease-in-out",
        "bg-slate-50/95 dark:bg-background/95 backdrop-blur-md border-r border-slate-200/70 dark:border-white/10 select-none",
        isExpanded
          ? "w-64 shadow-2xl ring-1 ring-black/5 dark:ring-white/10"
          : "w-20 shadow-sm"
      )}
    >
      {/* Brand Header */}
      <div className="h-20 px-4 flex items-center justify-between border-b border-slate-200/50 dark:border-white/5">
        <Link
          href="/dashboard"
          onClick={(e) => {
            if (pathname === "/dashboard") {
              e.preventDefault();
              toggleSidebar();
            }
          }}
          className="flex items-center gap-3 overflow-hidden cursor-pointer group"
          title="VetConnect"
        >
          <div className="w-11 h-11 min-w-[2.75rem] bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 group-hover:rotate-6 transition-all duration-300">
            <Heart size={22} fill="white" strokeWidth={0} />
          </div>
          <div
            className={cn(
              "transition-all duration-300 whitespace-nowrap",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-4 pointer-events-none w-0"
            )}
          >
            <span className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight block leading-none">
              VetConnect
            </span>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-1 block">
              Clinic Pro
            </span>
          </div>
        </Link>

        {/* Pin Toggle Button (Visible when expanded) */}
        {isExpanded && (
          <button
            onClick={() => setIsPinned((prev) => !prev)}
            title={isPinned ? "Desafixar menu (Modo Automático)" : "Fixar menu aberto"}
            className={cn(
              "p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all",
              isPinned
                ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "hover:bg-slate-200/50 dark:hover:bg-white/5"
            )}
          >
            {isPinned ? <Pin size={16} className="fill-current" /> : <PinOff size={16} />}
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto no-scrollbar overflow-x-hidden">
        {MENU_GROUPS.map((group) => {
          const groupItems = group.keys.filter((k) => visibleNames.has(k));
          if (groupItems.length === 0) return null;

          return (
            <div key={group.label} className="space-y-1">
              {/* Group Label */}
              <div
                className={cn(
                  "px-3 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] transition-opacity duration-200",
                  isExpanded ? "opacity-100 h-5 mb-1.5" : "opacity-0 h-0 overflow-hidden"
                )}
              >
                {group.label}
              </div>

              {/* Items */}
              <div className="space-y-1">
                {groupItems.map((name) => {
                  const item = visible.find((m) => m.name === name)!;
                  const Icon = MENU_ICONS[name] || LayoutDashboard;
                  const isActive = item.href === "/dashboard"
                    ? pathname === "/dashboard"
                    : pathname === item.href || pathname.startsWith(item.href + "/");

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={(e) => {
                        if (isActive) {
                          e.preventDefault();
                          toggleSidebar();
                        } else if (!isPinned) {
                          collapseSidebar();
                        }
                      }}
                      title={!isExpanded ? item.name : undefined}
                      className={cn(
                        "flex items-center rounded-2xl transition-all duration-200 group relative cursor-pointer",
                        isExpanded ? "px-3.5 py-3 justify-between" : "p-3 justify-center",
                        isActive
                          ? "bg-white dark:bg-card text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200/60 dark:ring-white/10"
                          : "text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-white/5"
                      )}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div
                          className={cn(
                            "transition-transform duration-200 shrink-0",
                            isActive ? "scale-110" : "group-hover:scale-110"
                          )}
                        >
                          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span
                          className={cn(
                            "text-sm tracking-tight whitespace-nowrap transition-all duration-300",
                            isActive ? "font-black" : "font-bold",
                            isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none w-0"
                          )}
                        >
                          {item.name}
                        </span>
                      </div>

                      {/* Active Indicator */}
                      {isActive && (
                        <div
                          className={cn(
                            "w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 shrink-0",
                            !isExpanded && "absolute right-2 top-2"
                          )}
                        />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Footer */}
      <div className="p-3 mt-auto border-t border-slate-200/50 dark:border-white/5 bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm">
        <div
          className={cn(
            "flex items-center gap-3 mb-2 rounded-2xl transition-all",
            isExpanded ? "p-2 bg-slate-100/50 dark:bg-white/5" : "justify-center p-1"
          )}
          title={!isExpanded ? (session?.user?.name || "Dr. Marco") : undefined}
        >
          <div className="w-10 h-10 min-w-[2.5rem] rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden shrink-0 shadow-inner">
            {session?.user?.image ? (
              <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div
            className={cn(
              "min-w-0 transition-all duration-300 whitespace-nowrap",
              isExpanded ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none w-0"
            )}
          >
            <p className="text-sm font-black text-slate-900 dark:text-white truncate">
              {session?.user?.name || "Dr. Marco"}
            </p>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {role ? (ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role) : "---"}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/auth/signin" })}
          title={!isExpanded ? "Terminar Sessão" : undefined}
          className={cn(
            "w-full flex items-center text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all font-black text-xs uppercase tracking-wider group",
            isExpanded ? "justify-between px-3 py-2.5" : "justify-center p-2.5"
          )}
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} strokeWidth={2.5} className="shrink-0" />
            <span
              className={cn(
                "transition-all duration-300 whitespace-nowrap",
                isExpanded ? "opacity-100 translate-x-0" : "opacity-0 pointer-events-none w-0"
              )}
            >
              Sair
            </span>
          </div>
          {isExpanded && (
            <ChevronRight
              size={14}
              className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0"
            />
          )}
        </button>
      </div>
    </aside>
  );
}
