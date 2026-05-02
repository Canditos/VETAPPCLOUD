"use client";

import { Bell, User } from "lucide-react";
import { CommandMenu } from "./CommandMenu";
import { Button } from "./ui/button";

export default function Header() {
  return (
    <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-slate-100 sticky top-0 z-40">
      <div className="flex-1 max-w-xl">
        <CommandMenu />
      </div>
      
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="text-slate-400 relative">
          <Bell size={20} />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
        </Button>
        <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-bold text-slate-900 leading-none">Dr. Marco António</p>
            <p className="text-[10px] text-slate-400 font-medium mt-1">Administrador</p>
          </div>
          <div className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-500 hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer">
            <User size={20} />
          </div>
        </div>
      </div>
    </header>
  );
}
