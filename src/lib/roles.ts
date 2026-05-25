import type { Session } from "next-auth";
import { NextResponse } from "next/server";

export type Role = "SUPER_ADMIN" | "ADMIN" | "VETERINARIAN" | "ASSISTANT" | "RECEPTIONIST";

export type CrudLevel = "CRUD" | "CRIAR_LER" | "LER" | "NONE";

const ROLE_HIERARCHY: Role[] = ["SUPER_ADMIN", "ADMIN", "VETERINARIAN", "ASSISTANT", "RECEPTIONIST"];

export function roleWeight(role: string): number {
  const idx = ROLE_HIERARCHY.indexOf(role as Role);
  return idx === -1 ? 99 : idx;
}

export function meetsMinimum(userRole: string | undefined, minimum: Role): boolean {
  if (!userRole) return false;
  if (userRole === "SUPER_ADMIN") return true;
  return roleWeight(userRole) <= roleWeight(minimum);
}

type Resource =
  | "patients" | "owners" | "consultations" | "prescriptions"
  | "exams" | "appointments" | "billing" | "inventory"
  | "team" | "settings" | "messages" | "marketing"
  | "diagnostics" | "internamento" | "reports" | "sms";

const PERMISSIONS: Record<Resource, Record<Role, CrudLevel>> = {
  patients:       { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "CRUD", ASSISTANT: "CRUD", RECEPTIONIST: "CRIAR_LER" },
  owners:         { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "CRIAR_LER", ASSISTANT: "CRIAR_LER", RECEPTIONIST: "CRIAR_LER" },
  consultations:  { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "CRUD", ASSISTANT: "CRIAR_LER", RECEPTIONIST: "LER" },
  prescriptions:  { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "CRIAR_LER", ASSISTANT: "LER", RECEPTIONIST: "NONE" },
  exams:          { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "CRUD", ASSISTANT: "CRIAR_LER", RECEPTIONIST: "NONE" },
  appointments:   { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "LER", ASSISTANT: "CRUD", RECEPTIONIST: "CRUD" },
  billing:        { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "LER", ASSISTANT: "NONE", RECEPTIONIST: "CRIAR_LER" },
  inventory:      { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "LER", ASSISTANT: "CRUD", RECEPTIONIST: "LER" },
  team:           { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "LER", ASSISTANT: "LER", RECEPTIONIST: "LER" },
  settings:       { SUPER_ADMIN: "CRUD", ADMIN: "NONE", VETERINARIAN: "NONE", ASSISTANT: "NONE", RECEPTIONIST: "NONE" },
  messages:       { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "CRIAR_LER", ASSISTANT: "CRIAR_LER", RECEPTIONIST: "CRIAR_LER" },
  marketing:      { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "NONE", ASSISTANT: "NONE", RECEPTIONIST: "NONE" },
  diagnostics:    { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "CRUD", ASSISTANT: "CRIAR_LER", RECEPTIONIST: "NONE" },
  internamento:   { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "CRUD", ASSISTANT: "CRUD", RECEPTIONIST: "LER" },
  reports:        { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "LER", ASSISTANT: "NONE", RECEPTIONIST: "NONE" },
  sms:            { SUPER_ADMIN: "CRUD", ADMIN: "CRUD", VETERINARIAN: "NONE", ASSISTANT: "NONE", RECEPTIONIST: "NONE" },
};

export function getPermission(resource: Resource, role: string): CrudLevel {
  const perResource = PERMISSIONS[resource];
  if (!perResource) return "NONE";
  return perResource[role as Role] || "NONE";
}

export function canAccess(resource: Resource, role: string | undefined, level: CrudLevel): boolean {
  if (!role || role === "NONE") return false;
  const actual = getPermission(resource, role);
  if (actual === "CRUD") return true;
  if (actual === "NONE") return false;
  if (level === "LER") return actual === "CRIAR_LER" || actual === "CRUD";
  if (level === "CRIAR_LER") return actual === "CRIAR_LER" || actual === "CRUD";
  return false;
}

export function requireRole(resource: Resource, level: CrudLevel) {
  return (session: Session | null): NextResponse | null => {
    const role = (session?.user as any)?.role;
    if (!role || !canAccess(resource, role, level)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    return null;
  };
}

export function canDelete(resource: Resource, role: string): boolean {
  return getPermission(resource, role) === "CRUD";
}

export const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: "Super Administrador",
  ADMIN: "Administrador",
  VETERINARIAN: "Médico(a) Veterinário(a)",
  ASSISTANT: "Auxiliar",
  RECEPTIONIST: "Rececionista",
};

export interface MenuItem {
  name: string;
  href: string;
  resource: Resource;
  minLevel: CrudLevel;
}

export const MENU_ITEMS: MenuItem[] = [
  { name: "Dashboard", href: "/dashboard", resource: "consultations", minLevel: "LER" },
  { name: "Agenda", href: "/dashboard/appointments", resource: "appointments", minLevel: "CRIAR_LER" },
  { name: "Mensagens", href: "/dashboard/messages", resource: "messages", minLevel: "CRIAR_LER" },
  { name: "Pacientes", href: "/dashboard/patients", resource: "patients", minLevel: "CRIAR_LER" },
  { name: "Clientes", href: "/dashboard/customers", resource: "owners", minLevel: "CRIAR_LER" },
  { name: "Internamento", href: "/dashboard/internamento", resource: "internamento", minLevel: "LER" },
  { name: "Prescrições", href: "/dashboard/prescricoes", resource: "prescriptions", minLevel: "LER" },
  { name: "Diagnósticos", href: "/dashboard/diagnostics", resource: "diagnostics", minLevel: "CRIAR_LER" },
  { name: "Inventário", href: "/dashboard/inventory", resource: "inventory", minLevel: "LER" },
  { name: "Faturação", href: "/dashboard/billing", resource: "billing", minLevel: "CRIAR_LER" },
  { name: "Marketing SMS", href: "/dashboard/marketing", resource: "marketing", minLevel: "CRIAR_LER" },
  { name: "SMS Stats", href: "/dashboard/sms", resource: "sms", minLevel: "LER" },
  { name: "Relatórios", href: "/dashboard/management", resource: "reports", minLevel: "LER" },
  { name: "Equipa", href: "/dashboard/team", resource: "team", minLevel: "LER" },
  { name: "Definições", href: "/dashboard/settings", resource: "settings", minLevel: "CRIAR_LER" },
];

export function getVisibleMenuItems(role: string | undefined): MenuItem[] {
  return MENU_ITEMS.filter((item) => canAccess(item.resource, role || "NONE", item.minLevel));
}
