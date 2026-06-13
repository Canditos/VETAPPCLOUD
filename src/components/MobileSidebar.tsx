"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { X, ChevronRight, LayoutDashboard, Stethoscope, Mail, PawPrint, Users, Bed, Pill, Activity, Package, Receipt, Send, BarChart3, Settings, Heart } from "lucide-react";
import { getVisibleMenuItems } from "@/lib/roles";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const ICON_MAP: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Agenda: Stethoscope,
  Mensagens: Mail,
  Pacientes: PawPrint,
  Clientes: Users,
  Internamento: Bed,
  Prescrições: Pill,
  Diagnósticos: Activity,
  Inventário: Package,
  Faturação: Receipt,
  "Marketing SMS": Send,
  "SMS Stats": BarChart3,
  Relatórios: BarChart3,
  Equipa: Users,
  Definições: Settings,
};

export default function MobileSidebar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession() as any;
  const role = session?.user?.role;
  const visible = getVisibleMenuItems(role);
  const visibleNames = new Set(visible.map((m) => m.name));

  const menuGroups = [
    { label: "Principal", keys: ["Dashboard", "Agenda", "Mensagens"] },
    { label: "Clínica", keys: ["Pacientes", "Clientes", "Internamento", "Prescrições", "Diagnósticos"] },
    { label: "Administrativo", keys: ["Inventário", "Faturação", "Marketing SMS", "SMS Stats", "Relatórios"] },
    { label: "Configuração", keys: ["Equipa", "Definições"] },
  ];

  return (
    <>
      <Button
        variant="outline"
        size="icon"
        className="fixed bottom-6 right-6 z-50 h-12 w-12 rounded-full shadow-lg bg-blue-600 text-white border-none hover:bg-blue-700 md:hidden"
        onClick={() => setOpen(true)}
        aria-label="Abrir menu"
      >
        <ChevronRight className="rotate-180" />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-slate-950 border-r border-slate-200 dark:border-slate-800">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg">
                  <Heart size={18} fill="white" strokeWidth={0} />
                </div>
                <div>
                  <span className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tighter">VetConnect</span>
                  <span className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] block">Clinic Pro</span>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)} className="rounded-xl">
                <X size={20} />
              </Button>
            </div>

            <nav className="flex-1 overflow-y-auto p-4 space-y-6">
              {menuGroups.map((group) => {
                const items = group.keys.filter((k) => visibleNames.has(k));
                if (items.length === 0) return null;
                return (
                  <div key={group.label} className="space-y-2">
                    <h3 className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em]">
                      {group.label}
                    </h3>
                    <div className="space-y-1">
                      {items.map((name) => {
                        const item = visible.find((m) => m.name === name)!;
                        const Icon = ICON_MAP[name] || LayoutDashboard;
                        const isActive = pathname === item.href;
                        return (
                          <Link
                            key={item.name}
                            href={item.href}
                            onClick={() => setOpen(false)}
                            className={cn(
                              "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300",
                              isActive
                                ? "bg-blue-600 text-white shadow-lg"
                                : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                          >
                            <Icon size={20} strokeWidth={2} />
                            <span className="text-sm font-bold tracking-tight">{item.name}</span>
                            {isActive && <ChevronRight size={14} className="ml-auto" />}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                className="w-full rounded-xl border-slate-200 dark:border-slate-800 font-bold"
                onClick={() => signOut({ callbackUrl: "/auth/signin" })}
              >
                Sair
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
