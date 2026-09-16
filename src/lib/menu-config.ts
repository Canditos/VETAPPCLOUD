import {
  LayoutDashboard,
  Stethoscope,
  Mail,
  PawPrint,
  Users,
  Bed,
  Bug,
  Pill,
  Activity,
  Package,
  Receipt,
  Send,
  BarChart3,
  Settings,
} from "lucide-react";

export const MENU_ICONS: Record<string, React.ElementType> = {
  Dashboard: LayoutDashboard,
  Agenda: Stethoscope,
  Mensagens: Mail,
  Pacientes: PawPrint,
  Clientes: Users,
  Internamento: Bed,
  "Desparasitação": Bug,
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

export interface MenuGroup {
  label: string;
  keys: string[];
}

export const MENU_GROUPS: MenuGroup[] = [
  { label: "Principal", keys: ["Dashboard", "Agenda", "Mensagens"] },
  {
    label: "Clínica",
    keys: ["Pacientes", "Clientes", "Internamento", "Desparasitação", "Prescrições", "Diagnósticos"],
  },
  {
    label: "Administrativo",
    keys: ["Inventário", "Faturação", "Marketing SMS", "SMS Stats", "Relatórios"],
  },
  { label: "Configuração", keys: ["Equipa", "Definições"] },
];
