"use client";

import { Bell, User } from "lucide-react";
import { CommandMenu } from "./CommandMenu";
import { Button } from "./ui/button";

import { ThemeToggle } from "./ThemeToggle";

export default function Header() {
  return (
    <header className="h-20 flex items-center justify-between px-10 glass-panel sticky top-0 z-40">
      <div className="flex-1 max-w-2xl">
        <CommandMenu />
      </div>
      
      <div className="flex items-center gap-6">
        <ThemeToggle />
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl text-slate-400 dark:text-slate-300 relative bg-slate-50 dark:bg-card hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm">
          <Bell size={20} strokeWidth={2.5} />
          <span className="absolute top-3 right-3 w-2 h-2 bg-rose-500 rounded-full ring-4 ring-white dark:ring-background"></span>
        </Button>
        
        <div className="flex items-center gap-4 pl-6 border-l border-slate-200 dark:border-white/10">
          <div className="text-right hidden md:block">
            <p className="text-sm font-black text-slate-900 dark:text-slate-100 leading-none tracking-tight uppercase">Dr. Marco António</p>
            <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-[0.2em] mt-1.5">Administrador Pro</p>
          </div>
          <div className="w-12 h-12 bg-slate-100 dark:bg-card rounded-2xl flex items-center justify-center text-slate-500 dark:text-slate-300 hover:bg-blue-600 hover:text-white transition-all duration-300 cursor-pointer shadow-sm border border-transparent dark:border-white/5">
            <User size={22} strokeWidth={2.5} />
          </div>
        </div>
      </div>
    </header>
  );
}
