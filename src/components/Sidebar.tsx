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
  BarChart3
} from "lucide-react";
import { signOut } from "next-auth/react";

const menuItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Pacientes", href: "/dashboard/patients", icon: PawPrint },
  { name: "Consultas", href: "/dashboard/consultations", icon: Stethoscope },
  { name: "Diagnósticos", href: "/dashboard/diagnostics", icon: Activity },
  { name: "Internamento", href: "/dashboard/hospitalization", icon: Bed },
  { name: "Gestão", href: "/dashboard/management", icon: BarChart3 },
  { name: "Inventário", href: "/dashboard/inventory", icon: Package },
  { name: "Faturação", href: "/dashboard/billing", icon: Receipt },
  { name: "Equipa", href: "/dashboard/team", icon: Users },
  { name: "Definições", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <div className="w-64 h-screen bg-white border-r border-slate-200 flex flex-col fixed left-0 top-0">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center text-white font-bold">
            V
          </div>
          <span className="text-xl font-bold text-slate-800 tracking-tight">VetConnect</span>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={isActive ? "sidebar-link-active" : "sidebar-link"}
            >
              <item.icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={20} />
          Sair
        </button>
      </div>
    </div>
  );
}
