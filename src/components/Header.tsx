"use client";

import { User } from "lucide-react";
import { CommandMenu } from "./CommandMenu";
import { ThemeToggle } from "./ThemeToggle";
import { NotificationsDropdown } from "./NotificationsDropdown";
import { useSession } from "next-auth/react";

export default function Header() {
  const { data: session } = useSession() as any;

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
        <NotificationsDropdown />
        
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
