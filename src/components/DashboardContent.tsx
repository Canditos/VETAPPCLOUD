"use client";

import { useSidebar } from "@/components/SidebarContext";
import { cn } from "@/lib/utils";

export function DashboardContent({ children }: { children: React.ReactNode }) {
  const { isPinned } = useSidebar();

  return (
    <main
      className={cn(
        "min-h-screen transition-all duration-300 ease-in-out",
        isPinned ? "md:ml-64" : "md:ml-20"
      )}
    >
      {children}
    </main>
  );
}
