"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  PawPrint,
  Stethoscope,
  Package,
  Receipt,
  Settings,
  Users,
  LogOut,
  Activity,
  Bed,
  BarChart3,
  Heart,
  ChevronRight,
  User,
  Pill,
  Mail,
  Send
} from "lucide-react";
import { signOut, useSession } from "next-auth/react";
import { getVisibleMenuItems, ROLE_LABELS } from "@/lib/roles";

const ICON_MAP: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Agenda: Stethoscope,
  Mensagens: Mail,
  Pacientes: PawPrint,
  Clientes: Users,
  Internamento: Bed,
  "Prescrições": Pill,
  "Diagnósticos": Activity,
  "Inventário": Package,
  "Faturação": Receipt,
  "Marketing SMS": Send,
  "SMS Stats": BarChart3,
  "Relatórios": BarChart3,
  "Equipa": Users,
  "Definições": Settings,
};

const menuGroups = [
  {
    label: "Principal",
    keys: ["Dashboard", "Agenda", "Mensagens"]
  },
  {
    label: "Clínica",
    keys: ["Pacientes", "Clientes", "Internamento", "Prescrições", "Diagnósticos"]
  },
  {
    label: "Administrativo",
    keys: ["Inventário", "Faturação", "Marketing SMS", "SMS Stats", "Relatórios"]
  },
  {
    label: "Configuração",
    keys: ["Equipa", "Definições"]
  }
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession() as any;
  const role: string | undefined = session?.user?.role;
  const visible = getVisibleMenuItems(role);
  const visibleNames = new Set(visible.map((m) => m.name));

  return (
    <div className="w-64 h-screen bg-slate-50 dark:bg-background border-r border-slate-200/50 dark:border-white/5 flex flex-col fixed left-0 top-0 z-50">
      <Link href="/dashboard" className="p-8 pb-6 block">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200 dark:shadow-none group-hover:rotate-12 transition-transform duration-500">
            <Heart size={22} fill="white" strokeWidth={0} />
          </div>
          <div>
            <span className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tighter block leading-none">VetConnect</span>
            <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-1 block">Clinic Pro</span>
          </div>
        </div>
      </Link>

      <nav className="flex-1 px-4 py-4 space-y-8 overflow-y-auto no-scrollbar">
        {menuGroups.map((group) => {
          const groupItems = group.keys.filter((k) => visibleNames.has(k));
          if (groupItems.length === 0) return null;
          return (
            <div key={group.label} className="space-y-2">
              <h3 className="px-4 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.25em] mb-3">
                {group.label}
              </h3>
              <div className="space-y-1">
                {groupItems.map((name) => {
                  const item = visible.find((m) => m.name === name)!;
                  const Icon = ICON_MAP[name] || LayoutDashboard;
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${
                        isActive
                          ? "bg-white dark:bg-card text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200/50 dark:ring-white/10"
                          : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/50 dark:hover:bg-card/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`transition-transform duration-300 ${isActive ? "scale-110" : "group-hover:scale-110"}`}>
                          <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        <span className={`text-sm tracking-tight ${isActive ? "font-black" : "font-bold"}`}>
                          {item.name}
                        </span>
                      </div>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="p-6 mt-auto border-t border-slate-200/50 dark:border-slate-800/50 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden">
            {session?.user?.image ? (
              <img src={session.user.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <User size={20} />
            )}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-900 dark:text-white truncate">
              {session?.user?.name || "Dr. Marco"}
            </p>
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-600 uppercase tracking-widest">
              {role ? (ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role) : "---"}
            </p>
          </div>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full flex items-center justify-between px-4 py-3 text-rose-600 dark:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-2xl transition-all font-black text-xs uppercase tracking-widest group"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} strokeWidth={2.5} />
            Sair
          </div>
          <ChevronRight size={14} className="opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0" />
        </button>
      </div>
    </div>
  );
}
