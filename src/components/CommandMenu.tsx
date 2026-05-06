"use client";

import * as React from "react";
import {
  Calculator,
  Calendar,
  CreditCard,
  Plus,
  Search,
  Settings,
  Smile,
  User,
  PawPrint,
  Stethoscope,
  Users,
  Package,
} from "lucide-react";
import { useRouter } from "next/navigation";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";

export function CommandMenu() {
  const [open, setOpen] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const runCommand = (command: () => void) => {
    setOpen(false);
    command();
  };

  return (
    <>
      <div 
        className="hidden lg:flex items-center gap-2 px-3 py-1.5 text-xs text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
        onClick={() => setOpen(true)}
      >
        <Search size={14} />
        <span className="font-medium">Procurar ou executar...</span>
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border dark:border-slate-800 bg-white dark:bg-slate-900 px-1.5 font-mono text-[10px] font-bold text-slate-400 dark:text-slate-500 opacity-100 shadow-sm">
          <span className="text-xs">⌘</span>K
        </kbd>
      </div>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="Escreva um comando ou pesquise..." />
        <CommandList>
          <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
          <CommandGroup heading="Ações Rápidas">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/patients?new=true"))}>
              <Plus className="mr-2 h-4 w-4" />
              <span>Novo Paciente</span>
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/consultations"))}>
              <Stethoscope className="mr-2 h-4 w-4" />
              <span>Iniciar Consulta</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Navegação">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/patients"))}>
              <PawPrint className="mr-2 h-4 w-4" />
              <span>Pacientes</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/inventory"))}>
              <Package className="mr-2 h-4 w-4" />
              <span>Inventário</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/team"))}>
              <Users className="mr-2 h-4 w-4" />
              <span>Equipa</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/billing"))}>
              <CreditCard className="mr-2 h-4 w-4" />
              <span>Faturação</span>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Configurações">
            <CommandItem onSelect={() => runCommand(() => router.push("/dashboard/settings"))}>
              <Settings className="mr-2 h-4 w-4" />
              <span>Definições da Clínica</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
